const db = require("../config/db");

const getAuditLogs = (req, res) => {

    const sql = `
        SELECT
            a.id,
            a.user_id,
            u.name AS user_name,
            a.action,
            a.details,
            a.created_at
        FROM audit_logs a
        LEFT JOIN users u
            ON a.user_id = u.id
        ORDER BY a.id DESC
    `;

    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch audit logs"
            });

        }

        res.json(results);

    });

};

module.exports = {
    getAuditLogs
};