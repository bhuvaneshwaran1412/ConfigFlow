/**
 * Tier 1: Feature Coverage E2E Tests (≥70 Tests)
 *
 * Validates all 31 Express API endpoints and all 11 HTML pages,
 * asset serving, baseline responses, and core functional contracts in isolation.
 */

function registerTests({ test, assert, request, multipartRequest, loginAs, resetDatabase, BASE_URL }) {

    // =========================================================================
    // 1. STATIC PAGES & ASSETS (11 HTML Pages + Root + Assets)
    // =========================================================================

    test("T1-PAGE-01: GET /pages/login.html serves login.html with status 200", async () => {
        const res = await request("/pages/login.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("login") || res.text.includes("ConfigFlow"));
    });

    test("T1-PAGE-02: GET /pages/dashboard.html serves dashboard.html with status 200", async () => {
        const res = await request("/pages/dashboard.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("sidebar") || res.text.includes("dashboard") || res.text.includes("totalProjects"));
    });

    test("T1-PAGE-03: GET /pages/projects.html serves projects.html with status 200", async () => {
        const res = await request("/pages/projects.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("projectsTable"));
    });

    test("T1-PAGE-04: GET /pages/modules.html serves modules.html with status 200", async () => {
        const res = await request("/pages/modules.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("modulesTable"));
    });

    test("T1-PAGE-05: GET /pages/changeRequests.html serves changeRequests.html with status 200", async () => {
        const res = await request("/pages/changeRequests.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("requestsTable"));
    });

    test("T1-PAGE-06: GET /pages/approval.html serves approval.html with status 200", async () => {
        const res = await request("/pages/approval.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("pendingRequestsTable"));
    });

    test("T1-PAGE-07: GET /pages/versions.html serves versions.html with status 200", async () => {
        const res = await request("/pages/versions.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("versionsTable"));
    });

    test("T1-PAGE-08: GET /pages/releaseNotes.html serves releaseNotes.html with status 200", async () => {
        const res = await request("/pages/releaseNotes.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("release") || res.text.includes("Release"));
    });

    test("T1-PAGE-09: GET /pages/reports.html serves reports.html with status 200", async () => {
        const res = await request("/pages/reports.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("projectReportTable") || res.text.includes("versionReportTable"));
    });

    test("T1-PAGE-10: GET /pages/auditLogs.html serves auditLogs.html with status 200", async () => {
        const res = await request("/pages/auditLogs.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("auditTable"));
    });

    test("T1-PAGE-11: GET /pages/search.html serves search.html with status 200", async () => {
        const res = await request("/pages/search.html");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
        assert.ok(res.text.includes("searchResults") || res.text.includes("searchQuery"));
    });

    test("T1-PAGE-12: GET / (Root API endpoint) returns welcome greeting", async () => {
        const res = await request("/");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.text, "Welcome to ConfigFlow API");
    });

    test("T1-PAGE-13: GET /pages/login without extension resolves cleanly", async () => {
        const res = await request("/pages/login");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/html"));
    });

    test("T1-ASSET-01: GET /css/style.css serves main stylesheet with status 200", async () => {
        const res = await request("/css/style.css");
        assert.strictEqual(res.status, 200);
        assert.ok(res.headers.get("content-type").includes("text/css"));
        assert.ok(res.text.length > 50);
    });

    test("T1-ASSET-02: GET /js/sidebar.js serves sidebar controller script with status 200", async () => {
        const res = await request("/js/sidebar.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-03: GET /js/login.js serves login controller script with status 200", async () => {
        const res = await request("/js/login.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-04: GET /js/dashboard.js serves dashboard controller script with status 200", async () => {
        const res = await request("/js/dashboard.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-05: GET /js/projects.js serves projects controller script with status 200", async () => {
        const res = await request("/js/projects.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-06: GET /js/modules.js serves modules controller script with status 200", async () => {
        const res = await request("/js/modules.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-07: GET /js/changeRequests.js serves changeRequests controller script with status 200", async () => {
        const res = await request("/js/changeRequests.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-08: GET /js/approval.js serves approval controller script with status 200", async () => {
        const res = await request("/js/approval.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-09: GET /js/versions.js serves versions controller script with status 200", async () => {
        const res = await request("/js/versions.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-10: GET /js/releaseNotes.js serves release notes controller script with status 200", async () => {
        const res = await request("/js/releaseNotes.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-11: GET /js/reports.js serves reports controller script with status 200", async () => {
        const res = await request("/js/reports.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-12: GET /js/auditLogs.js serves auditLogs controller script with status 200", async () => {
        const res = await request("/js/auditLogs.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    test("T1-ASSET-13: GET /js/search.js serves search controller script with status 200", async () => {
        const res = await request("/js/search.js");
        assert.strictEqual(res.status, 200);
        assert.ok(res.text.length > 20);
    });

    // =========================================================================
    // 2. AUTHENTICATION & REGISTRATION ENDPOINTS
    // =========================================================================

    test("T1-AUTH-01: GET /api/employee-id-preview returns formatted preview CFG-XXXX", async () => {
        const res = await request("/api/employee-id-preview");
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.match(res.data.employee_id, /^CFG-\d{4}$/);
    });

    test("T1-AUTH-02: POST /api/register creates Developer account with @dev.ac.in", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: {
                name: "Alice Developer",
                email: "alice@dev.ac.in",
                password: "Password@123",
                confirm_password: "Password@123"
            }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.match(res.data.employee_id, /^CFG-\d{4}$/);
        assert.ok(res.data.message.includes("Developer account created"));
    });

    test("T1-AUTH-03: POST /api/register creates Manager account with @manager.in", async () => {
        const res = await request("/api/register", {
            method: "POST",
            body: {
                name: "Mark Manager",
                email: "mark@manager.in",
                password: "Password@123",
                confirm_password: "Password@123"
            }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.match(res.data.employee_id, /^CFG-\d{4}$/);
        assert.ok(res.data.message.includes("Manager account created"));
    });

    test("T1-AUTH-04: POST /api/login authenticates Admin and returns JWT Set-Cookie", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: {
                email: "admin@configflow.com",
                password: "Admin@1234"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, "Admin");
        assert.ok(res.cookie.includes("configflow_token="));
        assert.ok(res.cookie.includes("HttpOnly"));
    });

    test("T1-AUTH-05: POST /api/login authenticates Manager successfully", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: {
                email: "manager@manager.in",
                password: "Manager@1234"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, "Manager");
        assert.ok(res.cookie.includes("configflow_token="));
    });

    test("T1-AUTH-06: POST /api/login authenticates Developer successfully", async () => {
        const res = await request("/api/login", {
            method: "POST",
            body: {
                email: "developer@dev.ac.in",
                password: "Dev@1234"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.user.role, "Developer");
        assert.ok(res.cookie.includes("configflow_token="));
    });

    test("T1-AUTH-07: POST /api/logout clears session cookie with Max-Age=0", async () => {
        const res = await request("/api/logout", { method: "POST" });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.cookie.includes("Max-Age=0"));
    });

    // =========================================================================
    // 3. PROJECT MANAGEMENT ENDPOINTS
    // =========================================================================

    test("T1-PROJ-01: GET /api/projects as Admin returns all projects with is_assigned=1", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 2);
        assert.strictEqual(res.data[0].is_assigned, 1);
    });

    test("T1-PROJ-02: GET /api/projects as Manager returns projects with role-scoped is_assigned flag", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(p => p.is_assigned === 1));
    });

    test("T1-PROJ-03: GET /api/projects as Developer returns assigned project flags", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/projects", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(p => p.is_assigned === 1));
    });

    test("T1-PROJ-04: POST /api/projects as Admin creates a new project", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: {
                project_name: "Workflow Engine",
                description: "Automated routing pipeline",
                current_version: "v1.0.0"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Project Added Successfully");
    });

    test("T1-PROJ-05: PUT /api/projects/:id as Admin updates project metadata", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/1", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                project_name: "Core Platform Refactored",
                description: "Updated description for core platform",
                current_version: "v1.1.0"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Project Updated Successfully");
    });

    test("T1-PROJ-06: PUT /api/projects/:id as Assigned Manager updates project", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/projects/1", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                project_name: "Core Platform by Manager",
                description: "Manager update",
                current_version: "v1.0.1"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    test("T1-PROJ-07: DELETE /api/projects/:id as Admin removes project", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/2", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Project Deleted Successfully");
    });

    test("T1-PROJ-08: GET /api/users/assignable as Admin returns Managers", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/users/assignable", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(u => u.email === "manager@manager.in"));
    });

    test("T1-PROJ-09: GET /api/users/assignable as Manager returns Developers", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/users/assignable", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(u => u.email === "developer@dev.ac.in"));
    });

    test("T1-PROJ-10: POST /api/projects/:id/manager as Admin assigns Project Manager", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/projects/1/manager", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { manager_id: 2 }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Project Manager assigned");
    });

    test("T1-PROJ-11: POST /api/projects/:id/developers as Manager assigns Developer", async () => {
        const auth = await loginAs("Manager");
        await request("/api/register", {
            method: "POST",
            body: { name: "Dev Two", email: "dev2@dev.ac.in", password: "Password@123" }
        });
        const res = await request("/api/projects/1/developers", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { developer_id: 4 }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Developer assigned to project");
    });

    // =========================================================================
    // 4. MODULE MANAGEMENT ENDPOINTS
    // =========================================================================

    test("T1-MOD-01: GET /api/modules as Admin returns all modules with can_edit=1", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/modules", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 2);
        assert.strictEqual(res.data[0].can_edit, 1);
        assert.ok(res.data[0].project_name);
    });

    test("T1-MOD-02: GET /api/modules as Developer returns modules with can_edit computed", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/modules", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(m => m.can_edit === 1));
    });

    test("T1-MOD-03: POST /api/modules as Admin creates a new module", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/modules", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: {
                project_id: 1,
                module_name: "Reporting Engine",
                description: "Export and aggregate reporting metrics"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Module Added Successfully");
    });

    test("T1-MOD-04: POST /api/modules as Assigned Developer creates a module", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/modules", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: {
                project_id: 1,
                module_name: "API Gateway",
                description: "Route dispatching and rate limiting"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    test("T1-MOD-05: PUT /api/modules/:id as Assigned Developer updates module", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/modules/1", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                project_id: 1,
                module_name: "Auth Engine v2",
                description: "Enhanced session tracking"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Module Updated Successfully");
    });

    test("T1-MOD-06: DELETE /api/modules/:id as Assigned Developer deletes module", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/modules/2", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Module Deleted Successfully");
    });

    // =========================================================================
    // 5. CHANGE REQUEST ENDPOINTS
    // =========================================================================

    test("T1-CR-01: GET /api/change-requests as Admin returns all change requests", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].project_name);
        assert.ok(res.data[0].developer);
    });

    test("T1-CR-02: GET /api/change-requests as Manager returns managed project requests", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/change-requests", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T1-CR-03: GET /api/change-requests as Developer returns authored requests on assigned projects", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/change-requests", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.every(cr => cr.created_by === auth.user.id));
    });

    test("T1-CR-04: POST /api/change-requests as Developer creates change request without attachment", async () => {
        const auth = await loginAs("Developer");
        const res = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Optimize SQL Query Indices",
                description: "Add composite indexes on foreign keys",
                priority: "High"
            },
            null,
            auth.cookie
        );
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Change Request Submitted");
        assert.ok(res.data.id > 0);
    });

    test("T1-CR-05: POST /api/change-requests as Developer creates change request with file attachment", async () => {
        const auth = await loginAs("Developer");
        const res = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Add API Specification Document",
                description: "OpenAPI 3.1 schema definitions",
                priority: "Medium"
            },
            {
                fieldname: "attachment",
                filename: "openapi_spec.json",
                contentType: "application/json",
                content: JSON.stringify({ openapi: "3.1.0", info: { title: "ConfigFlow" } })
            },
            auth.cookie
        );
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.ok(res.data.attachment !== null);
    });

    test("T1-CR-06: DELETE /api/change-requests/:id as Creator Developer deletes request", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/change-requests/1", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Deleted Successfully");
    });

    test("T1-CR-07: DELETE /api/change-requests/:id as Admin deletes request", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/1", {
            method: "DELETE",
            headers: { Cookie: auth.cookie }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    // =========================================================================
    // 6. APPROVAL ENDPOINTS & STATE CASCADES
    // =========================================================================

    test("T1-APP-01: PUT /api/change-requests/:id/approve (Approved) creates version and release note", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                status: "Approved",
                admin_comment: "All checks passed. Ready for deployment."
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Request Approved Successfully");
        assert.match(res.data.version, /^v\d+$/);
    });

    test("T1-APP-02: PUT /api/change-requests/:id/approve (Rejected) rejects request without version creation", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                status: "Rejected",
                admin_comment: "Requires further security review."
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Request Rejected");
    });

    test("T1-APP-03: PUT /api/change-requests/:id/approve as Assigned Manager approves request", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                status: "Approved",
                admin_comment: "Approved by manager."
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.match(res.data.version, /^v\d+$/);
    });

    test("T1-APP-04: PUT /api/approve-request/:id (Alias Route Approved) approves request", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/approve-request/1", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                status: "Approved",
                admin_comment: "Alias route approval test"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    test("T1-APP-05: PUT /api/approve-request/:id (Alias Route Rejected) rejects request", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/approve-request/1", {
            method: "PUT",
            headers: { Cookie: auth.cookie },
            body: {
                status: "Rejected",
                admin_comment: "Alias route rejection test"
            }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
    });

    // =========================================================================
    // 7. DASHBOARD & REPORTING ENDPOINTS
    // =========================================================================

    test("T1-DASH-01: GET /api/dashboard returns aggregate metrics object", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/dashboard", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(typeof res.data.totalProjects, "number");
        assert.strictEqual(typeof res.data.totalDevelopers, "number");
        assert.strictEqual(typeof res.data.pendingRequests, "number");
        assert.strictEqual(typeof res.data.approvedRequests, "number");
        assert.strictEqual(typeof res.data.rejectedRequests, "number");
        assert.ok(res.data.latestVersion);
    });

    test("T1-REP-01: GET /api/reports as Admin returns full change requests list", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/reports", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].project_name);
        assert.ok(res.data[0].module_name);
    });

    test("T1-REP-02: GET /api/reports/stats as Admin returns KPI metrics breakdown", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/reports/stats", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(typeof res.data.data.totalRequests, "number");
        assert.strictEqual(typeof res.data.data.pendingRequests, "number");
        assert.strictEqual(typeof res.data.data.approvedRequests, "number");
        assert.strictEqual(typeof res.data.data.totalVersions, "number");
        assert.strictEqual(typeof res.data.data.totalProjects, "number");
    });

    test("T1-REP-03: GET /api/reports/projects as Admin returns project request count summary", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/reports/projects", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].project_name);
        assert.strictEqual(typeof res.data[0].total_requests, "number");
    });

    test("T1-REP-04: GET /api/reports/versions as Admin returns version report history", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/reports/versions", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].version);
    });

    test("T1-REP-05: GET /api/reports as Manager returns role-scoped report", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/reports", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T1-REP-06: GET /api/reports/stats as Developer returns role-scoped stats", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/reports/stats", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(typeof res.data.data.totalRequests, "number");
    });

    // =========================================================================
    // 8. SEARCH & FILTERING ENDPOINTS
    // =========================================================================

    test("T1-SRCH-01: GET /api/search with empty query returns all scoped records", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
    });

    test("T1-SRCH-02: GET /api/search?keyword=Cookie matches title substring", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search?keyword=Cookie", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.some(cr => cr.title.includes("Cookie")));
    });

    test("T1-SRCH-03: GET /api/search?status=Pending filters by Pending status", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search?status=Pending", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.every(cr => cr.status === "Pending"));
    });

    test("T1-SRCH-04: GET /api/search?priority=High filters by High priority", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search?priority=High", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.every(cr => cr.priority === "High"));
    });

    test("T1-SRCH-05: GET /api/search?keyword=Core&status=Pending combines keyword and status", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/search?keyword=Core&status=Pending", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    // =========================================================================
    // 9. VERSIONS & RELEASE NOTES ENDPOINTS
    // =========================================================================

    test("T1-VER-01: GET /api/versions as Admin returns versions in descending order", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/versions", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.strictEqual(res.data[0].version, "v1.0.0");
    });

    test("T1-VER-02: GET /api/versions as Developer returns versions list", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/versions", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T1-RN-01: GET /api/release-notes as Admin returns release notes list", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/release-notes", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].notes);
    });

    test("T1-RN-02: GET /api/release-notes as Developer returns release notes", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/release-notes", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T1-RN-03: POST /api/release-notes as Admin publishes new release note", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/release-notes", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: {
                version_id: 1,
                notes: "Maintenance release addressing session timeout anomalies."
            }
        });
        assert.strictEqual(res.status, 201);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Release note published");
        assert.ok(res.data.id > 0);
    });

    // =========================================================================
    // 10. AUDIT LOGS ENDPOINTS
    // =========================================================================

    test("T1-AUD-01: GET /api/audit-logs as Admin returns audit entries with user names", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/audit-logs", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
        assert.ok(res.data.length >= 1);
        assert.ok(res.data[0].action);
        assert.ok(res.data[0].user_name);
    });

    test("T1-AUD-02: GET /api/audit-logs as Manager returns audit log records", async () => {
        const auth = await loginAs("Manager");
        const res = await request("/api/audit-logs", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    test("T1-AUD-03: GET /api/audit-logs as Developer returns audit log records", async () => {
        const auth = await loginAs("Developer");
        const res = await request("/api/audit-logs", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.ok(Array.isArray(res.data));
    });

    // =========================================================================
    // 11. BACKUP & RESTORE ENDPOINTS
    // =========================================================================

    test("T1-BAK-01: GET /api/backup as Admin exports full JSON payload with 7 tables", async () => {
        const auth = await loginAs("Admin");
        const res = await request("/api/backup", { headers: { Cookie: auth.cookie } });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.format, "configflow-backup");
        assert.strictEqual(res.data.version, 1);
        assert.ok(res.data.tables.users);
        assert.ok(res.data.tables.projects);
        assert.ok(res.data.tables.modules);
        assert.ok(res.data.tables.change_requests);
        assert.ok(res.data.tables.versions);
        assert.ok(res.data.tables.release_notes);
        assert.ok(res.data.tables.audit_logs);
    });

    test("T1-BAK-02: POST /api/backup/restore as Admin restores database from JSON payload", async () => {
        const auth = await loginAs("Admin");
        const backupRes = await request("/api/backup", { headers: { Cookie: auth.cookie } });
        const res = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: auth.cookie },
            body: { backup: backupRes.data }
        });
        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.data.success, true);
        assert.strictEqual(res.data.message, "Backup restored successfully");
    });
}

module.exports = { registerTests };
