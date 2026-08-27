/**
 * ConfigFlow SVG Icon System
 * Standardized 24x24 viewBox Heroicons / Lucide SVG icons.
 * Provides unified, accessible icon rendering across all views and scripts.
 */

(function (root, factory) {
    if (typeof define === "function" && define.amd) {
        define([], factory);
    } else if (typeof module === "object" && module.exports) {
        module.exports = factory();
    } else {
        const exports = factory();
        root.renderIcon = exports.renderIcon;
        root.ICONS = exports.ICONS;
        root.ConfigFlowIcons = exports;
    }
})(typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : this, function () {
    "use strict";

    const ICONS = {
        // Navigation & Entity Icons
        dashboard: "<rect width=\"7\" height=\"9\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"9\" x=\"14\" y=\"12\" rx=\"1\"/><rect width=\"7\" height=\"5\" x=\"3\" y=\"16\" rx=\"1\"/>",
        projects: "<path d=\"M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z\"/>",
        modules: "<rect width=\"7\" height=\"7\" x=\"3\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"3\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"14\" y=\"14\" rx=\"1\"/><rect width=\"7\" height=\"7\" x=\"3\" y=\"14\" rx=\"1\"/>",
        changeRequests: "<path d=\"m16 3 4 4-4 4\"/><path d=\"M20 7H4\"/><path d=\"m8 21-4-4 4-4\"/><path d=\"M4 17h16\"/>",
        approvals: "<path d=\"m9 12 2 2 4-4\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
        versions: "<path d=\"M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z\"/><circle cx=\"7\" cy=\"7\" r=\"1\"/>",
        releaseNotes: "<path d=\"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z\"/><polyline points=\"14 2 14 8 20 8\"/><line x1=\"16\" x2=\"8\" y1=\"13\" y2=\"13\"/><line x1=\"16\" x2=\"8\" y1=\"17\" y2=\"17\"/><line x1=\"10\" x2=\"8\" y1=\"9\" y2=\"9\"/>",
        reports: "<line x1=\"12\" x2=\"12\" y1=\"20\" y2=\"10\"/><line x1=\"18\" x2=\"18\" y1=\"20\" y2=\"4\"/><line x1=\"6\" x2=\"6\" y1=\"20\" y2=\"16\"/><line x1=\"3\" x2=\"21\" y1=\"20\" y2=\"20\"/>",
        auditLogs: "<path d=\"M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2\"/><rect width=\"8\" height=\"4\" x=\"8\" y=\"2\" rx=\"1\"/><path d=\"M9 12h6\"/><path d=\"M9 16h6\"/>",
        search: "<circle cx=\"11\" cy=\"11\" r=\"8\"/><line x1=\"21\" x2=\"16.65\" y1=\"21\" y2=\"16.65\"/>",

        // Action & UI Controls
        paperclip: "<path d=\"m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48\"/>",
        file: "<path d=\"M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z\"/><polyline points=\"14 2 14 8 20 8\"/>",
        menu: "<line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\"/><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\"/><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\"/>",
        close: "<line x1=\"18\" x2=\"6\" y1=\"6\" y2=\"18\"/><line x1=\"6\" x2=\"18\" y1=\"6\" y2=\"18\"/>",
        "x-circle": "<circle cx=\"12\" cy=\"12\" r=\"10\"/><path d=\"m15 9-6 6\"/><path d=\"m9 9 6 6\"/>",
        settings: "<path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
        users: "<path d=\"M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2\"/><circle cx=\"9\" cy=\"7\" r=\"4\"/><path d=\"M22 21v-2a4 4 0 0 0-3-3.87\"/><path d=\"M16 3.13a4 4 0 0 1 0 7.75\"/>",
        user: "<path d=\"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2\"/><circle cx=\"12\" cy=\"7\" r=\"4\"/>",
        clock: "<circle cx=\"12\" cy=\"12\" r=\"10\"/><polyline points=\"12 6 12 12 16 14\"/>",
        check: "<polyline points=\"20 6 9 17 4 12\"/>",
        "check-circle": "<path d=\"m9 12 2 2 4-4\"/><circle cx=\"12\" cy=\"12\" r=\"10\"/>",
        alert: "<path d=\"m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z\"/><line x1=\"12\" x2=\"12\" y1=\"9\" y2=\"13\"/><line x1=\"12\" x2=\"12.01\" y1=\"17\" y2=\"17\"/>",
        logout: "<path d=\"M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4\"/><polyline points=\"16 17 21 12 16 7\"/><line x1=\"21\" x2=\"9\" y1=\"12\" y2=\"12\"/>",
        download: "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"7 10 12 15 17 10\"/><line x1=\"12\" x2=\"12\" y1=\"15\" y2=\"3\"/>",
        upload: "<path d=\"M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4\"/><polyline points=\"17 8 12 3 7 8\"/><line x1=\"12\" x2=\"12\" y1=\"3\" y2=\"15\"/>",
        plus: "<line x1=\"12\" x2=\"12\" y1=\"5\" y2=\"19\"/><line x1=\"5\" x2=\"19\" y1=\"12\" y2=\"12\"/>",
        edit: "<path d=\"M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z\"/><path d=\"m15 5 4 4\"/>",
        trash: "<path d=\"M3 6h18\"/><path d=\"M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6\"/><path d=\"M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2\"/><line x1=\"10\" x2=\"10\" y1=\"11\" y2=\"17\"/><line x1=\"14\" x2=\"14\" y1=\"11\" y2=\"17\"/>",
        lock: "<rect width=\"18\" height=\"11\" x=\"3\" y=\"11\" rx=\"2\" ry=\"2\"/><path d=\"M7 11V7a5 5 0 0 1 10 0v4\"/>",
        eye: "<path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/>",
        "eye-off": "<path d=\"M9.88 9.88a3 3 0 1 0 4.24 4.24\"/><path d=\"M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68\"/><path d=\"M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61\"/><line x1=\"2\" x2=\"22\" y1=\"2\" y2=\"22\"/>",
        brand: "<path d=\"M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5\"/>",
        rocket: "<path d=\"M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z\"/><path d=\"m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z\"/><line x1=\"9\" x2=\"9\" y1=\"22\" y2=\"22\"/>",
        filter: "<polygon points=\"22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3\"/>",
        refresh: "<path d=\"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8\"/><path d=\"M21 3v5h-5\"/><path d=\"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16\"/><path d=\"M8 16H3v5\"/>"
    };

    const ALIASES = {
        // Dashboard
        "dashboard.html": "dashboard",
        "layout-dashboard": "dashboard",
        "home": "dashboard",

        // Projects
        "projects.html": "projects",
        "project": "projects",
        "folder": "projects",
        "folder-git-2": "projects",
        "folder-kanban": "projects",

        // Modules
        "modules.html": "modules",
        "module": "modules",
        "boxes": "modules",
        "box": "modules",
        "cube": "modules",
        "component": "modules",

        // Change Requests
        "changerequests.html": "changeRequests",
        "changerequests": "changeRequests",
        "change-requests": "changeRequests",
        "change-request": "changeRequests",
        "changerequest": "changeRequests",
        "git-pull-request": "changeRequests",
        "pull-request": "changeRequests",
        "changes": "changeRequests",

        // Approvals
        "approval.html": "approvals",
        "approvals.html": "approvals",
        "approval": "approvals",
        "badge-check": "approvals",

        // Versions
        "versions.html": "versions",
        "version": "versions",
        "tag": "versions",
        "milestone": "versions",
        "git-commit": "versions",

        // Release Notes
        "releasenotes.html": "releaseNotes",
        "releasenotes": "releaseNotes",
        "release-notes": "releaseNotes",
        "releasenote": "releaseNotes",
        "release-note": "releaseNotes",
        "file-text": "releaseNotes",
        "scroll": "releaseNotes",
        "scroll-text": "releaseNotes",

        // Reports
        "reports.html": "reports",
        "report": "reports",
        "bar-chart-3": "reports",
        "bar-chart": "reports",
        "chart": "reports",
        "analytics": "reports",

        // Audit Logs
        "auditlogs.html": "auditLogs",
        "auditlogs": "auditLogs",
        "audit-logs": "auditLogs",
        "auditlog": "auditLogs",
        "audit-log": "auditLogs",
        "clipboard-list": "auditLogs",
        "shield-alert": "auditLogs",
        "audit": "auditLogs",
        "history": "auditLogs",

        // Search
        "search.html": "search",
        "magnifying-glass": "search",
        "find": "search",

        // Action icons
        "attachment": "paperclip",
        "file-attachment": "paperclip",
        "clip": "paperclip",
        "document": "file",
        "hamburger": "menu",
        "menu-lines": "menu",
        "x": "close",
        "times": "close",
        "cancel": "close",
        "reject": "x-circle",
        "rejected": "x-circle",
        "gear": "settings",
        "cog": "settings",
        "sliders": "settings",
        "user-group": "users",
        "developers": "users",
        "team": "users",
        "person": "user",
        "profile": "user",
        "avatar": "user",
        "time": "clock",
        "hourglass": "clock",
        "pending": "clock",
        "tick": "check",
        "done": "check",
        "approve": "check-circle",
        "approved": "check-circle",
        "success": "check-circle",
        "warning": "alert",
        "triangle-alert": "alert",
        "warn": "alert",
        "log-out": "logout",
        "sign-out": "logout",
        "export": "download",
        "restore": "upload",
        "import": "upload",
        "add": "plus",
        "create": "plus",
        "new": "plus",
        "pencil": "edit",
        "modify": "edit",
        "trash-2": "trash",
        "delete": "trash",
        "remove": "trash",
        "security": "lock",
        "view": "eye",
        "show": "eye",
        "hide": "eye-off",
        "logo": "brand",
        "layers": "brand",
        "configflow": "brand",
        "sync": "refresh"
    };

    function resolveIconKey(rawName) {
        if (!rawName || typeof rawName !== "string") return "";
        const clean = rawName.trim();
        if (ICONS[clean]) return clean;

        const lower = clean.toLowerCase();
        if (ALIASES[lower]) return ALIASES[lower];
        if (ICONS[lower]) return lower;

        // Try removing .html extension
        const withoutExt = lower.replace(/\.html$/, "");
        if (ALIASES[withoutExt]) return ALIASES[withoutExt];
        if (ICONS[withoutExt]) return withoutExt;

        // Try converting camelCase to kebab-case
        const kebab = clean.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
        if (ALIASES[kebab]) return ALIASES[kebab];
        if (ICONS[kebab]) return kebab;

        // Try stripping non-alphanumeric
        const stripped = lower.replace(/[^a-z0-9]/g, "");
        if (ALIASES[stripped]) return ALIASES[stripped];
        if (ICONS[stripped]) return stripped;

        return lower;
    }

    function escapeAttr(str) {
        if (typeof str !== "string") str = String(str);
        return str
            .replace(/&/g, "&amp;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    /**
     * Render an accessible SVG icon string.
     * @param {string} name - Icon name or alias (e.g. 'dashboard', 'paperclip', 'plus', 'projects.html')
     * @param {string} [className] - Optional CSS class names
     * @param {number|string} [size] - Optional width and height dimension (e.g. 16, 18, 20, 24)
     * @returns {string} SVG HTML markup string
     */
    function renderIcon(name, className, size) {
        if (!name) return "";
        const key = resolveIconKey(name);
        const pathContent = ICONS[key] || "";
        if (!pathContent) {
            return "";
        }
        const clsAttr = className ? ` class="${escapeAttr(className)}"` : "";
        const sizeAttr = (size !== undefined && size !== null && size !== "")
            ? ` width="${escapeAttr(size)}" height="${escapeAttr(size)}"`
            : "";
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"${sizeAttr} fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${clsAttr} aria-hidden="true">${pathContent}</svg>`;
    }

    return {
        ICONS,
        ALIASES,
        resolveIconKey,
        renderIcon
    };
});
