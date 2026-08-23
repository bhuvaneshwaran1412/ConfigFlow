const storedUser = localStorage.getItem("user");

if (!storedUser) {

    window.location.href = "login.html";

}

const user = JSON.parse(storedUser);


// =================================
// USER DETAILS
// =================================

document.getElementById(
    "sidebarUserName"
).textContent = user.name || "User";


document.getElementById(
    "sidebarUserRole"
).textContent = user.role || "User";


// =================================
// SEARCH
// =================================

async function performSearch() {

    const keyword =
        document.getElementById(
            "searchInput"
        ).value.trim();

    const status = document.getElementById("statusFilter").value;
    const priority = document.getElementById("priorityFilter").value;


    const table =
        document.getElementById(
            "searchResults"
        );


    if (!keyword) {

        table.innerHTML = `
            <tr>
                <td colspan="9">
                    Please enter a search keyword
                </td>
            </tr>
        `;

        return;

    }


    try {

        const response =
            await fetch(
                `/api/search?keyword=${encodeURIComponent(keyword)}&status=${encodeURIComponent(status)}&priority=${encodeURIComponent(priority)}`
            );


        const results =
            await response.json();


        if (!response.ok) {

            throw new Error(
                results.message ||
                "Search failed"
            );

        }


        table.innerHTML = "";


        if (results.length === 0) {

            table.innerHTML = `
                <tr>
                    <td colspan="9">
                        No matching records found
                    </td>
                </tr>
            `;

            return;

        }


        results.forEach(result => {

            const row =
                document.createElement("tr");


            row.innerHTML = `

                <td>
                    ${result.id}
                </td>

                <td>
                    ${result.project_name || "-"}
                </td>

                <td>
                    ${result.module_name || "-"}
                </td>

                <td>
                    ${result.title || "-"}
                </td>

                <td>
                    ${result.priority || "-"}
                </td>

                <td>
                    ${result.status || "-"}
                </td>

                <td>
                    ${result.developer || "-"}
                </td>

                <td>
                    ${result.version || "-"}
                </td>

                <td>
                    ${
                        result.created_at
                        ? new Date(
                            result.created_at
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
            "Search error:",
            error
        );


        table.innerHTML = `
            <tr>
                <td colspan="9">
                    Failed to perform search
                </td>
            </tr>
        `;

    }

}


// =================================
// BUTTON
// =================================

document.getElementById(
    "searchButton"
).addEventListener(
    "click",
    performSearch
);


// =================================
// ENTER KEY
// =================================

document.getElementById(
    "searchInput"
).addEventListener(
    "keypress",
    (event) => {

        if (event.key === "Enter") {

            performSearch();

        }

    }
);