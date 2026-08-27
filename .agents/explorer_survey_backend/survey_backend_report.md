# ConfigFlow Backend, API Endpoints, Data Flow & Test Strategy Survey Report

## Executive Summary

ConfigFlow is an Express.js & MySQL Software Configuration Management (SCM) system. This comprehensive survey maps 100% of the backend architecture, middleware stack, database schema, authentication & authorization models, all 34 API & static endpoints, data flow pipelines, and business workflows. In addition, it details an exhaustive 4-tier End-to-End (E2E) testing strategy to ensure zero functional regressions during the UI/UX refactoring.

---

## 1. Backend Architecture & Runtime Environment

### 1.1 Technology Stack & Core Dependencies
- **Runtime**: Node.js (v26.7.0)
- **Framework**: Express.js (`^5.2.1`)
- **Database Driver**: `mysql2` (`^3.23.2`)
- **Authentication**: `jsonwebtoken` (`^9.0.3`) for signed JWTs, `bcrypt` (`^6.0.0`) for password hashing (12 salt rounds)
- **File Uploads**: `multer` (`^2.2.0`) disk storage for change request attachments
- **CORS & Environment**: `cors` (`^2.8.6`), `dotenv` (`^17.4.2`)
- **Dev Server**: `nodemon` (`^3.1.14`)
- **Entry Point**: `app.js`

### 1.2 Application Middleware Pipeline
In `app.js`, the middleware pipeline is structured as follows:
1. `cors()`: Cross-Origin Resource Sharing enabled for API calls.
2. `express.json()`: JSON request body parser.
3. `express.static(path.join(__dirname, "public"), { extensions: ["html"] })`: Serves static web assets with automatic `.html` extension resolution.
4. `express.static(path.join(__dirname, "uploads"))` mounted on `/uploads`: Serves uploaded change request attachments directly.
5. `authRoutes` mounted on `/api`: Public authentication endpoints (`/api/login`, `/api/register`, `/api/logout`, `/api/employee-id-preview`).
6. `requireAuth` middleware mounted on `/api`: Enforces authentication via JWT cookie for all downstream `/api` routes.
7. Protected Route Handlers mounted on `/api`:
   - `/api` -> `projectRoutes`
   - `/api` -> `moduleRoutes`
   - `/api` -> `changeRequestRoutes`
   - `/api` -> `approvalRoutes`
   - `/api` -> `dashboardRoutes`
   - `/api` -> `reportRoutes`
   - `/api` -> `searchRoutes`
   - `/api` -> `versionRoutes`
   - `/api` -> `releaseNoteRoutes`
   - `/api` -> `auditLogRoutes`
   - `/api` -> `backupRoutes`
8. Root handler: `GET /` -> `"Welcome to ConfigFlow API"`

### 1.3 Static Pages & Asset Serving (11 HTML views)
- `dashboard.html` (`/dashboard` or `/dashboard.html`)
- `projects.html` (`/projects` or `/projects.html`)
- `modules.html` (`/modules` or `/modules.html`)
- `changeRequests.html` (`/changeRequests` or `/changeRequests.html`)
- `approval.html` (`/approval` or `/approval.html`)
- `versions.html` (`/versions` or `/versions.html`)
- `releaseNotes.html` (`/releaseNotes` or `/releaseNotes.html`)
- `reports.html` (`/reports` or `/reports.html`)
- `auditLogs.html` (`/auditLogs` or `/auditLogs.html`)
- `search.html` (`/search` or `/search.html`)
- `login.html` (`/login` or `/login.html`)

---

## 2. Authentication & Authorization Security Model

### 2.1 Cookie-Based JWT Session Flow
- **Token Name**: `configflow_token`
- **Cookie Attributes**: `HttpOnly; SameSite=Lax; Max-Age=28800; Path=/` (8 hours expiry)
- **Token Payload**: `{ id: user.id, email: user.email, role: user.role }`
- **Signing Secret**: `process.env.JWT_SECRET` (Throws runtime exception on boot if missing)
- **Authentication Middleware (`middleware/authMiddleware.js`)**:
  - Reads `req.headers.cookie` and extracts `configflow_token`.
  - Verifies token signature using `jwt.verify(token, JWT_SECRET)`.
  - Attaches decoded user payload to `req.user`.
  - Missing token -> `401 Unauthorized` (`{ success: false, message: "Authentication required" }`).
  - Invalid / Expired token -> `401 Unauthorized` (`{ success: false, message: "Your session has expired. Please log in again." }`).

