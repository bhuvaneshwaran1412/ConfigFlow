const storedUser = localStorage.getItem("user");

if (!storedUser) {

    window.location.href = "login.html";

}

const user = JSON.parse(storedUser);

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";


// =================================
// LOAD PROJECTS INTO DROPDOWN
// =================================

async function loadProjects() {

    try {

        const response = await fetch(`/api/projects?user_id=${encodeURIComponent(user.id)}`);

        const projects = await response.json();

        const select = document.getElementById("projectId");

        select.innerHTML = `
            <option value="">
                Select Project
            </option>
        `;

        projects
            .filter(project => user.role === "Admin" || Number(project.is_assigned) === 1)
            .forEach(project => {

            const option = document.createElement("option");

            option.value = project.id;

            option.textContent = project.project_name;

            select.appendChild(option);

            });

    }

    catch (error) {

        console.error("Project loading error:", error);

    }

}


// =================================
// LOAD MODULES
// =================================

async function loadModules() {

    try {

        const response = await fetch(`/api/modules?user_id=${encodeURIComponent(user.id)}`);

        const modules = await response.json();

        const table =
            document.getElementById("modulesTable");

        table.innerHTML = "";

        document.getElementById("moduleCount").textContent =
            `${modules.length} Modules`;


        if (modules.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="4">
                        No modules found
                    </td>
                </tr>
            `;

            return;

        }


        modules.forEach(module => {

            const row = document.createElement("tr");

            const actions = Number(module.can_edit) === 1
                ? `
                    <button class="edit-btn" onclick='editModule(${JSON.stringify(module)})'>Edit</button>
                    <button class="delete-btn" onclick="deleteModule(${module.id})">Delete</button>
                `
                : "View only";

            row.innerHTML = `

                <td>
                    ${module.id}
                </td>

                <td>
                    ${module.project_name || "-"}
                </td>

                <td>
                    <strong>
                        ${module.module_name}
                    </strong>
                </td>

                <td>

                    ${actions}

                </td>

            `;

            table.appendChild(row);

        });

    }

    catch (error) {

        console.error("Module loading error:", error);

    }

}


// =================================
// OPEN FORM
// =================================

function openModuleForm() {

    document.getElementById("moduleFormSection")
        .style.display = "block";

    document.getElementById("formTitle")
        .textContent = "Add Module";

}


// =================================
// CLOSE FORM
// =================================

function closeModuleForm() {

    document.getElementById("moduleFormSection")
        .style.display = "none";

    document.getElementById("moduleId").value = "";

    document.getElementById("projectId").value = "";

    document.getElementById("moduleName").value = "";

}


// =================================
// SAVE MODULE
// =================================

async function saveModule() {

    const id =
        document.getElementById("moduleId").value;

    const project_id =
        document.getElementById("projectId").value;

    const module_name =
        document.getElementById("moduleName").value;


    if (!project_id) {

        alert("Please select a project");

        return;

    }


    if (!module_name) {

        alert("Please enter module name");

        return;

    }


    const moduleData = {

        project_id,
        module_name,
        created_by: user.id,
        updated_by: user.id

    };


    try {

        let url = "/api/modules";

        let method = "POST";


        if (id) {

            url = `/api/modules/${id}`;

            method = "PUT";

        }


        const response = await fetch(url, {

            method: method,

            headers: {

                "Content-Type":
                    "application/json"

            },

            body: JSON.stringify(moduleData)

        });


        const data = await response.json();

        console.log(data);


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to save module"
            );

            return;

        }


        alert(
            id
                ? "Module Updated Successfully"
                : "Module Added Successfully"
        );


        closeModuleForm();

        loadModules();

    }

    catch (error) {

        console.error(
            "Save module error:",
            error
        );

        alert("Something went wrong");

    }

}


// =================================
// EDIT MODULE
// =================================

function editModule(module) {

    document.getElementById("moduleFormSection")
        .style.display = "block";

    document.getElementById("formTitle")
        .textContent = "Edit Module";


    document.getElementById("moduleId").value =
        module.id;

    document.getElementById("projectId").value =
        module.project_id;

    document.getElementById("moduleName").value =
        module.module_name;

}


// =================================
// DELETE MODULE
// =================================

async function deleteModule(id) {

    if (
        !confirm(
            "Are you sure you want to delete this module?"
        )
    ) {

        return;

    }


    try {

        const response = await fetch(
            `/api/modules/${id}`,
            {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ deleted_by: user.id })
            }
        );


        const data = await response.json();

        console.log(data);


        if (!response.ok) {

            alert(
                data.message ||
                "Unable to delete module"
            );

            return;

        }


        alert("Module Deleted Successfully");

        loadModules();

    }

    catch (error) {

        console.error(
            "Delete module error:",
            error
        );

        alert("Something went wrong");

    }

}


// =================================
// START
// =================================

loadProjects();

loadModules();