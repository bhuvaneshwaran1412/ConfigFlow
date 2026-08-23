const storedUser = localStorage.getItem("user");

if (!storedUser) {
    window.location.href = "login.html";
}

const user = JSON.parse(storedUser);
let assignableUsers = [];

if (user.role === "Admin") {
    document.getElementById("addProjectButton").hidden = false;
    document.getElementById("projectFormSection").hidden = false;
}

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";


// ==========================
// LOAD PROJECTS
// ==========================

async function loadProjects() {

    try {

        const response = await fetch(`/api/projects?user_id=${encodeURIComponent(user.id)}`);

        const projects = await response.json();

        const table = document.getElementById("projectsTable");

        table.innerHTML = "";

        document.getElementById("projectCount").textContent =
            `${projects.length} Projects`;

        if (projects.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        ${user.role === "Manager"
                            ? "No projects assigned. Ask an Admin to assign a project."
                            : user.role === "Developer"
                                ? "No projects assigned. Ask a Manager to add you to a project."
                                : "No projects found"}
                    </td>
                </tr>
            `;

            return;
        }

        projects.forEach(project => {

            const row = document.createElement("tr");
            if (Number(project.is_assigned) === 1) {
                row.className = "assigned-project-row";
            }

            const assignmentStatus = Number(project.is_assigned) === 1
                ? "Assigned"
                : "Not assigned";

            const actions = user.role === "Admin"
                ? `
                    <button class="edit-btn" onclick='editProject(${JSON.stringify(project)})'>Edit</button>
                    <button class="delete-btn" onclick="deleteProject(${project.id})">Delete</button>
                    <div class="assignment-control">
                        <select id="manager-${project.id}">
                            ${assignmentOptions("Manager", project.project_manager_id)}
                        </select>
                        <button class="add-btn" onclick="assignManager(${project.id})">Assign Manager</button>
                    </div>
                `
                : user.role === "Manager" && Number(project.is_assigned) === 1
                    ? `
                        <div class="assignment-control">
                            <select id="developer-${project.id}">
                                ${assignmentOptions("Developer")}
                            </select>
                            <button class="add-btn" onclick="assignDeveloper(${project.id})">Add Developer</button>
                        </div>
                    `
                    : "View only";

            row.innerHTML = `
                <td>${project.id}</td>

                <td>
                    <strong>${project.project_name}</strong>
                </td>

                <td>
                    ${project.description || "-"}
                </td>

                <td>
                    ${project.current_version || "-"}
                </td>

                <td>
                    <span class="assignment-badge ${Number(project.is_assigned) === 1 ? "assigned" : "not-assigned"}">
                        ${assignmentStatus}
                    </span>
                </td>

                <td>

                    ${actions}

                </td>
            `;

            table.appendChild(row);

        });

    }

    catch (error) {

        console.error("Project loading error:", error);

    }

}

function assignmentOptions(role, selectedId) {
    const options = assignableUsers
        .filter(assignableUser => assignableUser.role === role || !assignableUser.role)
        .map(assignableUser => `
            <option value="${assignableUser.id}" ${String(assignableUser.id) === String(selectedId) ? "selected" : ""}>
                ${assignableUser.name} (${assignableUser.employee_id || assignableUser.email})
            </option>
        `)
        .join("");

    return `<option value="">Select ${role}</option>${options}`;
}

async function loadAssignableUsers() {
    if (user.role !== "Admin" && user.role !== "Manager") {
        return;
    }

    const response = await fetch(`/api/users/assignable?user_id=${encodeURIComponent(user.id)}`);
    if (response.ok) {
        assignableUsers = await response.json();
        assignableUsers.forEach(assignableUser => {
            assignableUser.role = user.role === "Admin" ? "Manager" : "Developer";
        });
    }
}

async function assignManager(projectId) {
    const managerId = document.getElementById(`manager-${projectId}`).value;
    if (!managerId) {
        alert("Select a Manager first");
        return;
    }

    try {
        const response = await fetch(`/api/projects/${projectId}/manager`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ manager_id: managerId, assigned_by: user.id })
        });
        const result = await response.json();
        alert(result.message || result.sqlMessage || "Manager assignment failed");
        if (response.ok) loadProjects();
    } catch (error) {
        alert("Manager assignment failed. Check that the assignment database migration was run.");
    }
}

async function assignDeveloper(projectId) {
    const developerId = document.getElementById(`developer-${projectId}`).value;
    if (!developerId) return;

    const response = await fetch(`/api/projects/${projectId}/developers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ developer_id: developerId, assigned_by: user.id })
    });
    const result = await response.json();
    alert(result.message);
}


// ==========================
// OPEN FORM
// ==========================

function openProjectForm() {

    if (user.role !== "Admin") {
        return;
    }

    document.getElementById("projectFormSection").style.display =
        "block";

    document.getElementById("formTitle").textContent =
        "Add Project";

}


// ==========================
// CLOSE FORM
// ==========================

function closeProjectForm() {

    document.getElementById("projectFormSection").style.display =
        "none";

    document.getElementById("projectId").value = "";

    document.getElementById("projectName").value = "";

    document.getElementById("projectDescription").value = "";

    document.getElementById("currentVersion").value = "";

}


// ==========================
// SAVE PROJECT
// ==========================

async function saveProject() {

    if (user.role !== "Admin") {
        alert("Only Admin users can create projects");
        return;
    }

    const id =
        document.getElementById("projectId").value;

    const project_name =
        document.getElementById("projectName").value;

    const description =
        document.getElementById("projectDescription").value;

    const current_version =
        document.getElementById("currentVersion").value;


    if (!project_name) {

        alert("Please enter project name");

        return;

    }


    const projectData = {

        project_name,
        description,
        current_version,
        created_by: user.id

    };


    try {

        let url = "/api/projects";

        let method = "POST";


        if (id) {

            url = `/api/projects/${id}`;

            method = "PUT";

        }


        const response = await fetch(url, {

            method: method,

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(projectData)

        });


        const data = await response.json();

        console.log(data);


        alert(
            id
                ? "Project Updated Successfully"
                : "Project Added Successfully"
        );


        closeProjectForm();

        loadProjects();

    }

    catch (error) {

        console.error("Save project error:", error);

        alert("Something went wrong");

    }

}


// ==========================
// EDIT PROJECT
// ==========================

function editProject(project) {

    document.getElementById("projectFormSection").style.display =
        "block";

    document.getElementById("formTitle").textContent =
        "Edit Project";


    document.getElementById("projectId").value =
        project.id;

    document.getElementById("projectName").value =
        project.project_name;

    document.getElementById("projectDescription").value =
        project.description || "";

    document.getElementById("currentVersion").value =
        project.current_version || "";

}


// ==========================
// DELETE PROJECT
// ==========================

async function deleteProject(id) {

    if (!confirm("Are you sure you want to delete this project?")) {

        return;

    }


    try {

        const response = await fetch(
            `/api/projects/${id}`,
            {
                method: "DELETE"
            }
        );


        const data = await response.json();

        console.log(data);


        alert("Project Deleted Successfully");

        loadProjects();

    }

    catch (error) {

        console.error("Delete error:", error);

        alert("Something went wrong");

    }

}


// LOAD PROJECTS WHEN PAGE OPENS

loadAssignableUsers().then(loadProjects);