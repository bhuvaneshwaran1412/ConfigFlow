# ConfigFlow UI/UX & Design System Architecture Report

**Document**: `survey_design_report.md`  
**Explorer**: Explorer 2 (Design System, CSS Architecture & SVG Icon Strategy)  
**Date**: 2026-08-27  
**Project**: ConfigFlow (`/home/abrahamgracef/teamwork_projects/configflow`)  
**Objective**: Comprehensive audit of current UI/CSS implementation, identification of AI-generated slop and anti-patterns, and complete architectural specification of a production-grade, Linear/Vercel/Stripe-inspired design system with zero functional regressions.

---

## 1. Executive Summary

ConfigFlow is a software configuration management web application built on Node.js/Express with plain HTML/JS frontend views. The current frontend is an artifact of multiple successive AI generation passes, resulting in a bloated, 2,347-line CSS stylesheet (`public/css/style.css`) consisting of five distinct historical layers appended on top of each other. 

Key issues identified:
1. **AI UI Slop & Gimmicks**: Decorative background grid lines (`linear-gradient` 28px pattern), radial gradient glow blobs (`.main-content::before`, `.login-page`), rotating wire circles, multi-stop neon button gradients, and 35px blurry box shadows.
2. **Emoji-Laden Navigation & Actions**: All 11 HTML screens and several client JS scripts rely on hardcoded unicode emojis (`⚙️`, `🏠`, `📁`, `▦`, `🔄`, `✓`, `🚀`, `📄`, `📊`, `📋`, `🔍`, `👥`, `⏳`, `✕`, `☰`, `📎`) paired with crude string-stripping regexes in JS.
3. **Incoherent Styling Architecture**: Font stacks switch from `Arial` to `Trebuchet MS` (a 1990s humanist font) to `Segoe UI`; color tokens conflict across multiple `:root` declarations (`--brand`, `--primary`, `--ink`, `--canvas`); spacing and sizing rules use arbitrary pixel values rather than a harmonious scale.
4. **Layout & Responsiveness Breakage**: Media queries are fragmented at 900px and 700px with negative-margin hacks on table containers, broken horizontal scroll handling, and inline modal/form state toggling (`display: none` / `display: block`).

This report provides the full architectural blueprint to replace the messy CSS with a single, modular, tokenized stylesheet, integrate a cohesive 24x24 SVG icon system, eliminate all emojis and visual noise, and elevate ConfigFlow into a razor-sharp, high-density SaaS product matching the aesthetic rigor of Linear, Vercel, and Stripe.

---

## 2. Comprehensive Audit of Existing CSS Architecture & Layouts

### 2.1 CSS Layer Archaeology (`public/css/style.css`)

The file `public/css/style.css` contains **2,347 lines** divided into five conflicting chronological layers:

| Layer | Line Range | Theme / Intent | Key Characteristics | Defects |
|---|---|---|---|---|
| **Layer 1: Legacy Prototype** | Lines 1–1005 | Basic Bootstrap-like MVP | `font-family: Arial;`, `#2563eb` blue primary, `#0f172a` slate sidebar, `.login-box` 350px centered | Duplicate rules (`.form-section label` and `select` defined twice), basic unstyled tables |
| **Layer 2: Visual Refresh** | Lines 1006–1324 | Teal overhaul | Introduces `:root` with `--brand: #0f766e`, `font-family: "Trebuchet MS"`, split login shell | `button:hover` with `transform: translateY(-1px)` and box shadows; high specificity overrides |
| **Layer 3: Product UI System** | Lines 1325–1876 | Enterprise attempt | Redefines `:root` with `--primary`, `--border`, `--surface`; adds SVG icon wrappers and toast system | Overwrites Layer 1 and 2 rules; introduces first set of media queries at 900px and 700px |
| **Layer 4: Final Refinement** | Lines 1877–2078 | Dense dashboard attempt | Flexbox sidebar, 6-column border-separated stat grid, removes button hover transforms | Overrides previous stat grids and cards; adds 3rd set of media queries |
| **Layer 5: Reports Composition** | Lines 2079–2185 | Page-specific tweaks | Overrides `.reports-page`, `.report-panel`, left color borders on cards (`::before`) | Page-scoped overrides that fight global card rules |
| **Layer 6: AI Slop Finish** | Lines 2186–2347 | Decorative background blobs | Grid pattern background, glowing radial pseudo-elements, wire circles, button gradients | High GPU overhead, visual clutter, poor contrast |

### 2.2 Application View Inventory & DOM Bindings

ConfigFlow consists of 11 HTML pages in `public/pages/` powered by client scripts in `public/js/`. All existing IDs, classes, and form bindings must be strictly preserved:

