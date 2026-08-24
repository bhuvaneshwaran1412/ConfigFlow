const sidebarStoredUser = localStorage.getItem("user");

if (!sidebarStoredUser) {
    window.location.href = "login.html";
} else {
    const user = JSON.parse(sidebarStoredUser);
    const userName = document.getElementById("sidebarUserName");
    const userRole = document.getElementById("sidebarUserRole");

    if (userName) userName.textContent = user.name || "User";
    if (userRole) userRole.textContent = user.role || "User";

    const icons = {
        "dashboard.html": "<path d='m4 11 8-7 8 7'/><path d='M6 10v9h12v-9'/><path d='M10 19v-5h4v5'/>",
        "projects.html": "<path d='M3 7h7l2 2h9v9H3z'/><path d='M3 7V5h7l2 2'/>",
        "modules.html": "<rect x='4' y='4' width='6' height='6'/><rect x='14' y='4' width='6' height='6'/><rect x='4' y='14' width='6' height='6'/><rect x='14' y='14' width='6' height='6'/>",
        "changeRequests.html": "<path d='M4 5h16v12H8l-4 3z'/><path d='M8 9h8M8 13h5'/>",
        "approval.html": "<path d='m5 12 4 4L19 6'/><circle cx='12' cy='12' r='9'/>",
        "versions.html": "<path d='M4 5h16v14H4z'/><path d='M8 9h8M8 13h5'/>",
        "releaseNotes.html": "<path d='M6 3h9l3 3v15H6z'/><path d='M15 3v4h4M9 12h6M9 16h6'/>",
        "reports.html": "<path d='M5 19V9M12 19V5M19 19v-8'/><path d='M3 19h18'/>",
        "auditLogs.html": "<path d='M5 4h14v16H5z'/><path d='M8 8h8M8 12h8M8 16h5'/>",
        "search.html": "<circle cx='10.5' cy='10.5' r='6.5'/><path d='m16 16 5 5'/>",
    };

    const logo = document.querySelector(".logo");
    if (logo) logo.innerHTML = "<span class='logo-mark'>CF</span><span>ConfigFlow<small class='logo-subtitle'>Control workspace</small></span>";

    const navigationLinks = Array.from(document.querySelectorAll(".sidebar nav a"));
    navigationLinks.forEach(link => {
        const page = link.getAttribute("href").split("/").pop();
        const label = link.textContent.trim().replace(/^[^A-Za-z]+/, "");
        link.innerHTML = `<span class='nav-icon' aria-hidden='true'><svg viewBox='0 0 24 24'>${icons[page] || ""}</svg></span><span>${label}</span>`;
        link.title = label;
        link.addEventListener("click", closeMobileMenu);
    });

    if (navigationLinks.length > 0) {
        navigationLinks[0].insertAdjacentHTML("beforebegin", "<div class='nav-section-label'>Workspace</div>");
        if (navigationLinks[4]) {
            navigationLinks[4].insertAdjacentHTML("beforebegin", "<div class='nav-section-label'>Management</div>");
        }
    }

    const statIcons = [
        "<path d='M3 7h7l2 2h9v9H3z'/><path d='M3 7V5h7l2 2'/>",
        "<circle cx='9' cy='8' r='3'/><path d='M3 20c0-3 2-5 6-5s6 2 6 5M17 11a3 3 0 0 0 0-6M18 15c2 .5 3 2 3 5'/>",
        "<path d='M12 7v5l3 2'/><circle cx='12' cy='12' r='9'/>",
        "<path d='m5 12 4 4L19 6'/><circle cx='12' cy='12' r='9'/>",
        "<path d='m7 7 10 10M17 7 7 17'/><circle cx='12' cy='12' r='9'/>",
        "<path d='M4 5h16v14H4z'/><path d='M8 9h8M8 13h5'/>",
    ];
    document.querySelectorAll(".stat-icon").forEach((icon, index) => {
        icon.innerHTML = `<svg viewBox='0 0 24 24' aria-hidden='true'>${statIcons[index] || ""}</svg>`;
    });

    const sidebar = document.querySelector(".sidebar");
    if (sidebar) {
        const menuButton = document.createElement("button");
        menuButton.className = "mobile-menu-button";
        menuButton.type = "button";
        menuButton.setAttribute("aria-label", "Open navigation menu");
        menuButton.textContent = "☰";
        menuButton.addEventListener("click", toggleMobileMenu);
        document.body.appendChild(menuButton);

        const overlay = document.createElement("div");
        overlay.className = "sidebar-overlay";
        overlay.addEventListener("click", closeMobileMenu);
        document.body.appendChild(overlay);

        const logoutButton = document.createElement("button");
        logoutButton.className = "sidebar-logout";
        logoutButton.type = "button";
        logoutButton.textContent = "Log out";
        logoutButton.addEventListener("click", () => window.logout());
        document.querySelector(".sidebar-user")?.appendChild(logoutButton);
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
        await fetch("/api/logout", { method: "POST" });
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