const db = require("../config/db");
const { checkProjectAccess } = require("../middleware/authorization");
const { writeAuditLog } = require("../utils/auditLog");

// Get all modules with project name
const getModules = (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT modules.*, projects.project_name,
            CASE WHEN u.role='Admin'
                OR (u.role='Manager' AND projects.project_manager_id=u.id)
                OR (u.role='Developer' AND EXISTS (
                    SELECT 1 FROM project_developers pd
                    WHERE pd.project_id=modules.project_id AND pd.developer_id=u.id
                ))
                THEN 1 ELSE 0 END AS can_edit
        FROM modules
        JOIN projects ON modules.project_id = projects.id
        LEFT JOIN users u ON u.id=?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to load modules" });
        res.json(result);
    });
};

// Add module
const addModule = (req, res) => {
    const { project_id, module_name, description } = req.body;

    checkProjectAccess(req.user.id, project_id, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify project access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You are not assigned to this project" });

        const sql = `
        INSERT INTO modules(project_id, module_name, description)
        VALUES(?,?,?)
    `;

        db.query(sql, [project_id, module_name, description], (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Module Added Successfully"
            });
            writeAuditLog(req.user.id, "Created Module", module_name);
        });
    });
};

// Update module
const updateModule = (req, res) => {
    const { id } = req.params;
    const { project_id, module_name, description } = req.body;

    checkModuleAccess(req.user.id, id, project_id, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify module access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You can edit modules only in your assigned projects" });

        const sql = `
        UPDATE modules
        SET project_id=?, module_name=?, description=?
        WHERE id=?
    `;

        db.query(sql, [project_id, module_name, description, id], (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Module Updated Successfully"
            });
            writeAuditLog(req.user.id, "Updated Module", id);
        });
    });
};

// Delete module
const deleteModule = (req, res) => {
    const { id } = req.params;

    checkModuleAccess(req.user.id, id, null, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify module access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You can delete modules only in your assigned projects" });

        db.query("DELETE FROM modules WHERE id=?", [id], (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Module Deleted Successfully"
            });
            writeAuditLog(req.user.id, "Deleted Module", id);
        });
    });
};

function checkModuleAccess(userId, moduleId, targetProjectId, callback) {
    db.query("SELECT project_id FROM modules WHERE id=?", [moduleId], (err, rows) => {
        if (err) return callback(err);
        if (!rows.length) return callback(null, false);

        checkProjectAccess(userId, rows[0].project_id, (sourceError, sourceAllowed) => {
            if (sourceError || !sourceAllowed) return callback(sourceError, false);
            if (!targetProjectId || String(targetProjectId) === String(rows[0].project_id)) {
                return callback(null, true);
            }
            checkProjectAccess(userId, targetProjectId, callback);
        });
    });
}

module.exports = {
    getModules,
    addModule,
    updateModule,
    deleteModule
};