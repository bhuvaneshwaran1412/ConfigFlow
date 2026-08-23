const storedUser =
    localStorage.getItem("user");


if (!storedUser) {

    window.location.href =
        "login.html";

}


const user =
    JSON.parse(storedUser);

let auditLogs = [];


document.getElementById(
    "sidebarUserName"
).textContent =
    user.name || "User";


document.getElementById(
    "sidebarUserRole"
).textContent =
    user.role || "User";


// =================================
// LOAD AUDIT LOGS
// =================================

async function loadAuditLogs() {

    try {

        const response =
            await fetch(
                "/api/audit-logs"
            );


        const logs =
            await response.json();

        auditLogs = logs;


        const table =
            document.getElementById(
                "auditTable"
            );


        table.innerHTML = "";


        document.getElementById(
            "logCount"
        ).textContent =
            `${logs.length} Activities`;


        if (logs.length === 0) {

            table.innerHTML = `
                <tr>

                    <td colspan="5">
                        No audit logs found
                    </td>

                </tr>
            `;

            return;

        }


        logs.forEach(log => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${log.id}
                </td>

                <td>
                    ${log.user_name || log.user_id || "-"}
                </td>

                <td>
                    <strong>
                        ${log.action}
                    </strong>
                </td>

                <td>
                    ${log.details || "-"}
                </td>

                <td>
                    ${
                        log.created_at
                        ? new Date(
                            log.created_at
                          ).toLocaleString()
                        : "-"
                    }
                </td>

            `;


            table.appendChild(row);

        });

    }

    catch (error) {

        console.error(
            "Audit log error:",
            error
        );

    }

}


// =================================
// START
// =================================

loadAuditLogs();

function escapeCsv(value) {
    return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function exportAuditLogs() {
    const headers = ["ID", "User", "Action", "Details", "Date & Time"];
    const rows = auditLogs.map(log => [
        log.id,
        log.user_name || log.user_id || "",
        log.action,
        log.details || "",
        log.created_at || ""
    ]);
    const csv = [headers, ...rows]
        .map(row => row.map(escapeCsv).join(","))
        .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "configflow-audit-logs.csv";
    link.click();
    URL.revokeObjectURL(url);
}

document
    .getElementById("exportAuditButton")
    .addEventListener("click", exportAuditLogs);