### 2.2 Client-Side State Synchronization
- Client scripts store the user object `{ id, name, email, employee_id, role }` in `localStorage.getItem("user")`.
- If missing on protected pages, client JS immediately redirects to `login.html`.
- On logout (`window.logout()`), client calls `POST /api/logout` (which sets cookie `Max-Age=0`), removes `localStorage.user`, and redirects to `login.html`.

### 2.3 Role-Based Access Control (RBAC)
Roles: `Admin`, `Manager`, `Developer`.
1. **`authorizeRoles(...allowedRoles)` Middleware**:
   - Compares `req.user.role` against `allowedRoles`.
   - Unauthorized -> `403 Forbidden` (`{ success: false, message: "You are not authorized to perform this action" }`).
2. **Project Scoping (`getProjectScope(alias, user)`)**:
   - `Admin`: Unrestricted access (empty SQL clause `""`).
   - `Manager`: Scoped to projects where `project_manager_id = user.id`.
   - `Developer`: Scoped to projects where record exists in `project_developers (project_id, developer_id)`.
3. **Project Access Check (`checkProjectAccess(userId, projectId, callback)`)**:
   - Evaluates whether user has permission on a specific project based on role hierarchy and assignment.

---

## 3. Database Schema & Data Models

### 3.1 Entity Relationship Model
```text
           ┌──────────────────────┐
           │        users         │
           ├──────────────────────┤
           │ id (PK)              │◄────────────────────┐
           │ name                 │                     │
           │ email (UNIQUE)       │                     │
           │ employee_id          │                     │
           │ password             │                     │
           │ role                 │                     │
           └──────────┬───────────┘                     │
                      │ 1                               │
                      │                                 │
                      ▼ *                               │
           ┌──────────────────────┐                     │
           │       projects       │                     │
           ├──────────────────────┤                     │
           │ id (PK)              │                     │
           │ project_name         │                     │
           │ description          │                     │
           │ current_version      │                     │
           │ project_manager_id   ├─(FK: users.id)──────┤
           └──────────┬───────────┘                     │
                      │ 1                               │
         ┌────────────┼────────────┐                    │
         │ *          │ *          │ *                  │
         ▼            ▼            ▼                    │
┌──────────────┐ ┌─────────┐ ┌──────────────────┐       │
│ project_devs │ │ modules │ │ change_requests  │       │
├──────────────┤ ├─────────┤ ├──────────────────┤       │
│ id (PK)      │ │ id (PK) │ │ id (PK)          │       │
│ project_id   │ │ proj_id │ │ project_id (FK)  │       │
│ developer_id │ │ name    │ │ module_id (FK)   │       │
└──────────────┘ │ desc    │ │ title, desc      │       │
                 └────┬────┘ │ priority, status │       │
                      │ 1    │ attachment       │       │
                      │      │ created_by (FK)──┼───────┤
                      ▼ *    │ approved_by (FK)─┼───────┤
                     (FK)    │ approved_at      │       │
                             └────────┬─────────┘       │
                                      │ (triggers on    │
                                      │  approval)      │
                                      ▼                 │
                             ┌──────────────────┐       │
                             │     versions     │       │
                             ├──────────────────┤       │
                             │ id (PK)          │       │
                             │ project_id (FK)  │       │
                             │ version          │       │
                             │ description      │       │
                             │ release_date     │       │
                             │ created_by (FK)──┼───────┘
                             └────────┬─────────┘
                                      │ 1
                                      ▼ *
                             ┌──────────────────┐
                             │  release_notes   │
                             ├──────────────────┤
                             │ id (PK)          │
                             │ version_id (FK)  │
                             │ notes            │
                             └──────────────────┘

┌───────────────────────────────────────────────┐
│                  audit_logs                   │
├───────────────────────────────────────────────┤
│ id (PK), user_id (FK), action, details, date  │
└───────────────────────────────────────────────┘
```

### 3.2 Detailed Table Schemas
1. **`users`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `name`: VARCHAR(255) NOT NULL
   - `email`: VARCHAR(255) NOT NULL UNIQUE
   - `employee_id`: VARCHAR(50) (e.g. `CFG-0001`)
   - `password`: VARCHAR(255) NOT NULL (bcrypt hash `$2b$12$...` or legacy plaintext)
   - `role`: ENUM('Admin', 'Manager', 'Developer') NOT NULL
2. **`projects`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `project_name`: VARCHAR(255) NOT NULL
   - `description`: TEXT
   - `current_version`: VARCHAR(50)
   - `project_manager_id`: INT NULL (Foreign Key -> `users.id`)
3. **`project_developers`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `project_id`: INT NOT NULL (Foreign Key -> `projects.id`)
   - `developer_id`: INT NOT NULL (Foreign Key -> `users.id`)
   - UNIQUE KEY (`project_id`, `developer_id`)
