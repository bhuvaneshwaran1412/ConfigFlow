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
// EXPORT
// =========================================

module.exports = {

    getReports,
    getReportStats,
    getProjectReport,
    getVersionReport

};