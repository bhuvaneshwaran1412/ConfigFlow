const bcrypt = require("bcrypt");

class MockDatabase {
    constructor() {
        this.reset();
    }

    reset() {
        this.tables = {
            users: [],
            projects: [],
            project_developers: [],
            modules: [],
            change_requests: [],
            versions: [],
            release_notes: [],
            audit_logs: []
        };
        this.autoIncrements = {
            users: 1,
            projects: 1,
            project_developers: 1,
            modules: 1,
            change_requests: 1,
            versions: 1,
            release_notes: 1,
            audit_logs: 1
        };
        this.inTransaction = false;
        this.transactionSnapshot = null;
        this.seedDefaults();
    }

    seedDefaults() {
        const adminHash = bcrypt.hashSync("Admin@1234", 10);
        const managerHash = bcrypt.hashSync("Manager@1234", 10);
        const devHash = bcrypt.hashSync("Dev@1234", 10);

        this.tables.users = [
            {
                id: 1,
                name: "Admin User",
                email: "admin@configflow.com",
                employee_id: "CFG-0001",
                password: adminHash,
                role: "Admin"
            },
            {
                id: 2,
                name: "Manager User",
                email: "manager@manager.in",
                employee_id: "CFG-0002",
                password: managerHash,
                role: "Manager"
            },
            {
                id: 3,
                name: "Developer User",
                email: "developer@dev.ac.in",
                employee_id: "CFG-0003",
                password: devHash,
                role: "Developer"
            }
        ];
        this.autoIncrements.users = 4;

        this.tables.projects = [
            {
                id: 1,
                project_name: "Core Platform",
                description: "Main configuration and workflow management system",
                current_version: "v1.0.0",
                project_manager_id: 2
            },
            {
                id: 2,
                project_name: "Security Services",
                description: "Authentication and authorization layer",
                current_version: "v0.9.0",
                project_manager_id: 2
            }
        ];
        this.autoIncrements.projects = 3;

        this.tables.project_developers = [
            { id: 1, project_id: 1, developer_id: 3 },
            { id: 2, project_id: 2, developer_id: 3 }
        ];
        this.autoIncrements.project_developers = 3;

        this.tables.modules = [
            {
                id: 1,
                project_id: 1,
                module_name: "Auth Engine",
                description: "JWT token generation and verification module"
            },
            {
                id: 2,
                project_id: 1,
                module_name: "Audit Pipeline",
                description: "Event logging and activity stream"
            }
        ];
        this.autoIncrements.modules = 3;

        this.tables.change_requests = [
            {
                id: 1,
                project_id: 1,
                module_id: 1,
                title: "Refactor Cookie Security",
                description: "Enforce SameSite=Lax and HttpOnly on session cookies",
                priority: "High",
                attachment: null,
                status: "Pending",
                admin_comment: null,
                created_by: 3,
                approved_by: null,
                approved_at: null,
                created_at: new Date("2026-08-20T10:00:00Z")
            }
        ];
        this.autoIncrements.change_requests = 2;

        this.tables.versions = [
            {
                id: 1,
                project_id: 1,
                version: "v1.0.0",
                description: "Initial production release",
                release_date: new Date("2026-08-01T00:00:00Z"),
                created_by: 1
            }
        ];
        this.autoIncrements.versions = 2;

        this.tables.release_notes = [
            {
                id: 1,
                version_id: 1,
                notes: "Initial release with core dashboard, project, and module tracking."
            }
        ];
        this.autoIncrements.release_notes = 2;

        this.tables.audit_logs = [
            {
                id: 1,
                user_id: 1,
                action: "System Initialization",
                details: "ConfigFlow environment initialized",
                created_at: new Date("2026-08-01T00:00:00Z")
            }
        ];
        this.autoIncrements.audit_logs = 2;
    }

    connect(callback) {
        if (callback) callback(null);
    }

    beginTransaction(callback) {
        this.inTransaction = true;
        this.transactionSnapshot = JSON.parse(JSON.stringify({
            tables: this.tables,
            autoIncrements: this.autoIncrements
        }));
        if (callback) callback(null);
    }

    commit(callback) {
        this.inTransaction = false;
        this.transactionSnapshot = null;
        if (callback) callback(null);
    }

    rollback(callback) {
        if (this.transactionSnapshot) {
            this.tables = this.transactionSnapshot.tables;
            this.autoIncrements = this.transactionSnapshot.autoIncrements;
        }
        this.inTransaction = false;
        this.transactionSnapshot = null;
        if (callback) callback(null);
    }