| Page | Primary HTML File | Client Script | Key DOM IDs & Bindings (MUST PRESERVE) | Key Classes / Selectors |
|---|---|---|---|---|
| **Login / Register** | `login.html` | `login.js` | `#email`, `#password`, `#loginFields`, `#registerFields`, `#registerToggle`, `#message`, `#registerName`, `#employeeId`, `#employeeIdHint`, `#registerEmail`, `#registerPassword`, `#confirmPassword` | `.login-page`, `.login-shell`, `.login-brand`, `.login-box`, `.password-field`, `.password-toggle`, `.employee-id-field`, `.lock-icon`, `.link-button`, `.error-message`, `.success-message` |
| **Dashboard** | `dashboard.html` | `dashboard.js`, `sidebar.js` | `#welcomeMessage`, `#totalProjects`, `#totalDevelopers`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#latestVersion`, `#pendingBar`, `#approvedBar`, `#rejectedBar`, `#pendingBarValue`, `#approvedBarValue`, `#rejectedBarValue`, `#dashboardNotification`, `#backupSection`, `#downloadBackupButton`, `#backupFile`, `#restoreBackupButton`, `#backupMessage`, `#recentRequests`, `#projectSummary`, `#sidebarUserName`, `#sidebarUserRole` | `.sidebar`, `.logo`, `.topbar`, `.logout-btn`, `.stats-grid`, `.stat-card`, `.stat-icon`, `.dashboard-section`, `.section-header`, `.table-container`, `.status`, `.status.pending`, `.status.approved`, `.status.rejected`, `.dashboard-bars`, `.dashboard-bar-row`, `.dashboard-bar-track`, `.backup-controls`, `.file-button` |
| **Projects** | `projects.html` | `projects.js`, `sidebar.js` | `#addProjectButton`, `#projectFormSection`, `#formTitle`, `#projectId`, `#projectName`, `#projectDescription`, `#currentVersion`, `#projectCount`, `#projectsTable`, `#manager-${id}`, `#developer-${id}` | `.form-section`, `.add-btn`, `.cancel-btn`, `.edit-btn`, `.delete-btn`, `.assigned-project-row`, `.assignment-badge`, `.assigned`, `.not-assigned`, `.assignment-control` |
| **Modules** | `modules.html` | `modules.js`, `sidebar.js` | `#moduleFormSection`, `#formTitle`, `#moduleId`, `#projectId`, `#moduleName`, `#moduleCount`, `#modulesTable` | `.form-section`, `.add-btn`, `.cancel-btn`, `.edit-btn`, `.delete-btn` |
| **Change Requests** | `changeRequests.html` | `changeRequests.js`, `sidebar.js` | `#requestFormSection`, `#projectId`, `#moduleId`, `#requestTitle`, `#requestDescription`, `#priority`, `#attachment`, `#requestCount`, `#requestsTable` | `.form-section`, `.add-btn`, `.cancel-btn`, `.status`, `.status.pending`, `.status.approved`, `.status.rejected` |
| **Approvals** | `approval.html` | `approval.js`, `sidebar.js` | `#approvalSection`, `#requestId`, `#requestTitle`, `#requestProject`, `#requestModule`, `#requestPriority`, `#requestDescription`, `#adminComment`, `#pendingCount`, `#pendingRequestsTable` | `.form-section`, `.approve-btn`, `.reject-btn`, `.cancel-btn`, `.edit-btn` |
| **Versions** | `versions.html` | `versions.js`, `sidebar.js` | `#versionCount`, `#versionsTable`, `#olderVersion`, `#newerVersion`, `#compareVersionsButton`, `#versionComparison`, `#releaseNotesContainer` | `.version-compare-controls`, `.version-comparison-panel`, `.release-note-card` |
| **Release Notes** | `releaseNotes.html` | `releaseNotes.js`, `sidebar.js` | `#releaseNoteFormSection`, `#releaseVersion`, `#releaseNoteText`, `#publishReleaseNoteButton`, `#releaseNoteMessage`, `#releaseNoteCount`, `#releaseNotesContainer` | `.release-note-card`, `.release-note-meta`, `.release-note-body`, `.release-notes-status`, `.release-notes-toolbar`, `.release-notes-list` |
| **Reports** | `reports.html` | `reports.js`, `sidebar.js` | `#totalRequests`, `#pendingRequests`, `#approvedRequests`, `#rejectedRequests`, `#totalVersions`, `#totalProjects`, `#projectReportTable`, `#versionReportTable` | `.reports-page`, `.cards`, `.card`, `.report-card`, `.report-panel`, `.report-metrics`, `.reports-tables`, `.page-kicker`, `.section-kicker` |
| **Audit Logs** | `auditLogs.html` | `auditLogs.js`, `sidebar.js` | `#logCount`, `#exportAuditButton`, `#auditTable` | `.dashboard-section`, `.section-header`, `.table-container`, `.add-btn` |
| **Search** | `search.html` | `search.js`, `sidebar.js` | `#searchInput`, `#searchButton`, `#statusFilter`, `#priorityFilter`, `#searchResults` | `.search-box`, `.table-container` |

---

## 3. Catalog of AI-Generated UI Slop & Anti-Patterns

### 3.1 Decorative Gradients, Glowing Blobs & Grid Noise

