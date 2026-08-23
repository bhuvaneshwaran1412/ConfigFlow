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


    document.getElementById(
        "requestPriority"
    ).textContent =
        request.priority;


    document.getElementById(
        "requestDescription"
    ).textContent =
        request.description;


    document.getElementById(
        "adminComment"
    ).value = "";

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