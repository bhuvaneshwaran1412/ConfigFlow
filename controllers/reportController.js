const db = require("../config/db");
const { getProjectScope } = require("../middleware/authorization");


// =========================================
// GET COMPLETE CHANGE REQUEST REPORT
// =========================================

const getReports = (req, res) => {
    const scope = getProjectScope("p", req.user);

    const sql = `
        SELECT
            cr.id,
            p.project_name,
            m.module_name,
            cr.title,
            cr.priority,
            cr.status,
            u.name AS developer,
            cr.created_at
        FROM change_requests cr
        JOIN projects p
            ON cr.project_id = p.id
        JOIN modules m
            ON cr.module_id = m.id
        JOIN users u
            ON cr.created_by = u.id
        WHERE 1=1 ${scope.sql}
        ORDER BY cr.created_at DESC
    `;


    db.query(sql, scope.params, (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch reports"
            });

        }


        res.json(result);

    });

};



// =========================================
// REPORT STATISTICS
// =========================================

const getReportStats = (req, res) => {
    const requestScope = getProjectScope("p", req.user);
    const versionScope = getProjectScope("p", req.user);
    const projectScope = getProjectScope("p", req.user);

    const sql = `
        SELECT

            (SELECT COUNT(*)
             FROM change_requests cr JOIN projects p ON p.id=cr.project_id
             WHERE 1=1 ${requestScope.sql})
            AS totalRequests,

            (SELECT COUNT(*)
             FROM change_requests cr JOIN projects p ON p.id=cr.project_id
             WHERE LOWER(cr.status) = 'pending' ${requestScope.sql})
            AS pendingRequests,

            (SELECT COUNT(*)
             FROM change_requests cr JOIN projects p ON p.id=cr.project_id
             WHERE LOWER(cr.status) = 'approved' ${requestScope.sql})
            AS approvedRequests,

            (SELECT COUNT(*)
             FROM change_requests cr JOIN projects p ON p.id=cr.project_id
             WHERE LOWER(cr.status) = 'rejected' ${requestScope.sql})
            AS rejectedRequests,

            (SELECT COUNT(*)
             FROM versions v JOIN projects p ON p.id=v.project_id
             WHERE 1=1 ${versionScope.sql})
            AS totalVersions,

            (SELECT COUNT(*)
             FROM projects p
             WHERE 1=1 ${projectScope.sql})
            AS totalProjects
    `;


    db.query(sql, [
        ...requestScope.params,
        ...requestScope.params,
        ...requestScope.params,
        ...requestScope.params,
        ...versionScope.params,
        ...projectScope.params
    ], (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch report statistics"
            });

        }


        res.json({
            success: true,
            data: result[0]
        });

    });

};



// =========================================
// PROJECT REPORT
// =========================================

const getProjectReport = (req, res) => {

    const scope = getProjectScope("p", req.user);

    const sql = `
        SELECT
            p.id,
            p.project_name,
            p.current_version,
            COUNT(cr.id) AS total_requests
        FROM projects p
        LEFT JOIN change_requests cr
            ON p.id = cr.project_id

        WHERE 1=1 ${scope.sql}

        GROUP BY
            p.id,
            p.project_name,
            p.current_version

        ORDER BY p.id DESC
    `;

    db.query(sql, scope.params, (err, result) => {

        if (err) {

            console.error("Project Report Error:", err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch project report"
            });

        }

        res.json(result);

    });

};



// =========================================
// VERSION REPORT
// =========================================

const getVersionReport = (req, res) => {
    const scope = getProjectScope("p", req.user);

    const sql = `
        SELECT
            v.id,
            p.project_name,
            v.version,
            v.description,
            v.release_date
        FROM versions v
        LEFT JOIN projects p
            ON v.project_id = p.id
        WHERE 1=1 ${scope.sql}
        ORDER BY v.id DESC
    `;


    db.query(sql, scope.params, (err, result) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch version report"
            });

        }


        res.json(result);

    });

};



// =========================================
// VISUAL ANALYTICS REPORT
// =========================================