| Anti-Pattern Location | Code / Rule in `public/css/style.css` | Defect & Impact | Remediation Strategy |
|---|---|---|---|
| **Global Body Grid Pattern** | `body:not(.login-page)` (lines 2188–2191): `background-image: linear-gradient(rgba(15, 118, 110, 0.035) 1px, transparent 1px)... background-size: 28px 28px;` | Renders a repetitive math-grid pattern across all views. High visual noise, clutters dense data tables. | Remove entirely. Replace with a solid neutral surface: `background-color: var(--bg-canvas)` (`#f8fafc` or `#fafafa`). |
| **Top-Right Glowing Blob** | `.main-content::before` (lines 2198–2208): `background: linear-gradient(135deg, rgba(20, 184, 166, 0.09), transparent 70%); width: 42%; height: 210px;` | AI-flavored ambient light blob. Serves zero functional purpose; creates uneven contrast across topbar headers. | Remove `.main-content::before` pseudo-element entirely. Clean white/neutral header area. |
| **Login Ambient Radial Blobs** | `.login-page` (lines 2248–2252): `radial-gradient(circle at 12% 18%, rgba(45, 212, 191, 0.24)...), radial-gradient(circle at 88% 82%, rgba(249, 115, 22, 0.2)...)` | Purple/cyan/orange neon blobs reminiscent of generic AI mockups. | Replace with restrained, dark neutral or clean minimal background with subtle border containment. |
| **Login Decorative Wire Circles** | `.login-page::before`, `.login-page::after`, `.login-brand::after` (lines 2254–2276, 2290–2299): 480px, 560px, 280px circular borders | Floating wireframe circles that overflow the viewport and cause unnecessary compositing layers. | Remove all decorative wireframe pseudo-elements. |
| **Button Gradient Fills** | `.login-box button:not(.link-button)` (line 2311): `background: linear-gradient(110deg, #0f766e, #0d9488);` | Gradients on primary buttons reduce click target clarity and look dated. | Replace with solid neutral/brand primary: `#0f172a` (or `#18181b` / `#2563eb`) with crisp state transitions. |
| **Section Card Top Accent Border** | `.dashboard-section, .form-section` (lines 2221–2224): `border-top: 3px solid rgba(15, 118, 110, 0.2);` | Random teal stripe at the top of every card. Visual clutter that breaks visual rhythm. | Use uniform, subtle 1px border: `border: 1px solid var(--border-default)`. |

### 3.2 Emoji-Based UI & Raw Text Navigation

| Location | Current Content | Problem | Solution |
|---|---|---|---|
| **App Logo** | `⚙️ ConfigFlow` in all 10 HTML pages | Unicode gear emoji renders differently on every OS/browser. | Dedicated SVG brand glyph (e.g. geometric layers/workflow icon) + clean bold wordmark. |
| **Sidebar Nav Links** | `🏠 Dashboard`, `📁 Projects`, `▦ Modules`, `🔄 Change Requests`, `✓ Approvals`, `🚀 Versions`, `📄 Release Notes`, `📊 Reports`, `📋 Audit Logs`, `🔍 Search` | Unicode emojis hardcoded in HTML link text. `sidebar.js` uses regex `link.textContent.trim().replace(/^[^A-Za-z]+/, "")` to strip them. | Remove all emojis from HTML files; render clean SVG icons inline or via standardized template with `aria-hidden="true"`. |
| **Dashboard Stat Icons** | `📁`, `👥`, `⏳`, `✓`, `✕`, `🚀` in `dashboard.html` | Initial HTML contains raw emojis inside `.stat-icon` before JS replacement. | Replace initial HTML with standard SVG icon elements. |
| **Mobile Menu Toggle** | `menuButton.textContent = "☰";` in `sidebar.js` line 63 | Unicode trigram symbol. Poor touch-target visual definition and inconsistent font rendering. | Render clean 20px SVG hamburger / close menu icon. |
| **Action Buttons** | `+ Add Project`, `+ Add Module`, `+ New Change Request`, `✓ Approve`, `✕ Reject` in HTML | Text characters `+`, `✓`, `✕` prepended to button labels. | Use clean SVG icon primitives or standard typography labels. |
| **File Attachment Links** | `📎 View File` in `changeRequests.js` line 445 | Unicode paperclip emoji. | Replace with SVG paperclip/attachment icon + "View file". |
| **Orphaned Versions Link** | `<a href="versions.html">🚀 Versions</a>` in `versions.html` line 178 | Dangling leftover link tag outside the `main` container. | Remove entirely. |

### 3.3 Typography, Color & Contrast Defects

1. **Font Stack Mismatch**: `body` sets `font-family: "Trebuchet MS", "Segoe UI", sans-serif;`. `Trebuchet MS` is an informal 1996 typeface that looks unprofessional for an engineering configuration management system.
2. **Arbitrary Responsive Font Sizes**: `font-size: clamp(26px, 3vw, 36px)` produces unpredictable text wrapping and awkward header line wrapping on tablets.
3. **Eyebrows & Kickers Overuse**: `.page-kicker`, `.section-kicker`, `.login-kicker`, `.nav-section-label` use `letter-spacing: 0.13em; font-size: 10px; font-weight: 700; text-transform: uppercase;`. Excessive micro-labels increase visual noise.
4. **Poor Status Color Contrast**:
   - Pending: `#8a4b08` on `#fff7df` has low contrast ratio (3.8:1).
   - Table hover: `#f0fdfa` (light teal) clashes with status pill backgrounds.
   - Secondary text `#64748b` on light teal table rows falls below WCAG AA 4.5:1.

