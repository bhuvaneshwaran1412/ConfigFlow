const db = require("../config/db");

const search = (req, res) => {

    const keyword = "%" + (req.query.keyword || "") + "%";
    const status = req.query.status || "";
    const priority = req.query.priority || "";

    const sql = `
        SELECT
            cr.id,
            p.project_name,
            m.module_name,
            cr.title,
            cr.description,
            cr.priority,
            cr.status,
            u.name AS developer,
            cr.created_at,
            v.version
        FROM change_requests cr

        JOIN projects p
            ON cr.project_id = p.id

        JOIN modules m
            ON cr.module_id = m.id

        JOIN users u
            ON cr.created_by = u.id

        LEFT JOIN versions v
            ON v.project_id = cr.project_id

        WHERE
            (
                p.project_name LIKE ?
                OR m.module_name LIKE ?
                OR v.version LIKE ?
                OR cr.status LIKE ?
                OR u.name LIKE ?
                OR cr.title LIKE ?
            )

            AND (? = '' OR cr.status = ?)
            AND (? = '' OR cr.priority = ?)

        ORDER BY cr.created_at DESC
    `;

    db.query(
        sql,
        [
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            keyword,
            status,
            status,
            priority,
            priority
        ],
        (err, result) => {

            if (err) {

                console.error(err);

                return res.status(500).json({
                    success: false,
                    message: "Search failed"
                });

            }

            res.json(result);

        }
    );

};

module.exports = { search };