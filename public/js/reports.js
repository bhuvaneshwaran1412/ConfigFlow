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
// START
// =================================

loadReportStats();

loadProjectReport();

loadVersionReport();