4. **`modules`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `project_id`: INT NOT NULL (Foreign Key -> `projects.id`)
   - `module_name`: VARCHAR(255) NOT NULL
   - `description`: TEXT
5. **`change_requests`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `project_id`: INT NOT NULL (Foreign Key -> `projects.id`)
   - `module_id`: INT NOT NULL (Foreign Key -> `modules.id`)
   - `title`: VARCHAR(255) NOT NULL
   - `description`: TEXT NOT NULL
   - `priority`: VARCHAR(50) NOT NULL (e.g. `Low`, `Medium`, `High`, `Critical`)
   - `attachment`: VARCHAR(255) NULL (Stored filename in `uploads/`)
   - `status`: VARCHAR(50) DEFAULT 'Pending' (`Pending`, `Approved`, `Rejected`)
   - `admin_comment`: TEXT NULL
   - `created_by`: INT NOT NULL (Foreign Key -> `users.id`)
   - `approved_by`: INT NULL (Foreign Key -> `users.id`)
   - `approved_at`: DATETIME NULL
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP
6. **`versions`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `project_id`: INT NOT NULL (Foreign Key -> `projects.id`)
   - `version`: VARCHAR(50) NOT NULL (e.g. `v1740000000000`)
   - `description`: TEXT
   - `release_date`: DATETIME NOT NULL
   - `created_by`: INT NOT NULL (Foreign Key -> `users.id`)
7. **`release_notes`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `version_id`: INT NOT NULL (Foreign Key -> `versions.id`)
   - `notes`: TEXT NOT NULL
8. **`audit_logs`**:
   - `id`: INT AUTO_INCREMENT PRIMARY KEY
   - `user_id`: INT NOT NULL (Foreign Key -> `users.id`)
   - `action`: VARCHAR(255) NOT NULL
   - `details`: TEXT
   - `created_at`: TIMESTAMP DEFAULT CURRENT_TIMESTAMP

---

## 4. Complete API Endpoint Catalog (31 API Routes + 3 Static Routes)

