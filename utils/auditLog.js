const db = require("../config/db");

function writeAuditLog(userId, action, details) {
    db.query(
        "INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)",
        [userId, action, details],
        error => {
            if (error) console.error("Audit log error:", error);
        }
    );
}

module.exports = { writeAuditLog };
