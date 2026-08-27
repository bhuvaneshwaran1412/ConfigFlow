const db = require("../config/db");
const { writeAuditLog } = require("../utils/auditLog");
const { bumpSemVer, generateChangelog } = require("../utils/semver");

const approveRequest = (req, res) => {

    const { id } = req.params;
    const { status, admin_comment } = req.body;


    // =========================================
    // VALIDATION
    // =========================================

    if (!status) {

        return res.status(400).json({
            success: false,
            message: "Status is required"
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
        SELECT u.id, u.name, u.role, cr.project_id, p.project_manager_id
        FROM users u
        JOIN change_requests cr ON cr.id=?
        JOIN projects p ON p.id=cr.project_id
        WHERE u.id=?
    `;


    db.query(
        userSql,
        [id, req.user.id],
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
                !(user.role === "Manager" && String(user.project_manager_id) === String(req.user.id))) {

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
                    req.user.id,
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
                        writeAuditLog(req.user.id, "Rejected Change Request", id);

                        return res.json({
                            success: true,
                            message: "Request Rejected"
                        });

                    }


                    // =========================================
                    // GET CHANGE REQUEST DETAILS WITH PROJECT INFO
                    // =========================================

                    const getSql = `
                        SELECT
                            cr.*,
                            p.project_name,
                            p.current_version,
                            m.module_name
                        FROM change_requests cr
                        JOIN projects p ON cr.project_id = p.id
                        JOIN modules m ON cr.module_id = m.id
                        WHERE cr.id=?
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
                            // CALCULATE NEXT SEMVER VERSION
                            // =========================================

                            const currentVer = request.current_version || "v1.0.0";
                            const changeType = request.change_type || "Patch";
                            const version = bumpSemVer(currentVer, changeType);


                            const versionSql = `
                                INSERT INTO versions
                                (
                                    project_id,
                                    version,
                                    description,
                                    release_date,
                                    created_by
                                )
                                VALUES (?,?,?,NOW(),?)
                            `;


                            db.query(
                                versionSql,
                                [
                                    request.project_id,
                                    version,
                                    request.title,
                                    req.user.id
                                ],
                                (err, versionResult) => {

                                    if (err) {

                                        return res.status(500).json(err);

                                    }


                                    const versionId =
                                        versionResult.insertId;


                                    // =========================================
                                    // CREATE STRUCTURED RELEASE NOTE
                                    // =========================================

                                    const formattedNotes = generateChangelog(
                                        request,
                                        version,
                                        user.name || "Reviewer"
                                    );

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
                                            formattedNotes
                                        ],
                                        (err) => {

                                            if (err) {

                                                return res.status(500).json(err);

                                            }

                                            // =========================================
                                            // UPDATE PROJECT CURRENT VERSION
                                            // =========================================
                                            const updateProjectSql = `
                                                UPDATE projects
                                                SET current_version = ?
                                                WHERE id = ?
                                            `;

                                            db.query(
                                                updateProjectSql,
                                                [version, request.project_id],
                                                (updateProjectErr) => {
                                                    if (updateProjectErr) {
                                                        console.error("Failed to update project current_version:", updateProjectErr);
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
                                                            req.user.id,
                                                            "Approved Change Request",
                                                            `${request.title} (Released ${version})`
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

        }
    );

};


module.exports = {
    approveRequest
};