const db = require("../config/db");
const { writeAuditLog } = require("../utils/auditLog");


// Ensure comments table and change_type column exist
const initCommentsTable = () => {
    const tableSql = `
    CREATE TABLE IF NOT EXISTS change_request_comments (
        id INT NOT NULL AUTO_INCREMENT,
        change_request_id INT NOT NULL,
        user_id INT NOT NULL,
        comment TEXT NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY change_request_id (change_request_id),
        KEY user_id (user_id),
        CONSTRAINT fk_crc_change_request FOREIGN KEY (change_request_id) REFERENCES change_requests (id) ON DELETE CASCADE,
        CONSTRAINT fk_crc_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    db.query(tableSql, (err) => {
        if (err) {
            console.error("Failed to initialize change_request_comments table:", err.message);
        }
    });

    const alterSql = `ALTER TABLE change_requests ADD COLUMN change_type ENUM('Patch', 'Minor', 'Major') DEFAULT 'Patch' AFTER priority`;
    db.query(alterSql, (err) => {
        // Ignored if column already exists
    });
};
initCommentsTable();


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
            u.name AS developer,
            (SELECT COUNT(*) FROM change_request_comments crc WHERE crc.change_request_id = cr.id) AS comment_count
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
        change_type,
        created_by
    } = req.body;

    const validatedChangeType = ["Patch", "Minor", "Major"].includes(change_type)
        ? change_type
        : "Patch";


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
            change_type,
            attachment,
            created_by
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;


        db.query(
        sql,
        [
            project_id,
            module_id,
            title,
            description,
            priority,
            validatedChangeType,
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
// GET COMMENTS FOR CHANGE REQUEST
// =========================================

const getComments = (req, res) => {
    const requestId = req.params.id;

    const sql = `
        SELECT
            c.id,
            c.change_request_id,
            c.user_id,
            c.comment,
            c.created_at,
            u.name AS user_name,
            u.role AS user_role
        FROM change_request_comments c
        JOIN users u ON c.user_id = u.id
        WHERE c.change_request_id = ?
        ORDER BY c.created_at ASC
    `;

    db.query(sql, [requestId], (err, results) => {
        if (err) {
            console.error("Error fetching comments:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch comments" });
        }
        res.json({ success: true, comments: results });
    });
};


// =========================================
// ADD COMMENT TO CHANGE REQUEST
// =========================================

const addComment = (req, res) => {
    const requestId = req.params.id;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || !comment.trim()) {
        return res.status(400).json({ success: false, message: "Comment text is required" });
    }

    // Verify change request exists
    const checkSql = "SELECT id, title FROM change_requests WHERE id = ?";
    db.query(checkSql, [requestId], (checkErr, crRows) => {
        if (checkErr) {
            console.error("Error checking change request:", checkErr);
            return res.status(500).json({ success: false, message: "Database error" });
        }
        if (!crRows.length) {
            return res.status(404).json({ success: false, message: "Change request not found" });
        }

        const insertSql = `
            INSERT INTO change_request_comments (change_request_id, user_id, comment)
            VALUES (?, ?, ?)
        `;

        db.query(insertSql, [requestId, userId, comment.trim()], (insertErr, result) => {
            if (insertErr) {
                console.error("Error adding comment:", insertErr);
                return res.status(500).json({ success: false, message: "Failed to post comment" });
            }

            const commentId = result.insertId;
            writeAuditLog(userId, "Posted Comment on CR", `#${requestId}: ${comment.trim().substring(0, 40)}`);

            // Fetch and return the newly created comment with author info
            const fetchSql = `
                SELECT
                    c.id,
                    c.change_request_id,
                    c.user_id,
                    c.comment,
                    c.created_at,
                    u.name AS user_name,
                    u.role AS user_role
                FROM change_request_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.id = ?
            `;

            db.query(fetchSql, [commentId], (fetchErr, commentRows) => {
                if (fetchErr || !commentRows.length) {
                    return res.json({
                        success: true,
                        message: "Comment added",
                        comment: { id: commentId, change_request_id: requestId, user_id: userId, comment: comment.trim(), created_at: new Date() }
                    });
                }
                res.json({
                    success: true,
                    message: "Comment added",
                    comment: commentRows[0]
                });
            });
        });
    });
};


// =========================================
// DELETE COMMENT
// =========================================

const deleteComment = (req, res) => {
    const { id: requestId, commentId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const findSql = "SELECT user_id FROM change_request_comments WHERE id = ? AND change_request_id = ?";
    db.query(findSql, [commentId, requestId], (findErr, rows) => {
        if (findErr) return res.status(500).json({ success: false, message: "Database error" });
        if (!rows.length) return res.status(404).json({ success: false, message: "Comment not found" });

        // Allow author or Admin to delete
        if (rows[0].user_id !== userId && userRole !== "Admin") {
            return res.status(403).json({ success: false, message: "You are not authorized to delete this comment" });
        }

        const deleteSql = "DELETE FROM change_request_comments WHERE id = ?";
        db.query(deleteSql, [commentId], (delErr) => {
            if (delErr) return res.status(500).json({ success: false, message: "Failed to delete comment" });

            writeAuditLog(userId, "Deleted Comment from CR", `#${requestId} Comment #${commentId}`);
            res.json({ success: true, message: "Comment deleted successfully" });
        });
    });
};


// =========================================
// EXPORT
// =========================================

module.exports = {
    getChangeRequests,
    addChangeRequest,
    deleteChangeRequest,
    getComments,
    addComment,
    deleteComment
};