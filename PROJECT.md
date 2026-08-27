# Project: ConfigFlow UI/UX Production-Grade Refactor

## Architecture & Design Vision
ConfigFlow is a multi-tier configuration management and change tracking web application with an Express.js backend and a multi-page client-side vanilla JavaScript frontend. This project refactors the prototype UI/UX into a restrained, production-grade interface inspired by Linear, Vercel, and Stripe, while maintaining 100% functional fidelity and zero DOM binding regressions.

### Design System Principles
1. **Neutral-First Palette**: Strict zinc/slate tonal foundation (`#09090b` / `#0f172a` text, `#ffffff` card/surface, `#f8fafc` canvas background, `#e2e8f0` borders) paired with subtle, purposeful functional accents (primary `#0f172a`/`#2563eb`, success `#10b981`, warning `#f59e0b`, danger `#ef4444`).
2. **Typography & Spacing**: High-legibility system/Inter font stack with optical tracking, standardized 8-level typographic scale, tabular numerals for metric cards and tables, and strict 4/8/12/16/24/32/48px spacing rhythm.
3. **No AI Slop**: Elimination of decorative background grids, glowing radial blobs, neon wireframe circles, emoji navigation, and generic oversized headers.
4. **Cohesive 24x24 SVG Icon System**: Clean, semantic Heroicons/Lucide SVG icons rendered uniformly at 16px/18px/20px sizes across all navigation links, stat cards, action buttons, and file attachments.
5. **Operational Data Density & States**: Clean data tables with subtle borders, predictable action menus, responsive sidebar drawer for mobile/tablet, and contextual empty/loading/error states.

---

