const db = require("../config/db");
const { checkProjectAccess } = require("../middleware/authorization");
const { writeAuditLog } = require("../utils/auditLog");

// Ensure module_dependencies table exists
const initModuleDependenciesTable = () => {
    const tableSql = `
    CREATE TABLE IF NOT EXISTS module_dependencies (
        id INT NOT NULL AUTO_INCREMENT,
        module_id INT NOT NULL,
        depends_on_module_id INT NOT NULL,
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        UNIQUE KEY uk_module_dependency (module_id, depends_on_module_id),
        KEY idx_module_id (module_id),
        KEY idx_depends_on (depends_on_module_id),
        CONSTRAINT fk_md_module FOREIGN KEY (module_id) REFERENCES modules (id) ON DELETE CASCADE,
        CONSTRAINT fk_md_depends_on FOREIGN KEY (depends_on_module_id) REFERENCES modules (id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `;
    db.query(tableSql, (err) => {
        if (err) {
            console.error("Failed to initialize module_dependencies table:", err.message);
        }
    });
};
initModuleDependenciesTable();

// Get all modules with project name and dependency list
const getModules = (req, res) => {
    const userId = req.user.id;
    const sql = `
        SELECT modules.*, projects.project_name,
            (SELECT GROUP_CONCAT(md.depends_on_module_id) FROM module_dependencies md WHERE md.module_id = modules.id) AS depends_on_ids,
            (SELECT GROUP_CONCAT(m2.module_name SEPARATOR ', ') FROM module_dependencies md JOIN modules m2 ON md.depends_on_module_id = m2.id WHERE md.module_id = modules.id) AS depends_on_names,
            (SELECT COUNT(*) FROM module_dependencies md2 WHERE md2.depends_on_module_id = modules.id) AS downstream_dependent_count,
            CASE WHEN u.role='Admin'
                OR (u.role='Manager' AND projects.project_manager_id=u.id)
                OR (u.role='Developer' AND EXISTS (
                    SELECT 1 FROM project_developers pd
                    WHERE pd.project_id=modules.project_id AND pd.developer_id=u.id
                ))
                THEN 1 ELSE 0 END AS can_edit
        FROM modules
        JOIN projects ON modules.project_id = projects.id
        LEFT JOIN users u ON u.id=?
    `;

    db.query(sql, [userId], (err, result) => {
        if (err) return res.status(500).json({ success: false, message: "Failed to load modules" });
        res.json(result);
    });
};

// Add module with optional dependencies
const addModule = (req, res) => {
    const { project_id, module_name, description, depends_on_ids } = req.body;

    checkProjectAccess(req.user.id, project_id, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify project access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You are not assigned to this project" });

        const sql = `
        INSERT INTO modules(project_id, module_name, description)
        VALUES(?,?,?)
    `;

        db.query(sql, [project_id, module_name, description], (err, result) => {
            if (err) return res.status(500).json(err);
            const newModuleId = result.insertId;

            // Insert dependencies if provided
            if (Array.isArray(depends_on_ids) && depends_on_ids.length > 0) {
                const depValues = depends_on_ids
                    .map(depId => Number(depId))
                    .filter(depId => !isNaN(depId) && depId !== newModuleId)
                    .map(depId => [newModuleId, depId]);

                if (depValues.length > 0) {
                    db.query("INSERT IGNORE INTO module_dependencies (module_id, depends_on_module_id) VALUES ?", [depValues], () => {});
                }
            }

            res.json({
                success: true,
                message: "Module Added Successfully",
                id: newModuleId
            });
            writeAuditLog(req.user.id, "Created Module", module_name);
        });
    });
};

// Update module and its dependencies
const updateModule = (req, res) => {
    const { id } = req.params;
    const { project_id, module_name, description, depends_on_ids } = req.body;

    checkModuleAccess(req.user.id, id, project_id, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify module access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You can edit modules only in your assigned projects" });

        const sql = `
        UPDATE modules
        SET project_id=?, module_name=?, description=?
        WHERE id=?
    `;

        db.query(sql, [project_id, module_name, description, id], (err) => {
            if (err) return res.status(500).json(err);

            // Update dependencies
            if (Array.isArray(depends_on_ids)) {
                db.query("DELETE FROM module_dependencies WHERE module_id=?", [id], () => {
                    const depValues = depends_on_ids
                        .map(depId => Number(depId))
                        .filter(depId => !isNaN(depId) && depId !== Number(id))
                        .map(depId => [Number(id), depId]);

                    if (depValues.length > 0) {
                        db.query("INSERT IGNORE INTO module_dependencies (module_id, depends_on_module_id) VALUES ?", [depValues], () => {});
                    }
                });
            }

            res.json({
                success: true,
                message: "Module Updated Successfully"
            });
            writeAuditLog(req.user.id, "Updated Module", id);
        });
    });
};

// Delete module
const deleteModule = (req, res) => {
    const { id } = req.params;

    checkModuleAccess(req.user.id, id, null, (accessError, allowed) => {
        if (accessError) return res.status(500).json({ success: false, message: "Failed to verify module access" });
        if (!allowed) return res.status(403).json({ success: false, message: "You can delete modules only in your assigned projects" });

        db.query("DELETE FROM modules WHERE id=?", [id], (err) => {
            if (err) return res.status(500).json(err);

            res.json({
                success: true,
                message: "Module Deleted Successfully"
            });
            writeAuditLog(req.user.id, "Deleted Module", id);
        });
    });
};

// Get downstream impacted modules when a module changes
const getModuleImpact = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            m.id,
            m.module_name,
            m.project_id,
            p.project_name
        FROM module_dependencies md
        JOIN modules m ON md.module_id = m.id
        JOIN projects p ON m.project_id = p.id
        WHERE md.depends_on_module_id = ?
    `;

    db.query(sql, [id], (err, results) => {
        if (err) {
            console.error("Module impact error:", err);
            return res.status(500).json({ success: false, message: "Failed to query module impact" });
        }

        res.json({
            success: true,
            module_id: Number(id),
            impacted_modules: results || [],
            has_downstream_impact: (results && results.length > 0)
        });
    });
};

// Get all dependencies for graph visualization
const getDependencies = (req, res) => {
    const sql = `
        SELECT
            md.id,
            md.module_id,
            m1.module_name,
            m1.project_id,
            p.project_name,
            md.depends_on_module_id,
            m2.module_name AS depends_on_name
        FROM module_dependencies md
        JOIN modules m1 ON md.module_id = m1.id
        JOIN modules m2 ON md.depends_on_module_id = m2.id
        JOIN projects p ON m1.project_id = p.id
        ORDER BY p.project_name, m1.module_name
    `;

    db.query(sql, (err, results) => {
        if (err) {
            console.error("Fetch dependencies error:", err);
            return res.status(500).json({ success: false, message: "Failed to fetch dependencies" });
        }
        res.json({ success: true, dependencies: results || [] });
    });
};

function checkModuleAccess(userId, moduleId, targetProjectId, callback) {
    db.query("SELECT project_id FROM modules WHERE id=?", [moduleId], (err, rows) => {
        if (err) return callback(err);
        if (!rows.length) return callback(null, false);

        checkProjectAccess(userId, rows[0].project_id, (sourceError, sourceAllowed) => {
            if (sourceError || !sourceAllowed) return callback(sourceError, false);
            if (!targetProjectId || String(targetProjectId) === String(rows[0].project_id)) {
                return callback(null, true);
            }
            checkProjectAccess(userId, targetProjectId, callback);
        });
    });
}

module.exports = {
    getModules,
    addModule,
    updateModule,
    deleteModule,
    getModuleImpact,
    getDependencies
};