| # | HTTP Method | Endpoint Pattern | Auth & Roles | Request Body / Params | Expected Response Schema | Error Status Codes & Messages |
|---|-------------|------------------|--------------|-----------------------|--------------------------|-------------------------------|
| 1 | `POST` | `/api/login` | Public | `{ email, password }` | `{ success: true, message: "Login Successful", user: {...} }` + `Set-Cookie` | `401`: Invalid Email or Password<br>`500`: Unable to process login |
| 2 | `POST` | `/api/register` | Public | `{ name, email, password, confirm_password? }` | `{ success: true, message: "...", employee_id: "CFG-XXXX" }` | `400`: Missing fields / Passwords do not match / Invalid email / Domain mismatch / Password < 8 chars<br>`409`: Email or employee ID is already registered<br>`500`: Could not create account |
| 3 | `POST` | `/api/logout` | Public | None | `{ success: true, message: "Logged out" }` + Cleared cookie | None |
| 4 | `GET` | `/api/employee-id-preview` | Public | None | `{ success: true, employee_id: "CFG-XXXX" }` | `500`: Unable to generate employee ID preview |
| 5 | `GET` | `/api/projects` | Any Authenticated | None (Optional `?user_id`) | `[ { id, project_name, description, current_version, project_manager_id, is_assigned }, ... ]` | `401`: User not found<br>`500`: Database error |
| 6 | `GET` | `/api/users/assignable` | Admin, Manager | None (Optional `?user_id`) | `[ { id, name, email, employee_id }, ... ]` | `401`: User not found<br>`403`: Unauthorized<br>`500`: Database error |
| 7 | `POST` | `/api/projects` | Admin | `{ project_name, description, current_version }` | `{ success: true, message: "Project Added Successfully" }` | `403`: Unauthorized<br>`500`: Failed to create project |
| 8 | `PUT` | `/api/projects/:id` | Admin, Assigned Manager | Param: `id`<br>Body: `{ project_name, description, current_version }` | `{ success: true, message: "Project Updated Successfully" }` | `403`: You can edit only your assigned projects<br>`404`: Project not found<br>`500`: Failed to update project |
| 9 | `DELETE` | `/api/projects/:id` | Admin | Param: `id` | `{ success: true, message: "Project Deleted Successfully" }` | `403`: Unauthorized<br>`404`: Project not found<br>`500`: Database error |
| 10 | `POST` | `/api/projects/:id/manager` | Admin | Param: `id`<br>Body: `{ manager_id }` | `{ success: true, message: "Project Manager assigned" }` | `400`: Selected user is not a Manager<br>`403`: Only Admin users can assign managers<br>`500`: Database error |
| 11 | `POST` | `/api/projects/:id/developers` | Admin, Assigned Manager | Param: `id`<br>Body: `{ developer_id }` | `{ success: true, message: "Developer assigned to project" }` | `400`: Selected user is not a Developer<br>`403`: Only assigned Manager can add Developers<br>`409`: Developer is already assigned<br>`500`: Database error |
| 12 | `GET` | `/api/modules` | Any Authenticated | None (Optional `?user_id`) | `[ { id, project_id, module_name, description, project_name, can_edit }, ... ]` | `500`: Failed to load modules |
| 13 | `POST` | `/api/modules` | Admin, Manager, Developer (Assigned) | `{ project_id, module_name, description }` | `{ success: true, message: "Module Added Successfully" }` | `403`: You are not assigned to this project<br>`500`: Database error |
| 14 | `PUT` | `/api/modules/:id` | Admin, Manager, Developer (Assigned) | Param: `id`<br>Body: `{ project_id, module_name, description }` | `{ success: true, message: "Module Updated Successfully" }` | `403`: You can edit modules only in your assigned projects<br>`500`: Database error |
| 15 | `DELETE` | `/api/modules/:id` | Admin, Manager, Developer (Assigned) | Param: `id` | `{ success: true, message: "Module Deleted Successfully" }` | `403`: You can delete modules only in your assigned projects<br>`500`: Database error |
| 16 | `GET` | `/api/change-requests` | Any Authenticated (Scoped by role) | None (Optional `?user_id`) | `[ { id, project_id, module_id, title, description, priority, attachment, status, admin_comment, created_by, approved_by, approved_at, created_at, project_name, module_name, developer }, ... ]` | `401`: User not found<br>`500`: Database error |
| 17 | `POST` | `/api/change-requests` | Any Authenticated (Assigned) | Multipart / Form-Data:<br>`project_id`, `module_id`, `title`, `description`, `priority`, `attachment` (file) | `{ success: true, message: "Change Request Submitted", id, attachment }` | `400`: Missing required fields<br>`403`: You are not assigned to this project<br>`500`: Failed to submit change request |
| 18 | `DELETE` | `/api/change-requests/:id` | Admin, Assigned Manager, Creator Dev | Param: `id` | `{ success: true, message: "Deleted Successfully" }` | `404`: Change request not found or not accessible<br>`500`: Database error |
| 19 | `PUT` | `/api/change-requests/:id/approve` | Admin, Assigned Manager | Param: `id`<br>Body: `{ status: "Approved"|"Rejected", admin_comment }` | `{ success: true, message: "Request Approved Successfully", version }` OR `{ success: true, message: "Request Rejected" }` | `400`: Status is required / Invalid status<br>`401`: User not found<br>`403`: Access denied<br>`404`: Change request not found<br>`500`: Database error |
| 20 | `PUT` | `/api/approve-request/:id` | Admin, Assigned Manager | Param: `id`<br>Body: `{ status: "Approved"|"Rejected", admin_comment }` | Same as endpoint #19 (Alias route) | Same as endpoint #19 |
| 21 | `GET` | `/api/dashboard` | Any Authenticated | None | `{ totalProjects, totalDevelopers, pendingRequests, approvedRequests, rejectedRequests, latestVersion }` | `500`: Database error |
| 22 | `GET` | `/api/reports` | Any Authenticated (Scoped) | None | `[ { id, project_name, module_name, title, priority, status, developer, created_at }, ... ]` | `500`: Failed to fetch reports |
| 23 | `GET` | `/api/reports/stats` | Any Authenticated (Scoped) | None | `{ success: true, data: { totalRequests, pendingRequests, approvedRequests, rejectedRequests, totalVersions, totalProjects } }` | `500`: Failed to fetch report statistics |
| 24 | `GET` | `/api/reports/projects` | Any Authenticated (Scoped) | None | `[ { id, project_name, current_version, total_requests }, ... ]` | `500`: Failed to fetch project report |
| 25 | `GET` | `/api/reports/versions` | Any Authenticated (Scoped) | None | `[ { id, project_name, version, description, release_date }, ... ]` | `500`: Failed to fetch version report |
| 26 | `GET` | `/api/search` | Any Authenticated (Scoped) | Query: `?keyword=&status=&priority=` | `[ { id, project_name, module_name, title, description, priority, status, developer, created_at, version }, ... ]` | `500`: Search failed |
| 27 | `GET` | `/api/versions` | Any Authenticated | None | `[ { id, project_id, project_name, version, description, release_date, created_by }, ... ]` | `500`: Failed to fetch versions |
| 28 | `GET` | `/api/release-notes` | Any Authenticated | None | `[ { id, version_id, notes, version, release_date, project_id, project_name }, ... ]` | `500`: Failed to fetch release notes |
| 29 | `POST` | `/api/release-notes` | Admin | Body: `{ version_id, notes }` | `{ success: true, message: "Release note published", id }` | `400`: Version, notes, and creator are required<br>`403`: Only Admin users can publish release notes<br>`500`: Failed to publish release note |
| 30 | `GET` | `/api/audit-logs` | Admin, Manager, Developer | None | `[ { id, user_id, user_name, action, details, created_at }, ... ]` | `500`: Failed to fetch audit logs |
| 31 | `GET` | `/api/backup` | Admin | None (Optional `?user_id`) | `{ format: "configflow-backup", version: 1, created_at, tables: { users, projects, modules, change_requests, versions, release_notes, audit_logs } }` | `403`: Only Admin users can create backups<br>`500`: Failed to create backup |
| 32 | `POST` | `/api/backup/restore` | Admin | Body: `{ backup }` | `{ success: true, message: "Backup restored successfully" }` | `400`: Invalid backup file / Unsupported tables<br>`403`: Only Admin users can restore backups<br>`500`: Restore failed |
| 33 | `GET` | `/` | Public | None | String `"Welcome to ConfigFlow API"` | None |
| 34 | `GET` | `/uploads/:filename` | Public / Browser | URL Param: `filename` | File stream from `uploads/` directory | `404`: Cannot GET /uploads/... |

