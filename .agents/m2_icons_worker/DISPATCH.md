# Task Assignment: Milestone 2 — SVG Icon System & Client Scripts Sync

Read:
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/ORIGINAL_REQUEST.md`
- `/home/abrahamgracef/teamwork_projects/configflow/PROJECT.md`
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/explorer_survey_dom/survey_dom_report.md`
- `/home/abrahamgracef/teamwork_projects/configflow/.agents/explorer_survey_design/survey_design_report.md`

YOUR WRITE OWNERSHIP:
You EXCLUSIVELY own:
- `public/js/icons.js` (create modular, self-contained SVG icon library and render helper)
- `public/js/sidebar.js` (eliminate emoji stripping regex hack, eliminate `☰` mobile hamburger, render crisp SVG icons)
- `public/js/changeRequests.js` (eliminate `📎` in dynamic file attachment link, render crisp SVG icon)
- Any other `public/js/*.js` client scripts where emojis or icon hooks need clean SVG rendering.

TASKS:
1. Create `public/js/icons.js`:
   - Export a robust, self-contained SVG icon catalog (Lucide/Heroicons 24x24 viewBox, stroke-width 1.75/2px):
     - `dashboard` (layout-dashboard / grid)
     - `projects` (folder-git-2 / folder)
     - `modules` (boxes / cube)
     - `changeRequests` (git-pull-request)
     - `approvals` (check-circle-2)
     - `versions` (tag / git-commit)
     - `releaseNotes` (file-text / scroll)
     - `reports` (bar-chart-3)
     - `auditLogs` (clipboard-list / shield-alert)
     - `search` (search / magnifying-glass)
     - `paperclip` / `file` (paperclip)
     - `menu` / `hamburger` (menu lines)
     - `close` / `x` (x-circle / x)
     - `settings` / `gear` (settings)
     - `users` (users)
     - `clock` / `hourglass` (clock / hourglass)
     - `check` (check)
     - `alert` / `warning` (alert-triangle)
     - `logout` (log-out)
     - `download` (download)
     - `upload` (upload)
     - `plus` (plus)
   - Provide helper function `window.renderIcon(name, className, size)` returning clean, accessible SVG string with `aria-hidden="true"`.
2. Update `public/js/sidebar.js`:
   - Integrate with `icons.js` or provide inline fallback if script loads standalone.
   - Cleanly inject SVG icons into `.sidebar nav a` based on data attribute or route path without regex stripping hacks.
   - Replace mobile menu button text (`☰`) with a clean SVG hamburger/menu icon.
   - Preserve all DOM IDs (`#sidebarUserName`, `#sidebarUserRole`, `#approvalLink`), event listeners, and responsive drawer functionality.
3. Update `public/js/changeRequests.js`:
   - Line 445: Replace `📎 View File` with SVG paperclip icon + `View File`.
4. Ensure 0 unicode emojis remain in ANY file under `public/js/`.
5. Verify with automated tests, ensure server boots cleanly (`node app.js`), and document in `handoff.md`.

DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.
