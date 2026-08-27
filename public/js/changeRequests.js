const storedUser = localStorage.getItem("user");

if (!storedUser) {

    window.location.href = "login.html";

}

const user = JSON.parse(storedUser);


// Display user

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";


// =================================
// LOAD PROJECTS
// =================================

async function loadProjects() {

    try {

        const response =
            await fetch(`/api/projects?user_id=${encodeURIComponent(user.id)}`);

        const projects =
            await response.json();

        const select =
            document.getElementById("projectId");

        select.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;


        projects
            .filter(project => user.role === "Admin" || Number(project.is_assigned) === 1)
            .forEach(project => {

            const option =
                document.createElement("option");

            option.value = project.id;

            option.textContent =
                project.project_name;

            select.appendChild(option);

            });

    }

    catch (error) {

        console.error(
            "Project loading error:",
            error
        );

    }

}


// =================================
// LOAD MODULES FOR SELECTED PROJECT
// =================================

document
    .getElementById("projectId")
    .addEventListener(
        "change",
        loadModules
    );


async function loadModules() {

    const projectId =
        document.getElementById("projectId").value;

    const moduleSelect =
        document.getElementById("moduleId");


    moduleSelect.innerHTML = `
        <option value="">
            Select Module
        </option>
    `;


    if (!projectId) {

        return;

    }


    try {

        const response =
            await fetch("/api/modules");

        const modules =
            await response.json();


        const projectModules =
            modules.filter(
                module =>
                    String(module.project_id)
                    === String(projectId)
            );


        projectModules.forEach(module => {

            const option =
                document.createElement("option");

            option.value =
                module.id;

            option.textContent =
                module.module_name;

            moduleSelect.appendChild(option);

        });

    }

    catch (error) {

        console.error(
            "Module loading error:",
            error
        );

    }

}


// =================================
// OPEN FORM
// =================================

function openRequestForm() {

    document.getElementById(
        "requestFormSection"
    ).style.display = "block";

}


// =================================
// CLOSE FORM
// =================================

function closeRequestForm() {

    document.getElementById(
        "requestFormSection"
    ).style.display = "none";


    document.getElementById(
        "projectId"
    ).value = "";


    document.getElementById(
        "moduleId"
    ).innerHTML = `
        <option value="">
            Select Module
        </option>
    `;


    document.getElementById(
        "requestTitle"
    ).value = "";


    document.getElementById(
        "requestDescription"
    ).value = "";


    document.getElementById(
        "priority"
    ).value = "";

    document.getElementById(
    "attachment"
    ).value = "";

}


// =================================
// SUBMIT CHANGE REQUEST
// =================================

async function submitRequest() {

    const project_id =
        document.getElementById("projectId").value;

    const module_id =
        document.getElementById("moduleId").value;

    const title =
        document.getElementById("requestTitle").value.trim();

    const description =
        document.getElementById(
            "requestDescription"
        ).value.trim();

    const priority =
        document.getElementById("priority").value;

    const attachmentInput =
        document.getElementById("attachment");


    // ================================
    // VALIDATION
    // ================================

    if (!project_id) {
        alert("Please select a project");
        return;
    }

    if (!module_id) {
        alert("Please select a module");
        return;
    }

    if (!title) {
        alert("Please enter request title");
        return;
    }

    if (!description) {
        alert("Please enter description");
        return;
    }

    if (!priority) {
        alert("Please select priority");
        return;
    }


    // ================================
    // CREATE FORM DATA
    // ================================

    const formData = new FormData();

    formData.append(
        "project_id",
        project_id
    );

    formData.append(
        "module_id",
        module_id
    );

    formData.append(
        "title",
        title
    );

    formData.append(
        "description",
        description
    );

    formData.append(
        "priority",
        priority
    );

    formData.append(
        "created_by",
        user.id
    );


    // Add attachment if selected

    if (
        attachmentInput &&
        attachmentInput.files.length > 0
    ) {

        formData.append(
            "attachment",
            attachmentInput.files[0]
        );

    }


    // ================================
    // SEND REQUEST
    // ================================

    try {

        const response =
            await fetch(
                "/api/change-requests",
                {
                    method: "POST",
                    body: formData
                }
            );


        const data =
            await response.json();


        console.log(data);


        if (!response.ok) {

            alert(
                data.message ||
                "Failed to submit request"
            );

            return;

        }


        alert(
            "Change Request Submitted Successfully"
        );


        closeRequestForm();

        loadRequests();

    }

    catch (error) {

        console.error(
            "Submit request error:",
            error
        );

        alert(
            "Something went wrong"
        );

    }

}


// =================================
// LOAD CHANGE REQUESTS
// =================================


async function loadRequests() {

    try {

        const response = await fetch(
            `/api/change-requests?user_id=${encodeURIComponent(user.id)}`
        );

        const requests = await response.json();

        const table = document.getElementById(
            "requestsTable"
        );

        table.innerHTML = "";

        document.getElementById(
            "requestCount"
        ).textContent =
            `${requests.length} Requests`;


        if (requests.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="10">
                        No change requests found
                    </td>
                </tr>
            `;

            return;
        }


        requests.forEach(request => {

            const row = document.createElement("tr");

            const status =
                request.status || "Pending";


            let attachmentHTML = "-";


            if (request.attachment) {
                const clipIcon = typeof window.renderIcon === "function"
                    ? window.renderIcon("paperclip", "attachment-icon", 14)
                    : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="display:inline-block;vertical-align:middle;margin-right:4px;"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>`;

                attachmentHTML = `
                    <a
                        href="/uploads/${request.attachment}"
                        target="_blank"
                        class="attachment-link"
                    >
                        ${clipIcon}<span>View File</span>
                    </a>
                `;

            }


            row.innerHTML = `

                <td>
                    ${request.id}
                </td>

                <td>
                    <strong>
                        ${request.title}
                    </strong>
                </td>

                <td>
                    ${request.project_name || "-"}
                </td>

                <td>
                    ${request.module_name || "-"}
                </td>

                <td>
                    ${request.priority || "-"}
                </td>

                <td>
                    <span class="status ${status.toLowerCase()}">
                        ${status}
                    </span>
                </td>

                <td>
                    ${request.admin_comment || "-"}
                </td>

                <td>
                    ${
                        request.approved_at
                        ? new Date(
                            request.approved_at
                          ).toLocaleDateString()
                        : "-"
                    }
                </td>

                <td>
                    ${
                        request.created_at
                        ? new Date(
                            request.created_at
                          ).toLocaleDateString()
                        : "-"
                    }
                </td>

                <td>
                    ${attachmentHTML}
                </td>

            `;


            table.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Request loading error:",
            error
        );

    }

}


// =================================
// START
// =================================

loadProjects();

loadRequests();