---

## 5. End-to-End Business Workflows & Data Flow Analysis

### Workflow 1: User Onboarding & Authentication
```text
1. User enters Registration fields (Name, Email, Password, Confirm Password).
2. Client queries GET /api/employee-id-preview to show upcoming CFG ID.
3. User submits -> POST /api/register.
   - Domain check: @dev.ac.in -> 'Developer', @manager.in -> 'Manager'.
   - Generates unique employee_id ('CFG-0001'...).
   - Bcrypt hashes password (12 rounds).
4. User logs in -> POST /api/login.
   - Server returns JWT in HttpOnly cookie `configflow_token` (8h expiry).
   - Client saves safe user object in localStorage('user').
   - Redirects to dashboard.html.
```

### Workflow 2: Project & Team Hierarchy Setup
```text
1. Admin creates Project -> POST /api/projects.
   - Writes Audit Log: "Created Project".
2. Admin fetches assignable Managers -> GET /api/users/assignable.
3. Admin assigns Manager -> POST /api/projects/:id/manager.
   - Updates projects.project_manager_id.
   - Writes Audit Log: "Assigned Project Manager".
4. Manager logs in -> views projects (GET /api/projects returns is_assigned = 1 for their projects).
5. Manager fetches assignable Developers -> GET /api/users/assignable.
6. Manager assigns Developer -> POST /api/projects/:id/developers.
   - Inserts into project_developers.
   - Writes Audit Log: "Assigned Developer".
```

### Workflow 3: Module Definition & Scoped Editing
```text
1. Assigned user (Admin, Manager, or Dev) creates Module -> POST /api/modules.
   - Validates project assignment via checkProjectAccess().
   - Inserts into modules.
   - Writes Audit Log: "Created Module".
2. All users view GET /api/modules.
   - `can_edit` field is computed dynamically (1 for assigned team members, 0 for others).
3. Assigned user can PUT /api/modules/:id or DELETE /api/modules/:id.
```

### Workflow 4: Change Request Submission, Review & Automated Version Release
```text
1. Developer creates Change Request -> POST /api/change-requests with optional attachment.
   - Multer saves file to `uploads/<timestamp>-<filename>`.
   - Validates project & module relationship (`m.project_id = p.id`).
   - Inserts change_requests (status = 'Pending').
   - Writes Audit Log: "Created Change Request".
2. Manager / Admin views pending queue in `approval.html` -> GET /api/change-requests.
3. Manager / Admin reviews and takes action:
   a. If REJECTED:
      - PUT /api/change-requests/:id/approve with status: "Rejected", admin_comment.
      - Sets status = 'Rejected', approved_by, approved_at.
      - Writes Audit Log: "Rejected Change Request".
   b. If APPROVED:
      - PUT /api/change-requests/:id/approve with status: "Approved", admin_comment.
      - Sets status = 'Approved', approved_by, approved_at.
      - Automatically creates new version: `v<timestamp>` in `versions` table.
      - Automatically creates release note with CR description in `release_notes` table.
      - Writes Audit Log: "Approved Change Request".
4. Dashboard and Reports update immediately (GET /api/dashboard, GET /api/reports/stats).
5. Versions screen displays new version & release note (GET /api/versions, GET /api/release-notes).
```

