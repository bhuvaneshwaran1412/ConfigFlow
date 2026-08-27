/**
 * Tier 2: Boundary & Corner Cases E2E Tests (≥60 Tests)
 *
 * Validates edge inputs, non-existent IDs, malformed payloads, SQL injection resilience,
 * missing/tampered JWT tokens, RBAC negative assertions, unicode emoji elimination scan,
 * and DOM ID invariants across all 11 HTML pages.
 */

const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

function registerTests({ test, assert, request, multipartRequest, loginAs, resetDatabase, BASE_URL }) {

    const publicPagesDir = path.resolve(__dirname, "../../public/pages");
    const publicJsDir = path.resolve(__dirname, "../../public/js");

    // =========================================================================
    // 1. UNICODE EMOJI & DECORATIVE SLOP ELIMINATION SCAN (23 Tests)
    // =========================================================================

    const EMOJI_REGEX = /[\u{1F300}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}\u{1F1E0}-\u{1F1FF}]/u;

    const htmlFiles = [
        "dashboard.html",
        "projects.html",
        "modules.html",
        "changeRequests.html",
        "approval.html",
        "versions.html",
        "releaseNotes.html",
        "reports.html",
        "auditLogs.html",
        "search.html",
        "login.html"
    ];

    const jsFiles = [
        "sidebar.js",
        "login.js",
        "dashboard.js",
        "projects.js",
        "modules.js",
        "changeRequests.js",
        "approval.js",
        "versions.js",
        "releaseNotes.js",
        "reports.js",
        "auditLogs.js",
        "search.js"
    ];

    htmlFiles.forEach(file => {
        test(`T2-EMOJI-HTML-${file}: Scans public/pages/${file} for zero unicode emojis`, async () => {
            const filePath = path.join(publicPagesDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf8");
                const hasEmoji = EMOJI_REGEX.test(content);
                assert.strictEqual(hasEmoji, false, `Found unicode emoji in public/pages/${file}`);
            }
        });
    });

    jsFiles.forEach(file => {
        test(`T2-EMOJI-JS-${file}: Scans public/js/${file} for zero unicode emojis`, async () => {
            const filePath = path.join(publicJsDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf8");
                const hasEmoji = EMOJI_REGEX.test(content);
                assert.strictEqual(hasEmoji, false, `Found unicode emoji in public/js/${file}`);
            }
        });
    });

    // =========================================================================
    // 2. DOM ID & CONTAINER PRESERVATION SCAN ACROSS ALL 11 PAGES (15 Tests)
    // =========================================================================

    test("T2-DOM-01: Shared user indicators (#sidebarUserName, #sidebarUserRole) exist in protected pages", async () => {
        const protectedPages = [
            "dashboard.html",
            "projects.html",
            "modules.html",
            "changeRequests.html",
            "approval.html",
            "versions.html",
            "releaseNotes.html",
            "reports.html",
            "auditLogs.html",
            "search.html"
        ];

        for (const file of protectedPages) {
            const filePath = path.join(publicPagesDir, file);
            if (fs.existsSync(filePath)) {
                const content = fs.readFileSync(filePath, "utf8");
                assert.ok(content.includes('id="sidebarUserName"') || content.includes("sidebarUserName"), `Missing #sidebarUserName in ${file}`);
                assert.ok(content.includes('id="sidebarUserRole"') || content.includes("sidebarUserRole"), `Missing #sidebarUserRole in ${file}`);
            }
        }
    });

    test("T2-DOM-02: projects.html preserves #projectsTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "projects.html"), "utf8");
        assert.ok(content.includes('id="projectsTable"'));
    });

    test("T2-DOM-03: modules.html preserves #modulesTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "modules.html"), "utf8");
        assert.ok(content.includes('id="modulesTable"'));
    });

    test("T2-DOM-04: changeRequests.html preserves #requestsTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "changeRequests.html"), "utf8");
        assert.ok(content.includes('id="requestsTable"'));
    });

    test("T2-DOM-05: approval.html preserves #pendingRequestsTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "approval.html"), "utf8");
        assert.ok(content.includes('id="pendingRequestsTable"'));
    });

    test("T2-DOM-06: versions.html preserves #versionsTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "versions.html"), "utf8");
        assert.ok(content.includes('id="versionsTable"'));
    });

    test("T2-DOM-07: reports.html preserves #projectReportTable and #versionReportTable containers", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "reports.html"), "utf8");
        assert.ok(content.includes('id="projectReportTable"'));
        assert.ok(content.includes('id="versionReportTable"'));
    });

    test("T2-DOM-08: auditLogs.html preserves #auditTable container", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "auditLogs.html"), "utf8");
        assert.ok(content.includes('id="auditTable"'));
    });

    test("T2-DOM-09: search.html preserves #searchResults and #searchInput", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "search.html"), "utf8");
        assert.ok(content.includes('id="searchResults"'));
        assert.ok(content.includes('id="searchInput"'));
    });

    test("T2-DOM-10: dashboard.html preserves metric counter IDs", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "dashboard.html"), "utf8");
        const requiredIds = [
            "totalProjects",
            "totalDevelopers",
            "pendingRequests",
            "approvedRequests",
            "rejectedRequests",
            "latestVersion"
        ];
        for (const id of requiredIds) {
            assert.ok(content.includes(`id="${id}"`), `Missing metric container #${id} in dashboard.html`);
        }
    });

    test("T2-DOM-11: projects.html preserves #projectFormSection with #projectName and #projectDescription", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "projects.html"), "utf8");
        assert.ok(content.includes('id="projectFormSection"'));
        assert.ok(content.includes('id="projectName"'));
        assert.ok(content.includes('id="projectDescription"'));
    });

    test("T2-DOM-12: modules.html preserves #moduleFormSection with #moduleName and #projectId", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "modules.html"), "utf8");
        assert.ok(content.includes('id="moduleFormSection"'));
        assert.ok(content.includes('id="moduleName"'));
        assert.ok(content.includes('id="projectId"'));
    });

    test("T2-DOM-13: changeRequests.html preserves #requestFormSection with #requestTitle and #requestDescription", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "changeRequests.html"), "utf8");
        assert.ok(content.includes('id="requestFormSection"'));
        assert.ok(content.includes('id="requestTitle"'));
        assert.ok(content.includes('id="requestDescription"'));
    });

    test("T2-DOM-14: approval.html preserves #approvalSection and #adminComment", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "approval.html"), "utf8");
        assert.ok(content.includes('id="approvalSection"'));
        assert.ok(content.includes('id="adminComment"'));
    });

    test("T2-DOM-15: login.html preserves #loginFields, #registerFields and auth input IDs", async () => {
        const content = fs.readFileSync(path.join(publicPagesDir, "login.html"), "utf8");
        assert.ok(content.includes('id="loginFields"'));
        assert.ok(content.includes('id="registerFields"'));
        assert.ok(content.includes('id="email"'));
        assert.ok(content.includes('id="password"'));
        assert.ok(content.includes('id="registerName"'));
        assert.ok(content.includes('id="registerEmail"'));
        assert.ok(content.includes('id="registerPassword"'));
    });

    // =========================================================================
    // 3. AUTHENTICATION & REGISTRATION BOUNDARY TESTS (11 Tests)
    // =========================================================================

    test("T2-AUTH-01: Login with non-existent email returns 401 Unauthorized", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: { email: "nonexistent@user.com", password: "Password@123" }
        });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, "Invalid Email or Password");
    });

    test("T2-AUTH-02: Login with incorrect password returns 401 Unauthorized", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: { email: "admin@configflow.com", password: "WrongPassword999" }
        });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, "Invalid Email or Password");
    });

    test("T2-AUTH-03: Login with empty credentials returns 401 Unauthorized", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: { email: "", password: "" }
        });
        assert.strictEqual(res.status, 401);
    });

    test("T2-AUTH-04: Register with missing name returns 400 Bad Request", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { email: "dev@dev.ac.in", password: "Password@123" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
        assert.strictEqual(res.data.message, "Name, work email, and password are required");
    });

    test("T2-AUTH-05: Register with missing email returns 400 Bad Request", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Bob", password: "Password@123" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
    });

    test("T2-AUTH-06: Register with missing password returns 400 Bad Request", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Bob", email: "bob@dev.ac.in" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.success, false);
    });

    test("T2-AUTH-07: Register with mismatching confirm_password returns 400", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: {
                name: "Bob",
                email: "bob@dev.ac.in",
                password: "Password@123",
                confirm_password: "MismatchedPassword"
            }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Passwords do not match");
    });

    test("T2-AUTH-08: Register with invalid email format returns 400", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Bob", email: "notanemailaddress", password: "Password@123" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Enter a valid work email address");
    });

    test("T2-AUTH-09: Register with generic email domain (@gmail.com) returns 400", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Bob", email: "bob@gmail.com", password: "Password@123" }
        });
        assert.strictEqual(res.status, 400);
        assert.ok(res.data.message.includes("Use a @dev.ac.in email for Developer or @manager.in for Manager"));
    });

    test("T2-AUTH-10: Register with password less than 8 characters returns 400", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Bob", email: "bob@dev.ac.in", password: "short" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Password must be at least 8 characters");
    });

    test("T2-AUTH-11: Register with duplicate email returns 409 Conflict", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: { name: "Dev Clone", email: "developer@dev.ac.in", password: "Password@123" }
        });
        assert.strictEqual(res.status, 409);
        assert.strictEqual(res.data.message, "Email or employee ID is already registered");
    });

    // =========================================================================
    // 4. SESSION & COOKIE BOUNDARY TESTS (6 Tests)
    // =========================================================================

    test("T2-AUTH-12: Accessing protected endpoint without cookie returns 401 Unauthorized", async () => {
        const res = await request("/api/projects");
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.message, "Authentication required");
    });

    test("T2-AUTH-13: Accessing protected endpoint with invalid JWT signature returns 401", async () => {
        const fakeToken = jwt.sign({ id: 1, email: "admin@configflow.com", role: "Admin" }, "wrong_secret_key");
        const res = await request("/api/projects", {
            headers: { Cookie: `configflow_token=${fakeToken}` }
        });
        assert.strictEqual(res.status, 401);
        assert.strictEqual(res.data.message, "Your session has expired. Please log in again.");
    });

    test("T2-AUTH-14: Accessing protected endpoint with expired JWT returns 401", async () => {
        const expiredToken = jwt.sign(
            { id: 1, email: "admin@configflow.com", role: "Admin" },
            process.env.JWT_SECRET,
            { expiresIn: "-1s" }
        );
        const res = await request("/api/projects", {
            headers: { Cookie: `configflow_token=${expiredToken}` }
        });
        assert.strictEqual(res.status, 401);
    });

    test("T2-AUTH-15: Accessing protected endpoint with garbage cookie value returns 401", async () => {
        const res = await request("/api/projects", {
            headers: { Cookie: "configflow_token=totally_not_a_valid_jwt" }
        });
        assert.strictEqual(res.status, 401);
    });

    test("T2-AUTH-16: Accessing protected endpoint with empty cookie header returns 401", async () => {
        const res = await request("/api/projects", {
            headers: { Cookie: "" }
        });
        assert.strictEqual(res.status, 401);
    });

    test("T2-AUTH-17: Accessing protected endpoint with different cookie name returns 401", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects", {
            headers: { Cookie: `other_token=${auth.token}` }
        });
        assert.strictEqual(res.status, 401);
    });

    // =========================================================================
    // 5. ROLE-BASED ACCESS CONTROL (RBAC) NEGATIVE ASSERTIONS (14 Tests)
    // =========================================================================

    test("T2-RBAC-01: Developer cannot create project (POST /api/projects returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/projects", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { project_name: "Illegal Project", description: "Desc", current_version: "v1.0" }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-02: Manager cannot create project (POST /api/projects returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { project_name: "Illegal Project", description: "Desc", current_version: "v1.0" }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-03: Developer cannot delete project (DELETE /api/projects/:id returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/projects/1", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-04: Manager cannot delete project (DELETE /api/projects/:id returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects/1", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-05: Developer cannot assign manager (POST /api/projects/:id/manager returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/projects/1/manager", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { manager_id: 2 }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-06: Manager cannot assign manager (POST /api/projects/:id/manager returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects/1/manager", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { manager_id: 2 }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-07: Developer cannot access assignable users (GET /api/users/assignable returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/users/assignable", {
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-08: Developer cannot approve change requests (PUT /api/change-requests/:id/approve returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: { status: "Approved" }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-09: Developer cannot publish release notes (POST /api/release-notes returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/release-notes", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { version_id: 1, notes: "Unauthorized release note" }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-10: Manager cannot publish release notes (POST /api/release-notes returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/release-notes", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { version_id: 1, notes: "Unauthorized release note" }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-11: Developer cannot download backup (GET /api/backup returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/backup", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-12: Manager cannot download backup (GET /api/backup returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/backup", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-13: Developer cannot restore backup (POST /api/backup/restore returns 403)", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { backup: {} }
        });
        assert.strictEqual(res.status, 403);
    });

    test("T2-RBAC-14: Manager cannot restore backup (POST /api/backup/restore returns 403)", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { backup: {} }
        });
        assert.strictEqual(res.status, 403);
    });

    // =========================================================================
    // 6. RESOURCE NON-EXISTENCE & PARAMETER BOUNDARIES (6 Tests)
    // =========================================================================

    test("T2-PARAM-01: PUT /api/projects/99999 returns 403/404 for non-existent project", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/99999", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: { project_name: "Nonexistent", description: "Desc", current_version: "v1.0" }
        });
        assert.ok([403, 404].includes(res.status));
    });

    test("T2-PARAM-02: DELETE /api/projects/99999 returns 404 for non-existent project", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/99999", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 404);
    });

    test("T2-PARAM-03: DELETE /api/change-requests/99999 returns 404", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/99999", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 404);
    });

    test("T2-PARAM-04: Assigning non-manager user as manager returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/1/manager", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { manager_id: 3 } // ID 3 is Developer
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Selected user is not a Manager");
    });

    test("T2-PARAM-05: Assigning non-developer user as developer returns 400", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects/1/developers", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { developer_id: 2 } // ID 2 is Manager
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Selected user is not a Developer");
    });

    test("T2-PARAM-06: Assigning duplicate developer returns 409 Conflict", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects/1/developers", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { developer_id: 3 } // Already assigned
        });
        assert.strictEqual(res.status, 409);
        assert.strictEqual(res.data.message, "Developer is already assigned");
    });

    // =========================================================================
    // 7. MALFORMED PAYLOADS & SQL INJECTION RESILIENCE (10 Tests)
    // =========================================================================

    test("T2-SEC-01: Submitting change request with missing required fields returns 400", async () => {
        const auth = await loginAs("Developer");
        const res = await multipartRequest(
            "/api/change-requests",
            { project_id: "", module_id: "", title: "" },
            null,
            auth.cookie
        );
        assert.strictEqual(res.status, 400);
        assert.ok(res.data.message.includes("Missing required fields"));
    });

    test("T2-SEC-02: Approving request with missing status returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: { admin_comment: "Missing status field" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Status is required");
    });

    test("T2-SEC-03: Approving request with invalid status string ('Pending') returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: { status: "InvalidStatusValue" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Invalid status");
    });

    test("T2-SEC-04: Publishing release note with missing notes returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/release-notes", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { version_id: 1, notes: "" }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Version, notes, and creator are required");
    });

    test("T2-SEC-05: Restoring backup with missing format property returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { backup: { tables: {} } }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Invalid ConfigFlow backup file");
    });

    test("T2-SEC-06: Restoring backup with unsupported table names returns 400", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: {
                backup: {
                    format: "configflow-backup",
                    tables: { secret_passwords: [] }
                }
            }
        });
        assert.strictEqual(res.status, 400);
        assert.strictEqual(res.data.message, "Backup contains unsupported tables");
    });

    test("T2-SEC-07: SQL Injection payload in login email is safely handled", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: { email: "' OR '1'='1' --", password: "' OR '1'='1" }
        });
        assert.strictEqual(res.status, 401);
    });

    test("T2-SEC-08: SQL Injection in search query keyword is safely parameterized", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search?keyword=' UNION SELECT 1,2,3,4,5,6,7,8,9,10 --", {
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T2-SEC-09: Unicode and international characters in project name preserve fidelity", async () => {
        const auth = await loginAs("Admin");
        const name = "Projet Déploiement & Configuration 流 (v2.0)";
        const res = await request("/api/projects", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { project_name: name, description: "International characters test", current_version: "v2.0" }
        });
        assert.strictEqual(res.status, 200);

        const listRes = await request("/api/projects", { headers: { Cookie: auth.cookie } });
        assert.ok(listRes.data.some(p => p.project_name === name));
    });

    test("T2-SEC-10: Extreme payload length in module description is safely accepted", async () => {
        const auth = await loginAs("Admin");
        const longDesc = "A".repeat(4000);
        const res = await request("/api/modules", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { project_id: 1, module_name: "Heavy Module", description: longDesc }
        });
        assert.strictEqual(res.status, 200);
    });
}

module.exports = { registerTests };