---

## 4. Production-Grade Design System Architecture

Inspired by **Linear**, **Vercel**, and **Stripe**, ConfigFlow will adopt a neutral-first, high-density design system built on CSS custom properties.

### 4.1 Design Philosophy & Aesthetic Foundation

- **Restrained & Neutral-First**: Deep slate/zinc neutrals provide structure; color is reserved strictly for semantic feedback (status, destructive actions, focus rings).
- **Operational Data Density**: Generous hit targets for interactive controls, but compact tabular presentation for maximum data scanning efficiency.
- **Crisp Geometry**: Standard 6px/8px radii, subtle 1px hairline borders (`#e2e8f0` / `#27272a`), micro-shadows (`0 1px 2px rgba(0,0,0,0.05)`), zero blurry drop shadows.
- **Predictable Hierarchy**: Clear visual distinction between page titles, section headers, card titles, metadata, and data values.

### 4.2 CSS Design Tokens (`:root`)

```css
:root {
    /* ----------------------------------------- */
    /* 1. Neutral Palette (Zinc / Slate Base)     */
    /* ----------------------------------------- */
    --color-bg-canvas: #f8fafc;        /* Page background */
    --color-bg-surface: #ffffff;       /* Card / Modal / Popover surface */
    --color-bg-subtle: #f1f5f9;        /* Table headers, tag backgrounds */
    --color-bg-muted: #e2e8f0;         /* Dividers, track backgrounds */
    --color-bg-hover: #f8fafc;         /* Interactive row / item hover */
    --color-bg-active: #f1f5f9;        /* Active item background */

    --color-border-subtle: #f1f5f9;    /* Internal subtle separators */
    --color-border-default: #e2e8f0;   /* Standard card & control borders */
    --color-border-strong: #cbd5e1;    /* Input borders, active dividers */
    --color-border-focus: #0f172a;     /* Focused input/control ring */

    --color-text-primary: #0f172a;     /* Headings, body text, high contrast */
    --color-text-secondary: #475569;   /* Subtitles, labels, table cells */
    --color-text-muted: #64748b;       /* Placeholders, secondary metadata */
    --color-text-disabled: #94a3b8;    /* Disabled text / icons */

    /* ----------------------------------------- */
    /* 2. Brand & Semantic Accents               */
    /* ----------------------------------------- */
    --color-brand-primary: #0f172a;    /* High-contrast dark primary (Linear/Vercel) */
    --color-brand-primary-hover: #1e293b;
    --color-brand-accent: #2563eb;     /* Focused action blue */
    --color-brand-accent-subtle: #eff6ff;

    /* Success (Approved / Resolved / Assigned) */
    --color-success-fg: #15803d;
    --color-success-bg: #f0fdf4;
    --color-success-border: #bbf7d0;

    /* Warning (Pending / In Review) */
    --color-warning-fg: #b45309;
    --color-warning-bg: #fffbeb;
    --color-warning-border: #fde68a;

    /* Danger / Error (Rejected / Destructive) */
    --color-danger-fg: #b91c1c;
    --color-danger-bg: #fef2f2;
    --color-danger-border: #fecaca;
    --color-danger-btn: #dc2626;
    --color-danger-btn-hover: #b91c1c;

    /* Info */
    --color-info-fg: #1d4ed8;
    --color-info-bg: #eff6ff;
    --color-info-border: #bfdbfe;

    /* ----------------------------------------- */
    /* 3. Typography Scale & Font Stack           */
    /* ----------------------------------------- */
    --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;

    --font-size-xs: 11px;     /* Captions, tags, kickers */
    --font-size-sm: 12px;     /* Table headers, meta labels */
    --font-size-base: 13px;   /* Standard table data, inputs, body */
    --font-size-md: 14px;     /* Subheadings, nav links, button text */
    --font-size-lg: 16px;     /* Card titles, section headers */
    --font-size-xl: 20px;     /* Section h2 */
    --font-size-2xl: 24px;    /* Page h1 */
    --font-size-3xl: 28px;    /* Stat card key metrics */

    --font-weight-normal: 400;
    --font-weight-medium: 500;
    --font-weight-semibold: 600;
    --font-weight-bold: 700;

    --line-height-tight: 1.25;
    --line-height-base: 1.5;
    --line-height-relaxed: 1.625;

    /* ----------------------------------------- */
    /* 4. Spacing Scale (4/8/12/16/24/32/48px)   */
    /* ----------------------------------------- */
    --space-1: 4px;
    --space-2: 8px;
    --space-3: 12px;
    --space-4: 16px;
    --space-5: 20px;
    --space-6: 24px;
    --space-8: 32px;
    --space-12: 48px;
    --space-16: 64px;

    /* ----------------------------------------- */
    /* 5. Radii & Elevation                      */
    /* ----------------------------------------- */
    --radius-sm: 4px;
    --radius-md: 6px;
    --radius-lg: 8px;
    --radius-xl: 12px;
    --radius-pill: 9999px;

    --shadow-subtle: 0 1px 2px 0 rgba(15, 23, 42, 0.05);
    --shadow-md: 0 4px 6px -1px rgba(15, 23, 42, 0.07), 0 2px 4px -2px rgba(15, 23, 42, 0.05);
    --shadow-lg: 0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -4px rgba(15, 23, 42, 0.04);
    --shadow-modal: 0 20px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.06);

    /* ----------------------------------------- */
    /* 6. Layout Constants                       */
    /* ----------------------------------------- */
    --sidebar-width: 240px;
    --header-height: 60px;
    --content-max-width: 1400px;
    --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## 5. UI Component Primitives & Styling Guidelines

### 5.1 Buttons & Action Hierarchy

Buttons must establish an unambiguous functional hierarchy without neon gradients or awkward hover transforms:

```css
/* Base Button Primitive */
button, .add-btn, .approve-btn, .reject-btn, .cancel-btn, .edit-btn, .delete-btn, .file-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-2);
    height: 34px;
    padding: 0 var(--space-3);
    font-family: var(--font-sans);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    line-height: 1;
    border-radius: var(--radius-md);
    border: 1px solid transparent;
    cursor: pointer;
    white-space: nowrap;
    text-decoration: none;
    transition: background-color var(--transition-fast), border-color var(--transition-fast), color var(--transition-fast), box-shadow var(--transition-fast);
}