### Workflow 5: Search, Reporting, Audit Trail & CSV Export
```text
1. Global Search: GET /api/search?keyword=...&status=...&priority=...
   - Cross-searches projects, modules, versions, request titles, developers, statuses.
   - Enforces project scoping according to role.
2. Reporting:
   - GET /api/reports/stats (KPI metrics).
   - GET /api/reports/projects (Requests per project).
   - GET /api/reports/versions (Version history).
3. Audit Log:
   - GET /api/audit-logs retrieves chronologically sorted activities.
   - Client JS generates formatted CSV and triggers client-side download (`exportAuditLogs`).
```

### Workflow 6: Full System Backup & Disaster Recovery
```text
1. Admin triggers Backup -> GET /api/backup.
   - Server reads all 7 core tables into a structured JSON payload.
   - Client JS triggers JSON file download (`configflow-backup.json`).
2. Admin restores Backup -> POST /api/backup/restore.
   - Validates format & table names.
   - Starts DB transaction: `SET FOREIGN_KEY_CHECKS=0`.
   - Clears existing tables, inserts backup data in batch.
   - Re-enables `FOREIGN_KEY_CHECKS=1` and commits.
   - On error: rolls back cleanly.
```

---

## 6. Comprehensive 4-Tier E2E Test Strategy

### Tier 1: Feature Coverage (>=5 Tests per Feature)

#### Feature 1: Authentication & Registration
1. `AUTH-01`: Login with valid Developer credentials -> verify 200, JWT cookie set, safe user in response body.
2. `AUTH-02`: Login with invalid password -> verify 401 `"Invalid Email or Password"`, no cookie set.
3. `AUTH-03`: Register new Developer (`@dev.ac.in`) with valid 8+ char password -> verify 201, `CFG-XXXX` generated.
4. `AUTH-04`: Register new Manager (`@manager.in`) with mismatching passwords -> verify 400 `"Passwords do not match"`.
5. `AUTH-05`: Register with non-organizational domain (`@gmail.com`) -> verify 400 rejection message.
6. `AUTH-06`: Preview employee ID (`GET /api/employee-id-preview`) -> verify 200 and regex pattern `^CFG-[0-9]{4}$`.
7. `AUTH-07`: Logout (`POST /api/logout`) -> verify 200 and cookie header has `Max-Age=0`.

#### Feature 2: Project Management & Role Assignment
8. `PROJ-01`: Admin creates new project -> verify 200, DB record created, audit log written.
9. `PROJ-02`: Developer attempts to create project -> verify 403 Forbidden.
10. `PROJ-03`: Admin assigns Manager to project -> verify 200, `project_manager_id` updated, audit log written.
11. `PROJ-04`: Manager assigns Developer to their managed project -> verify 200, `project_developers` row added.
12. `PROJ-05`: Manager assigns Developer to an UNASSIGNED project -> verify 403 Forbidden.
13. `PROJ-06`: Assigning already-assigned Developer to same project -> verify 409 `"Developer is already assigned"`.
14. `PROJ-07`: Admin deletes project -> verify 200, project removed, audit log written.

#### Feature 3: Module Management
15. `MOD-01`: Assigned Developer creates module in assigned project -> verify 200, module created, audit log written.
16. `MOD-02`: Unassigned Developer creates module in unassigned project -> verify 403 Forbidden.
17. `MOD-03`: Get modules list -> verify each item includes `project_name` and calculated `can_edit` boolean flag.
18. `MOD-04`: Assigned Manager updates module details -> verify 200, updated in DB, audit log written.
19. `MOD-05`: Developer deletes module from assigned project -> verify 200, deleted, audit log written.
20. `MOD-06`: Developer attempts to update module moving it to an unassigned project -> verify 403 Forbidden.

#### Feature 4: Change Request Submission & Scoping
21. `CR-01`: Assigned Developer submits change request without attachment -> verify 200, status 'Pending', audit log written.
22. `CR-02`: Assigned Developer submits change request with file attachment -> verify 200, file saved in `uploads/`.
23. `CR-03`: Submit change request with missing title/project_id -> verify 400 Bad Request.
24. `CR-04`: Submit change request specifying module that does NOT belong to project -> verify 403 Forbidden.
25. `CR-05`: Developer GET `/api/change-requests` -> verify only requests created by that developer on assigned projects are returned.
26. `CR-06`: Manager GET `/api/change-requests` -> verify only requests for projects managed by that manager are returned.
27. `CR-07`: Developer deletes own change request -> verify 200; Developer deletes another user's request -> verify 404.

