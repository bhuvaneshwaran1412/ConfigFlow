const storedUser = localStorage.getItem("user");


// =================================
// LOGIN CHECK
// =================================

if (!storedUser) {

    window.location.href = "login.html";

    throw new Error("User not logged in");

}


const user = JSON.parse(storedUser);


// =================================
// ADMIN ONLY
// =================================

if (user.role !== "Admin" && user.role !== "Manager") {

    alert("Access Denied. Admin or Manager access required.");

    window.location.href = "dashboard.html";

    throw new Error("Admin access required");

}


// Display user

document.getElementById("sidebarUserName").textContent =
    user.name || "User";

document.getElementById("sidebarUserRole").textContent =
    user.role || "User";


// =================================
// LOAD ALL REQUESTS
// =================================

async function loadRequests() {

    try {

        const response =
            await fetch(`/api/change-requests?user_id=${encodeURIComponent(user.id)}`);

        const requests =
            await response.json();


        const table =
            document.getElementById(
                "pendingRequestsTable"
            );


        table.innerHTML = "";


        const pendingRequests =
            requests.filter(request =>
                String(request.status).toLowerCase()
                === "pending"
            );


        document.getElementById(
            "pendingCount"
        ).textContent =
            `${pendingRequests.length} Pending`;


        if (pendingRequests.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="7">
                        No pending change requests
                    </td>
                </tr>
            `;

            return;

        }


        pendingRequests.forEach(request => {

            const row =
                document.createElement("tr");

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
                    ${request.priority}
                </td>

                <td>
                    ${request.created_by_name || request.created_by || "-"}
                </td>

                <td>

                    <button
                        class="edit-btn"
                        onclick='reviewRequest(${JSON.stringify(request)})'
                    >
                        Review
                    </button>

                </td>

            `;


            table.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Loading approval requests error:",
            error
        );

    }

}


// =================================
// REVIEW REQUEST
// =================================

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

async function loadApprovalComments(requestId) {
    const list = document.getElementById("approvalCommentsList");
    if (!list) return;
    list.innerHTML = `<div class="comment-empty-state">Loading discussion...</div>`;

    try {
        const response = await fetch(`/api/change-requests/${requestId}/comments`);
        const data = await response.json();

        if (!response.ok || !data.success) {
            list.innerHTML = `<div class="comment-empty-state">Unable to load comments</div>`;
            return;
        }

        const comments = data.comments || [];
        if (comments.length === 0) {
            list.innerHTML = `<div class="comment-empty-state">No comments yet.</div>`;
            return;
        }

        list.innerHTML = "";
        comments.forEach(c => {
            const roleClass = (c.user_role || "developer").toLowerCase();
            const item = document.createElement("div");
            item.className = "comment-item";
            item.style.padding = "8px 12px";
            item.innerHTML = `
                <div class="comment-meta" style="margin-bottom: 4px;">
                    <div class="comment-author-info">
                        <span class="comment-author" style="font-size: 11px;">${escapeHtml(c.user_name || "User")}</span>
                        <span class="role-badge ${roleClass}">${escapeHtml(c.user_role || "Developer")}</span>
                    </div>
                    <span class="comment-time">${formatRelativeTime(c.created_at)}</span>
                </div>
                <div class="comment-text" style="font-size: 12px;">${escapeHtml(c.comment)}</div>
            `;
            list.appendChild(item);
        });
        list.scrollTop = list.scrollHeight;
    } catch (err) {
        console.error("Error loading approval comments:", err);
        list.innerHTML = `<div class="comment-empty-state">Error loading discussion</div>`;
    }
}