/* Primary Button (Standard Action) */
.add-btn, .approve-btn, .login-box button:not(.link-button), #compareVersionsButton, #searchButton, #exportAuditButton, #publishReleaseNoteButton {
    background-color: var(--color-brand-primary);
    color: #ffffff;
    border-color: var(--color-brand-primary);
    box-shadow: var(--shadow-subtle);
}
.add-btn:hover, .approve-btn:hover, .login-box button:not(.link-button):hover, #compareVersionsButton:hover, #searchButton:hover, #exportAuditButton:hover, #publishReleaseNoteButton:hover {
    background-color: var(--color-brand-primary-hover);
    border-color: var(--color-brand-primary-hover);
}

/* Secondary Button / Cancel */
.cancel-btn, .file-button {
    background-color: var(--color-bg-surface);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
    box-shadow: var(--shadow-subtle);
}
.cancel-btn:hover, .file-button:hover {
    background-color: var(--color-bg-subtle);
    border-color: var(--color-border-strong);
}

/* Destructive Button */
.delete-btn, .reject-btn, .logout-btn {
    background-color: var(--color-danger-btn);
    color: #ffffff;
    border-color: var(--color-danger-btn);
    box-shadow: var(--shadow-subtle);
}
.delete-btn:hover, .reject-btn:hover, .logout-btn:hover {
    background-color: var(--color-danger-btn-hover);
    border-color: var(--color-danger-btn-hover);
}

/* Compact Table Row Actions */
.edit-btn {
    height: 28px;
    padding: 0 var(--space-2);
    font-size: var(--font-size-sm);
    background-color: var(--color-bg-surface);
    color: var(--color-text-primary);
    border-color: var(--color-border-default);
}
.edit-btn:hover {
    background-color: var(--color-bg-subtle);
}
.delete-btn {
    height: 28px;
    padding: 0 var(--space-2);
    font-size: var(--font-size-sm);
}

/* Ghost / Link Buttons */
.link-button {
    background: transparent;
    border: none;
    color: var(--color-brand-accent);
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    padding: var(--space-2);
    box-shadow: none;
}
.link-button:hover {
    text-decoration: underline;
    background: transparent;
}
```

### 5.2 Form Inputs, Selects & Textareas

```css
input[type="text"],
input[type="email"],
input[type="password"],
select,
textarea {
    width: 100%;
    height: 36px;
    padding: 0 var(--space-3);
    font-family: var(--font-sans);
    font-size: var(--font-size-base);
    color: var(--color-text-primary);
    background-color: var(--color-bg-surface);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
    box-sizing: border-box;
    transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
}

textarea {
    height: auto;
    min-height: 88px;
    padding: var(--space-2) var(--space-3);
    resize: vertical;
    line-height: var(--line-height-base);
}

input:focus, select:focus, textarea:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 1px var(--color-border-focus);
}