const getAnalytics = (req, res) => {
    const scope = getProjectScope("p", req.user);

    // 1. Status breakdown
    const statusSql = `
        SELECT
            COALESCE(SUM(CASE WHEN LOWER(cr.status) = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
            COALESCE(SUM(CASE WHEN LOWER(cr.status) = 'approved' THEN 1 ELSE 0 END), 0) AS approved,
            COALESCE(SUM(CASE WHEN LOWER(cr.status) = 'rejected' THEN 1 ELSE 0 END), 0) AS rejected
        FROM change_requests cr
        JOIN projects p ON p.id = cr.project_id
        WHERE 1=1 ${scope.sql}
    `;

    // 2. Impact breakdown
    const impactSql = `
        SELECT
            COALESCE(SUM(CASE WHEN cr.change_type = 'Major' THEN 1 ELSE 0 END), 0) AS major,
            COALESCE(SUM(CASE WHEN cr.change_type = 'Minor' THEN 1 ELSE 0 END), 0) AS minor,
            COALESCE(SUM(CASE WHEN cr.change_type = 'Patch' OR cr.change_type IS NULL THEN 1 ELSE 0 END), 0) AS patch
        FROM change_requests cr
        JOIN projects p ON p.id = cr.project_id
        WHERE 1=1 ${scope.sql}
    `;

    // 3. Priority breakdown
    const prioritySql = `
        SELECT
            COALESCE(SUM(CASE WHEN cr.priority = 'Critical' THEN 1 ELSE 0 END), 0) AS critical,
            COALESCE(SUM(CASE WHEN cr.priority = 'High' THEN 1 ELSE 0 END), 0) AS high,
            COALESCE(SUM(CASE WHEN cr.priority = 'Medium' THEN 1 ELSE 0 END), 0) AS medium,
            COALESCE(SUM(CASE WHEN cr.priority = 'Low' THEN 1 ELSE 0 END), 0) AS low
        FROM change_requests cr
        JOIN projects p ON p.id = cr.project_id
        WHERE 1=1 ${scope.sql}
    `;

    // 4. Module activity breakdown (top 8)
    const moduleSql = `
        SELECT
            m.module_name,
            COUNT(cr.id) AS total_changes
        FROM change_requests cr
        JOIN modules m ON m.id = cr.module_id
        JOIN projects p ON p.id = cr.project_id
        WHERE 1=1 ${scope.sql}
        GROUP BY m.module_name
        ORDER BY total_changes DESC
        LIMIT 8
    `;

    // 5. Monthly trend
    const trendSql = `
        SELECT
            DATE_FORMAT(cr.created_at, '%Y-%m') AS period,
            COUNT(cr.id) AS total,
            COALESCE(SUM(CASE WHEN LOWER(cr.status) = 'approved' THEN 1 ELSE 0 END), 0) AS approved
        FROM change_requests cr
        JOIN projects p ON p.id = cr.project_id
        WHERE 1=1 ${scope.sql}
        GROUP BY period
        ORDER BY period ASC
        LIMIT 12
    `;

    db.query(statusSql, scope.params, (err1, statusRows) => {
        if (err1) {
            console.error("Analytics Error (status):", err1);
            return res.status(500).json({ success: false, message: "Analytics error" });
        }

        db.query(impactSql, scope.params, (err2, impactRows) => {
            if (err2) {
                console.error("Analytics Error (impact):", err2);
                return res.status(500).json({ success: false, message: "Analytics error" });
            }

            db.query(prioritySql, scope.params, (err3, priorityRows) => {
                if (err3) {
                    console.error("Analytics Error (priority):", err3);
                    return res.status(500).json({ success: false, message: "Analytics error" });
                }

                db.query(moduleSql, scope.params, (err4, moduleRows) => {
                    if (err4) {
                        console.error("Analytics Error (modules):", err4);
                        return res.status(500).json({ success: false, message: "Analytics error" });
                    }

                    db.query(trendSql, scope.params, (err5, trendRows) => {
                        if (err5) {
                            console.error("Analytics Error (trends):", err5);
                            return res.status(500).json({ success: false, message: "Analytics error" });
                        }

                        res.json({
                            success: true,
                            data: {
                                status: statusRows[0] || { pending: 0, approved: 0, rejected: 0 },
                                impact: impactRows[0] || { patch: 0, minor: 0, major: 0 },
                                priority: priorityRows[0] || { low: 0, medium: 0, high: 0, critical: 0 },
                                modules: moduleRows || [],
                                trends: trendRows || []
                            }
                        });
                    });
                });
            });
        });
    });
};


// =========================================
// EXPORT
// =========================================

module.exports = {

    getReports,
    getReportStats,
    getProjectReport,
    getVersionReport,
    getAnalytics

};