## Code Layout
```
/home/abrahamgracef/teamwork_projects/configflow/
├── app.js                          # Express application entrypoint
├── package.json                    # Dependencies and scripts
├── public/
│   ├── css/
│   │   └── style.css               # Unified modern design system stylesheet
│   ├── js/
│   │   ├── icons.js                # Cohesive SVG icon library definitions & helper
│   │   ├── sidebar.js              # Sidebar navigation & responsive drawer handler
│   │   ├── auth.js                 # Shared auth state & session verification
│   │   ├── login.js                # Authentication & registration controller
│   │   ├── dashboard.js            # Dashboard analytics, stat cards, backup/restore
│   │   ├── projects.js             # Project management & role assignment
│   │   ├── modules.js              # Module tracking & CRUD
│   │   ├── changeRequests.js       # Change request submission & file attachment
│   │   ├── approval.js             # Change review & approval drawer workflow
│   │   ├── versions.js             # Version history & side-by-side comparison
│   │   ├── releaseNotes.js         # Release notes publication & feed
│   │   ├── reports.js              # System reports & metric aggregations
│   │   ├── auditLogs.js            # Audit log explorer & CSV export
│   │   └── search.js               # Global multi-entity search
│   └── pages/
│       ├── login.html              # Authentication & registration view
│       ├── dashboard.html          # Main overview & metrics view
│       ├── projects.html           # Project inventory & assignment view
│       ├── modules.html            # Module inventory & status view
│       ├── changeRequests.html     # Change request submission & tracking view
│       ├── approval.html           # Change request review & approval view
│       ├── versions.html           # Version timeline & comparison view
│       ├── releaseNotes.html       # Release notes view
│       ├── reports.html            # Metrics & reporting view
│       ├── auditLogs.html          # Audit log history view
│       └── search.html             # Global search view
├── tests/
│   └── e2e/                        # Comprehensive 4-tier + adversarial test suite
│       ├── runner.js               # Unified test runner
│       ├── test_tier1_features.js  # Tier 1: Feature coverage (>=5 tests per feature)
│       ├── test_tier2_boundaries.js# Tier 2: Boundary & corner case validation
│       ├── test_tier3_combos.js    # Tier 3: Cross-feature workflows
│       └── test_tier4_workloads.js # Tier 4: Real-world operational scenarios
└── .agents/                        # Orchestrator & subagent metadata
```

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | CSS Modernization & Tokens | Refactor style.css into tokenized, neutral-first design system | M1 | Survey / R2 |
| 2 | UI Component Primitives | Buttons, forms, inputs, selects, cards, tables, badges, modals | M1 | Survey / R2 |
| 3 | Responsive Layout Rules | Responsive layout grid, breakpoints (1280px, 768-1024px, 375-480px) | M1 | Survey / R2, R3 |
| 4 | SVG Icon System Module | Implement `public/js/icons.js` for crisp, consistent SVG icons | M2 | Survey / R1 |
| 5 | Client Scripts Emoji Elimination | Eliminate emojis in `changeRequests.js`, `sidebar.js`, etc. | M2 | Survey / R1, R4 |
| 6 | Navigation & Sidebar Refactor | Modern 240px sidebar with SVG icons, user profile, responsive drawer | M2, M3 | Survey / R1, R2, R3 |
| 7 | Authentication View Refactor | Modern `login.html` with polished tabs, responsive cards, crisp inputs | M3 | Survey / R3 |
| 8 | Dashboard View Refactor | Modern `dashboard.html` stat cards, metric progress bars, backup drawer | M3 | Survey / R3 |
| 9 | Project Inventory View Refactor | Modern `projects.html` data table, creation modal, assignment selects | M3 | Survey / R3 |
| 10 | Module Inventory View Refactor | Modern `modules.html` table, creation modal, permission-aware actions | M3 | Survey / R3 |
| 11 | Change Requests View Refactor | Modern `changeRequests.html` table, submission form, file upload badge | M3 | Survey / R3 |
| 12 | Approvals View Refactor | Modern `approval.html` pending list, side drawer review panel | M3 | Survey / R3 |
| 13 | Versions & Diff View Refactor | Modern `versions.html` timeline, diff comparison panel, clean layout | M3 | Survey / R3 |
| 14 | Release Notes View Refactor | Modern `releaseNotes.html` structured cards, author badges, publish modal | M3 | Survey / R3 |
| 15 | Reports View Refactor | Modern `reports.html` KPI metrics, summary tables, clean data density | M3 | Survey / R3 |
| 16 | Audit Logs View Refactor | Modern `auditLogs.html` filterable table, CSV export, event badges | M3 | Survey / R3 |
| 17 | Search View Refactor | Modern `search.html` search bar, categorized results grid, empty state | M3 | Survey / R3 |
| 18 | E2E Test Suite Infrastructure | Test runner, assertions, HTTP agent, static asset verifier | M4 | Survey / Acceptance |
| 19 | Tier 1: Feature Coverage Tests | ≥5 tests per feature covering all 31 endpoints & 11 HTML pages | M4 | Survey / E2E Track |
| 20 | Tier 2: Boundary & Corner Tests | Extreme inputs, invalid IDs, malformed JSON, auth failures, 0 emojis | M4 | Survey / E2E Track |
| 21 | Tier 3: Cross-Feature Combos | Full lifecycle: User -> Project -> Module -> CR -> Approval -> Version | M4 | Survey / E2E Track |
| 22 | Tier 4: Real-World Workloads | Multi-role concurrent workflows, backup/restore fidelity, asset checks | M4 | Survey / E2E Track |
| 23 | E2E 100% Pass Verification | Execute and pass 100% of E2E test suite (Tiers 1-4) | M5 | Acceptance Criteria |
| 24 | Tier 5: Adversarial Hardening | White-box stress tests, DOM binding validation, forensic audit | M5 | Integrity Forensics |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Design System & CSS Refactor | `public/css/style.css`: tokens, typography, primitives, tables, modals, responsiveness | none | DONE |
| M2 | SVG Icons & Client Scripts Sync | `public/js/icons.js`, `public/js/sidebar.js`, `public/js/changeRequests.js` | M1 | DONE |
| M3 | View Templates Modernization | All 11 HTML pages (`public/pages/*.html`): zero emojis, modern layout, 100% DOM IDs | M1, M2 | DONE |
| M4 | E2E Test Suite Creation | `tests/e2e/`: runner + Tiers 1-4 test cases (Dual Track in parallel) | none | DONE |
| M5 | Final Integration & Adversarial Verification | 100% E2E test pass, Tier 5 white-box stress testing, forensic audit verification | M1, M2, M3, M4 | DONE |

