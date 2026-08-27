# E2E Test Infra: ConfigFlow UI/UX & Functional Verification

## Test Philosophy
- **Opaque-Box, Requirement-Driven**: Tests interact with the application strictly via HTTP/HTTPS endpoints, static asset routing, and DOM structure verification without relying on backend internal methods.
- **Zero-Tolerance for Regressions**: All 31 API endpoints, authentication flows, authorization rules, and client DOM contracts must be validated with deterministic assertions.
- **Visual & Structural Standards**: Zero unicode emojis allowed across all HTML and JS files; all SVG icons must adhere to consistent dimensions; all 11 HTML views must serve assets cleanly with zero 404s.

---

## Feature Inventory & Test Mapping
| # | Feature Area | Endpoints / Assets Verified | Tier 1 (Count) | Tier 2 (Count) | Tier 3 | Tier 4 |
|---|--------------|-----------------------------|:--------------:|:--------------:|:------:|:------:|
| 1 | Asset Integrity & Static Serving | All 11 HTML pages, `style.css`, `public/js/*.js`, `/uploads` | 11 | 6 | ✓ | ✓ |
| 2 | Emoji Elimination & Icon Standards | Unicode scan across all public HTML/JS, SVG structure | 5 | 5 | ✓ | ✓ |
| 3 | DOM ID & Binding Invariants | 10 table bodies, 6 metric containers, form IDs, input names | 10 | 5 | ✓ | ✓ |
| 4 | Authentication & Authorization | `/api/login`, `/api/register`, `/api/logout`, JWT cookies, RBAC | 6 | 6 | ✓ | ✓ |
| 5 | Project Lifecycle & Assignments | `/api/projects` CRUD, `/api/projects/:id/assign-manager`, `/assign-developer` | 6 | 5 | ✓ | ✓ |
| 6 | Module Lifecycle & Ownership | `/api/modules` CRUD, project-scoped modules, permission checks | 5 | 5 | ✓ | ✓ |
| 7 | Change Requests & Attachments | `/api/change-requests` CRUD, Multer file upload, status tracking | 6 | 5 | ✓ | ✓ |
| 8 | Approvals & Cascading State | `/api/approvals`, version creation, release note generation, audit logging | 5 | 5 | ✓ | ✓ |
| 9 | Versioning & Diff Comparison | `/api/versions`, `/api/versions/compare`, chronological sorting | 5 | 5 | ✓ | ✓ |
| 10 | Release Notes & Audit Logs | `/api/release-notes`, `/api/audit-logs`, CSV export | 5 | 5 | ✓ | ✓ |
| 11 | Search & Reports Analytics | `/api/search`, `/api/reports/summary`, metric calculations | 6 | 5 | ✓ | ✓ |
| 12 | Backup & Recovery | `/api/backup/export`, `/api/backup/restore`, transactional integrity | 5 | 5 | ✓ | ✓ |

---

## Test Architecture
- **Location**: `tests/e2e/`
  - `runner.js`: Master test harness and reporter
  - `test_tier1_features.js`: Tier 1 Feature Coverage (≥70 tests covering all features in isolation)
  - `test_tier2_boundaries.js`: Tier 2 Boundary & Corner Cases (≥60 tests covering edge inputs, unicode checks, invalid payloads, missing tokens)
  - `test_tier3_combos.js`: Tier 3 Cross-Feature Combinations (≥15 end-to-end integration workflows)
  - `test_tier4_workloads.js`: Tier 4 Real-World Application Workloads (≥10 end-to-end operational scenarios)
- **Invocation**: `node tests/e2e/runner.js` or `npm test`
- **Pass/Fail Semantics**: Exit code 0 on 100% pass; non-zero exit code with detailed assertion failure diff on any regression.

---

## Real-World Application Scenarios (Tier 4)
1. **Full Enterprise Development Cycle**: Admin creates project -> assigns Manager -> Manager assigns Developer -> Developer adds Modules -> Developer submits Change Request with attachment -> Manager reviews & approves -> System auto-generates Version `v1.0.0` and Release Note -> Admin verifies in Audit Log and Reports.
2. **Multi-Role Access Control Matrix**: Developer attempts to approve request (403 forbidden) -> Developer attempts to delete project (403 forbidden) -> Manager approves own project request (200 OK) -> Manager attempts to access non-assigned project (403 forbidden).
3. **Disaster Recovery Round-Trip**: Populate project with modules and approved change requests -> Export JSON backup -> Truncate/modify records -> Restore backup -> Verify 100% data fidelity across all tables.
4. **Offline Asset & DOM Integrity**: Fetch all 11 HTML pages via HTTP -> Parse with DOM/RegExp parser -> Verify 0 missing CSS/JS links, 0 unicode emojis, and 100% presence of required dynamic element IDs and forms.
5. **High-Density Search & Reporting Verification**: Query search with substring matching across projects, modules, change requests, and release notes -> Verify search categorization and summary metric calculations.

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥ 70 test cases
- **Tier 2 (Boundary & Corner Cases)**: ≥ 60 test cases
- **Tier 3 (Cross-Feature Combinations)**: ≥ 15 test cases
- **Tier 4 (Real-World Scenarios)**: ≥ 10 test cases
- **Total Suite Minimum**: ≥ 155 test cases
