# Task Assignment: Milestone 3 — View Templates Modernization

Read:
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/ORIGINAL_REQUEST.md`
- `/home/abrahamgracef/teamwork_projects/configflow/PROJECT.md`
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/explorer_survey_dom/survey_dom_report.md`
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/explorer_survey_design/survey_design_report.md`

YOUR WRITE OWNERSHIP:
You EXCLUSIVELY own and modify:
- All 11 HTML files in `public/pages/`:
  1. `public/pages/login.html`
  2. `public/pages/dashboard.html`
  3. `public/pages/projects.html`
  4. `public/pages/modules.html`
  5. `public/pages/changeRequests.html`
  6. `public/pages/approval.html`
  7. `public/pages/versions.html`
  8. `public/pages/releaseNotes.html`
  9. `public/pages/reports.html`
  10. `public/pages/auditLogs.html`
  11. `public/pages/search.html`

TASKS:
1. Modernize all 11 HTML page layouts into production-grade, restrained interfaces matching Linear/Vercel/Stripe aesthetic:
   - Modern sidebar brand header: `<div class="logo"><span class="logo-mark">CF</span><span class="logo-text">ConfigFlow</span></div>`.
   - Clean navigation links with `data-page="..."` (e.g. `<a href="dashboard.html" data-page="dashboard"><span class="nav-label">Dashboard</span></a>` - sidebar.js injects SVG icons).
   - In head or before scripts: Include `<script src="../js/icons.js"></script>` before `<script src="../js/sidebar.js"></script>`.
2. ZERO EMOJIS:
   - Remove all unicode emojis from brand headers (`⚙️`), navigation links, stat cards, action buttons (`✓ Approve`, `✕ Reject`), stray tags (e.g. `versions.html` line 178 `🚀 Versions`), search inputs (`🔍`), and headings.
   - For stat cards in `dashboard.html`: replace raw emoji stat-icons with clean semantic wrappers (e.g. `<div class="stat-icon" data-icon="projects"></div>` or `<div class="stat-icon stat-icon-projects"></div>`).
3. ZERO DOM REGRESSIONS:
   - Preserve 100% of DOM IDs:
     - User profile: `#sidebarUserName`, `#sidebarUserRole`, `#approvalLink`.
     - 10 Dynamic Table Bodies: `#recentRequests`, `#projectSummary`, `#projectsTable`, `#modulesTable`, `#requestsTable`, `#pendingRequestsTable`, `#versionsTable`, `#projectReportTable`, `#versionReportTable`, `#auditTable`, `#searchResults`.
     - Dashboard metric IDs: `#totalProjects`, `#totalDevelopers`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#latestVersion`, `#pendingBar`, `#pendingBarValue`, `#approvedBar`, `#approvedBarValue`, `#rejectedBar`, `#rejectedBarValue`, `#dashboardNotification`.
     - Reports metric IDs: `#totalRequests`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#totalVersions`, `#totalProjects`.
     - Form & Modal section IDs: `#projectFormSection`, `#moduleFormSection`, `#requestFormSection`, `#approvalSection`, `#releaseNoteFormSection`, `#backupSection`, `#loginFields`, `#registerFields`.
     - Input IDs and form field names: `#projectName`, `#projectDescription`, `#moduleName`, `#moduleDescription`, `#projectId`, `#requestTitle`, `#requestDescription`, `#fileUpload`, `#adminComment`, `#searchQuery`, `#email`, `#password`, `#registerName`, `#registerEmail`, `#registerPassword`, `#registerRole`, `#olderVersion`, `#newerVersion`, `#versionComparison`, `#employeeIdPreview`, `#backupFile`, etc.
     - Inline `onclick` handlers: `openProjectForm()`, `closeProjectForm()`, `saveProject()`, `openModuleForm()`, `closeModuleForm()`, `saveModule()`, `openRequestForm()`, `closeRequestForm()`, `submitRequest()`, `approveRequest()`, `rejectRequest()`, `closeApprovalForm()`, `login()`, `registerDeveloper()`, `toggleRegistration()`, `togglePassword()`, `logout()`.
4. Visual polish & states:
   - Consistent headers, action buttons, table wrappers, empty states with contextual messages.
   - Ensure clean HTML semantics and no broken tags.
5. Run verification tests (`node tests/e2e/runner.js`) and document in `handoff.md`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
