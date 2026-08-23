const db = require("../config/db");


const getReleaseNotes = (req, res) => {

    const sql = `
        SELECT
            rn.id,
            rn.version_id,
            rn.notes,
            v.version,
            v.release_date,
            v.project_id,
            p.project_name
        FROM release_notes rn
        LEFT JOIN versions v
            ON rn.version_id = v.id
        LEFT JOIN projects p
            ON v.project_id = p.id
        ORDER BY rn.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch release notes"
            });

        }


        res.json(results);

    });

};

const addReleaseNote = (req, res) => {
    const { version_id, notes, created_by } = req.body;

    if (!version_id || !notes || !created_by) {
        return res.status(400).json({
            success: false,
            message: "Version, notes, and creator are required"
        });
    }

    const userSql = "SELECT role FROM users WHERE id=?";

    db.query(userSql, [created_by], (err, users) => {
        if (err) {
            console.error(err);
            return res.status(500).json({
                success: false,
                message: "Failed to verify user"
            });
        }

        if (!users.length || users[0].role !== "Admin") {
            return res.status(403).json({
                success: false,
                message: "Only Admin users can publish release notes"
            });
        }

        const sql = `
            INSERT INTO release_notes (version_id, notes)
            VALUES (?, ?)
        `;

        db.query(sql, [version_id, notes.trim()], (insertError, result) => {
            if (insertError) {
                console.error(insertError);
                return res.status(500).json({
                    success: false,
                    message: "Failed to publish release note"
                });
            }

            res.status(201).json({
                success: true,
                message: "Release note published",
                id: result.insertId
            });
        });
    });
};

module.exports = {
    getReleaseNotes,
    addReleaseNote
};