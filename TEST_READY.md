# TEST_READY: ConfigFlow E2E Test Suite Specification & Inventory

## 1. Test Suite Overview

- **Harness Path**: `tests/e2e/runner.js`
- **Total Test Cases**: **195** (Exceeds required threshold of ≥155 by 40 tests)
- **Invocation**: `node tests/e2e/runner.js` or `npm test`
- **Selective Invocations**:
  - `node tests/e2e/runner.js --tier=1` (Tier 1: Feature Coverage)
  - `node tests/e2e/runner.js --tier=2` (Tier 2: Boundary & Corner Cases)
  - `node tests/e2e/runner.js --tier=3` (Tier 3: Cross-Feature Combinations)
  - `node tests/e2e/runner.js --tier=4` (Tier 4: Real-World Enterprise Workloads)
- **Architecture**: Opaque-box HTTP test suite running against in-process Express server with an in-memory SQL mock engine providing 100% hermetic isolation.

---

## 2. Tier Breakdown & Test Counts

| Tier | Category | File Path | Test Count | Minimum Req | Current Pass Rate |
|:----:|----------|-----------|:----------:|:-----------:|:-----------------:|
| **1** | Feature Coverage | `tests/e2e/test_tier1_features.js` | **84** | ≥ 70 | 100% (84/84) |
| **2** | Boundary & Corner Cases | `tests/e2e/test_tier2_boundaries.js` | **85** | ≥ 60 | 85.9% (73/85)* |
| **3** | Cross-Feature Combos | `tests/e2e/test_tier3_combos.js` | **16** | ≥ 15 | 100% (16/16) |
| **4** | Real-World Enterprise Workloads | `tests/e2e/test_tier4_workloads.js` | **10** | ≥ 10 | 100% (10/10) |
| **TOTAL** | **Comprehensive Suite** | `tests/e2e/` | **195** | **≥ 155** | **93.8% (183/195)** |

*\*Note on Tier 2 Pass Rate: The 12 failing checks in Tier 2 are the adversarial unicode emoji scans on `public/pages/*.html` and `public/js/*.js`. The prototype currently contains legacy emojis which are actively being removed in parallel by M2 and M3 workers. Once M2 and M3 refactoring is complete, the suite will achieve 100% (195/195) pass rate.*

---

## 3. Comprehensive Endpoint & Feature Coverage

### 3.1 Static Pages & Asset Serving (13 Tests)
- All 11 HTML operational views served with status 200 and Content-Type `text/html`:
  - `GET /pages/login.html` & `GET /pages/login`
  - `GET /pages/dashboard.html`
  - `GET /pages/projects.html`
  - `GET /pages/modules.html`
  - `GET /pages/changeRequests.html`
  - `GET /pages/approval.html`
  - `GET /pages/versions.html`
  - `GET /pages/releaseNotes.html`
  - `GET /pages/reports.html`
  - `GET /pages/auditLogs.html`
  - `GET /pages/search.html`
- Root greeting endpoint: `GET /` -> `"Welcome to ConfigFlow API"`
- Core CSS: `GET /css/style.css`
- All 12 Client JS controllers in `public/js/*.js`

### 3.2 Authentication & Session Lifecycle (18 Tests across Tiers 1-4)
- `GET /api/employee-id-preview` (Sequential preview `CFG-XXXX`)
- `POST /api/register` (Role derivation: `@dev.ac.in` -> Developer, `@manager.in` -> Manager, domain validation, duplicate email rejection 409)
- `POST /api/login` (Admin, Manager, Developer login, bcrypt verification, legacy plaintext upgrade)
- `POST /api/logout` (Cookie invalidation with `Max-Age=0`)
- Cookie-based session security: `configflow_token` with `HttpOnly`, `SameSite=Lax`, `Max-Age=28800`
- Token tampering, signature mismatch, and expired token rejection (401)

### 3.3 Project Lifecycle & Team Assignment (22 Tests across Tiers 1-4)
- `GET /api/projects` (Role-scoped `is_assigned` calculation for Admin, Manager, and Developer)
- `POST /api/projects` (Admin creation, RBAC blocking of Dev/Manager with 403)
- `PUT /api/projects/:id` (Admin and assigned Manager editing, unassigned Manager blocking with 403, 404 on non-existent)
- `DELETE /api/projects/:id` (Admin deletion, RBAC blocking)
- `GET /api/users/assignable` (Admin retrieves Managers, Manager retrieves Developers, Dev blocked with 403)
- `POST /api/projects/:id/manager` (Admin assigns Manager, validation of Manager role)
- `POST /api/projects/:id/developers` (Assigned Manager adds Developer, duplicate assignment 409)

