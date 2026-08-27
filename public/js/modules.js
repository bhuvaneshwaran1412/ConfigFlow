const storedUser = localStorage.getItem("user");

if (!storedUser) {
    window.location.href = "login.html";
}

const user = JSON.parse(storedUser);

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";

let allModulesCache = [];

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

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

// Update dependency dropdown when project changes
document.getElementById("projectId")?.addEventListener("change", updateDependencyOptions);

function updateDependencyOptions(currentModuleId = null, selectedIds = []) {
    const projectId = document.getElementById("projectId").value;
    const depSelect = document.getElementById("moduleDependencies");
    if (!depSelect) return;

    depSelect.innerHTML = "";

    const filtered = allModulesCache.filter(m =>
        String(m.project_id) === String(projectId) &&
        String(m.id) !== String(currentModuleId)
    );

    if (filtered.length === 0) {
        depSelect.innerHTML = `<option value="" disabled>No other modules in this project</option>`;
        return;
    }

    filtered.forEach(m => {
        const opt = document.createElement("option");
        opt.value = m.id;
        opt.textContent = m.module_name;
        if (selectedIds.includes(String(m.id)) || selectedIds.includes(Number(m.id))) {
            opt.selected = true;
        }
        depSelect.appendChild(opt);
    });
}


// =================================
// LOAD MODULES
// =================================

async function loadModules() {

    try {

        const response = await fetch(`/api/modules?user_id=${encodeURIComponent(user.id)}`);

        const modules = await response.json();
        allModulesCache = Array.isArray(modules) ? modules : [];

        const table =
            document.getElementById("modulesTable");

        table.innerHTML = "";

        document.getElementById("moduleCount").textContent =
            `${modules.length} Modules`;


        if (modules.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="6">
                        No modules found
                    </td>
                </tr>
            `;

            renderDependencyMap([]);
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

            const dependsOn = module.depends_on_names
                ? `<span class="role-badge developer" style="font-size: 11px;">${escapeHtml(module.depends_on_names)}</span>`
                : `<span style="color: var(--text-muted); font-size: 12px;">None (Root)</span>`;

            const downstreamCount = Number(module.downstream_dependent_count || 0);
            const impactBadge = downstreamCount > 0
                ? `<span class="role-badge manager" style="font-size: 11px;">⚠️ ${downstreamCount} downstream</span>`
                : `<span style="color: var(--text-muted); font-size: 12px;">0 dependents</span>`;

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
                    ${dependsOn}
                </td>

                <td>
                    ${impactBadge}
                </td>

                <td>

                    ${actions}

                </td>

            `;

            table.appendChild(row);

        });

        renderDependencyMap(allModulesCache);

    }

    catch (error) {

        console.error("Module loading error:", error);

    }

}


// =================================
// RENDER DEPENDENCY MAP
// =================================

async function renderDependencyMap(modules) {
    const container = document.getElementById("dependencyMapContainer");
    if (!container) return;

    if (!modules || modules.length === 0) {
        container.innerHTML = `<div style="color: var(--text-muted); font-size: 12px; padding: 20px;">No modules defined yet.</div>`;
        return;
    }

    container.innerHTML = "";

    modules.forEach(m => {
        const card = document.createElement("div");
        card.className = "chart-card";
        card.style.padding = "16px";

        const downstreamCount = Number(m.downstream_dependent_count || 0);
        const dependsOnList = m.depends_on_names
            ? m.depends_on_names.split(", ")
            : [];

        let upstreamBadges = dependsOnList.length > 0
            ? dependsOnList.map(name => `<span class="role-badge developer">${escapeHtml(name)}</span>`).join(" ")
            : `<span style="color: var(--text-muted); font-size: 11px;">None (Standalone / Core)</span>`;

        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                    <h4 style="margin: 0; font-size: 13px; color: var(--text-primary); font-weight: 600;">${escapeHtml(m.module_name)}</h4>
                    <span style="font-size: 11px; color: var(--text-muted);">${escapeHtml(m.project_name || "General")}</span>
                </div>
                ${downstreamCount > 0 ? `<span class="role-badge manager" title="${downstreamCount} modules depend on this">${downstreamCount} Impacted</span>` : `<span class="role-badge" style="background: rgba(255,255,255,0.05); color: var(--text-muted);">0 Downstream</span>`}
            </div>

            <div style="font-size: 11px; color: var(--text-secondary); margin-top: 8px;">
                <div style="margin-bottom: 4px;"><strong style="color: var(--text-muted);">Depends On:</strong></div>
                <div>${upstreamBadges}</div>
            </div>
        `;

        container.appendChild(card);
    });
}


// =================================
// OPEN FORM
// =================================

function openModuleForm() {

    document.getElementById("moduleFormSection")
        .style.display = "block";

    document.getElementById("formTitle")
        .textContent = "Add Module";

    updateDependencyOptions();

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

    const depSelect = document.getElementById("moduleDependencies");
    if (depSelect) depSelect.innerHTML = "";

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

    const depSelect = document.getElementById("moduleDependencies");
    const selectedOptions = depSelect ? Array.from(depSelect.selectedOptions).map(opt => Number(opt.value)) : [];


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
        depends_on_ids: selectedOptions,
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

    const existingDepIds = module.depends_on_ids
        ? String(module.depends_on_ids).split(",")
        : [];

    updateDependencyOptions(module.id, existingDepIds);

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