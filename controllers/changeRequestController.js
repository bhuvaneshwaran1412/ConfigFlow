const db = require("../config/db");
const { writeAuditLog } = require("../utils/auditLog");


// =========================================
// GET ALL CHANGE REQUESTS
// =========================================

const getChangeRequests = (req, res) => {
    const userId = req.user.id;
    const accessSql = "SELECT role FROM users WHERE id=?";

    db.query(accessSql, [userId], (userError, users) => {
        if (userError) return res.status(500).json(userError);
        if (!users.length) return res.status(401).json({ success: false, message: "User not found" });

        let scope = "";
        let params = [];

        if (users[0].role === "Manager") {
            scope = " AND p.project_manager_id=?";
            params = [userId];
        } else if (users[0].role === "Developer") {
            scope = " AND cr.created_by=? AND EXISTS (SELECT 1 FROM project_developers pd2 WHERE pd2.project_id=cr.project_id AND pd2.developer_id=?)";
            params = [userId, userId];
        }

        const sql = `
        SELECT
            cr.*,
            p.project_name,
            m.module_name,
            u.name AS developer
        FROM change_requests cr
        JOIN projects p
            ON cr.project_id = p.id
        JOIN modules m
            ON cr.module_id = m.id
        JOIN users u
            ON cr.created_by = u.id
        WHERE 1=1 ${scope}
        ORDER BY cr.created_at DESC
        `;

        db.query(sql, params, (err, result) => {

        if (err) {
            console.error(err);
            return res.status(500).json(err);
        }

        res.json(result);

        });
    });

};


// =========================================
// ADD CHANGE REQUEST + ATTACHMENT
// =========================================

const addChangeRequest = (req, res) => {

    const {
        project_id,
        module_id,
        title,
        description,
        priority,
        created_by
    } = req.body;


    const attachment = req.file
        ? req.file.filename
        : null;


    if (!project_id || !module_id || !title) {

        return res.status(400).json({
            success: false,
            message:
                "Missing required fields. Please provide project_id, module_id, and title."
        });

    }

    const accessSql = `
        SELECT u.role, p.project_manager_id,
            EXISTS (
                SELECT 1 FROM project_developers pd
                WHERE pd.project_id=p.id AND pd.developer_id=u.id
            ) AS is_assigned
        FROM users u
        JOIN projects p ON p.id=?
        JOIN modules m ON m.id=? AND m.project_id=p.id
        WHERE u.id=?
    `;

    db.query(accessSql, [project_id, module_id, req.user.id], (accessError, access) => {
        if (accessError) return res.status(500).json(accessError);
        if (!access.length) return res.status(403).json({ success: false, message: "Invalid user or project" });

        const permitted = access[0].role === "Admin" ||
            (access[0].role === "Manager" && String(access[0].project_manager_id) === String(req.user.id)) ||
            (access[0].role === "Developer" && access[0].is_assigned);

        if (!permitted) {
            return res.status(403).json({ success: false, message: "You are not assigned to this project" });
        }

        const sql = `
        INSERT INTO change_requests
        (
            project_id,
            module_id,
            title,
            description,
            priority,
            attachment,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


        db.query(
        sql,
        [
            project_id,
            module_id,
            title,
            description,
            priority,
            attachment,
            req.user.id
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to submit change request"
                });

            }


            res.json({
                success: true,
                message: "Change Request Submitted",
                id: result.insertId,
                attachment: attachment
            });
            writeAuditLog(req.user.id, "Created Change Request", title);

        }
        );
    });

};


// =========================================
// DELETE CHANGE REQUEST
// =========================================

const deleteChangeRequest = (req, res) => {

    const id = req.params.id;


    const sql = `
        DELETE cr FROM change_requests cr
        JOIN projects p ON p.id=cr.project_id
        WHERE cr.id=? AND (
            ? = 'Admin'
            OR (? = 'Manager' AND p.project_manager_id=?)
            OR (? = 'Developer' AND cr.created_by=?)
        )
    `;

    db.query(
        sql,
        [id, req.user.role, req.user.role, req.user.id, req.user.id, req.user.id],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json(err);

            }


            if (!result.affectedRows) {
                return res.status(404).json({
                    success: false,
                    message: "Change request not found or not accessible"
                });
            }

            res.json({
                success: true,
                message: "Deleted Successfully"
            });
            writeAuditLog(req.user.id, "Deleted Change Request", id);

        }
    );

};


// =========================================
// EXPORT
// =========================================

module.exports = {
    getChangeRequests,
    addChangeRequest,
    deleteChangeRequest
};