const storedUser = localStorage.getItem("user");

if (!storedUser) {
    window.location.href = "login.html";
}

const user = JSON.parse(storedUser);
let availableVersions = [];

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";


// =================================
// LOAD VERSIONS
// =================================

async function loadVersions() {

    try {

        const response =
            await fetch("/api/versions");

        const versions =
            await response.json();

        availableVersions = versions;

        const table =
            document.getElementById("versionsTable");

        table.innerHTML = "";

        document.getElementById("versionCount").textContent =
            `${versions.length} Versions`;


        if (versions.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="5">
                        No versions found
                    </td>
                </tr>
            `;

            return;
        }


        versions.forEach(version => {

            const row =
                document.createElement("tr");

            row.innerHTML = `

                <td>${version.id}</td>

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

        populateVersionSelects(versions);

    }

    catch (error) {

        console.error(
            "Version loading error:",
            error
        );

    }

}

function populateVersionSelects(versions) {
    ["olderVersion", "newerVersion"].forEach(selectId => {
        const select = document.getElementById(selectId);

        versions.forEach(version => {
            const option = document.createElement("option");
            option.value = version.id;
            option.textContent = `${version.version} - ${version.project_name || "Project"}`;
            select.appendChild(option);
        });
    });
}

function compareVersions() {
    const olderId = document.getElementById("olderVersion").value;
    const newerId = document.getElementById("newerVersion").value;
    const result = document.getElementById("versionComparison");

    if (!olderId || !newerId) {
        result.textContent = "Select two versions to compare their release details.";
        return;
    }

    if (olderId === newerId) {
        result.textContent = "Choose two different versions.";
        return;
    }

    const older = availableVersions.find(version => String(version.id) === olderId);
    const newer = availableVersions.find(version => String(version.id) === newerId);

    result.replaceChildren();

    [older, newer].forEach((version, index) => {
        const panel = document.createElement("div");
        panel.className = "version-comparison-panel";

        const heading = document.createElement("h3");
        heading.textContent = index === 0 ? "Older version" : "Newer version";

        const versionName = document.createElement("strong");
        versionName.textContent = version.version || "Version";

        const details = document.createElement("p");
        details.textContent = `${version.project_name || "Project"} | ${version.description || "No description"} | ${version.release_date ? new Date(version.release_date).toLocaleDateString() : "No release date"}`;

        panel.append(heading, versionName, details);
        result.appendChild(panel);
    });
}


// =================================
// LOAD RELEASE NOTES
// =================================

async function loadReleaseNotes() {

    try {

        const response =
            await fetch("/api/release-notes");

        const notes =
            await response.json();

        const container =
            document.getElementById(
                "releaseNotesContainer"
            );

        container.innerHTML = "";


        if (notes.length === 0) {

            container.innerHTML = `
                <p>No release notes found.</p>
            `;

            return;
        }


        notes.forEach(note => {

            const card =
                document.createElement("div");

            card.className =
                "release-note-card";


            card.innerHTML = `

                <h3>
                    ${note.version || "Version"}
                </h3>

                <p>
                    ${note.notes || "-"}
                </p>

            `;


            container.appendChild(card);

        });

    }

    catch (error) {

        console.error(
            "Release notes error:",
            error
        );

    }

}


// =================================
// START
// =================================

loadVersions();

document
    .getElementById("compareVersionsButton")
    .addEventListener("click", compareVersions);

loadReleaseNotes();