#### Feature 5: Approval Workflow & Automated Cascades
28. `APP-01`: Assigned Manager rejects change request with comment -> verify 200, status='Rejected', audit log written.
29. `APP-02`: Assigned Manager approves change request -> verify 200, status='Approved', returns new version string.
30. `APP-03`: Verify automated version creation on approval -> `versions` table has new row `v<timestamp>` with CR title.
31. `APP-04`: Verify automated release note creation on approval -> `release_notes` table has row linked to version with CR description.
32. `APP-05`: Developer attempts to approve change request -> verify 403 Forbidden.
33. `APP-06`: Manager attempts to approve request on another Manager's project -> verify 403 Forbidden.

#### Feature 6: Version Management & Release Notes
34. `VER-01`: GET `/api/versions` returns all versions ordered descending by ID.
35. `VER-02`: GET `/api/release-notes` returns all notes joined with version number and project name.
36. `VER-03`: Admin publishes manual release note (`POST /api/release-notes`) -> verify 201, audit log written.
37. `VER-04`: Manager/Developer attempts to publish release note -> verify 403 Forbidden.
38. `VER-05`: Post release note with missing version_id or notes -> verify 400 Bad Request.

#### Feature 7: Reports & Dashboard Metrics
39. `REP-01`: GET `/api/dashboard` returns accurate aggregates (`totalProjects`, `totalDevelopers`, `pendingRequests`, `approvedRequests`, `rejectedRequests`, `latestVersion`).
40. `REP-02`: GET `/api/reports/stats` returns role-scoped totals matching database state.
41. `REP-03`: GET `/api/reports/projects` returns project-wise request counts.
42. `REP-04`: GET `/api/reports/versions` returns list of versions per scoped project.
43. `REP-05`: GET `/api/reports` returns full change request list for assigned projects.

#### Feature 8: Global Search & Filtering
44. `SRCH-01`: Search with keyword matching project name -> returns matching change requests.
45. `SRCH-02`: Search with keyword matching module name -> returns matching change requests.
46. `SRCH-03`: Search with keyword matching change request title -> returns matching change requests.
47. `SRCH-04`: Search filtered by `status=Approved` -> returns only approved items.
48. `SRCH-05`: Search filtered by `priority=High` -> returns only high-priority items.
49. `SRCH-06`: Verify search results are strictly filtered by user's assigned project scope.

#### Feature 9: Audit Trail & Export
50. `AUD-01`: GET `/api/audit-logs` returns chronologically sorted system activities with user names.
51. `AUD-02`: Audit logs record user ID, action name, and detail payload for every mutating operation.
52. `AUD-03`: Client-side CSV export generates valid RFC 4180 CSV with escaped quotes and commas.

#### Feature 10: System Backup & Disaster Recovery
53. `BAK-01`: Admin GET `/api/backup` returns valid JSON structure with all 7 tables populated.
54. `BAK-02`: Non-admin GET `/api/backup` returns 403 Forbidden.
55. `BAK-03`: Admin POST `/api/backup/restore` with valid backup JSON restores database state cleanly.
56. `BAK-04`: Restore with malformed backup or invalid table names -> returns 400 Bad Request.
57. `BAK-05`: Restore rollback on database failure preserves pre-existing database contents.

---

### Tier 2: Boundary & Corner Cases

1. **Empty & Whitespace Inputs**:
   - Project name / Module name / CR title with leading/trailing spaces -> verify trimming.
   - Empty title/description strings -> verify appropriate 400 validation response.
2. **Invalid IDs & Foreign Keys**:
   - Negative ID, string ID (`/api/projects/abc`), non-existent ID (`999999`) -> verify 404 or clean error handling without server crash.
   - Assigning non-existent `developer_id` or non-developer user -> verify 400 rejection.
3. **Malformed Request Payloads**:
   - Sending invalid JSON body to JSON endpoints -> verify 400 from parser.
   - Sending empty multipart form without fields -> verify 400 from controller.
4. **Session & Cookie Edge Cases**:
   - Tampered JWT signature -> verify 401 `"Your session has expired"`.
   - Expired JWT token -> verify 401.
   - Missing `configflow_token` cookie header -> verify 401 `"Authentication required"`.
5. **Special Characters & SQL Injection Resilience**:
   - Single quotes, double quotes, emojis, SQL strings (`' OR 1=1 --`) in search keywords and text fields -> verify safe parameterized execution.
