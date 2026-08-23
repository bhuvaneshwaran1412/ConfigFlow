const db = require("../config/db");

const getDashboard = (req, res) => {

    const dashboard = {};

    db.query("SELECT COUNT(*) AS totalProjects FROM projects", (err, result) => {

        if (err) return res.status(500).json(err);

        dashboard.totalProjects = result[0].totalProjects;

        db.query("SELECT COUNT(*) AS totalDevelopers FROM users WHERE role='Developer'", (err, result) => {

            dashboard.totalDevelopers = result[0].totalDevelopers;

            db.query("SELECT COUNT(*) AS pendingRequests FROM change_requests WHERE status='Pending'", (err, result) => {

                dashboard.pendingRequests = result[0].pendingRequests;

                db.query("SELECT COUNT(*) AS approvedRequests FROM change_requests WHERE status='Approved'", (err, result) => {

                    dashboard.approvedRequests = result[0].approvedRequests;

                    db.query("SELECT COUNT(*) AS rejectedRequests FROM change_requests WHERE status='Rejected'", (err, result) => {

                        dashboard.rejectedRequests = result[0].rejectedRequests;

                        db.query("SELECT version FROM versions ORDER BY id DESC LIMIT 1", (err, result) => {

                            dashboard.latestVersion = result.length
                                ? result[0].version
                                : "No Version";

                            res.json(dashboard);

                        });

                    });

                });

            });

        });

    });

};

module.exports = { getDashboard };