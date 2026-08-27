const sidebarStoredUser = localStorage.getItem("user");

if (!sidebarStoredUser) {
    window.location.href = "login.html";
} else {
    const user = JSON.parse(sidebarStoredUser);
    const userName = document.getElementById("sidebarUserName");
    const userRole = document.getElementById("sidebarUserRole");

    if (userName) userName.textContent = user.name || "User";
    if (userRole) userRole.textContent = user.role || "User";

    const fallbackNavIcons = {
        "dashboard.html": "<rect width='7' height='9' x='3' y='3' rx='1'/><rect width='7' height='5' x='14' y='3' rx='1'/><rect width='7' height='9' x='14' y='12' rx='1'/><rect width='7' height='5' x='3' y='16' rx='1'/>",
        "projects.html": "<path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'/>",
        "modules.html": "<rect width='7' height='7' x='3' y='3' rx='1'/><rect width='7' height='7' x='14' y='3' rx='1'/><rect width='7' height='7' x='14' y='14' rx='1'/><rect width='7' height='7' x='3' y='14' rx='1'/>",
        "changeRequests.html": "<path d='m16 3 4 4-4 4'/><path d='M20 7H4'/><path d='m8 21-4-4 4-4'/><path d='M4 17h16'/>",
        "approval.html": "<path d='m9 12 2 2 4-4'/><circle cx='12' cy='12' r='10'/>",
        "versions.html": "<path d='M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z'/><circle cx='7' cy='7' r='1'/>",
        "releaseNotes.html": "<path d='M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z'/><polyline points='14 2 14 8 20 8'/><line x1='16' x2='8' y1='13' y2='13'/><line x1='16' x2='8' y1='17' y2='17'/><line x1='10' x2='8' y1='9' y2='9'/>",
        "reports.html": "<line x1='12' x2='12' y1='20' y2='10'/><line x1='18' x2='18' y1='20' y2='4'/><line x1='6' x2='6' y1='20' y2='16'/><line x1='3' x2='21' y1='20' y2='20'/>",
        "auditLogs.html": "<path d='M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2'/><rect width='8' height='4' x='8' y='2' rx='1'/><path d='M9 12h6'/><path d='M9 16h6'/>",
        "search.html": "<circle cx='11' cy='11' r='8'/><line x1='21' x2='16.65' y1='21' y2='16.65'/>"
    };

    const navMetadata = {
        "dashboard.html": { key: "dashboard", label: "Dashboard" },
        "projects.html": { key: "projects", label: "Projects" },
        "modules.html": { key: "modules", label: "Modules" },
        "changeRequests.html": { key: "changeRequests", label: "Change Requests" },
        "approval.html": { key: "approvals", label: "Approvals" },
        "versions.html": { key: "versions", label: "Versions" },
        "releaseNotes.html": { key: "releaseNotes", label: "Release Notes" },
        "reports.html": { key: "reports", label: "Reports" },
        "auditLogs.html": { key: "auditLogs", label: "Audit Logs" },
        "search.html": { key: "search", label: "Search" }
    };

    const logo = document.querySelector(".logo");
    if (logo) {
        logo.innerHTML = "<span class='logo-mark'>CF</span><span>ConfigFlow<small class='logo-subtitle'>Control workspace</small></span>";
    }

    const currentPath = window.location.pathname.split("/").pop() || "dashboard.html";
    const navigationLinks = Array.from(document.querySelectorAll(".sidebar nav a"));

    navigationLinks.forEach(link => {
        const href = link.getAttribute("href") || "";
        const page = href.split("/").pop().split("?")[0];
        const meta = navMetadata[page];

        let label = meta ? meta.label : "";
        if (!label) {
            label = link.dataset.label || link.textContent.trim();
        }

        let iconSvg = "";
        if (typeof window.renderIcon === "function") {
            iconSvg = window.renderIcon(page, "nav-svg", 18);
        }
        if (!iconSvg) {
            const pathData = fallbackNavIcons[page] || "";
            iconSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='18' height='18' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>${pathData}</svg>`;
        }

        link.innerHTML = `<span class='nav-icon' aria-hidden='true'>${iconSvg}</span><span>${label}</span>`;
        link.title = label;

        if (page === currentPath) {
            link.classList.add("active");
        }

        link.removeEventListener("click", closeMobileMenu);
        link.addEventListener("click", closeMobileMenu);
    });

    if (navigationLinks.length > 0 && !document.querySelector(".nav-section-label")) {
        navigationLinks[0].insertAdjacentHTML("beforebegin", "<div class='nav-section-label'>Workspace</div>");
        if (navigationLinks[4]) {
            navigationLinks[4].insertAdjacentHTML("beforebegin", "<div class='nav-section-label'>Management</div>");
        }
    }

    const fallbackStatIcons = [
        "<path d='M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z'/>",
        "<path d='M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2'/><circle cx='9' cy='7' r='4'/><path d='M22 21v-2a4 4 0 0 0-3-3.87'/><path d='M16 3.13a4 4 0 0 1 0 7.75'/>",
        "<circle cx='12' cy='12' r='10'/><polyline points='12 6 12 12 16 14'/>",
        "<path d='m9 12 2 2 4-4'/><circle cx='12' cy='12' r='10'/>",
        "<circle cx='12' cy='12' r='10'/><path d='m15 9-6 6'/><path d='m9 9 6 6'/>",
        "<path d='M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z'/><circle cx='7' cy='7' r='1'/>"
    ];
    const statIconNames = ["projects", "users", "clock", "check-circle", "x-circle", "versions"];

    document.querySelectorAll(".stat-icon").forEach((icon, index) => {
        const iconName = icon.dataset.icon || statIconNames[index];
        let statSvg = "";
        if (iconName && typeof window.renderIcon === "function") {
            statSvg = window.renderIcon(iconName, "stat-svg", 20);
        }
        if (!statSvg) {
            const pathData = fallbackStatIcons[index] || "";
            statSvg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'>${pathData}</svg>`;
        }
        icon.innerHTML = statSvg;
    });

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        let menuButton = document.querySelector(".mobile-menu-button");
        if (!menuButton) {
            menuButton = document.createElement("button");
            menuButton.className = "mobile-menu-button";
            menuButton.type = "button";
            menuButton.setAttribute("aria-label", "Open navigation menu");
            document.body.appendChild(menuButton);
        }

        const menuIconSvg = typeof window.renderIcon === "function"
            ? window.renderIcon("menu", "mobile-menu-icon", 20)
            : "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' width='20' height='20' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' aria-hidden='true'><line x1='4' x2='20' y1='12' y2='12'/><line x1='4' x2='20' y1='6' y2='6'/><line x1='4' x2='20' y1='18' y2='18'/></svg>";
        menuButton.innerHTML = menuIconSvg;
        menuButton.removeEventListener("click", toggleMobileMenu);
        menuButton.addEventListener("click", toggleMobileMenu);

        let overlay = document.querySelector(".sidebar-overlay");
        if (!overlay) {
            overlay = document.createElement("div");
            overlay.className = "sidebar-overlay";
            document.body.appendChild(overlay);
        }
        overlay.removeEventListener("click", closeMobileMenu);
        overlay.addEventListener("click", closeMobileMenu);

        const userPanel = document.querySelector(".sidebar-user");
        if (userPanel && !userPanel.querySelector(".sidebar-logout")) {
            const logoutButton = document.createElement("button");
            logoutButton.className = "sidebar-logout";
            logoutButton.type = "button";
            logoutButton.textContent = "Log out";
            logoutButton.addEventListener("click", () => window.logout());
            userPanel.appendChild(logoutButton);
        }
    }
}

function toggleMobileMenu() {
    document.querySelector(".sidebar")?.classList.toggle("mobile-open");
    document.querySelector(".sidebar-overlay")?.classList.toggle("visible");
}

function closeMobileMenu() {
    document.querySelector(".sidebar")?.classList.remove("mobile-open");
    document.querySelector(".sidebar-overlay")?.classList.remove("visible");
}

if (typeof window.logout !== "function") {
    window.logout = async function () {
        try {
            await fetch("/api/logout", { method: "POST" });
        } catch (e) {
            // Ignore network errors during logout
        }
        localStorage.removeItem("user");
        window.location.href = "login.html";
    };
}

window.showToast = function (message, type = "info") {
    let region = document.querySelector(".toast-region");
    if (!region) {
        region = document.createElement("div");
        region.className = "toast-region";
        region.setAttribute("aria-live", "polite");
        document.body.appendChild(region);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.setAttribute("role", type === "error" ? "alert" : "status");
    toast.textContent = message;
    region.appendChild(toast);
    window.setTimeout(() => toast.remove(), 4200);
};