    query(sql, params, callback) {
        if (typeof params === "function") {
            callback = params;
            params = [];
        }
        params = params || [];

        setImmediate(() => {
            try {
                const result = this.execute(sql, params);
                callback(null, result);
            } catch (err) {
                callback(err);
            }
        });
    }

    execute(sql, params) {
        const trimmed = sql.trim();

        // 1. SET FOREIGN_KEY_CHECKS
        if (/^SET\s+FOREIGN_KEY_CHECKS/is.test(trimmed)) {
            return { affectedRows: 0 };
        }

        // 2. Backup & Restore helpers: SELECT * FROM ??
        if (/^SELECT\s+\*\s+FROM\s+\?\?/is.test(trimmed)) {
            const table = params[0];
            return (this.tables[table] || []).map(r => ({ ...r }));
        }

        // 3. DELETE FROM ??
        if (/^DELETE\s+FROM\s+\?\?$/is.test(trimmed)) {
            const table = params[0];
            const count = (this.tables[table] || []).length;
            this.tables[table] = [];
            return { affectedRows: count };
        }

        // 4. INSERT INTO ?? (??) VALUES ?
        if (/^INSERT\s+INTO\s+\?\?\s+\(\?\?\)\s+VALUES\s+\?/is.test(trimmed)) {
            const table = params[0];
            const columns = params[1];
            const rows = params[2];
            if (!this.tables[table]) this.tables[table] = [];

            for (const row of rows) {
                const obj = {};
                for (let i = 0; i < columns.length; i++) {
                    obj[columns[i]] = row[i];
                }
                if (!obj.id) {
                    obj.id = this.autoIncrements[table]++;
                } else if (obj.id >= this.autoIncrements[table]) {
                    this.autoIncrements[table] = obj.id + 1;
                }
                this.tables[table].push(obj);
            }
            return { affectedRows: rows.length };
        }

        // 5. SELECT * FROM users WHERE email = ?
        if (/^SELECT\s+\*\s+FROM\s+users\s+WHERE\s+email\s*=\s*\?/is.test(trimmed)) {
            const email = (params[0] || "").toString().toLowerCase().trim();
            return this.tables.users.filter(u => u.email.toLowerCase() === email).map(u => ({ ...u }));
        }

        // 6. UPDATE users SET password=? WHERE id=?
        if (/^UPDATE\s+users\s+SET\s+password=\?\s+WHERE\s+id=\?/is.test(trimmed)) {
            const [newHash, id] = params;
            const user = this.tables.users.find(u => u.id === Number(id));
            if (user) {
                user.password = newHash;
                return { affectedRows: 1, changedRows: 1 };
            }
            return { affectedRows: 0, changedRows: 0 };
        }

        // 7. Preview next employee ID
        if (/SELECT\s+COALESCE\(MAX\(CAST\(SUBSTRING\(employee_id/is.test(trimmed)) {
            let maxNum = 0;
            for (const u of this.tables.users) {
                if (u.employee_id && /^CFG-\d+$/.test(u.employee_id)) {
                    const num = parseInt(u.employee_id.substring(4), 10);
                    if (num > maxNum) maxNum = num;
                }
            }
            return [{ next_number: maxNum + 1 }];
        }

        // 8. SELECT id FROM users WHERE email=?
        if (/^SELECT\s+id\s+FROM\s+users\s+WHERE\s+email=\?/is.test(trimmed)) {
            const email = (params[0] || "").toString().toLowerCase().trim();
            return this.tables.users.filter(u => u.email.toLowerCase() === email).map(u => ({ id: u.id }));
        }

        // 9. INSERT INTO users (name, email, employee_id, password, role)
        if (/^INSERT\s+INTO\s+users/is.test(trimmed)) {
            const [name, email, employee_id, password, role] = params;
            const normalizedEmail = (email || "").toLowerCase().trim();
            if (this.tables.users.some(u => u.email.toLowerCase() === normalizedEmail)) {
                const err = new Error("Duplicate entry for email");
                err.code = "ER_DUP_ENTRY";
                throw err;
            }
            const id = this.autoIncrements.users++;
            const newUser = { id, name: (name || "").trim(), email: normalizedEmail, employee_id, password, role };
            this.tables.users.push(newUser);
            return { insertId: id, affectedRows: 1 };
        }

        // 10. SELECT role FROM users WHERE id=?
        if (/^SELECT\s+role\s+FROM\s+users\s+WHERE\s+id=\?/is.test(trimmed)) {
            const id = Number(params[0]);
            const user = this.tables.users.find(u => u.id === id);
            return user ? [{ role: user.role }] : [];
        }

        // 11. SELECT id, name, email, employee_id FROM users WHERE role=? ORDER BY name
        if (/SELECT\s+id,\s*name,\s*email,\s*employee_id\s+FROM\s+users\s+WHERE\s+role=\?/is.test(trimmed)) {
            const role = params[0];
            return this.tables.users
                .filter(u => u.role === role)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(u => ({ id: u.id, name: u.name, email: u.email, employee_id: u.employee_id }));
        }

        // 12. SELECT id FROM users WHERE id=? AND role='Manager' / 'Developer'
        if (/SELECT\s+id\s+FROM\s+users\s+WHERE\s+id=\?\s+AND\s+role=['"](Manager|Developer)['"]/is.test(trimmed)) {
            const id = Number(params[0]);
            const roleMatch = trimmed.match(/role=['"](Manager|Developer)['"]/i);
            const targetRole = roleMatch ? roleMatch[1] : "";
            const user = this.tables.users.find(u => u.id === id && u.role.toLowerCase() === targetRole.toLowerCase());
            return user ? [{ id: user.id }] : [];
        }

        // 13. Dashboard total developers: SELECT COUNT(*) AS totalDevelopers FROM users WHERE role='Developer'
        if (/SELECT\s+COUNT\(\*\)\s+AS\s+totalDevelopers\s+FROM\s+users/is.test(trimmed)) {
            const count = this.tables.users.filter(u => u.role === "Developer").length;
            return [{ totalDevelopers: count }];
        }

        // 14. Dashboard total projects: SELECT COUNT(*) AS totalProjects FROM projects
        if (/SELECT\s+COUNT\(\*\)\s+AS\s+totalProjects\s+FROM\s+projects/is.test(trimmed)) {
            return [{ totalProjects: this.tables.projects.length }];
        }

        // 15. Dashboard requests counts: SELECT COUNT(*) AS pendingRequests / approvedRequests / rejectedRequests FROM change_requests WHERE status='...'
        if (/SELECT\s+COUNT\(\*\)\s+AS\s+(pendingRequests|approvedRequests|rejectedRequests)\s+FROM\s+change_requests\s+WHERE\s+status=['"](Pending|Approved|Rejected)['"]/is.test(trimmed)) {
            const match = trimmed.match(/status=['"](Pending|Approved|Rejected)['"]/i);
            const status = match[1];
            const alias = status === "Pending" ? "pendingRequests" : status === "Approved" ? "approvedRequests" : "rejectedRequests";
            const count = this.tables.change_requests.filter(cr => cr.status.toLowerCase() === status.toLowerCase()).length;
            return [{ [alias]: count }];
        }

        // 16. Dashboard latest version: SELECT version FROM versions ORDER BY id DESC LIMIT 1
        if (/SELECT\s+version\s+FROM\s+versions\s+ORDER\s+BY\s+id\s+DESC\s+LIMIT\s+1/is.test(trimmed)) {
            const sorted = [...this.tables.versions].sort((a, b) => b.id - a.id);
            return sorted.length ? [{ version: sorted[0].version }] : [];
        }

        // 17. GET /api/projects (with is_assigned calculation)
        if (/SELECT\s+p\.\*[\s\S]*is_assigned[\s\S]*FROM\s+projects\s+p\s+CROSS\s+JOIN\s+users\s+u/is.test(trimmed)) {
            const userId = Number(params[0]);
            const user = this.tables.users.find(u => u.id === userId);
            if (!user) return [];

            const result = this.tables.projects.map(p => {
                let is_assigned = 0;
                if (user.role === "Admin") {
                    is_assigned = 1;
                } else if (user.role === "Manager" && p.project_manager_id === user.id) {
                    is_assigned = 1;
                } else if (user.role === "Developer") {
                    const devAssigned = this.tables.project_developers.some(pd => pd.project_id === p.id && pd.developer_id === user.id);
                    if (devAssigned) is_assigned = 1;
                }
                return { ...p, is_assigned };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 18. INSERT INTO projects
        if (/^INSERT\s+INTO\s+projects/is.test(trimmed)) {
            const [project_name, description, current_version] = params;
            const id = this.autoIncrements.projects++;
            const newProject = {
                id,
                project_name: project_name || "",
                description: description || "",
                current_version: current_version || "v1.0.0",
                project_manager_id: null
            };
            this.tables.projects.push(newProject);
            return { insertId: id, affectedRows: 1 };
        }

        // 19. UPDATE projects SET project_name=?, description=?, current_version=? WHERE id=?
        if (/^UPDATE\s+projects\s+SET\s+project_name=\?,\s*description=\?,\s*current_version=\?\s+WHERE\s+id=\?/is.test(trimmed)) {
            const [project_name, description, current_version, id] = params;
            const project = this.tables.projects.find(p => p.id === Number(id));
            if (!project) return { affectedRows: 0 };
            project.project_name = project_name;
            project.description = description;
            project.current_version = current_version;
            return { affectedRows: 1, changedRows: 1 };
        }

        // 20. DELETE FROM projects WHERE id=?
        if (/^DELETE\s+FROM\s+projects\s+WHERE\s+id=\?/is.test(trimmed)) {
            const id = Number(params[0]);
            const idx = this.tables.projects.findIndex(p => p.id === id);
            if (idx === -1) return { affectedRows: 0 };
            this.tables.projects.splice(idx, 1);
            return { affectedRows: 1 };
        }

        // 21. UPDATE projects SET project_manager_id=? WHERE id=?
        if (/^UPDATE\s+projects\s+SET\s+project_manager_id=\?\s+WHERE\s+id=\?/is.test(trimmed)) {
            const [manager_id, id] = params;
            const project = this.tables.projects.find(p => p.id === Number(id));
            if (!project) return { affectedRows: 0 };
            project.project_manager_id = Number(manager_id);
            return { affectedRows: 1 };
        }

        // 22. Assign developer access check: SELECT u.role, p.project_manager_id FROM users u CROSS JOIN projects p WHERE u.id=? AND p.id=?
        if (/SELECT\s+u\.role,\s*p\.project_manager_id\s+FROM\s+users\s+u\s+CROSS\s+JOIN\s+projects\s+p\s+WHERE\s+u\.id=\?\s+AND\s+p\.id=\?/is.test(trimmed)) {
            const [userId, projId] = params.map(Number);
            const user = this.tables.users.find(u => u.id === userId);
            const project = this.tables.projects.find(p => p.id === projId);
            if (!user || !project) return [];
            return [{ role: user.role, project_manager_id: project.project_manager_id }];
        }

        // 23. INSERT INTO project_developers (project_id, developer_id) VALUES (?, ?)
        if (/^INSERT\s+INTO\s+project_developers/is.test(trimmed)) {
            const [project_id, developer_id] = params.map(Number);
            const exists = this.tables.project_developers.some(pd => pd.project_id === project_id && pd.developer_id === developer_id);
            if (exists) {
                const err = new Error("Duplicate entry for project developer");
                err.code = "ER_DUP_ENTRY";
                throw err;
            }
            const id = this.autoIncrements.project_developers++;
            this.tables.project_developers.push({ id, project_id, developer_id });
            return { insertId: id, affectedRows: 1 };
        }

        // 24. checkProjectAccess: SELECT u.role, p.project_manager_id, EXISTS(...) AS is_assigned FROM users u JOIN projects p ON p.id=? WHERE u.id=?
        if (/SELECT\s+u\.role,\s*p\.project_manager_id[\s\S]*FROM\s+users\s+u\s+JOIN\s+projects\s+p\s+ON\s+p\.id=\?\s+WHERE\s+u\.id=\?/is.test(trimmed)) {
            const [projId, userId] = params.map(Number);
            const user = this.tables.users.find(u => u.id === userId);
            const project = this.tables.projects.find(p => p.id === projId);
            if (!user || !project) return [];
            const is_assigned = this.tables.project_developers.some(pd => pd.project_id === projId && pd.developer_id === userId) ? 1 : 0;
            return [{ role: user.role, project_manager_id: project.project_manager_id, is_assigned }];
        }

        // 25. GET /api/modules (with can_edit flag)
        if (/SELECT\s+modules\.\*,\s*projects\.project_name[\s\S]*FROM\s+modules/is.test(trimmed)) {
            const userId = Number(params[0]);
            const user = this.tables.users.find(u => u.id === userId);

            const result = this.tables.modules.map(m => {
                const project = this.tables.projects.find(p => p.id === m.project_id);
                let can_edit = 0;
                if (user) {
                    if (user.role === "Admin") {
                        can_edit = 1;
                    } else if (user.role === "Manager" && project && project.project_manager_id === user.id) {
                        can_edit = 1;
                    } else if (user.role === "Developer") {
                        const assigned = this.tables.project_developers.some(pd => pd.project_id === m.project_id && pd.developer_id === user.id);
                        if (assigned) can_edit = 1;
                    }
                }
                return {
                    ...m,
                    project_name: project ? project.project_name : "Unknown",
                    can_edit
                };
            });
            return result;
        }

        // 26. INSERT INTO modules
        if (/^INSERT\s+INTO\s+modules/is.test(trimmed)) {
            const [project_id, module_name, description] = params;
            const id = this.autoIncrements.modules++;
            this.tables.modules.push({
                id,
                project_id: Number(project_id),
                module_name: module_name || "",
                description: description || ""
            });
            return { insertId: id, affectedRows: 1 };
        }

        // 27. UPDATE modules SET project_id=?, module_name=?, description=? WHERE id=?
        if (/^UPDATE\s+modules\s+SET\s+project_id=\?,\s*module_name=\?,\s*description=\?\s+WHERE\s+id=\?/is.test(trimmed)) {
            const [project_id, module_name, description, id] = params;
            const mod = this.tables.modules.find(m => m.id === Number(id));
            if (!mod) return { affectedRows: 0 };
            mod.project_id = Number(project_id);
            mod.module_name = module_name;
            mod.description = description;
            return { affectedRows: 1, changedRows: 1 };
        }

        // 28. DELETE FROM modules WHERE id=?
        if (/^DELETE\s+FROM\s+modules\s+WHERE\s+id=\?/is.test(trimmed)) {
            const id = Number(params[0]);
            const idx = this.tables.modules.findIndex(m => m.id === id);
            if (idx === -1) return { affectedRows: 0 };
            this.tables.modules.splice(idx, 1);
            return { affectedRows: 1 };
        }

        // 29. SELECT project_id FROM modules WHERE id=?
        if (/^SELECT\s+project_id\s+FROM\s+modules\s+WHERE\s+id=\?/is.test(trimmed)) {
            const id = Number(params[0]);
            const mod = this.tables.modules.find(m => m.id === id);
            return mod ? [{ project_id: mod.project_id }] : [];
        }

        // 30. Change request submission access check:
        if (/SELECT\s+u\.role,\s*p\.project_manager_id[\s\S]*FROM\s+users\s+u\s+JOIN\s+projects\s+p\s+ON\s+p\.id=\?\s+JOIN\s+modules\s+m\s+ON\s+m\.id=\?\s+AND\s+m\.project_id=p\.id\s+WHERE\s+u\.id=\?/is.test(trimmed)) {
            const [projId, modId, userId] = params.map(Number);
            const user = this.tables.users.find(u => u.id === userId);
            const project = this.tables.projects.find(p => p.id === projId);
            const mod = this.tables.modules.find(m => m.id === modId && m.project_id === projId);
            if (!user || !project || !mod) return [];
            const is_assigned = this.tables.project_developers.some(pd => pd.project_id === projId && pd.developer_id === userId);
            return [{ role: user.role, project_manager_id: project.project_manager_id, is_assigned: is_assigned ? 1 : 0 }];
        }

        // 31. INSERT INTO change_requests
        if (/^INSERT\s+INTO\s+change_requests/is.test(trimmed)) {
            const [project_id, module_id, title, description, priority, attachment, created_by] = params;
            const id = this.autoIncrements.change_requests++;
            const newCR = {
                id,
                project_id: Number(project_id),
                module_id: Number(module_id),
                title: title || "",
                description: description || "",
                priority: priority || "Medium",
                attachment: attachment || null,
                status: "Pending",
                admin_comment: null,
                created_by: Number(created_by),
                approved_by: null,
                approved_at: null,
                created_at: new Date()
            };
            this.tables.change_requests.push(newCR);
            return { insertId: id, affectedRows: 1 };
        }

        // 32. GET /api/change-requests
        if (/SELECT\s+cr\.\*,\s*p\.project_name,\s*m\.module_name,\s*u\.name\s+AS\s+developer\s+FROM\s+change_requests\s+cr/is.test(trimmed)) {
            let list = this.tables.change_requests.map(cr => {
                const project = this.tables.projects.find(p => p.id === cr.project_id);
                const mod = this.tables.modules.find(m => m.id === cr.module_id);
                const dev = this.tables.users.find(u => u.id === cr.created_by);
                return {
                    ...cr,
                    project_name: project ? project.project_name : "Unknown",
                    module_name: mod ? mod.module_name : "Unknown",
                    developer: dev ? dev.name : "Unknown"
                };
            });

            if (/AND\s+p\.project_manager_id=\?/is.test(trimmed)) {
                const managerId = Number(params[0]);
                list = list.filter(cr => {
                    const p = this.tables.projects.find(proj => proj.id === cr.project_id);
                    return p && p.project_manager_id === managerId;
                });
            } else if (/AND\s+cr\.created_by=\?/is.test(trimmed)) {
                const devId = Number(params[0]);
                list = list.filter(cr => {
                    if (cr.created_by !== devId) return false;
                    return this.tables.project_developers.some(pd => pd.project_id === cr.project_id && pd.developer_id === devId);
                });
            }

            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return list;
        }

        // 33. DELETE change request: DELETE cr FROM change_requests cr JOIN projects p ON p.id=cr.project_id WHERE cr.id=? AND ...
        if (/DELETE\s+cr\s+FROM\s+change_requests\s+cr/is.test(trimmed)) {
            const [id, role1, role2, devId] = params;
            const crId = Number(id);
            const cr = this.tables.change_requests.find(c => c.id === crId);
            if (!cr) return { affectedRows: 0 };
            const project = this.tables.projects.find(p => p.id === cr.project_id);

            let canDelete = false;
            if (role1 === "Admin") {
                canDelete = true;
            } else if (role1 === "Manager" && project && project.project_manager_id === Number(devId)) {
                canDelete = true;
            } else if (role1 === "Developer" && cr.created_by === Number(devId)) {
                canDelete = true;
            }

            if (!canDelete) return { affectedRows: 0 };
            const idx = this.tables.change_requests.findIndex(c => c.id === crId);
            this.tables.change_requests.splice(idx, 1);
            return { affectedRows: 1 };
        }

        // 34. Approval user check: SELECT u.id, u.role, cr.project_id, p.project_manager_id FROM users u JOIN change_requests cr ON cr.id=? JOIN projects p ON p.id=cr.project_id WHERE u.id=?
        if (/SELECT\s+u\.id,\s*u\.role,\s*cr\.project_id,\s*p\.project_manager_id\s+FROM\s+users\s+u\s+JOIN\s+change_requests\s+cr\s+ON\s+cr\.id=\?\s+JOIN\s+projects\s+p\s+ON\s+p\.id=cr\.project_id\s+WHERE\s+u\.id=\?/is.test(trimmed)) {
            const [crId, userId] = params.map(Number);
            const user = this.tables.users.find(u => u.id === userId);
            const cr = this.tables.change_requests.find(c => c.id === crId);
            if (!user || !cr) return [];
            const project = this.tables.projects.find(p => p.id === cr.project_id);
            if (!project) return [];
            return [{ id: user.id, role: user.role, project_id: cr.project_id, project_manager_id: project.project_manager_id }];
        }

        // 35. UPDATE change_requests SET status=?, admin_comment=?, approved_by=?, approved_at=NOW() WHERE id=?
        if (/^UPDATE\s+change_requests\s+SET\s+status=\?,\s*admin_comment=\?,\s*approved_by=\?,\s*approved_at=NOW\(\)\s+WHERE\s+id=\?/is.test(trimmed)) {
            const [status, admin_comment, approved_by, id] = params;
            const cr = this.tables.change_requests.find(c => c.id === Number(id));
            if (!cr) return { affectedRows: 0 };
            cr.status = status;
            cr.admin_comment = admin_comment;
            cr.approved_by = Number(approved_by);
            cr.approved_at = new Date();
            return { affectedRows: 1, changedRows: 1 };
        }

        // 36. SELECT * FROM change_requests WHERE id=?
        if (/^SELECT\s+\*\s+FROM\s+change_requests\s+WHERE\s+id=\?/is.test(trimmed)) {
            const id = Number(params[0]);
            const cr = this.tables.change_requests.find(c => c.id === id);
            return cr ? [{ ...cr }] : [];
        }

        // 37. INSERT INTO versions
        if (/^INSERT\s+INTO\s+versions/is.test(trimmed)) {
            const [project_id, version, description, release_date, created_by] = params;
            const id = this.autoIncrements.versions++;
            this.tables.versions.push({
                id,
                project_id: Number(project_id),
                version,
                description,
                release_date: new Date(release_date),
                created_by: Number(created_by)
            });
            return { insertId: id, affectedRows: 1 };
        }

        // 38. INSERT INTO release_notes
        if (/^INSERT\s+INTO\s+release_notes/is.test(trimmed)) {
            const [version_id, notes] = params;
            const id = this.autoIncrements.release_notes++;
            this.tables.release_notes.push({
                id,
                version_id: Number(version_id),
                notes
            });
            return { insertId: id, affectedRows: 1 };
        }

        // 39. INSERT INTO audit_logs
        if (/^INSERT\s+INTO\s+audit_logs/is.test(trimmed)) {
            const [user_id, action, details] = params;
            const id = this.autoIncrements.audit_logs++;
            this.tables.audit_logs.push({
                id,
                user_id: Number(user_id),
                action,
                details: details ? String(details) : "",
                created_at: new Date()
            });
            return { insertId: id, affectedRows: 1 };
        }

        // 40. GET /api/versions: SELECT v.id, v.project_id, p.project_name, v.version, v.description, v.release_date, v.created_by FROM versions v LEFT JOIN projects p ON v.project_id = p.id ORDER BY v.id DESC
        if (/SELECT\s+v\.id,\s*v\.project_id,\s*p\.project_name,\s*v\.version,\s*v\.description,\s*v\.release_date,\s*v\.created_by\s+FROM\s+versions\s+v/is.test(trimmed)) {
            const result = this.tables.versions.map(v => {
                const project = this.tables.projects.find(p => p.id === v.project_id);
                return {
                    ...v,
                    project_name: project ? project.project_name : "Unknown"
                };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 41. GET /api/release-notes: SELECT rn.id, rn.version_id, rn.notes, v.version, v.release_date, v.project_id, p.project_name FROM release_notes rn LEFT JOIN versions v ON rn.version_id = v.id LEFT JOIN projects p ON v.project_id = p.id ORDER BY rn.id DESC
        if (/SELECT\s+rn\.id,\s*rn\.version_id,\s*rn\.notes,\s*v\.version[\s\S]*FROM\s+release_notes\s+rn/is.test(trimmed)) {
            const result = this.tables.release_notes.map(rn => {
                const version = this.tables.versions.find(v => v.id === rn.version_id);
                const project = version ? this.tables.projects.find(p => p.id === version.project_id) : null;
                return {
                    ...rn,
                    version: version ? version.version : "Unknown",
                    release_date: version ? version.release_date : null,
                    project_id: version ? version.project_id : null,
                    project_name: project ? project.project_name : "Unknown"
                };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 42. GET /api/audit-logs: SELECT a.id, a.user_id, u.name AS user_name, a.action, a.details, a.created_at FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id ORDER BY a.id DESC
        if (/SELECT\s+a\.id,\s*a\.user_id,\s*u\.name\s+AS\s+user_name,\s*a\.action,\s*a\.details,\s*a\.created_at\s+FROM\s+audit_logs\s+a/is.test(trimmed)) {
            const result = this.tables.audit_logs.map(a => {
                const user = this.tables.users.find(u => u.id === a.user_id);
                return {
                    ...a,
                    user_name: user ? user.name : "Unknown"
                };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 43. GET /api/reports/stats
        if (/SELECT\s+\(SELECT\s+COUNT\(\*\)\s+FROM\s+change_requests[\s\S]*totalRequests/is.test(trimmed)) {
            const totalRequests = this.tables.change_requests.length;
            const pendingRequests = this.tables.change_requests.filter(c => c.status.toLowerCase() === "pending").length;
            const approvedRequests = this.tables.change_requests.filter(c => c.status.toLowerCase() === "approved").length;
            const rejectedRequests = this.tables.change_requests.filter(c => c.status.toLowerCase() === "rejected").length;
            const totalVersions = this.tables.versions.length;
            const totalProjects = this.tables.projects.length;

            return [{
                totalRequests,
                pendingRequests,
                approvedRequests,
                rejectedRequests,
                totalVersions,
                totalProjects
            }];
        }

        // 44. GET /api/reports/projects
        if (/SELECT\s+p\.id,\s*p\.project_name,\s*p\.current_version,\s*COUNT\(cr\.id\)\s+AS\s+total_requests\s+FROM\s+projects\s+p/is.test(trimmed)) {
            const result = this.tables.projects.map(p => {
                const crCount = this.tables.change_requests.filter(c => c.project_id === p.id).length;
                return {
                    id: p.id,
                    project_name: p.project_name,
                    current_version: p.current_version,
                    total_requests: crCount
                };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 45. GET /api/reports/versions
        if (/SELECT\s+v\.id,\s*p\.project_name,\s*v\.version,\s*v\.description,\s*v\.release_date\s+FROM\s+versions\s+v/is.test(trimmed)) {
            const result = this.tables.versions.map(v => {
                const project = this.tables.projects.find(p => p.id === v.project_id);
                return {
                    id: v.id,
                    project_name: project ? project.project_name : "Unknown",
                    version: v.version,
                    description: v.description,
                    release_date: v.release_date
                };
            });
            result.sort((a, b) => b.id - a.id);
            return result;
        }

        // 46. GET /api/reports (full list)
        if (/SELECT\s+cr\.id,\s*p\.project_name,\s*m\.module_name,\s*cr\.title,\s*cr\.priority,\s*cr\.status,\s*u\.name\s+AS\s+developer,\s*cr\.created_at\s+FROM\s+change_requests\s+cr/is.test(trimmed)) {
            let list = this.tables.change_requests.map(cr => {
                const project = this.tables.projects.find(p => p.id === cr.project_id);
                const mod = this.tables.modules.find(m => m.id === cr.module_id);
                const dev = this.tables.users.find(u => u.id === cr.created_by);
                return {
                    id: cr.id,
                    project_name: project ? project.project_name : "Unknown",
                    module_name: mod ? mod.module_name : "Unknown",
                    title: cr.title,
                    priority: cr.priority,
                    status: cr.status,
                    developer: dev ? dev.name : "Unknown",
                    created_at: cr.created_at
                };
            });

            if (/AND\s+p\.project_manager_id=\?/is.test(trimmed)) {
                const managerId = Number(params[0]);
                list = list.filter(cr => {
                    const p = this.tables.projects.find(proj => proj.id === cr.project_id);
                    return p && p.project_manager_id === managerId;
                });
            } else if (/AND\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+project_developers/is.test(trimmed)) {
                const devId = Number(params[0]);
                list = list.filter(cr => {
                    return this.tables.project_developers.some(pd => pd.project_id === cr.project_id && pd.developer_id === devId);
                });
            }

            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return list;
        }

        // 47. GET /api/search
        if (/FROM\s+change_requests\s+cr[\s\S]*LIKE\s+\?/is.test(trimmed)) {
            const rawKeyword = (params[0] || "").toString().replace(/^%|%$/g, "").toLowerCase();
            const statusFilter = (params[6] || "").toString().trim();
            const priorityFilter = (params[8] || "").toString().trim();

            let list = this.tables.change_requests.map(cr => {
                const project = this.tables.projects.find(p => p.id === cr.project_id);
                const mod = this.tables.modules.find(m => m.id === cr.module_id);
                const dev = this.tables.users.find(u => u.id === cr.created_by);
                const version = this.tables.versions.find(v => v.project_id === cr.project_id);

                return {
                    id: cr.id,
                    project_name: project ? project.project_name : "",
                    module_name: mod ? mod.module_name : "",
                    title: cr.title,
                    description: cr.description,
                    priority: cr.priority,
                    status: cr.status,
                    developer: dev ? dev.name : "",
                    created_at: cr.created_at,
                    version: version ? version.version : null
                };
            });

            if (rawKeyword) {
                list = list.filter(cr => {
                    return (
                        cr.project_name.toLowerCase().includes(rawKeyword) ||
                        cr.module_name.toLowerCase().includes(rawKeyword) ||
                        (cr.version && cr.version.toLowerCase().includes(rawKeyword)) ||
                        cr.status.toLowerCase().includes(rawKeyword) ||
                        cr.developer.toLowerCase().includes(rawKeyword) ||
                        cr.title.toLowerCase().includes(rawKeyword) ||
                        cr.description.toLowerCase().includes(rawKeyword)
                    );
                });
            }

            if (statusFilter) {
                list = list.filter(cr => cr.status.toLowerCase() === statusFilter.toLowerCase());
            }

            if (priorityFilter) {
                list = list.filter(cr => cr.priority.toLowerCase() === priorityFilter.toLowerCase());
            }

            if (/AND\s+p\.project_manager_id=\?/is.test(trimmed)) {
                const managerId = Number(params[params.length - 1]);
                list = list.filter(cr => {
                    const p = this.tables.projects.find(proj => proj.id === cr.project_id);
                    return p && p.project_manager_id === managerId;
                });
            } else if (/AND\s+EXISTS\s*\(\s*SELECT\s+1\s+FROM\s+project_developers/is.test(trimmed)) {
                const devId = Number(params[params.length - 1]);
                list = list.filter(cr => {
                    return this.tables.project_developers.some(pd => pd.project_id === cr.project_id && pd.developer_id === devId);
                });
            }

            list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            return list;
        }

        console.warn("Unhandled SQL query:", sql, params);
        return [];
    }
}

module.exports = MockDatabase;
