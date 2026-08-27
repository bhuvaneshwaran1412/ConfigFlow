const storedUser =
    localStorage.getItem("user");


if (!storedUser) {

    window.location.href =
        "login.html";

}


const user =
    JSON.parse(storedUser);


// =================================
// USER DETAILS
// =================================

document.getElementById(
    "sidebarUserName"
).textContent =
    user.name || "User";


document.getElementById(
    "sidebarUserRole"
).textContent =
    user.role || "User";


// =================================
// LOAD REPORT STATISTICS
// =================================

async function loadReportStats() {

    try {

        const response =
            await fetch(
                "/api/reports/stats"
            );


        const result =
            await response.json();


        if (!response.ok) {

            throw new Error(
                result.message ||
                "Failed to load report statistics"
            );

        }


        const data =
            result.data;


        document.getElementById(
            "totalRequests"
        ).textContent =
            data.totalRequests || 0;


        document.getElementById(
            "pendingRequests"
        ).textContent =
            data.pendingRequests || 0;


        document.getElementById(
            "approvedRequests"
        ).textContent =
            data.approvedRequests || 0;


        document.getElementById(
            "rejectedRequests"
        ).textContent =
            data.rejectedRequests || 0;


        document.getElementById(
            "totalVersions"
        ).textContent =
            data.totalVersions || 0;


        document.getElementById(
            "totalProjects"
        ).textContent =
            data.totalProjects || 0;

    }

    catch (error) {

        console.error(
            "Report statistics error:",
            error
        );

    }

}


// =================================
// LOAD PROJECT REPORT
// =================================

async function loadProjectReport() {

    try {

        const response =
            await fetch(
                "/api/reports/projects"
            );


        const projects =
            await response.json();


        const table =
            document.getElementById(
                "projectReportTable"
            );


        table.innerHTML = "";


        if (projects.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        No project data found
                    </td>
                </tr>
            `;

            return;

        }


        projects.forEach(project => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${project.id}
                </td>

                <td>
                    <strong>
                        ${project.project_name}
                    </strong>
                </td>

                <td>
                    ${project.current_version || "-"}
                </td>

                <td>
                    ${project.total_requests}
                </td>

            `;


            table.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Project report error:",
            error
        );

    }

}


// =================================
// LOAD VERSION REPORT
// =================================

async function loadVersionReport() {

    try {

        const response =
            await fetch(
                "/api/reports/versions"
            );


        const versions =
            await response.json();


        const table =
            document.getElementById(
                "versionReportTable"
            );


        table.innerHTML = "";


        if (versions.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        No version data found
                    </td>
                </tr>
            `;

            return;

        }


        versions.forEach(version => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${version.id}
                </td>

                <td>
                    ${version.project_name || "-"}
                </td>

                <td>
                    <strong>
                        ${version.version}
                    </strong>
                </td>

                <td>
                    ${version.description || "-"}
                </td>

                <td>
                    ${
                        version.release_date
                        ? new Date(
                            version.release_date
                          ).toLocaleDateString()
                        : "-"
                    }
                </td>

            `;


            table.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Version report error:",
            error
        );

    }

}


// =================================
// VISUAL CHARTS (FEATURE 3)
// =================================

let trendsChartInstance = null;
let moduleChartInstance = null;

async function loadReportCharts() {
    try {
        const response = await fetch("/api/reports/analytics");
        const json = await response.json();
        if (!response.ok || !json.success) return;

        const { trends, modules } = json.data;

        // 1. Trends Line Chart (Velocity)
        const trendsCtx = document.getElementById("trendsLineChart");
        if (trendsCtx && typeof Chart !== "undefined") {
            if (trendsChartInstance) trendsChartInstance.destroy();

            const labels = (trends && trends.length > 0)
                ? trends.map(t => t.period)
                : ['Current Period'];
            const totalData = (trends && trends.length > 0)
                ? trends.map(t => Number(t.total) || 0)
                : [0];
            const approvedData = (trends && trends.length > 0)
                ? trends.map(t => Number(t.approved) || 0)
                : [0];

            trendsChartInstance = new Chart(trendsCtx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Submitted Requests',
                            data: totalData,
                            borderColor: '#3b82f6',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            borderWidth: 2,
                            fill: true,
                            tension: 0.3,
                            pointRadius: 4,
                            pointBackgroundColor: '#3b82f6'
                        },
                        {
                            label: 'Approved & Released',
                            data: approvedData,
                            borderColor: '#10b981',
                            backgroundColor: 'transparent',
                            borderWidth: 2,
                            tension: 0.3,
                            pointRadius: 4,
                            pointBackgroundColor: '#10b981'
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                            labels: { color: '#a1a1aa', font: { family: 'inherit', size: 11 }, boxWidth: 12 }
                        }
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

        // 2. Module Activity Horizontal Bar Chart
        const moduleCtx = document.getElementById("moduleBarChart");
        if (moduleCtx && typeof Chart !== "undefined") {
            if (moduleChartInstance) moduleChartInstance.destroy();

            const modLabels = (modules && modules.length > 0)
                ? modules.map(m => m.module_name)
                : ['No modules yet'];
            const modData = (modules && modules.length > 0)
                ? modules.map(m => Number(m.total_changes) || 0)
                : [0];

            moduleChartInstance = new Chart(moduleCtx, {
                type: 'bar',
                data: {
                    labels: modLabels,
                    datasets: [{
                        label: 'Change Volume',
                        data: modData,
                        backgroundColor: '#6366f1',
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    indexAxis: 'y',
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false }
                    },
                    scales: {
                        x: {
                            grid: { color: '#1f1f22' },
                            ticks: { color: '#71717a', precision: 0, font: { family: 'inherit', size: 11 } }
                        },
                        y: {
                            grid: { display: false },
                            ticks: { color: '#ededed', font: { family: 'inherit', size: 11 } }
                        }
                    }
                }
            });
        }
    } catch (err) {
        console.error("Report charts error:", err);
    }
}


// =================================
// START
// =================================

loadReportStats();

loadReportCharts();

loadProjectReport();

loadVersionReport();