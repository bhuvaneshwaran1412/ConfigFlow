const db = require("../config/db");

const BACKUP_TABLES = [
    "users",
    "projects",
    "modules",
    "change_requests",
    "versions",
    "release_notes",
    "audit_logs"
];

function verifyAdmin(userId, callback) {
    if (!userId) {
        callback(null, false);
        return;
    }

    db.query(
        "SELECT role FROM users WHERE id=?",
        [userId],
        (err, result) => {
            if (err) {
                callback(err);
                return;
            }

            callback(null, result.length > 0 && result[0].role === "Admin");
        }
    );
}

function getBackup(req, res) {
    verifyAdmin(req.query.user_id, (err, isAdmin) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Failed to verify user" });
        }

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Only Admin users can create backups" });
        }

        const backup = {
            format: "configflow-backup",
            version: 1,
            created_at: new Date().toISOString(),
            tables: {}
        };
        let index = 0;

        function readNextTable() {
            if (index === BACKUP_TABLES.length) {
                return res.json(backup);
            }

            const table = BACKUP_TABLES[index++];
            db.query("SELECT * FROM ??", [table], (tableError, rows) => {
                if (tableError) {
                    console.error(tableError);
                    return res.status(500).json({ success: false, message: "Failed to create backup" });
                }

                backup.tables[table] = rows;
                readNextTable();
            });
        }

        readNextTable();
    });
}

function restoreBackup(req, res) {
    const { user_id, backup } = req.body;

    verifyAdmin(user_id, (err, isAdmin) => {
        if (err) {
            return res.status(500).json({ success: false, message: "Failed to verify user" });
        }

        if (!isAdmin) {
            return res.status(403).json({ success: false, message: "Only Admin users can restore backups" });
        }

        if (!backup || backup.format !== "configflow-backup" || !backup.tables) {
            return res.status(400).json({ success: false, message: "Invalid ConfigFlow backup file" });
        }

        const tables = Object.keys(backup.tables);
        if (tables.some(table => !BACKUP_TABLES.includes(table))) {
            return res.status(400).json({ success: false, message: "Backup contains unsupported tables" });
        }

        db.beginTransaction(transactionError => {
            if (transactionError) {
                return res.status(500).json({ success: false, message: "Could not start restore" });
            }

            db.query("SET FOREIGN_KEY_CHECKS=0", checksError => {
                if (checksError) {
                    return rollbackRestore(res, checksError, "Could not prepare restore");
                }

                let index = 0;
                const restoreNextTable = () => {
                    if (index === BACKUP_TABLES.length) {
                        return db.query("SET FOREIGN_KEY_CHECKS=1", enableError => {
                            if (enableError) {
                                return rollbackRestore(res, enableError, "Could not finish restore");
                            }

                            db.commit(commitError => {
                                if (commitError) {
                                    return rollbackRestore(res, commitError, "Could not commit restore");
                                }

                                res.json({ success: true, message: "Backup restored successfully" });
                            });
                        });
                    }

                    const table = BACKUP_TABLES[index++];
                    const rows = Array.isArray(backup.tables[table]) ? backup.tables[table] : [];

                    db.query("DELETE FROM ??", [table], deleteError => {
                        if (deleteError) {
                            return rollbackRestore(res, deleteError, "Could not clear existing data");
                        }

                        if (!rows.length) {
                            return restoreNextTable();
                        }

                        const columns = Object.keys(rows[0]);
                        const values = rows.map(row => columns.map(column => row[column]));
                        db.query("INSERT INTO ?? (??) VALUES ?", [table, columns, values], insertError => {
                            if (insertError) {
                                return rollbackRestore(res, insertError, "Could not restore backup data");
                            }

                            restoreNextTable();
                        });
                    });
                };

                restoreNextTable();
            });
        });
    });
}

function rollbackRestore(res, error, message) {
    console.error(error);
    db.rollback(() => {
        db.query("SET FOREIGN_KEY_CHECKS=1", () => {
            res.status(500).json({ success: false, message });
        });
    });
}

module.exports = {
    getBackup,
    restoreBackup
};
