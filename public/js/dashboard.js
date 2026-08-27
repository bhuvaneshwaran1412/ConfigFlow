const storedUser = localStorage.getItem("user");

if (!storedUser) {

    window.location.href = "login.html";

}

const user = JSON.parse(storedUser);

if (user.role === "Admin") {
    document.getElementById("backupSection").hidden = false;
}


// =================================
// DISPLAY USER
// =================================

document.getElementById(
    "sidebarUserName"
).textContent = user.name || "User";

document.getElementById(
    "sidebarUserRole"
).textContent = user.role || "User";

document.getElementById("welcomeMessage").textContent =
    `Welcome back, ${user.name || "User"}! Here's what's happening with your projects.`;


// Load dashboard statistics

async function loadDashboard() {

    try {

        const response = await fetch("/api/dashboard");

        const data = await response.json();

        document.getElementById("totalProjects").textContent =
            data.totalProjects || 0;

        document.getElementById("totalDevelopers").textContent =
            data.totalDevelopers || 0;

        document.getElementById("pendingRequests").textContent =
            data.pendingRequests || 0;

        document.getElementById("approvedRequests").textContent =
            data.approvedRequests || 0;

        document.getElementById("rejectedRequests").textContent =
            data.rejectedRequests || 0;

        document.getElementById("latestVersion").textContent =
            data.latestVersion || "-";

        const requestCounts = [
            data.pendingRequests || 0,
            data.approvedRequests || 0,
            data.rejectedRequests || 0
        ];
        const maximum = Math.max(...requestCounts, 1);
        const barIds = ["pendingBar", "approvedBar", "rejectedBar"];
        const valueIds = ["pendingBarValue", "approvedBarValue", "rejectedBarValue"];

        requestCounts.forEach((value, index) => {
            document.getElementById(barIds[index]).style.width =
                `${(value / maximum) * 100}%`;
            document.getElementById(valueIds[index]).textContent = value;
        });

        document.getElementById("dashboardNotification").textContent =
            data.pendingRequests > 0
                ? `${data.pendingRequests} change request${data.pendingRequests === 1 ? "" : "s"} waiting for review.`
                : "You are up to date. No requests are waiting for review.";

    }

    catch (error) {

        console.error("Dashboard Error:", error);

    }

}


// Load recent change requests

async function loadRecentRequests() {

    try {

        const response = await fetch(
            `/api/change-requests?user_id=${encodeURIComponent(user.id)}`
        );

        const requests = await response.json();
        if (!response.ok || !Array.isArray(requests)) {
            throw new Error(requests.message || "Unable to load recent requests");
        }

        const table = document.getElementById("recentRequests");

        table.innerHTML = "";

        const recent = requests.slice(0, 5);

        if (recent.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">No change requests found</td>
                </tr>
            `;

            return;
        }


        recent.forEach(request => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${request.title}</td>

                <td>${request.project_name}</td>

                <td>${request.priority}</td>

                <td>
                    <span class="status ${request.status.toLowerCase()}">
                        ${request.status}
                    </span>
                </td>
            `;

            table.appendChild(row);

        });

    }

    catch (error) {

        window.showToast?.(error.message, "error");

    }

}


// Load projects

async function loadProjects() {

    try {

        const response = await fetch(`/api/projects?user_id=${encodeURIComponent(user.id)}`);

        const projects = await response.json();
        if (!response.ok || !Array.isArray(projects)) {
            throw new Error(projects.message || "Unable to load projects");
        }

        const table = document.getElementById("projectSummary");

        table.innerHTML = "";

        if (projects.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="2">No projects found</td>
                </tr>
            `;

            return;
        }


        projects.slice(0, 5).forEach(project => {

            const row = document.createElement("tr");

            row.innerHTML = `
                <td>${project.project_name}</td>
                <td>${project.current_version || "-"}</td>
            `;

            table.appendChild(row);

        });

    }

    catch (error) {

        window.showToast?.(error.message, "error");

    }

}


// Logout

async function logout() {
    await fetch("/api/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

async function downloadBackup() {
    const message = document.getElementById("backupMessage");

    try {
        const response = await fetch(`/api/backup?user_id=${encodeURIComponent(user.id)}`);
        const backup = await response.json();

        if (!response.ok) {
            throw new Error(backup.message || "Backup failed");
        }

        const blob = new Blob([JSON.stringify(backup, null, 2)], {
            type: "application/json"
        });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "configflow-backup.json";
        link.click();
        URL.revokeObjectURL(link.href);
        message.textContent = "Backup downloaded successfully.";
    } catch (error) {
        message.textContent = error.message;
    }
}

async function restoreBackup() {
    const file = document.getElementById("backupFile").files[0];
    const message = document.getElementById("backupMessage");

    if (!file) {
        message.textContent = "Choose a backup file first.";
        return;
    }

    if (!window.confirm("Restore this backup? Existing ConfigFlow data will be replaced.")) {
        return;
    }

    try {
        const backup = JSON.parse(await file.text());
        const response = await fetch("/api/backup/restore", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id: user.id, backup })
        });
        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Restore failed");
        }

        message.textContent = result.message;
    } catch (error) {
        message.textContent = error.message === "Unexpected end of JSON input"
            ? "The selected file is not valid JSON."
            : error.message;
    }
}

document
    .getElementById("downloadBackupButton")
    .addEventListener("click", downloadBackup);

document
    .getElementById("restoreBackupButton")
    .addEventListener("click", restoreBackup);


// =================================
// VISUAL CHARTS (FEATURE 3)
// =================================

let statusChartInstance = null;
let impactChartInstance = null;

async function loadDashboardCharts() {
    try {
        const response = await fetch("/api/reports/analytics");
        const json = await response.json();
        if (!response.ok || !json.success) return;

        const { status, impact } = json.data;

        // 1. Status Doughnut Chart
        const statusCtx = document.getElementById("statusDonutChart");
        if (statusCtx && typeof Chart !== "undefined") {
            if (statusChartInstance) statusChartInstance.destroy();
            statusChartInstance = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Pending', 'Approved', 'Rejected'],
                    datasets: [{
                        data: [Number(status.pending) || 0, Number(status.approved) || 0, Number(status.rejected) || 0],
                        backgroundColor: ['#f59e0b', '#10b981', '#ef4444'],
                        borderWidth: 2,
                        borderColor: '#0a0a0a',
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: { color: '#a1a1aa', font: { family: 'inherit', size: 11 }, boxWidth: 12, padding: 14 }
                        }
                    },
                    cutout: '70%'
                }
            });
        }

        // 2. Impact Bar Chart
        const impactCtx = document.getElementById("impactBarChart");
        if (impactCtx && typeof Chart !== "undefined") {
            if (impactChartInstance) impactChartInstance.destroy();
            impactChartInstance = new Chart(impactCtx, {
                type: 'bar',
                data: {
                    labels: ['Patch', 'Minor', 'Major'],
                    datasets: [{
                        label: 'Change Requests',
                        data: [Number(impact.patch) || 0, Number(impact.minor) || 0, Number(impact.major) || 0],
                        backgroundColor: ['#3b82f6', '#10b981', '#ef4444'],
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { display: false },
                            ticks: { color: '#71717a', font: { family: 'inherit', size: 11 } }
                        },
                        y: {
                            grid: { color: '#1f1f22' },
                            ticks: { color: '#71717a', precision: 0, font: { family: 'inherit', size: 11 } }
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Dashboard charts error:", err);
    }
}


// Load everything

loadDashboard();

loadDashboardCharts();

loadRecentRequests();

loadProjects();