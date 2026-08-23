const db = require("../config/db");


// =========================================
// GET COMPLETE CHANGE REQUEST REPORT
// =========================================

const getReports = (req, res) => {

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
        ORDER BY cr.created_at DESC
    `;


    db.query(sql, (err, result) => {

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

    const sql = `
        SELECT

            (SELECT COUNT(*)
             FROM change_requests)
            AS totalRequests,

            (SELECT COUNT(*)
             FROM change_requests
             WHERE LOWER(status) = 'pending')
            AS pendingRequests,

            (SELECT COUNT(*)
             FROM change_requests
             WHERE LOWER(status) = 'approved')
            AS approvedRequests,

            (SELECT COUNT(*)
             FROM change_requests
             WHERE LOWER(status) = 'rejected')
            AS rejectedRequests,

            (SELECT COUNT(*)
             FROM versions)
            AS totalVersions,

            (SELECT COUNT(*)
             FROM projects)
            AS totalProjects
    `;


    db.query(sql, (err, result) => {

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

    const sql = `
        SELECT
            p.id,
            p.project_name,
            p.current_version,
            COUNT(cr.id) AS total_requests
        FROM projects p
        LEFT JOIN change_requests cr
            ON p.id = cr.project_id
        GROUP BY
            p.id,
            p.project_name,
            p.current_version
        ORDER BY p.id DESC
    `;


    db.query(sql, (err, result) => {

        if (err) {

            console.error(err);

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
        ORDER BY v.id DESC
    `;


    db.query(sql, (err, result) => {

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