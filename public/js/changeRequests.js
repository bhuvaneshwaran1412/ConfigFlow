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

document
    .getElementById("moduleId")
    ?.addEventListener(
        "change",
        checkSelectedModuleImpact
    );

async function checkSelectedModuleImpact() {
    const moduleId = document.getElementById("moduleId").value;
    const alertEl = document.getElementById("moduleImpactAlert");
    const textEl = document.getElementById("moduleImpactText");
    if (!alertEl || !textEl) return;

    if (!moduleId) {
        alertEl.style.display = "none";
        return;
    }

    try {
        const response = await fetch(`/api/modules/${moduleId}/impact`);
        const data = await response.json();

        if (response.ok && data.has_downstream_impact && data.impacted_modules.length > 0) {
            const names = data.impacted_modules.map(m => `"${m.module_name}"`).join(", ");
            textEl.innerHTML = `Modifying this module may affect downstream dependent components: <strong>${names}</strong>. Please ensure test coverage.`;
            alertEl.style.display = "block";
        } else {
            alertEl.style.display = "none";
        }
    } catch (e) {
        alertEl.style.display = "none";
    }
}


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

    const changeTypeEl = document.getElementById("changeType");
    if (changeTypeEl) changeTypeEl.value = "Patch";

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

    const changeTypeEl = document.getElementById("changeType");
    const change_type = changeTypeEl ? changeTypeEl.value : "Patch";

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
        "change_type",
        change_type
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

            const commentCount = Number(request.comment_count || 0);
            const safeTitle = (request.title || "").replace(/'/g, "\\'").replace(/"/g, "&quot;");
            const changeType = request.change_type || "Patch";
            const changeTypeClass = changeType === "Major" ? "admin" : (changeType === "Minor" ? "manager" : "developer");

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
                    <span class="role-badge ${changeTypeClass}">
                        ${changeType}
                    </span>
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
                    <button
                        type="button"
                        class="comment-badge-btn"
                        onclick="openCommentsModal(${request.id}, '${safeTitle}')"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
                        <span>Discuss</span>
                        <span class="badge-count">${commentCount}</span>
                    </button>
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
// COMMENTS / DISCUSSION MODAL
// =================================

let activeRequestId = null;

function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function formatRelativeTime(dateString) {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return "Just now";
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)}h ago`;
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

async function openCommentsModal(requestId, requestTitle) {
    activeRequestId = requestId;
    document.getElementById("commentsModalTitle").textContent = `CR #${requestId}: ${requestTitle || "Discussion"}`;
    document.getElementById("commentsModal").style.display = "flex";
    document.getElementById("newCommentText").value = "";
    await loadComments(requestId);
}

function closeCommentsModal() {
    document.getElementById("commentsModal").style.display = "none";
    activeRequestId = null;
}

async function loadComments(requestId) {
    const list = document.getElementById("commentsList");
    list.innerHTML = `<div class="comment-empty-state">Loading conversation...</div>`;

    try {
        const response = await fetch(`/api/change-requests/${requestId}/comments`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            list.innerHTML = `<div class="comment-empty-state">Failed to load comments</div>`;
            return;
        }

        const comments = data.comments || [];
        if (comments.length === 0) {
            list.innerHTML = `
                <div class="comment-empty-state">
                    No comments yet. Start the conversation by posting below!
                </div>
            `;
            return;
        }

        list.innerHTML = "";
        comments.forEach(c => {
            const roleClass = (c.user_role || "developer").toLowerCase();
            const canDelete = c.user_id === user.id || user.role === "Admin";
            const deleteBtn = canDelete
                ? `<button type="button" class="comment-delete-btn" onclick="deleteComment(${requestId}, ${c.id})">Delete</button>`
                : "";

            const item = document.createElement("div");
            item.className = "comment-item";
            item.innerHTML = `
                <div class="comment-meta">
                    <div class="comment-author-info">
                        <span class="comment-author">${escapeHtml(c.user_name || "Unknown")}</span>
                        <span class="role-badge ${roleClass}">${escapeHtml(c.user_role || "Developer")}</span>
                    </div>
                    <span class="comment-time">${formatRelativeTime(c.created_at)}</span>
                </div>
                <div class="comment-text">${escapeHtml(c.comment)}</div>
                ${deleteBtn ? `<div class="comment-actions">${deleteBtn}</div>` : ""}
            `;
            list.appendChild(item);
        });

        // Scroll to bottom
        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error("Load comments error:", err);
        list.innerHTML = `<div class="comment-empty-state">Error loading discussion</div>`;
    }
}

async function submitComment() {
    if (!activeRequestId) return;
    const textInput = document.getElementById("newCommentText");
    const comment = textInput.value.trim();

    if (!comment) return;

    const btn = document.getElementById("sendCommentBtn");
    btn.disabled = true;
    btn.textContent = "Posting...";

    try {
        const response = await fetch(`/api/change-requests/${activeRequestId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment })
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            alert(data.message || "Failed to post comment");
            return;
        }

        textInput.value = "";
        await loadComments(activeRequestId);
        loadRequests(); // Refresh comment count in background table
    } catch (err) {
        console.error("Submit comment error:", err);
        alert("Network error posting comment");
    } finally {
        btn.disabled = false;
        btn.textContent = "Post Comment";
    }
}

async function deleteComment(requestId, commentId) {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
        const response = await fetch(`/api/change-requests/${requestId}/comments/${commentId}`, {
            method: "DELETE"
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
            alert(data.message || "Failed to delete comment");
            return;
        }

        await loadComments(requestId);
        loadRequests(); // Refresh comment count in background table
    } catch (err) {
        console.error("Delete comment error:", err);
        alert("Failed to delete comment");
    }
}


// Close modal on escape key or clicking backdrop
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && activeRequestId) {
        closeCommentsModal();
    }
});

const commentsModalEl = document.getElementById("commentsModal");
if (commentsModalEl) {
    commentsModalEl.addEventListener("click", (e) => {
        if (e.target === commentsModalEl) {
            closeCommentsModal();
        }
    });
}


// =================================
// START
// =================================

loadProjects();

loadRequests();