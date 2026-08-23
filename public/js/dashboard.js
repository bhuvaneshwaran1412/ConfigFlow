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

        console.error("Request Error:", error);

    }

}


// Load projects

async function loadProjects() {

    try {

        const response = await fetch(`/api/projects?user_id=${encodeURIComponent(user.id)}`);

        const projects = await response.json();

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

        console.error("Project Error:", error);

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


// Load everything

loadDashboard();

loadRecentRequests();

loadProjects();