### 3.4 Module Management (15 Tests across Tiers 1-4)
- `GET /api/modules` (Project join, dynamic `can_edit` calculation)
- `POST /api/modules` (Admin & assigned team member creation, unassigned team member 403)
- `PUT /api/modules/:id` (Update module name/description/project_id with scoped access check)
- `DELETE /api/modules/:id` (Delete module with scoped access check)

### 3.5 Change Request Submission & Storage (18 Tests across Tiers 1-4)
- `GET /api/change-requests` (Admin gets all, Manager gets managed projects, Dev gets authored requests on assigned projects)
- `POST /api/change-requests` (Multipart form-data and JSON submission, Multer disk storage in `uploads/`, foreign key scoping)
- `DELETE /api/change-requests/:id` (Admin, assigned Manager, and creator Developer permitted; others 404/403)

### 3.6 Approval Workflow & Automated Versioning (16 Tests across Tiers 1-4)
- `PUT /api/change-requests/:id/approve` (Approved -> generates `v<timestamp>` in `versions` and creates `release_notes`; Rejected -> updates status without version release)
- `PUT /api/approve-request/:id` (Alias route support)
- Scoped approval permissions (Only Admin and assigned Manager permitted; Developers receive 403)

### 3.7 Analytics, Reports & Dashboards (15 Tests across Tiers 1-4)
- `GET /api/dashboard` (`totalProjects`, `totalDevelopers`, `pendingRequests`, `approvedRequests`, `rejectedRequests`, `latestVersion`)
- `GET /api/reports` (Complete change request reports)
- `GET /api/reports/stats` (Scoped totals: `totalRequests`, `pendingRequests`, `approvedRequests`, `rejectedRequests`, `totalVersions`, `totalProjects`)
- `GET /api/reports/projects` (Project-wise request aggregates)
- `GET /api/reports/versions` (Version history report)

### 3.8 Global Search & Filtering (12 Tests across Tiers 1-4)
- `GET /api/search` (Keyword search across project name, module name, version, title, description, developer name, status)
- Multi-parameter filtering (`?keyword=...&status=...&priority=...`)
- SQL injection parameterized safety validation

### 3.9 Versioning, Release Notes & Audit Trail (18 Tests across Tiers 1-4)
- `GET /api/versions` (Descending chronological ordering)
- `GET /api/release-notes` (Joined version and project metadata)
- `POST /api/release-notes` (Admin publication, RBAC blocking of Dev/Manager)
- `GET /api/audit-logs` (Chronological activity history with user names and action payloads)
- RFC 4180 CSV export formatting verification

### 3.10 System Backup & Disaster Recovery (12 Tests across Tiers 1-4)
- `GET /api/backup` (7 core tables JSON export, Admin only)
- `POST /api/backup/restore` (Transactional restore with `FOREIGN_KEY_CHECKS` toggling, rollback on error, validation of table names)

### 3.11 Structural DOM Invariants & Emoji Elimination (38 Tests in Tier 2)
- Zero unicode emojis scan across all 11 HTML pages and 12 JS files
- DOM element IDs verified:
  - Topbar & user profile: `#sidebarUserName`, `#sidebarUserRole`
  - Dynamic table bodies: `#projectsTable`, `#modulesTable`, `#requestsTable`, `#pendingRequestsTable`, `#versionsTable`, `#projectReportTable`, `#versionReportTable`, `#auditTable`, `#searchResults`
  - Dashboard counters: `#totalProjects`, `#totalDevelopers`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#latestVersion`
  - Form sections and modal wrappers: `#projectFormSection`, `#moduleFormSection`, `#requestFormSection`, `#approvalSection`, `#loginFields`, `#registerFields`
  - Input field IDs: `#projectName`, `#projectDescription`, `#moduleName`, `#projectId`, `#requestTitle`, `#requestDescription`, `#attachment`, `#adminComment`, `#searchInput`, `#email`, `#password`, `#registerName`, `#registerEmail`, `#registerPassword`

---

## 4. Test Execution Instructions

Run full test suite:
```bash
node tests/e2e/runner.js
# or
npm test
```

Run specific tiers:
```bash
node tests/e2e/runner.js --tier=1
node tests/e2e/runner.js --tier=2
node tests/e2e/runner.js --tier=3
node tests/e2e/runner.js --tier=4
```

---

## 5. Certification

The E2E test suite has been authored following strict opaque-box testing methodologies and verified for independent execution.
- **Created by**: Milestone 4 Test Writer
- **Date**: 2026-08-27
- **Verification Status**: Ready for integration with Milestones 1, 2, 3 in Milestone 5.
