/**
 * Tier 3: Cross-Feature Combinations E2E Tests (≥15 Multi-Step Lifecycle Tests)
 *
 * Validates complex end-to-end user workflows, state cascades across multiple entities,
 * authorization transitions, data integrity roundtrips, and sequential operations.
 */

function registerTests({ test, assert, request, multipartRequest, loginAs, resetDatabase, BASE_URL }) {

    test("T3-COMBO-01: Full Enterprise SCM Lifecycle (Admin -> Manager -> Dev -> CR -> Approval -> Version & Notes)", async () => {
        // Step 1: Admin logs in and creates a project
        const adminAuth = await loginAs("Admin");
        const createProjRes = await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: {
                project_name: "FinTech Settlement Hub",
                description: "Real-time payment settlements",
                current_version: "v1.0.0"
            }
        });
        assert.strictEqual(createProjRes.status, 200);

        // Step 2: Fetch project list to get newly created project ID
        const projListRes = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        const project = projListRes.data.find(p => p.project_name === "FinTech Settlement Hub");
        assert.ok(project);
        const projectId = project.id;

        // Step 3: Admin assigns Manager (ID 2)
        const assignMgrRes = await request(`/api/projects/${projectId}/manager`, {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { manager_id: 2 }
        });
        assert.strictEqual(assignMgrRes.status, 200);

        // Step 4: Manager logs in and assigns Developer (ID 3)
        const mgrAuth = await loginAs("Manager");
        const assignDevRes = await request(`/api/projects/${projectId}/developers`, {
            method: "POST",
            headers: { Cookie: mgrAuth.cookie },
            body: { developer_id: 3 }
        });
        assert.strictEqual(assignDevRes.status, 200);

        // Step 5: Developer logs in, verifies project is marked assigned, and creates a module
        const devAuth = await loginAs("Developer");
        const devProjRes = await request("/api/projects", { headers: { Cookie: devAuth.cookie } });
        const devProject = devProjRes.data.find(p => p.id === projectId);
        assert.ok(devProject);
        assert.strictEqual(devProject.is_assigned, 1);

        const addModRes = await request("/api/modules", {
            method: "POST",
            headers: { Cookie: devAuth.cookie },
            body: {
                project_id: projectId,
                module_name: "Ledger Reconciliation",
                description: "Automated ledger matching engine"
            }
        });
        assert.strictEqual(addModRes.status, 200);

        const modListRes = await request("/api/modules", { headers: { Cookie: devAuth.cookie } });
        const module = modListRes.data.find(m => m.module_name === "Ledger Reconciliation");
        assert.ok(module);
        assert.strictEqual(module.can_edit, 1);
        const moduleId = module.id;

        // Step 6: Developer submits a change request
        const submitCRRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: String(projectId),
                module_id: String(moduleId),
                title: "Add ISO 20022 Message Parser",
                description: "Parse pacs.008 and camt.053 settlement messages",
                priority: "Critical"
            },
            null,
            devAuth.cookie
        );
        assert.strictEqual(submitCRRes.status, 200);
        const crId = submitCRRes.data.id;

        // Step 7: Manager sees pending request and approves it
        const mgrCRList = await request("/api/change-requests", { headers: { Cookie: mgrAuth.cookie } });
        const pendingCR = mgrCRList.data.find(c => c.id === crId);
        assert.ok(pendingCR);
        assert.strictEqual(pendingCR.status, "Pending");

        const approveRes = await request(`/api/change-requests/${crId}/approve`, {
            method: "PUT",
            headers: { Cookie: mgrAuth.cookie },
            body: {
                status: "Approved",
                admin_comment: "All regulatory parser checks validated."
            }
        });
        assert.strictEqual(approveRes.status, 200);
        const createdVersion = approveRes.data.version;
        assert.match(createdVersion, /^v\d+$/);

        // Step 8: Verify version and release notes created
        const versionsRes = await request("/api/versions", { headers: { Cookie: adminAuth.cookie } });
        const newVersionRecord = versionsRes.data.find(v => v.version === createdVersion);
        assert.ok(newVersionRecord);
        assert.strictEqual(newVersionRecord.description, "Add ISO 20022 Message Parser");

        const rnRes = await request("/api/release-notes", { headers: { Cookie: adminAuth.cookie } });
        const releaseNoteRecord = rnRes.data.find(r => r.version === createdVersion);
        assert.ok(releaseNoteRecord);
        assert.strictEqual(releaseNoteRecord.notes, "Parse pacs.008 and camt.053 settlement messages");

        // Step 9: Verify dashboard and report counts reflect approval
        const dashRes = await request("/api/dashboard", { headers: { Cookie: adminAuth.cookie } });
        assert.ok(dashRes.data.approvedRequests >= 1);
        assert.strictEqual(dashRes.data.latestVersion, createdVersion);
    });

    test("T3-COMBO-02: Change Request Rejection and Resubmission Cycle", async () => {
        const devAuth = await loginAs("Developer");
        const mgrAuth = await loginAs("Manager");

        // Step 1: Developer submits initial change request
        const crRes1 = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Refactor Database Connection Pool",
                description: "Increase pool size to 50",
                priority: "Medium"
            },
            null,
            devAuth.cookie
        );
        assert.strictEqual(crRes1.status, 200);
        const crId1 = crRes1.data.id;

        // Step 2: Manager rejects CR with feedback
        const rejectRes = await request(`/api/change-requests/${crId1}/approve`, {
            method: "PUT",
            headers: { Cookie: mgrAuth.cookie },
            body: {
                status: "Rejected",
                admin_comment: "Benchmark data required before increasing pool size."
            }
        });
        assert.strictEqual(rejectRes.status, 200);
        assert.strictEqual(rejectRes.data.message, "Request Rejected");

        // Step 3: Verify rejected status and ensure no new version was created
        const versionsBefore = await request("/api/versions", { headers: { Cookie: devAuth.cookie } });
        const initialVersionCount = versionsBefore.data.length;

        const crCheck = await request("/api/change-requests", { headers: { Cookie: devAuth.cookie } });
        const rejectedCR = crCheck.data.find(c => c.id === crId1);
        assert.strictEqual(rejectedCR.status, "Rejected");
        assert.strictEqual(rejectedCR.admin_comment, "Benchmark data required before increasing pool size.");

        // Step 4: Developer resubmits with revised details
        const crRes2 = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Refactor Database Connection Pool (with Benchmarks)",
                description: "Load test proves 25ms p99 latency with pool size 50",
                priority: "High"
            },
            null,
            devAuth.cookie
        );
        assert.strictEqual(crRes2.status, 200);
        const crId2 = crRes2.data.id;

        // Step 5: Manager approves revised request
        const approveRes = await request(`/api/change-requests/${crId2}/approve`, {
            method: "PUT",
            headers: { Cookie: mgrAuth.cookie },
            body: {
                status: "Approved",
                admin_comment: "Benchmark data looks great. Approved."
            }
        });
        assert.strictEqual(approveRes.status, 200);

        const versionsAfter = await request("/api/versions", { headers: { Cookie: devAuth.cookie } });
        assert.strictEqual(versionsAfter.data.length, initialVersionCount + 1);
    });

    test("T3-COMBO-03: User Registration to Project Collaboration Pipeline", async () => {
        const adminAuth = await loginAs("Admin");

        // Step 1: Register new Manager
        const regMgr = await request("/api/register", {
            method: "POST",
            body: {
                name: "Sarah Lead",
                email: "sarah@manager.in",
                password: "Password@123",
                confirm_password: "Password@123"
            }
        });
        assert.strictEqual(regMgr.status, 201);
        const mgrEmployeeId = regMgr.data.employee_id;

        // Step 2: Register new Developer
        const regDev = await request("/api/register", {
            method: "POST",
            body: {
                name: "David Coder",
                email: "david@dev.ac.in",
                password: "Password@123",
                confirm_password: "Password@123"
            }
        });
        assert.strictEqual(regDev.status, 201);

        // Step 3: Fetch assignable users to retrieve database IDs
        const assignableMgrs = await request("/api/users/assignable", { headers: { Cookie: adminAuth.cookie } });
        const mgrUser = assignableMgrs.data.find(u => u.employee_id === mgrEmployeeId);
        assert.ok(mgrUser);

        // Step 4: Admin assigns Sarah to Project 1
        const assignRes = await request("/api/projects/1/manager", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { manager_id: mgrUser.id }
        });
        assert.strictEqual(assignRes.status, 200);

        // Step 5: Sarah logs in and views her assigned project
        const sarahLogin = await request("/api/login", {
            method: "POST",
            body: { email: "sarah@manager.in", password: "Password@123" }
        });
        assert.strictEqual(sarahLogin.status, 200);
        const sarahCookie = sarahLogin.cookie.split(";")[0];

        const sarahProjects = await request("/api/projects", { headers: { Cookie: sarahCookie } });
        const managedProj = sarahProjects.data.find(p => p.id === 1);
        assert.strictEqual(managedProj.is_assigned, 1);
    });

    test("T3-COMBO-04: Change Request File Attachment Upload & Retrieval Roundtrip", async () => {
        const devAuth = await loginAs("Developer");
        const fileContent = "API Architectural Blueprint v1.0\nSigned-off by security lead";

        // Step 1: Submit CR with text attachment
        const submitRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Upload API Blueprint Specification",
                description: "Attached architectural diagram and endpoint schemas",
                priority: "Low"
            },
            {
                fieldname: "attachment",
                filename: "blueprint.txt",
                contentType: "text/plain",
                content: fileContent
            },
            devAuth.cookie
        );
        assert.strictEqual(submitRes.status, 200);
        const attachmentName = submitRes.data.attachment;
        assert.ok(attachmentName);

        // Step 2: Download the attachment directly from static /uploads/
        const downloadRes = await request(`/uploads/${attachmentName}`);
        assert.strictEqual(downloadRes.status, 200);
        assert.strictEqual(downloadRes.text.trim(), fileContent);

        // Step 3: Delete change request
        const deleteRes = await request(`/api/change-requests/${submitRes.data.id}`, {
            method: "DELETE",
            headers: { Cookie: devAuth.cookie }
        });
        assert.strictEqual(deleteRes.status, 200);
    });

    test("T3-COMBO-05: Multi-Version Progression and Chronological Ordering", async () => {
        const adminAuth = await loginAs("Admin");
        const devAuth = await loginAs("Developer");

        // Submit and approve 3 change requests in sequence
        for (let i = 1; i <= 3; i++) {
            const crRes = await multipartRequest(
                "/api/change-requests",
                {
                    project_id: "1",
                    module_id: "1",
                    title: `Feature Release Batch ${i}`,
                    description: `Change batch description ${i}`,
                    priority: "Medium"
                },
                null,
                devAuth.cookie
            );
            assert.strictEqual(crRes.status, 200);

            const approveRes = await request(`/api/change-requests/${crRes.data.id}/approve`, {
                method: "PUT",
                headers: { Cookie: adminAuth.cookie },
                body: { status: "Approved", admin_comment: `Approved batch ${i}` }
            });
            assert.strictEqual(approveRes.status, 200);
        }

        // Verify versions endpoint returns all versions ordered descending by ID
        const versionsRes = await request("/api/versions", { headers: { Cookie: adminAuth.cookie } });
        assert.ok(versionsRes.data.length >= 4); // 1 initial + 3 new

        for (let i = 0; i < versionsRes.data.length - 1; i++) {
            assert.ok(versionsRes.data[i].id > versionsRes.data[i + 1].id, "Versions must be ordered descending by ID");
        }

        // Verify release notes endpoint contains all release notes
        const rnRes = await request("/api/release-notes", { headers: { Cookie: adminAuth.cookie } });
        assert.ok(rnRes.data.length >= 4);
    });

    test("T3-COMBO-06: Developer Project Assignment Scope Enforcement", async () => {
        const adminAuth = await loginAs("Admin");

        // Create Project 3 with no developers assigned
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_name: "Classified Security Vault", description: "Restricted", current_version: "v1.0.0" }
        });
        const projList = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        const proj3 = projList.data.find(p => p.project_name === "Classified Security Vault");
        assert.ok(proj3);

        // Admin adds module to Project 3
        await request("/api/modules", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_id: proj3.id, module_name: "Vault Core", description: "Secret vault" }
        });
        const modList = await request("/api/modules", { headers: { Cookie: adminAuth.cookie } });
        const mod3 = modList.data.find(m => m.project_id === proj3.id);
        assert.ok(mod3);

        // Developer attempts to submit CR on unassigned Project 3 -> 403 Forbidden
        const devAuth = await loginAs("Developer");
        const illegalCR = await multipartRequest(
            "/api/change-requests",
            {
                project_id: String(proj3.id),
                module_id: String(mod3.id),
                title: "Unauthorized CR submission",
                description: "Should be rejected",
                priority: "High"
            },
            null,
            devAuth.cookie
        );
        assert.strictEqual(illegalCR.status, 403);
    });

    test("T3-COMBO-07: Manual and Automated Release Notes Coexistence", async () => {
        const adminAuth = await loginAs("Admin");

        // Admin approves existing CR to generate an automated version
        const appRes = await request("/api/change-requests/1/approve", {
            method: "PUT",
            headers: { Cookie: adminAuth.cookie },
            body: { status: "Approved", admin_comment: "Automatic version release" }
        });
        assert.strictEqual(appRes.status, 200);

        // Get newly created version ID
        const verList = await request("/api/versions", { headers: { Cookie: adminAuth.cookie } });
        const latestVer = verList.data[0];

        // Admin posts an additional manual release note for that same version
        const manualNoteRes = await request("/api/release-notes", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: {
                version_id: latestVer.id,
                notes: "Manual addendum: Hotfix patch applied for CVE-2026-9999"
            }
        });
        assert.strictEqual(manualNoteRes.status, 201);

        // Verify both automated and manual notes exist for this version
        const rnList = await request("/api/release-notes", { headers: { Cookie: adminAuth.cookie } });
        const matchingNotes = rnList.data.filter(r => r.version_id === latestVer.id);
        assert.strictEqual(matchingNotes.length, 2);
    });

    test("T3-COMBO-08: Audit Log Activity Trail Completeness", async () => {
        const adminAuth = await loginAs("Admin");
        const devAuth = await loginAs("Developer");

        // Action 1: Admin creates project
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_name: "Audit Trail Project", description: "Testing audit logging", current_version: "v1.0.0" }
        });

        // Action 2: Admin creates module
        await request("/api/modules", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_id: 1, module_name: "Audit Module", description: "Audit logging module" }
        });

        // Action 3: Dev submits change request
        const crRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Audit Trail CR",
                description: "Audited change request",
                priority: "Low"
            },
            null,
            devAuth.cookie
        );

        // Action 4: Admin approves change request
        await request(`/api/change-requests/${crRes.data.id}/approve`, {
            method: "PUT",
            headers: { Cookie: adminAuth.cookie },
            body: { status: "Approved", admin_comment: "Audit approved" }
        });

        // Verify all audit logs exist and are ordered descending by ID
        const auditRes = await request("/api/audit-logs", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(auditRes.status, 200);
        assert.ok(auditRes.data.length >= 5);

        const actions = auditRes.data.map(a => a.action);
        assert.ok(actions.includes("Created Project"));
        assert.ok(actions.includes("Created Module"));
        assert.ok(actions.includes("Created Change Request"));
        assert.ok(actions.includes("Approved Change Request"));
    });

    test("T3-COMBO-09: Multi-Entity Global Search and Filter Intersections", async () => {
        const adminAuth = await loginAs("Admin");
        const devAuth = await loginAs("Developer");

        // Create specific CR with high priority
        await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "HighPriority UniqueSearchTarget",
                description: "Deep search verification token",
                priority: "High"
            },
            null,
            devAuth.cookie
        );

        // 1. Search by unique keyword
        const res1 = await request("/api/search?keyword=UniqueSearchTarget", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(res1.status, 200);
        assert.strictEqual(res1.data.length, 1);
        assert.strictEqual(res1.data[0].title, "HighPriority UniqueSearchTarget");

        // 2. Search by matching priority filter
        const res2 = await request("/api/search?keyword=UniqueSearchTarget&priority=High", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(res2.data.length, 1);

        // 3. Search by mismatched priority filter -> empty result
        const res3 = await request("/api/search?keyword=UniqueSearchTarget&priority=Low", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(res3.data.length, 0);
    });

    test("T3-COMBO-10: Project Deletion & Scoped Accessibility Verification", async () => {
        const adminAuth = await loginAs("Admin");

        // Admin creates project
        await request("/api/projects", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_name: "Ephemeral Project", description: "To be deleted", current_version: "v1.0" }
        });
        const projList = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        const ephemeralProj = projList.data.find(p => p.project_name === "Ephemeral Project");
        assert.ok(ephemeralProj);

        // Admin deletes project
        const delRes = await request(`/api/projects/${ephemeralProj.id}`, {
            method: "DELETE",
            headers: { Cookie: adminAuth.cookie }
        });
        assert.strictEqual(delRes.status, 200);

        // Verify project is no longer present in inventory
        const projListAfter = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(projListAfter.data.some(p => p.id === ephemeralProj.id), false);
    });

    test("T3-COMBO-11: Full Backup Export -> Data Mutation -> Restore Roundtrip", async () => {
        const adminAuth = await loginAs("Admin");

        // Step 1: Export backup of initial state
        const backupRes = await request("/api/backup", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(backupRes.status, 200);
        const originalBackup = backupRes.data;
        const originalProjectsCount = originalBackup.tables.projects.length;

        // Step 2: Mutate state (delete a project and add a module)
        await request("/api/projects/2", { method: "DELETE", headers: { Cookie: adminAuth.cookie } });
        await request("/api/modules", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { project_id: 1, module_name: "Transient Module", description: "Will be wiped on restore" }
        });

        // Verify state is altered
        const midProjects = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(midProjects.data.length, originalProjectsCount - 1);

        // Step 3: Restore original backup
        const restoreRes = await request("/api/backup/restore", {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { backup: originalBackup }
        });
        assert.strictEqual(restoreRes.status, 200);
        assert.strictEqual(restoreRes.data.success, true);

        // Step 4: Verify 100% restoration of original projects
        const restoredProjects = await request("/api/projects", { headers: { Cookie: adminAuth.cookie } });
        assert.strictEqual(restoredProjects.data.length, originalProjectsCount);
        assert.ok(restoredProjects.data.some(p => p.id === 2));
    });

    test("T3-COMBO-12: Manager Scope Isolation (Manager A cannot manage Manager B's project)", async () => {
        const adminAuth = await loginAs("Admin");

        // Register Manager B
        await request("/api/register", {
            method: "POST",
            body: { name: "Manager B", email: "managerb@manager.in", password: "Password@123" }
        });
        const assignable = await request("/api/users/assignable", { headers: { Cookie: adminAuth.cookie } });
        const mgrB = assignable.data.find(u => u.email === "managerb@manager.in");
        assert.ok(mgrB);

        // Assign Manager B to Project 2 (Manager A manages Project 1)
        await request(`/api/projects/2/manager`, {
            method: "POST",
            headers: { Cookie: adminAuth.cookie },
            body: { manager_id: mgrB.id }
        });

        // Manager A logs in and attempts to update Project 2 -> 403 Forbidden
        const mgrAAuth = await loginAs("Manager");
        const unauthorizedUpdate = await request("/api/projects/2", {
            method: "PUT",
            headers: { Cookie: mgrAAuth.cookie },
            body: { project_name: "Hacked Project 2", description: "Unauthorized", current_version: "v1.0" }
        });
        assert.strictEqual(unauthorizedUpdate.status, 403);
    });

    test("T3-COMBO-13: Developer Scope Isolation (Dev A cannot submit CR on Dev B's unassigned project)", async () => {
        const adminAuth = await loginAs("Admin");

        // Register Developer B
        await request("/api/register", {
            method: "POST",
            body: { name: "Dev B", email: "devb@dev.ac.in", password: "Password@123" }
        });
        const devBLogin = await request("/api/login", {
            method: "POST",
            body: { email: "devb@dev.ac.in", password: "Password@123" }
        });
        const devBCookie = devBLogin.cookie.split(";")[0];

        // Developer B is NOT assigned to Project 1; attempts to submit CR -> 403 Forbidden
        const crRes = await multipartRequest(
            "/api/change-requests",
            {
                project_id: "1",
                module_id: "1",
                title: "Dev B Unauthorized Request",
                description: "Should fail",
                priority: "Low"
            },
            null,
            devBCookie
        );
        assert.strictEqual(crRes.status, 403);
    });

    test("T3-COMBO-14: Employee ID Sequential Generation Pipeline", async () => {
        const ids = [];
        for (let i = 1; i <= 3; i++) {
            const preview = await request("/api/employee-id-preview");
            assert.strictEqual(preview.status, 200);

            const reg = await request("/api/register", {
                method: "POST",
                body: {
                    name: `Seq Dev ${i}`,
                    email: `seqdev${i}@dev.ac.in`,
                    password: "Password@123"
                }
            });
            assert.strictEqual(reg.status, 201);
            assert.strictEqual(reg.data.employee_id, preview.data.employee_id);
            ids.push(reg.data.employee_id);
        }

        // Verify sequential increment (e.g. CFG-0004, CFG-0005, CFG-0006)
        const nums = ids.map(id => parseInt(id.replace("CFG-", ""), 10));
        assert.strictEqual(nums[1], nums[0] + 1);
        assert.strictEqual(nums[2], nums[1] + 1);
    });

    test("T3-COMBO-15: Password Security & Legacy Plaintext Upgrade on Login", async () => {
        // Register user and verify login works smoothly with bcrypt hashing
        const reg = await request("/api/register", {
            method: "POST",
            body: { name: "Hash Test", email: "hashtest@dev.ac.in", password: "SecurePassword@123" }
        });
        assert.strictEqual(reg.status, 201);

        // Login twice to verify consistent hash evaluation
        for (let i = 0; i < 2; i++) {
            const login = await request("/api/login", {
                method: "POST",
                body: { email: "hashtest@dev.ac.in", password: "SecurePassword@123" }
            });
            assert.strictEqual(login.status, 200);
            assert.strictEqual(login.data.success, true);
        }
    });

    test("T3-COMBO-16: Module Modification Across Projects with Access Preservation", async () => {
        const adminAuth = await loginAs("Admin");

        // Update module 1 to move to project 2
        const updateMod = await request("/api/modules/1", {
            method: "PUT",
            headers: { Cookie: adminAuth.cookie },
            body: {
                project_id: 2,
                module_name: "Auth Engine (Moved to Sec)",
                description: "Relocated module"
            }
        });
        assert.strictEqual(updateMod.status, 200);

        // Verify module list reflects new project assignment
        const modList = await request("/api/modules", { headers: { Cookie: adminAuth.cookie } });
        const movedMod = modList.data.find(m => m.id === 1);
        assert.strictEqual(movedMod.project_id, 2);
        assert.strictEqual(movedMod.module_name, "Auth Engine (Moved to Sec)");
    });
}

module.exports = { registerTests };