label {
    display: block;
    margin-bottom: var(--space-1);
    margin-top: var(--space-3);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

label:first-child {
    margin-top: 0;
}
```

### 5.3 Sidebar Navigation & Topbar

```css
/* Sidebar Container */
.sidebar {
    position: fixed;
    top: 0;
    left: 0;
    width: var(--sidebar-width);
    height: 100vh;
    background-color: #0f172a; /* Solid dark slate */
    border-right: 1px solid #1e293b;
    display: flex;
    flex-direction: column;
    padding: var(--space-4) var(--space-3);
    box-sizing: border-box;
    z-index: 40;
}

/* Logo */
.logo {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: 0 var(--space-2);
    margin-bottom: var(--space-6);
    color: #f8fafc;
    font-size: var(--font-size-md);
    font-weight: var(--font-weight-bold);
    letter-spacing: -0.01em;
}

.logo-mark {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: var(--radius-md);
    background: #1e293b;
    border: 1px solid #334155;
    color: #38bdf8;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-bold);
}

/* Section Header Labels in Nav */
.nav-section-label {
    padding: var(--space-3) var(--space-2) var(--space-1);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

/* Nav Links */
.sidebar nav {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    overflow-y: auto;
}

.sidebar nav a {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    height: 34px;
    padding: 0 var(--space-2);
    border-radius: var(--radius-md);
    color: #94a3b8;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-medium);
    text-decoration: none;
    transition: background-color var(--transition-fast), color var(--transition-fast);
}

.sidebar nav a:hover {
    background-color: #1e293b;
    color: #f8fafc;
}

.sidebar nav a.active {
    background-color: #1e293b;
    color: #ffffff;
    font-weight: var(--font-weight-semibold);
}

.nav-icon {
    display: grid;
    place-items: center;
    width: 18px;
    height: 18px;
    flex-shrink: 0;
    color: currentColor;
}

/* Sidebar User Footer */
.sidebar-user {
    margin-top: auto;
    padding: var(--space-3);
    border-radius: var(--radius-lg);
    background-color: #1e293b;
    border: 1px solid #334155;
}

.sidebar-user strong {
    display: block;
    color: #f8fafc;
    font-size: var(--font-size-base);
    font-weight: var(--font-weight-semibold);
}

.sidebar-user span {
    display: block;
    color: #94a3b8;
    font-size: var(--font-size-xs);
    margin-top: 2px;
}

.sidebar-logout {
    margin-top: var(--space-2);
    width: 100%;
    height: 28px;
    font-size: var(--font-size-xs);
    background: transparent;
    border: 1px solid #334155;
    color: #cbd5e1;
    border-radius: var(--radius-sm);
    cursor: pointer;
}
.sidebar-logout:hover {
    background-color: #334155;
    color: #ffffff;
}

/* Main Content & Topbar */
.main-content {
    margin-left: var(--sidebar-width);
    min-height: 100vh;
    padding: var(--space-8) var(--space-8);
    background-color: var(--color-bg-canvas);
    box-sizing: border-box;
}

.topbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-6);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--color-border-default);
}

.topbar h1 {
    margin: 0;
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    letter-spacing: -0.02em;
}

.topbar p {
    margin: var(--space-1) 0 0;
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
}
```

### 5.4 Cards, Metric Grid & Sections

```css
/* Dashboard Sections & Form Containers */
.dashboard-section, .form-section {
    background-color: var(--color-bg-surface);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-subtle);
    padding: var(--space-5);
    margin-bottom: var(--space-6);
}

.section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-4);
}

.section-header h2 {
    margin: 0;
    font-size: var(--font-size-lg);
    font-weight: var(--font-weight-semibold);
    color: var(--color-text-primary);
}

/* Statistics Metric Grid */
.stats-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: var(--space-3);
    margin-bottom: var(--space-6);
}

.stat-card {
    background-color: var(--color-bg-surface);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow-subtle);
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-height: 96px;
    box-sizing: border-box;
}

.stat-card h3 {
    margin: 0;
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-medium);
    color: var(--color-text-secondary);
}

.stat-card strong {
    font-size: var(--font-size-2xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-text-primary);
    font-feature-settings: "tnum";
}

.stat-icon {
    display: none; /* In minimal Linear design, metric tiles are clean numbers; or use small 16px icons */
}
```

### 5.5 Data Tables & Status Pills

```css
.table-container {
    overflow-x: auto;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-lg);
    background-color: var(--color-bg-surface);
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--font-size-base);
    text-align: left;
}

th, td {
    padding: var(--space-3) var(--space-4);
    border-bottom: 1px solid var(--color-border-subtle);
    vertical-align: middle;
}

th {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
    font-weight: var(--font-weight-semibold);
    letter-spacing: 0.02em;
    border-bottom: 1px solid var(--color-border-default);
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr:hover {
    background-color: var(--color-bg-hover);
}

/* Status Pills */
.status, .assignment-badge {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    padding: 2px var(--space-2);
    border-radius: var(--radius-pill);
    font-size: var(--font-size-xs);
    font-weight: var(--font-weight-semibold);
    line-height: 1.4;
    border: 1px solid transparent;
}

.status.pending {
    background-color: var(--color-warning-bg);
    color: var(--color-warning-fg);
    border-color: var(--color-warning-border);
}

.status.approved, .assignment-badge.assigned {
    background-color: var(--color-success-bg);
    color: var(--color-success-fg);
    border-color: var(--color-success-border);
}

.status.rejected {
    background-color: var(--color-danger-bg);
    color: var(--color-danger-fg);
    border-color: var(--color-danger-border);
}

.assignment-badge.not-assigned {
    background-color: var(--color-bg-subtle);
    color: var(--color-text-secondary);
    border-color: var(--color-border-default);
}
```

### 5.6 Toast Notifications & Feedback States

```css
.toast-region {
    position: fixed;
    bottom: var(--space-6);
    right: var(--space-6);
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
    z-index: 100;
    max-width: 360px;
    width: calc(100vw - 48px);
    pointer-events: none;
}

.toast {
    pointer-events: auto;
    padding: var(--space-3) var(--space-4);
    background-color: var(--color-bg-surface);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-default);
    border-left: 3px solid var(--color-brand-primary);
    border-radius: var(--radius-md);
    box-shadow: var(--shadow-lg);
    font-size: var(--font-size-base);
    animation: toast-in 200ms cubic-bezier(0.16, 1, 0.3, 1);
}

