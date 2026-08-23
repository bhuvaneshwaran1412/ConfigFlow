const db = require("../config/db");

const approveRequest = (req, res) => {

    const { id } = req.params;
    const {
        status,
        admin_comment,
        approved_by
    } = req.body;


    // =========================================
    // VALIDATION
    // =========================================

    if (!status || !approved_by) {

        return res.status(400).json({
            success: false,
            message: "Status and approved_by are required"
        });

    }


    if (
        status !== "Approved" &&
        status !== "Rejected"
    ) {

        return res.status(400).json({
            success: false,
            message: "Invalid status"
        });

    }


    // =========================================
    // CHECK USER ROLE
    // =========================================

    const userSql = `
        SELECT u.id, u.role, cr.project_id, p.project_manager_id
        FROM users u
        JOIN change_requests cr ON cr.id=?
        JOIN projects p ON p.id=cr.project_id
        WHERE u.id=?
    `;


    db.query(
        userSql,
        [id, approved_by],
        (err, userResult) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Failed to verify user"
                });

            }


            if (userResult.length === 0) {

                return res.status(401).json({
                    success: false,
                    message: "User not found"
                });

            }


            const user = userResult[0];


            // =========================================
            // ADMIN ONLY
            // =========================================

            if (user.role !== "Admin" &&
                !(user.role === "Manager" && String(user.project_manager_id) === String(approved_by))) {

                return res.status(403).json({
                    success: false,
                    message: "Access denied. Only Admin or the assigned Manager can approve or reject requests."
                });

            }


            // =========================================
            // UPDATE CHANGE REQUEST
            // =========================================

            const updateSql = `
                UPDATE change_requests
                SET
                    status=?,
                    admin_comment=?,
                    approved_by=?,
                    approved_at=NOW()
                WHERE id=?
            `;


            db.query(
                updateSql,
                [
                    status,
                    admin_comment,
                    approved_by,
                    id
                ],
                (err) => {

                    if (err) {

                        console.error(err);

                        return res.status(500).json(err);

                    }


                    // =========================================
                    // IF REJECTED
                    // =========================================

                    if (status === "Rejected") {

                        return res.json({
                            success: true,
                            message: "Request Rejected"
                        });

                    }


                    // =========================================
                    // GET CHANGE REQUEST
                    // =========================================

                    const getSql = `
                        SELECT *
                        FROM change_requests
                        WHERE id=?
                    `;


                    db.query(
                        getSql,
                        [id],
                        (err, result) => {

                            if (err) {

                                return res.status(500).json(err);

                            }


                            const request = result[0];


                            if (!request) {

                                return res.status(404).json({
                                    success: false,
                                    message: "Change request not found"
                                });

                            }


                            // =========================================
                            // CREATE VERSION
                            // =========================================

                            const version =
                                "v" + Date.now();


                            const versionSql = `
                                INSERT INTO versions
                                (
                                    project_id,
                                    version,
                                    description,
                                    release_date,
                                    created_by
                                )
                                VALUES (?,?,?,?,?)
                            `;


                            db.query(
                                versionSql,
                                [
                                    request.project_id,
                                    version,
                                    request.title,
                                    new Date(),
                                    approved_by
                                ],
                                (err, versionResult) => {

                                    if (err) {

                                        return res.status(500).json(err);

                                    }


                                    const versionId =
                                        versionResult.insertId;


                                    // =========================================
                                    // CREATE RELEASE NOTE
                                    // =========================================

                                    const releaseSql = `
                                        INSERT INTO release_notes
                                        (
                                            version_id,
                                            notes
                                        )
                                        VALUES (?,?)
                                    `;


                                    db.query(
                                        releaseSql,
                                        [
                                            versionId,
                                            request.description
                                        ],
                                        (err) => {

                                            if (err) {

                                                return res.status(500).json(err);

                                            }


                                            // =========================================
                                            // AUDIT LOG
                                            // =========================================

                                            const auditSql = `
                                                INSERT INTO audit_logs
                                                (
                                                    user_id,
                                                    action,
                                                    details
                                                )
                                                VALUES (?,?,?)
                                            `;


                                            db.query(
                                                auditSql,
                                                [
                                                    approved_by,
                                                    "Approved Change Request",
                                                    request.title
                                                ],
                                                (err) => {

                                                    if (err) {

                                                        return res.status(500).json(err);

                                                    }


                                                    res.json({

                                                        success: true,

                                                        message:
                                                            "Request Approved Successfully",

                                                        version:
                                                            version

                                                    });

                                                }
                                            );

                                        }
                                    );

                                }
                            );

                        }
                    );

                }
            );

        }
    );

};


module.exports = {
    approveRequest
};