const db = require("../config/db");
const { checkProjectAccess } = require("../middleware/authorization");
const { writeAuditLog } = require("../utils/auditLog");

// Get All Projects
const getProjects = (req, res) => {
    const userId = req.user.id;

    db.query("SELECT role FROM users WHERE id=?", [userId], (userError, users) => {
        if (userError) return res.status(500).json(userError);
        if (!users.length) return res.status(401).json({ success: false, message: "User not found" });

        const sql = `
            SELECT p.*,
                CASE WHEN u.role='Admin'
                    OR (u.role='Manager' AND p.project_manager_id=u.id)
                    OR (u.role='Developer' AND EXISTS (
                        SELECT 1 FROM project_developers pd
                        WHERE pd.project_id=p.id AND pd.developer_id=u.id
                    ))
                    THEN 1 ELSE 0 END AS is_assigned
            FROM projects p
            CROSS JOIN users u
            WHERE u.id=?
            ORDER BY p.id DESC
        `;

        db.query(sql, [userId], (err, result) => {
            if (err) return res.status(500).json(err);
            res.json(result);
        });
    });
};

// Add Project
const addProject = (req, res) => {
    const {
        project_name,
        description,
        current_version
    } = req.body;

    const sql = `
                INSERT INTO projects(project_name, description, current_version)
                VALUES(?,?,?)
            `;

    db.query(sql, [project_name, description, current_version], (err) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to create project" });

        res.json({
            success: true,
            message: "Project Added Successfully"
        });
        writeAuditLog(req.user.id, "Created Project", project_name);
    });
};

// Update Project
const updateProject = (req, res) => {
    const { id } = req.params;
    const { project_name, description, current_version } = req.body;

    checkProjectAccess(req.user.id, id, (accessError, allowed, access) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify project access" });
        if (!allowed || (access.role !== "Admin" && access.role !== "Manager")) {
            return res.status(403).json({ success: false, message: "You can edit only your assigned projects" });
        }

        const sql = `
        UPDATE projects
        SET project_name=?, description=?, current_version=?
        WHERE id=?
    `;

        db.query(sql, [project_name, description, current_version, id], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to update project" });
        if (!result.affectedRows) return res.status(404).json({ success: false, message: "Project not found" });

        res.json({
            success: true,
            message: "Project Updated Successfully"
        });
        writeAuditLog(req.user.id, "Updated Project", id);
        });
    });
};

// Delete Project
const deleteProject = (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM projects WHERE id=?";

    db.query(sql, [id], (err, result) => {
        if (err) return res.status(500).json(err);
        if (!result.affectedRows) return res.status(404).json({ success: false, message: "Project not found" });

        res.json({
            success: true,
            message: "Project Deleted Successfully"
        });
        writeAuditLog(req.user.id, "Deleted Project", id);
    });
};

const getAssignableUsers = (req, res) => {
    db.query("SELECT role FROM users WHERE id=?", [req.user.id], (err, users) => {
        if (err) return res.status(500).json(err);
        if (!users.length) return res.status(401).json({ success: false, message: "User not found" });

        const role = users[0].role === "Admin" ? "Manager" : "Developer";
        db.query("SELECT id, name, email, employee_id FROM users WHERE role=? ORDER BY name", [role], (userError, result) => {
            if (userError) return res.status(500).json(userError);
            res.json(result);
        });
    });
};

const assignManager = (req, res) => {
    const { id } = req.params;
    const { manager_id } = req.body;

    db.query("SELECT role FROM users WHERE id=?", [req.user.id], (err, users) => {
        if (err) return res.status(500).json(err);
        if (!users.length || users[0].role !== "Admin") {
            return res.status(403).json({ success: false, message: "Only Admin users can assign managers" });
        }

        db.query("SELECT id FROM users WHERE id=? AND role='Manager'", [manager_id], (managerError, managers) => {
            if (managerError) return res.status(500).json(managerError);
            if (!managers.length) return res.status(400).json({ success: false, message: "Selected user is not a Manager" });

            db.query("UPDATE projects SET project_manager_id=? WHERE id=?", [manager_id, id], updateError => {
                if (updateError) {
                    console.error(updateError);
                    return res.status(500).json({
                        success: false,
                        message: updateError.code === "ER_BAD_FIELD_ERROR"
                            ? "Run database/add_project_assignments.sql before assigning managers"
                            : "Could not assign Project Manager"
                    });
                }
                writeAuditLog(req.user.id, "Assigned Project Manager", `Project ${id}, Manager ${manager_id}`);
                res.json({ success: true, message: "Project Manager assigned" });
            });
        });
    });
};

const assignDeveloper = (req, res) => {
    const { id } = req.params;
    const { developer_id } = req.body;
    const accessSql = `
        SELECT u.role, p.project_manager_id
        FROM users u CROSS JOIN projects p
        WHERE u.id=? AND p.id=?
    `;

    db.query(accessSql, [req.user.id, id], (err, access) => {
        if (err) return res.status(500).json(err);
        if (!access.length || (access[0].role !== "Admin" &&
            !(access[0].role === "Manager" && String(access[0].project_manager_id) === String(req.user.id)))) {
            return res.status(403).json({ success: false, message: "Only the assigned Manager can add Developers" });
        }

        db.query("SELECT id FROM users WHERE id=? AND role='Developer'", [developer_id], (developerError, developers) => {
            if (developerError) return res.status(500).json(developerError);
            if (!developers.length) return res.status(400).json({ success: false, message: "Selected user is not a Developer" });

            db.query(
                "INSERT INTO project_developers (project_id, developer_id) VALUES (?, ?)",
                [id, developer_id],
                insertError => {
                    if (insertError && insertError.code === "ER_DUP_ENTRY") {
                        return res.status(409).json({ success: false, message: "Developer is already assigned" });
                    }
                    if (insertError) return res.status(500).json(insertError);
                    writeAuditLog(req.user.id, "Assigned Developer", `Project ${id}, Developer ${developer_id}`);
                    res.json({ success: true, message: "Developer assigned to project" });
                }
            );
        });
    });
};

module.exports = {
    getProjects,
    addProject,
    updateProject,
    deleteProject,
    getAssignableUsers,
    assignManager,
    assignDeveloper
};