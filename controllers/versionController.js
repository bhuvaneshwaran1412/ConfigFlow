const db = require("../config/db");


const getVersions = (req, res) => {

    const sql = `
        SELECT
            v.id,
            v.project_id,
            p.project_name,
            v.version,
            v.description,
            v.release_date,
            v.created_by
        FROM versions v
        LEFT JOIN projects p
            ON v.project_id = p.id
        ORDER BY v.id DESC
    `;


    db.query(sql, (err, results) => {

        if (err) {

            console.error(err);

            return res.status(500).json({
                success: false,
                message: "Failed to fetch versions"
            });

        }


        res.json(results);

    });

};


module.exports = {
    getVersions
};