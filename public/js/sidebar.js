const storedUser = localStorage.getItem("user");


// =================================
// LOGIN CHECK
// =================================

if (!storedUser) {

    window.location.href = "login.html";

} else {

    const user = JSON.parse(storedUser);


    // =================================
    // DISPLAY USER
    // =================================

    const userName =
        document.getElementById("sidebarUserName");

    const userRole =
        document.getElementById("sidebarUserRole");


    if (userName) {

        userName.textContent =
            user.name || "User";

    }


    if (userRole) {

        userRole.textContent =
            user.role || "User";

    }


}