.toast-error {
    border-left-color: var(--color-danger-btn);
}

.toast-success {
    border-left-color: var(--color-success-fg);
}

@keyframes toast-in {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
}
```

---

## 6. SVG Icon Strategy & Asset System

### 6.1 Rendering Standards & Geometry

All icons across ConfigFlow will strictly adhere to the following rules:
- **Base Grid**: `24x24` viewBox (`viewBox="0 0 24 24"`).
- **Stroke Properties**: `fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`.
- **Sizing Hierarchy**:
  - `16px` (`width="16" height="16"`): Form controls, inline badges, table action buttons.
  - `18px` (`width="18" height="18"`): Sidebar navigation links, mobile menu buttons.
  - `20px` / `24px` (`width="24" height="24"`): Stat cards, empty state headers.
- **Crisp Pixel Alignment**: Coordinates aligned to whole integer pixels or 0.5 subpixels to prevent anti-aliasing blur.

### 6.2 Icon Mapping Catalog (Heroicons / Lucide Specification)

| UI Element | Replaces | SVG Path Data (`viewBox="0 0 24 24"`) | Rendered In |
|---|---|---|---|
| **Brand Logo Mark** | `⚙️` | `<path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>` | Sidebar Header (all pages) |
| **Dashboard Nav** | `🏠` | `<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>` | `dashboard.html` / `sidebar.js` |
| **Projects Nav** | `📁` | `<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>` | `projects.html` / `sidebar.js` |
| **Modules Nav** | `▦` | `<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/>` | `modules.html` / `sidebar.js` |
| **Change Requests Nav** | `🔄` | `<path d="m16 3 4 4-4 4"/><path d="M20 7H4"/><path d="m8 21-4-4 4-4"/><path d="M4 17h16"/>` | `changeRequests.html` / `sidebar.js` |
| **Approvals Nav** | `✓` | `<path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="10"/>` | `approval.html` / `sidebar.js` |
| **Versions Nav** | `🚀` | `<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/>` | `versions.html` / `sidebar.js` |
| **Release Notes Nav** | `📄` | `<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>` | `releaseNotes.html` / `sidebar.js` |
| **Reports Nav** | `📊` | `<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/><line x1="3" x2="21" y1="20" y2="20"/>` | `reports.html` / `sidebar.js` |
| **Audit Logs Nav** | `📋` | `<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect width="8" height="4" x="8" y="2" rx="1"/><path d="M9 12h6"/><path d="M9 16h6"/>` | `auditLogs.html` / `sidebar.js` |
| **Search Nav** | `🔍` | `<circle cx="11" cy="11" r="8"/><line x1="21" x2="16.65" y1="21" y2="16.65"/>` | `search.html` / `sidebar.js` |
| **Attachment File Link** | `📎` | `<path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>` | `changeRequests.js` |
| **Mobile Menu Button** | `☰` | `<line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/>` | `sidebar.js` |
| **Password Visibility Toggle** | Eye | `<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>` | `login.html` |
| **Lock Icon** | Lock | `<rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>` | `login.html` |
| **Add / Create** | `+` | `<line x1="12" x2="12" y1="5" y2="19"/><line x1="5" x2="19" y1="12" y2="12"/>` | Action buttons (Projects, Modules, Requests) |
| **Approve Action** | `✓` | `<polyline points="20 6 9 17 4 12"/>` | `approval.html` |
| **Reject Action** | `✕` | `<line x1="18" x2="6" y1="6" y2="18"/><line x1="6" x2="18" y1="6" y2="18"/>` | `approval.html` |

---

## 7. Responsive Layout & Breakpoint Architecture

```
+------------------------------------------------------------------------------------------------+
| Desktop (1280px+)                                                                              |
|  [Sidebar 240px]  |  [Main Content (max-width 1400px)]                                         |
|                   |  - Topbar (Title + Actions)                                                |
|                   |  - Stats Grid: 6 columns (repeat(6, 1fr))                                  |
|                   |  - Reports: 2 columns (.reports-tables: minmax(0, 1fr) minmax(0, 1.2fr))   |
|                   |  - Tables: Full width with crisp borders and subtle hover                  |
+------------------------------------------------------------------------------------------------+
| Tablet (768px - 1024px)                                                                        |
|  [Sidebar 200px or Collapsed] | [Main Content (padding: 24px 20px)]                            |
|                              | - Stats Grid: 3 columns (repeat(3, 1fr))                        |
|                              | - Reports: 1 column stacked (.reports-tables: 1fr)              |
|                              | - Tables: Horizontal scroll inside border container             |
+------------------------------------------------------------------------------------------------+
| Mobile (375px - 480px)                                                                         |
|  [Hamburger 36px] | [Header]                                                                   |
|  [Off-Canvas Drawer (Slide-in)]                                                                |
|  [Main Content (margin: 0, padding: 64px 16px 24px)]                                           |
|  - Stats Grid: 1 column (repeat(1, 1fr)) or 2 columns                                          |
|  - Form Controls: 100% width stacked                                                           |
|  - Tables: Responsive wrapper with touch scroll indicator                                      |
+------------------------------------------------------------------------------------------------+
```

### 7.1 Media Query Implementation Rules

```css
/* Tablet Breakpoint (<= 1024px) */
@media (max-width: 1024px) {
    .stats-grid {
        grid-template-columns: repeat(3, 1fr);
    }
    .cards {
        grid-template-columns: repeat(3, 1fr);
    }
    .reports-tables {
        grid-template-columns: 1fr;
    }
    .main-content {
        padding: var(--space-6) var(--space-4);
    }
}

