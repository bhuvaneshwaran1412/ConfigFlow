const db = require("../config/db");

function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user || !allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to perform this action"
            });
        }

        next();
    };
}

function checkProjectAccess(userId, projectId, callback) {
    const sql = `
        SELECT u.role, p.project_manager_id,
            EXISTS (
                SELECT 1 FROM project_developers pd
                WHERE pd.project_id=p.id AND pd.developer_id=u.id
            ) AS is_assigned
        FROM users u
        JOIN projects p ON p.id=?
        WHERE u.id=?
    `;

    db.query(sql, [projectId, userId], (err, rows) => {
        if (err) return callback(err);
        if (!rows.length) return callback(null, false, null);

        const access = rows[0];
        const allowed = access.role === "Admin" ||
            (access.role === "Manager" && String(access.project_manager_id) === String(userId)) ||
            (access.role === "Developer" && Number(access.is_assigned) === 1);

        callback(null, allowed, access);
    });
}

function getProjectScope(alias, user) {
    if (user.role === "Admin") {
        return { sql: "", params: [] };
    }

    if (user.role === "Manager") {
        return {
            sql: ` AND ${alias}.project_manager_id=?`,
            params: [user.id]
        };
    }

    return {
        sql: ` AND EXISTS (
            SELECT 1 FROM project_developers pd_scope
            WHERE pd_scope.project_id=${alias}.id AND pd_scope.developer_id=?
        )`,
        params: [user.id]
    };
}

module.exports = {
    authorizeRoles,
    checkProjectAccess,
    getProjectScope
};