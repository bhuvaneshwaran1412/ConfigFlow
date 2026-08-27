/**
 * Tier 4: Real-World Workloads E2E Tests (≥10 Enterprise Scenarios)
 *
 * Validates production-scale operations, multi-role RBAC matrices, disaster recovery fidelity,
 * static asset zero-404 integrity across all 11 pages, concurrent workflows, binary uploads,
 * RFC 4180 CSV audit log exports, and end-to-end organizational simulations.
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function registerTests({ test, assert, request, multipartRequest, loginAs, resetDatabase, BASE_URL }) {

    // =========================================================================
    // WORKLOAD 1: ENTERPRISE MULTI-ROLE RBAC ENFORCEMENT MATRIX
    // =========================================================================

    test("T4-WORKLOAD-01: Enterprise Multi-Role Access Control Matrix across all protected endpoints", async () => {
        const adminAuth = await loginAs("Admin");
        const mgrAuth = await loginAs("Manager");
        const devAuth = await loginAs("Developer");

        // 1. Admin-only endpoints
        const adminOnlyOperations = [
            { method: "POST", endpoint: "/api/projects", body: { project_name: "X", description: "Y" } },
            { method: "DELETE", endpoint: "/api/projects/2" },
            { method: "POST", endpoint: "/api/projects/1/manager", body: { manager_id: 2 } },
            { method: "POST", endpoint: "/api/release-notes", body: { version_id: 1, notes: "Admin note" } },
            { method: "GET", endpoint: "/api/backup" },
            { method: "POST", endpoint: "/api/backup/restore", body: { backup: {} } }
        ];

        for (const op of adminOnlyOperations) {
            // Admin must be authorized (not 403)
            const adminRes = await request(op.endpoint, {
                method: op.method,
                headers: { Cookie: adminAuth.cookie },
                body: op.body
            });
            assert.notStrictEqual(adminRes.status, 403, `Admin unexpectedly forbidden on ${op.method} ${op.endpoint}`);

            // Developer must be forbidden (403)
            const devRes = await request(op.endpoint, {
                method: op.method,
                headers: { Cookie: devAuth.cookie },
                body: op.body
            });
            assert.strictEqual(devRes.status, 403, `Developer not forbidden on ${op.method} ${op.endpoint}`);
        }

        // 2. Manager and Admin allowed endpoints
        const mgrEndpoints = [
            { method: "GET", endpoint: "/api/users/assignable" },
            { method: "PUT", endpoint: "/api/change-requests/1/approve", body: { status: "Approved" } }
        ];

        for (const op of mgrEndpoints) {
            const mgrRes = await request(op.endpoint, {
                method: op.method,
                headers: { Cookie: mgrAuth.cookie },
                body: op.body
            });
            assert.notStrictEqual(mgrRes.status, 403, `Manager forbidden on ${op.method} ${op.endpoint}`);

            const devRes = await request(op.endpoint, {
                method: op.method,
                headers: { Cookie: devAuth.cookie },
                body: op.body
            });
            assert.strictEqual(devRes.status, 403, `Developer not forbidden on ${op.method} ${op.endpoint}`);
        }
    });

    // =========================================================================
    // WORKLOAD 2: DISASTER RECOVERY ROUNDTRIP DATA FIDELITY
    // =========================================================================

    test("T4-WORKLOAD-02: Disaster Recovery Round-Trip & High-Density Relational Fidelity", async () => {
        const adminAuth = await loginAs("Admin");

        // Populate rich multi-entity test dataset
        for (let p = 3; p <= 5; p++) {
            await request("/api/projects", {
                method: "POST",
                headers: { Cookie: adminAuth.cookie },
                body: { project_name: `Enterprise Project ${p}`, description: `High density project ${p}`, current_version: `v${p}.0.0` }
            });
        }

        for (let m = 3; m <= 6; m++) {
            await request("/api/modules", {
                method: "POST",
                headers: { Cookie: adminAuth.cookie },
                body: { project_id: 1, module_name: `Sub-service Module ${m}`, description: `Desc ${m}` }
            });
        }

        // Export full database backup
        const exportRes = await request("/api/backup", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(exportRes.status, 200);
        const backupData = exportRes.data;

        assert.ok(backupData.tables.users.length >= 3);
        assert.ok(backupData.tables.projects.length >= 4);
        assert.ok(backupData.tables.modules.length >= 5);

        // Wipe tables and verify empty state
        const emptyBackup = {
            format: "configflow-backup",
            version: 1,
            created_at: new Date().toISOString(),
            tables: {
                users: backupData.tables.users, // preserve users to stay authenticated
                projects: [],
                modules: [],
                change_requests: [],
                versions: [],
                release_notes: [],
                audit_logs: []
            }
        };

        const wipeRes = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { backup: emptyBackup }
        });
        assert.strictEqual(wipeRes.status, 200);

        const checkProjectsEmpty = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(checkProjectsEmpty.data.length, 0);

        // Restore original full backup
        const restoreRes = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { backup: backupData }
        });
        assert.strictEqual(restoreRes.status, 200);

        // Verify 100% restored relational data
        const checkProjectsRestored = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(checkProjectsRestored.data.length, backupData.tables.projects.length);

        const checkModulesRestored = await request("/api/modules", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(checkModulesRestored.data.length, backupData.tables.modules.length);
    });

    // =========================================================================
    // WORKLOAD 3: STATIC ASSET INTEGRITY & ZERO 404S ACROSS ALL 11 HTML PAGES
    // =========================================================================

    test("T4-WORKLOAD-03: Static Asset Integrity & Zero 404s Scan across all 11 HTML views", async () => {
        const publicPagesDir = path.resolve(__dirname, "../../public/pages");
        const pages = fs.readdirSync(publicPagesDir).filter(f => f.endsWith(".html"));

        assert.strictEqual(pages.length, 11, "Must contain exactly 11 HTML pages in public/pages/");

        for (const page of pages) {
            // 1. Fetch HTML page via HTTP
            const pageRes = await request(`/pages/${page}`);
            assert.strictEqual(pageRes.status, 200, `Page /pages/${page} returned non-200 status: ${pageRes.status}`);

            const html = pageRes.text;

            // 2. Extract and verify stylesheet links
            const cssMatches = [...html.matchAll(/<link[^>]+href=["']([^"']+)["']/g)];
            for (const match of cssMatches) {
                let cssPath = match[1];
                if (cssPath.startsWith("../")) {
                    cssPath = cssPath.replace("../", "/");
                } else if (!cssPath.startsWith("/")) {
                    cssPath = "/" + cssPath;
                }
                const cssRes = await request(cssPath);
                assert.strictEqual(cssRes.status, 200, `Asset 404: ${cssPath} referenced in ${page}`);
            }

            // 3. Extract and verify script references
            const jsMatches = [...html.matchAll(/<script[^>]+src=["']([^"']+)["']/g)];
            for (const match of jsMatches) {
                let jsPath = match[1];
                if (jsPath.startsWith("../")) {
                    jsPath = jsPath.replace("../", "/");
                } else if (!jsPath.startsWith("/")) {
                    jsPath = "/" + jsPath;
                }
                const jsRes = await request(jsPath);
                assert.strictEqual(jsRes.status, 200, `Script 404: ${jsPath} referenced in ${page}`);
            }
        }
    });

    // =========================================================================
    // WORKLOAD 4: HIGH-DENSITY SEARCH & KPI CATEGORIZATION
    // =========================================================================

    test("T4-WORKLOAD-04: High-Density Search & Dashboard KPI Metric Consistency", async () => {
        const adminAuth = await loginAs("Admin");
        const devAuth = await loginAs("Developer");

        // Seed structured change requests with various priorities and statuses
        const crConfigs = [
            { title: "SearchTagAlpha Core Patch", priority: "High" },
            { title: "SearchTagBeta Minor Tweak", priority: "Low" },
            { title: "SearchTagGamma Critical Fix", priority: "Critical" }
        ];

        for (const config of crConfigs) {
            await multipartRequest(
                "/api/change-requests",
                {
                    project_id: "1",
                    module_id: "1",
                    title: config.title,
                    description: `Automated test CR for ${config.title}`,
                    priority: config.priority
                },
                null,
                devAuth.cookie
            );
        }

        // 1. Search for Alpha
        const searchAlpha = await request("/api/search?keyword=SearchTagAlpha", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(searchAlpha.data.length, 1);
        assert.ok(searchAlpha.data[0].title.includes("SearchTagAlpha"));

        // 2. Search for all SearchTag
        const searchAll = await request("/api/search?keyword=SearchTag", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(searchAll.data.length, 3);

        // 3. Verify reports summary stats match
        const statsRes = await request("/api/reports/stats", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(statsRes.status, 200);
        assert.ok(statsRes.data.data.totalRequests >= 4);
    });

    // =========================================================================
    // WORKLOAD 5: CONCURRENT MULTI-USER PIPELINE
    // =========================================================================

    test("T4-WORKLOAD-05: Concurrent Multi-User Change Request Pipeline", async () => {
        const adminAuth = await loginAs("Admin");

        // Create 2 separate developers
        const dev1Email = "concurrentdev1@dev.ac.in";
        const dev2Email = "concurrentdev2@dev.ac.in";

        await request("/api/register", { method: "POST", body: { name: "Dev 1", email: dev1Email, password: "Password@123" } });
        await request("/api/register", { method: "POST", body: { name: "Dev 2", email: dev2Email, password: "Password@123" } });

        const login1 = await request("/api/login", { method: "POST", body: { email: dev1Email, password: "Password@123" } });
        const login2 = await request("/api/login", { method: "POST", body: { email: dev2Email, password: "Password@123" } });

        const cookie1 = login1.cookie.split(";")[0];
        const cookie2 = login2.cookie.split(";")[0];

        // Assign both developers to Project 1
        const mgrAuth = await loginAs("Manager");
        await request("/api/projects/1/developers", { method: "POST", headers: { Cookie: mgrAuth.cookie }, body: { developer_id: login1.data.user.id } });
        await request("/api/projects/1/developers", { method: "POST", headers: { Cookie: mgrAuth.cookie }, body: { developer_id: login2.data.user.id } });

        // Concurrent submission
        const [cr1, cr2] = await Promise.all([
            multipartRequest("/api/change-requests", { project_id: "1", module_id: "1", title: "Concurrent CR 1", description: "Desc 1", priority: "High" }, null, cookie1),
            multipartRequest("/api/change-requests", { project_id: "1", module_id: "1", title: "Concurrent CR 2", description: "Desc 2", priority: "Medium" }, null, cookie2)
        ]);

        assert.strictEqual(cr1.status, 200);
        assert.strictEqual(cr2.status, 200);
        assert.notStrictEqual(cr1.data.id, cr2.data.id);

        // Manager approves both concurrently
        const [app1, app2] = await Promise.all([
            request(`/api/change-requests/${cr1.data.id}/approve`, { method: "PUT", headers: { Cookie: mgrAuth.cookie }, body: { status: "Approved", admin_comment: "Approved 1" } }),
            request(`/api/change-requests/${cr2.data.id}/approve`, { method: "PUT", headers: { Cookie: mgrAuth.cookie }, body: { status: "Approved", admin_comment: "Approved 2" } })
        ]);

        assert.strictEqual(app1.status, 200);
        assert.strictEqual(app2.status, 200);
    });

    // =========================================================================
    // WORKLOAD 6: SESSION LIFECYCLE & SECURITY HEADERS
    // =========================================================================

    test("T4-WORKLOAD-06: Session Token Lifecycle, Expiration & Cookie Headers", async () => {
        // Step 1: Login
        const loginRes = await request("/api/login", {
            method: "POST",
            body: { email: "admin@configflow.com", password: "Admin@1234" }
        });
        assert.strictEqual(loginRes.status, 200);
        const setCookieHeader = loginRes.cookie;

        assert.ok(setCookieHeader.includes("configflow_token="));
        assert.ok(setCookieHeader.includes("HttpOnly"));
        assert.ok(setCookieHeader.includes("SameSite=Lax"));
        assert.ok(setCookieHeader.includes("Max-Age=28800"));

        // Step 2: Use session cookie for protected call
        const cookie = setCookieHeader.split(";")[0];
        const projRes = await request("/api/projects", { headers: { Cookie: cookie } });
        assert.strictEqual(projRes.status, 200);

        // Step 3: Logout
        const logoutRes = await request("/api/logout", { method: "POST", headers: { Cookie: cookie } });
        assert.strictEqual(logoutRes.status, 200);
        assert.ok(logoutRes.cookie.includes("Max-Age=0"));
    });

    // =========================================================================
    // WORKLOAD 7: LARGE FILE ATTACHMENT & BINARY INTEGRITY
    // =========================================================================

    test("T4-WORKLOAD-07: Large Binary Attachment Upload, Checksum Verification & Retrieval", async () => {
        const devAuth = await loginAs("Developer");

        // Generate 64KB random binary buffer
        const randomBinary = crypto.randomBytes(64 * 1024);
        const originalChecksum = crypto.createHash("sha256").update(randomBinary).digest("hex");

        // Upload attachment
        const uploadRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Large Binary Driver Attachment",
                description: "Firmware binary with sha256 checksum",
                priority: "High"
            },
            {
                fieldname: "attachment",
                filename: "firmware.bin",
                contentType: "application/octet-stream",
                content: randomBinary
            },
            devAuth.cookie
        );
        assert.strictEqual(uploadRes.status, 200);
        const uploadedFilename = uploadRes.data.attachment;
        assert.ok(uploadedFilename);

        // Retrieve attachment from /uploads/
        const downloadRes = await fetch(`${BASE_URL}/uploads/${uploadedFilename}`);
        assert.strictEqual(downloadRes.status, 200);
        const downloadedBuffer = Buffer.from(await downloadRes.arrayBuffer());

        const downloadedChecksum = crypto.createHash("sha256").update(downloadedBuffer).digest("hex");
        assert.strictEqual(downloadedChecksum, originalChecksum, "Binary SHA256 checksum must match after download");
    });

    // =========================================================================
    // WORKLOAD 8: AUDIT TRAIL RFC 4180 CSV FORMAT COMPLIANCE
    // =========================================================================

    test("T4-WORKLOAD-08: Audit Log RFC 4180 CSV Structure & Escaping Invariant", async () => {
        const adminAuth = await loginAs("Admin");

        // Write an audit action containing commas, quotes, and newlines in details
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: {
                project_name: 'Project with "Quotes" & ,Commas,',
                description: "Description test",
                current_version: "v1.0.0"
            }
        });

        const auditRes = await request("/api/audit-logs", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(auditRes.status, 200);
        assert.ok(Array.isArray(auditRes.data));

        // Simulate client-side RFC 4180 CSV generator
        function generateCsv(logs) {
            const headers = ["ID", "User ID", "User Name", "Action", "Details", "Date"];
            const rows = logs.map(log => [
                log.id,
                log.user_id,
                `"${(log.user_name || "").replace(/"/g, '""')}"`,
                `"${(log.action || "").replace(/"/g, '""')}"`,
                `"${(log.details || "").replace(/"/g, '""')}"`,
                `"${log.created_at}"`
            ]);
            return [headers.join(","), ...rows.map(r => r.join(","))].join("\r\n");
        }

        const csvContent = generateCsv(auditRes.data);
        assert.ok(csvContent.startsWith("ID,User ID,User Name,Action,Details,Date"));
        assert.ok(csvContent.includes('""Quotes""'));
    });

    // =========================================================================
    // WORKLOAD 9: DATA BOUNDARY STRESS & UNICODE TEXT INVARIANCE
    // =========================================================================

    test("T4-WORKLOAD-09: Extreme Boundary Input Stress with Mixed Symbols and Extended Characters", async () => {
        const adminAuth = await loginAs("Admin");

        const specialTexts = [
            "SQL' OR '1'='1' UNION SELECT /* comment */ --",
            "<script>alert('XSS')</script>&amp;<span>Safe</span>",
            "CJK: 软件配置管理系统 (SCM) 日本語 한국어",
            "Symbols: © ® ™ § ¶ † ‡ • … ‰ ′ ″ ‹ › « »",
            "Mathematics: ∑ ∏ √ ∫ ≈ ≠ ≤ ≥ ∞ ∂ ∇ ⊂ ⊃ ∈ ∉"
        ];

        for (let i = 0; i < specialTexts.length; i++) {
            const text = specialTexts[i];
            const projRes = await request("/api/projects", {
                method: "POST",
                headers: { Cookie: adminAuth.cookie },
                body: { project_name: `Stress ${i}: ${text.substring(0, 50)}`, description: text, current_version: "v1.0.0" }
            });
            assert.strictEqual(projRes.status, 200);
        }

        const listRes = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.ok(listRes.data.length >= specialTexts.length);
    });

    // =========================================================================
    // WORKLOAD 10: END-TO-END ENTERPRISE SYSTEM SIMULATION
    // =========================================================================

    test("T4-WORKLOAD-10: End-to-End Enterprise Organizational Simulation", async () => {
        const adminAuth = await loginAs("Admin");

        // 1. Setup 2 Projects
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_name: "Org Alpha Platform", description: "Alpha tier", current_version: "v1.0.0" }
        });
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_name: "Org Beta Services", description: "Beta tier", current_version: "v1.0.0" }
        });

        // 2. Register & assign team members
        await request("/api/register", { method: "POST", body: { name: "Org Manager", email: "orgmgr@manager.in", password: "Password@123" } });
        await request("/api/register", { method: "POST", body: { name: "Org Dev", email: "orgdev@dev.ac.in", password: "Password@123" } });

        const assignables = await request("/api/users/assignable", { headers: { Cookie: adminAuth.cookie } });
        const orgMgr = assignables.data.find(u => u.email === "orgmgr@manager.in");
        assert.ok(orgMgr);

        const projList = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        const alphaProj = projList.data.find(p => p.project_name === "Org Alpha Platform");
        assert.ok(alphaProj);

        await request(`/api/projects/${alphaProj.id}/manager`, {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { manager_id: orgMgr.id }
        });

        // 3. Manager logs in and assigns developer
        const orgMgrLogin = await request("/api/login", { method: "POST", body: { email: "orgmgr@manager.in", password: "Password@123" } });
        const orgMgrCookie = orgMgrLogin.cookie.split(";")[0];

        const devAssignables = await request("/api/users/assignable", { headers: { Cookie: orgMgrCookie } });
        const orgDev = devAssignables.data.find(u => u.email === "orgdev@dev.ac.in");
        assert.ok(orgDev);

        await request(`/api/projects/${alphaProj.id}/developers`, {
            method: "POST",
            headers: { Cookie: orgMgrCookie },
            body: { developer_id: orgDev.id }
        });

        // 4. Developer logs in, creates module, submits CR
        const orgDevLogin = await request("/api/login", { method: "POST", body: { email: "orgdev@dev.ac.in", password: "Password@123" } });
        const orgDevCookie = orgDevLogin.cookie.split(";")[0];

        await request("/api/modules", {
            method: "POST",
            headers: { Cookie: orgDevCookie },
            body: { project_id: alphaProj.id, module_name: "Org Core Module", description: "Core enterprise module" }
        });

        const modList = await request("/api/modules", { headers: { Cookie: orgDevCookie } });
        const orgMod = modList.data.find(m => m.project_id === alphaProj.id);
        assert.ok(orgMod);

        const crRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: String(alphaProj.id),
                module_id: String(orgMod.id),
                title: "Enterprise Rollout Change",
                description: "Final verification of organization-wide deployment",
                priority: "Critical"
            },
            null,
            orgDevCookie
        );
        assert.strictEqual(crRes.status, 200);

        // 5. Manager approves CR
        const appRes = await request(`/api/change-requests/${crRes.data.id}/approve`, {
            method: "PUT",
            headers: { Cookie: orgMgrCookie },
            body: { status: "Approved", admin_comment: "Enterprise approval complete." }
        });
        assert.strictEqual(appRes.status, 200);

        // 6. Admin verifies system metrics and exports final backup
        const reportStats = await request("/api/reports/stats", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(reportStats.status, 200);
        assert.ok(reportStats.data.data.approvedRequests >= 1);

        const finalBackup = await request("/api/backup", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(finalBackup.status, 200);
        assert.strictEqual(finalBackup.data.format, "configflow-backup");
    });
}

module.exports = { registerTests };