---

## Interface Contracts & DOM Invariants

### 1. Element ID & Container Preservation
- **Shared Topbar & Sidebar**: `#sidebarUserName`, `#sidebarUserRole`, `#approvalLink`.
- **Dynamic Table Bodies**: `#recentRequests`, `#projectSummary`, `#projectsTable`, `#modulesTable`, `#requestsTable`, `#pendingRequestsTable`, `#versionsTable`, `#projectReportTable`, `#versionReportTable`, `#auditTable`, `#searchResults`.
- **Dashboard Metrics & Bars**: `#totalProjects`, `#totalDevelopers`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#latestVersion`, `#pendingBar`, `#pendingBarValue`, `#approvedBar`, `#approvedBarValue`, `#rejectedBar`, `#rejectedBarValue`, `#dashboardNotification`.
- **Reports Metrics**: `#totalRequests`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#totalVersions`, `#totalProjects`.
- **Form Sections & Modals**: `#projectFormSection`, `#moduleFormSection`, `#requestFormSection`, `#approvalSection`, `#releaseNoteFormSection`, `#backupSection`, `#loginFields`, `#registerFields`.
- **Action Buttons & Inputs**: All input IDs and names (`#projectName`, `#projectDescription`, `#moduleName`, `#moduleDescription`, `#projectId`, `#requestTitle`, `#requestDescription`, `#fileUpload`, `#adminComment`, `#searchQuery`, `#email`, `#password`, `#registerName`, `#registerEmail`, `#registerPassword`, `#registerRole`, etc.) must remain 100% identical.

### 2. Window Function & Inline Handler Signatures
- `window.openProjectForm()`, `window.closeProjectForm()`, `window.saveProject()`, `window.editProject(id, name, desc)`, `window.deleteProject(id)`
- `window.openModuleForm()`, `window.closeModuleForm()`, `window.saveModule()`, `window.editModule(id, name, desc)`, `window.deleteModule(id)`
- `window.openRequestForm()`, `window.closeRequestForm()`, `window.submitRequest()`, `window.reviewRequest(id, title, desc, project, module, dev, file)`
- `window.approveRequest()`, `window.rejectRequest()`, `window.closeApprovalForm()`
- `window.login()`, `window.registerDeveloper()`, `window.toggleRegistration()`, `window.togglePassword()`, `window.logout()`
- `window.downloadBackup()`, `window.restoreBackup()`, `window.exportAuditLogs()`, `window.compareVersions()`, `window.publishReleaseNote()`, `window.performSearch()`

### 3. Status Classes & Styling Hooks
- Badges must maintain semantic classes: `.status`, `.status.pending`, `.status.approved`, `.status.rejected`, `.status.active`, `.status.inactive`.
- Row styling classes: `.assigned-project-row`, `.assignment-badge`.
- Visibility mechanisms: Respect `element.style.display = "block"/"none"` and `element.hidden = true/false` without CSS `!important` overriding.

---

## Write Ownership Boundaries
- **Worker 1 (Milestone 1)**: `public/css/style.css`
- **Worker 2 (Milestone 2)**: `public/js/icons.js`, `public/js/sidebar.js`, `public/js/changeRequests.js`
- **Worker 3 (Milestone 3)**: `public/pages/*.html` (all 11 HTML views)
- **Test Writer (Milestone 4)**: `tests/e2e/*.js`, `package.json` test scripts
- **Worker 5 (Milestone 5)**: Integration fixes & test runner execution