async function postApprovalComment() {
    const requestId = document.getElementById("requestId").value;
    const input = document.getElementById("approvalNewComment");
    const comment = (input ? input.value : "").trim();

    if (!requestId || !comment) return;

    try {
        const response = await fetch(`/api/change-requests/${requestId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ comment })
        });
        const data = await response.json();
        if (response.ok && data.success) {
            input.value = "";
            await loadApprovalComments(requestId);
        } else {
            alert(data.message || "Failed to post comment");
        }
    } catch (err) {
        console.error("Post approval comment error:", err);
        alert("Error posting comment");
    }
}

function calculateNextSemVer(currentVersionStr, changeType) {
    const clean = (currentVersionStr || "v1.0.0").trim().replace(/^v/i, "");
    const match = clean.match(/^(\d+)\.(\d+)\.(\d+)/);
    const major = match ? parseInt(match[1], 10) : 1;
    const minor = match ? parseInt(match[2], 10) : 0;
    const patch = match ? parseInt(match[3], 10) : 0;
    const type = (changeType || "Patch").toLowerCase();

    if (type === "major") return `v${major + 1}.0.0`;
    if (type === "minor") return `v${major}.${minor + 1}.0`;
    return `v${major}.${minor}.${patch + 1}`;
}

function reviewRequest(request) {

    document.getElementById(
        "approvalSection"
    ).style.display = "block";


    document.getElementById(
        "requestId"
    ).value = request.id;


    document.getElementById(
        "requestTitle"
    ).textContent =
        request.title;


    document.getElementById(
        "requestProject"
    ).textContent =
        request.project_name || "-";


    document.getElementById(
        "requestModule"
    ).textContent =
        request.module_name || "-";

    const changeType = request.change_type || "Patch";
    const changeTypeClass = changeType === "Major" ? "admin" : (changeType === "Minor" ? "manager" : "developer");
    const changeTypeEl = document.getElementById("requestChangeType");
    if (changeTypeEl) {
        changeTypeEl.textContent = changeType;
        changeTypeEl.className = `role-badge ${changeTypeClass}`;
    }

    const nextVer = calculateNextSemVer(request.current_version, changeType);
    const nextVerEl = document.getElementById("requestNextVersion");
    if (nextVerEl) {
        nextVerEl.textContent = `${nextVer} (from ${request.current_version || "v1.0.0"})`;
    }

    document.getElementById(
        "requestPriority"
    ).textContent =
        request.priority;


    document.getElementById(
        "requestDescription"
    ).textContent =
        request.description;

    // Check downstream impact
    const alertEl = document.getElementById("approvalImpactAlert");
    const textEl = document.getElementById("approvalImpactText");
    if (alertEl && textEl) {
        alertEl.style.display = "none";
        if (request.module_id) {
            fetch(`/api/modules/${request.module_id}/impact`)
                .then(res => res.json())
                .then(data => {
                    if (data && data.has_downstream_impact && data.impacted_modules.length > 0) {
                        const names = data.impacted_modules.map(m => `"${m.module_name}"`).join(", ");
                        textEl.innerHTML = `Caution: Downstream modules dependent on this component (${names}) should be verified for regression.`;
                        alertEl.style.display = "block";
                    }
                })
                .catch(() => {});
        }
    }


    document.getElementById(
        "adminComment"
    ).value = "";

    const commentInput = document.getElementById("approvalNewComment");
    if (commentInput) commentInput.value = "";

    loadApprovalComments(request.id);

}


// =================================
// CLOSE REVIEW
// =================================

function closeApprovalForm() {

    document.getElementById(
        "approvalSection"
    ).style.display = "none";

}


// =================================
// APPROVE
// =================================

async function approveRequest() {

    await updateRequestStatus(
        "Approved"
    );

}


// =================================
// REJECT
// =================================

async function rejectRequest() {

    await updateRequestStatus(
        "Rejected"
    );

}


// =================================
// UPDATE STATUS
// =================================

async function updateRequestStatus(status) {

    const id =
        document.getElementById(
            "requestId"
        ).value;


    const admin_comment =
        document.getElementById(
            "adminComment"
        ).value;


    if (!admin_comment) {

        alert(
            "Please enter an admin comment"
        );

        return;

    }


    const data = {

        status,

        admin_comment,

        approved_by: user.id

    };


    try {

        const response =
            await fetch(
                `/api/change-requests/${id}/approve`,
                {

                    method: "PUT",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body:
                        JSON.stringify(data)

                }
            );


        const result =
            await response.json();


        console.log(result);


        if (!response.ok) {

            alert(
                result.message ||
                "Unable to update request"
            );

            return;

        }


        if (status === "Approved") {

            alert(
                `Request Approved Successfully\n\nVersion: ${
                    result.version || "-"
                }`
            );

        } else {

            alert(
                "Request Rejected Successfully"
            );

        }


        closeApprovalForm();

        loadRequests();

    }

    catch (error) {

        console.error(
            "Approval error:",
            error
        );

        alert(
            "Something went wrong"
        );

    }

}


// =================================
// START
// =================================

loadRequests();