6. **Concurrent & Duplicate Key Operations**:
   - Concurrent registration with same email -> verify 409 conflict.
   - Re-assigning same developer to same project -> verify 409 duplicate entry handling.

---

### Tier 3: Cross-Feature Integration Workflows

1. **Full Lifecycle Workflow**:
   ```text
   Admin creates Project "Project Alpha"
     -> Admin assigns Manager "Jane" (@manager.in)
     -> Manager assigns Developer "Bob" (@dev.ac.in)
     -> Developer logs in, sees "Project Alpha" highlighted as Assigned
     -> Developer adds Module "Auth Module"
     -> Developer submits Change Request "Add OAuth2" with attachment "spec.pdf"
     -> Manager logs in, sees 1 Pending Request on Dashboard & Approval screen
     -> Manager reviews and Approves request with comment "LGTM"
     -> Verify:
        a) Change Request status is 'Approved'
        b) New version created (e.g. 'v1740000000000') in versions table
        c) Release note created with description "Add OAuth2"
        d) Audit log contains 6 sequential entries
        e) Reports & Dashboard reflect 1 Approved request and 1 Version
        f) Search for "OAuth2" returns the approved record
        g) Admin downloads Backup containing all new records
   ```
2. **Rejection & Revision Workflow**:
   ```text
   Developer submits CR "Fix Memory Leak"
     -> Manager Rejects CR with comment "Needs benchmark data"
     -> Verify CR status is 'Rejected'
     -> Verify NO version or release note is created
     -> Developer submits revised CR "Fix Memory Leak with Benchmarks"
     -> Manager Approves revised CR
     -> Verify version and release note are now created
   ```

---

### Tier 4: Real-World Operational & Security Scenarios

1. **Multi-Tenant Project Isolation**:
   - Manager A (assigned Project 1) cannot view, edit, or approve Change Requests for Project 2 (managed by Manager B).
   - Developer A (assigned Project 1) cannot submit Change Requests or view private details for Project 2.
2. **Privilege Escalation Prevention**:
   - Developer attempts to call `PUT /api/projects/:id` or `POST /api/projects` -> 403 Forbidden.
   - Developer attempts to call `PUT /api/change-requests/:id/approve` -> 403 Forbidden.
   - Manager attempts to call `POST /api/projects` or `GET /api/backup` -> 403 Forbidden.
3. **Session Expiry & Re-Authentication**:
   - When token expires (8 hours), subsequent fetch returns 401. Client redirects user to `login.html`.
4. **File Upload Security & Handling**:
   - Large file attachments, special characters in original filename, non-ASCII names -> sanitized unique filename (`<timestamp>-<originalname>`).
   - Direct download from `/uploads/<filename>` works reliably.
5. **Database Resilience & Disaster Recovery**:
   - Backup JSON export downloaded by Admin, loaded into fresh database instance via `/api/backup/restore`, restores 100% relational integrity with foreign keys intact.

---

## 7. Zero-Regression Verification Guidelines for Frontend Refactoring

To guarantee that the UI/UX refactoring strictly preserves 100% of client-server functionality:
1. **Preserve DOM Element IDs**:
   All JavaScript scripts in `public/js/*.js` bind to exact DOM IDs (e.g., `email`, `password`, `message`, `projectId`, `moduleId`, `requestTitle`, `requestDescription`, `priority`, `attachment`, `requestsTable`, `pendingRequestsTable`, `approvalSection`, `adminComment`, `projectSummary`, `recentRequests`, `totalProjects`, `backupFile`, etc.). These IDs MUST remain untouched in HTML.
2. **Preserve Form Field Names**:
   Multipart upload forms for `/api/change-requests` MUST maintain field names: `project_id`, `module_id`, `title`, `description`, `priority`, `attachment`, `created_by`.
3. **Preserve Window Globals & Handlers**:
   Functions attached to `window` (e.g., `window.logout()`, `window.showToast()`, `login()`, `registerDeveloper()`, `saveProject()`, `editProject()`, `deleteProject()`, `assignManager()`, `assignDeveloper()`, `saveModule()`, `editModule()`, `deleteModule()`, `submitRequest()`, `reviewRequest()`, `approveRequest()`, `rejectRequest()`, `compareVersions()`, `publishReleaseNote()`, `performSearch()`, `downloadBackup()`, `restoreBackup()`) MUST remain callable from HTML event attributes (`onclick`, `onsubmit`, `onchange`).
4. **Preserve LocalStorage Keys**:
   The user session object key `localStorage.getItem("user")` is consumed across all 11 pages and must not be altered.
5. **Preserve API Route Contracts**:
   All 31 Express endpoints, payload schemas, and response formats documented in Section 4 must be maintained exactly as specified.