/* Mobile Breakpoint (<= 768px) */
@media (max-width: 768px) {
    .sidebar {
        transform: translateX(-100%);
        transition: transform var(--transition-fast);
        box-shadow: var(--shadow-modal);
    }
    .sidebar.mobile-open {
        transform: translateX(0);
    }
    .sidebar-overlay {
        display: none;
        position: fixed;
        inset: 0;
        background: rgba(15, 23, 42, 0.4);
        backdrop-filter: blur(2px);
        z-index: 35;
    }
    .sidebar-overlay.visible {
        display: block;
    }
    .mobile-menu-button {
        display: inline-flex;
        position: fixed;
        top: var(--space-3);
        left: var(--space-3);
        z-index: 50;
        width: 36px;
        height: 36px;
        background: var(--color-bg-surface);
        border: 1px solid var(--color-border-default);
        border-radius: var(--radius-md);
        box-shadow: var(--shadow-subtle);
    }
    .main-content {
        margin-left: 0;
        padding: 60px var(--space-3) var(--space-6);
    }
    .stats-grid, .cards {
        grid-template-columns: 1fr;
    }
    .topbar {
        flex-direction: column;
        align-items: flex-start;
        gap: var(--space-3);
    }
    .topbar button {
        width: 100%;
    }
    .version-compare-controls {
        grid-template-columns: 1fr;
    }
    .version-comparison-panel {
        width: 100%;
        margin-right: 0;
        margin-bottom: var(--space-3);
    }
    .backup-controls button, .file-button {
        width: 100%;
    }
}
```

---

## 8. Implementation Blueprint & Verification Checklist

### 8.1 Execution Roadmap

1. **Step 1: CSS Clean Slate**:
   - Rewrite `public/css/style.css` from the ground up using the token system defined in Section 4.
   - Consolidate all 2,347 lines into a single, clean, 500–600 line stylesheet.
   - Guarantee 100% preservation of all existing class names (`.sidebar`, `.main-content`, `.topbar`, `.stat-card`, `.dashboard-section`, `.form-section`, `.status`, `.assignment-badge`, etc.).

2. **Step 2: HTML Emoji Elimination & Structure Normalization**:
   - Across all 11 HTML pages (`dashboard.html`, `projects.html`, `modules.html`, `changeRequests.html`, `approval.html`, `versions.html`, `releaseNotes.html`, `reports.html`, `auditLogs.html`, `search.html`, `login.html`):
     - Replace `⚙️ ConfigFlow` with `<span class="logo-mark"><svg ...>...</svg></span><span>ConfigFlow</span>`.
     - Remove unicode emojis from all navigation link texts (`🏠`, `📁`, `▦`, `🔄`, etc.).
     - Replace unicode characters in action buttons (`+ Add Project` → standard text or SVG).
     - Fix HTML anomalies (e.g. remove orphaned `<a href="versions.html">` in `versions.html:178`).

3. **Step 3: Client Script SVG Asset Integration**:
   - Update `public/js/sidebar.js`:
     - Update SVG paths dictionary to modern Lucide-style paths.
     - Replace `menuButton.textContent = "☰";` with an inline SVG hamburger icon.
     - Update `logo.innerHTML` and `statIcons` array with crisp SVG templates.
   - Update `public/js/changeRequests.js`:
     - Replace `📎 View File` with SVG paperclip icon + text.

4. **Step 4: Regression Testing & DOM Verification**:
   - Start the Express server (`node app.js`).
   - Verify every endpoint and page load with zero 404s or console errors.
   - Verify that all forms, input fields, selects, tables, and modal triggers operate with zero functional regression.

---

## 9. Conclusion

By executing this design system architecture:
- ConfigFlow will shed all AI slop, neon gradients, ambient blobs, and unicode emojis.
- The UI will achieve the clean, dense, authoritative aesthetic of Stripe and Linear.
- Complete 100% DOM binding and functional integrity is guaranteed.
