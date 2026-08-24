async function login(){

    const email=document.getElementById("email").value;

    const password=document.getElementById("password").value;

    const response=await fetch("/api/login",{

        method:"POST",

        headers:{
            "Content-Type":"application/json"
        },

        body:JSON.stringify({
            email,
            password
        })

    });

    const data = await readResponse(response);

    if(data.success){

        localStorage.setItem("user",JSON.stringify(data.user));

        window.location.href="dashboard.html";

    }

    else{

        document.getElementById("message").innerHTML=data.message;

    }

}

function togglePassword(inputId, button) {
    const input = document.getElementById(inputId);
    const isPassword = input.type === "password";

    input.type = isPassword ? "text" : "password";
    button.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
}

async function readResponse(response) {
    const body = await response.text();

    try {
        return JSON.parse(body);
    } catch (error) {
        throw new Error(
            response.ok
                ? "The server returned an invalid response."
                : `Server error (${response.status}). Restart the ConfigFlow server and try again.`
        );
    }
}

function toggleRegistration() {
    const loginFields = document.getElementById("loginFields");
    const registerFields = document.getElementById("registerFields");
    const toggle = document.getElementById("registerToggle");
    const message = document.getElementById("message");
    const registrationOpen = registerFields.hidden;

    loginFields.hidden = registrationOpen;
    registerFields.hidden = !registrationOpen;
    toggle.textContent = registrationOpen
        ? "Already have an account? Log in"
        : "Need an account? Register";
    message.textContent = "";
}

let employeePreviewRequest = 0;

async function updateEmployeeIdPreview() {
    const name = document.getElementById("registerName").value.trim();
    const employeeId = document.getElementById("employeeId");
    if (!name) {
        employeeId.value = "";
        return;
    }

    const requestId = ++employeePreviewRequest;
    employeeId.value = "Generating...";
    try {
        const response = await fetch("/api/employee-id-preview");
        const data = await response.json();
        if (requestId === employeePreviewRequest) {
            employeeId.value = response.ok && data.success ? data.employee_id : "CFG-0001";
        }
    } catch (error) {
        if (requestId === employeePreviewRequest) employeeId.value = "CFG-0001";
    }
}

document.getElementById("registerName")?.addEventListener("input", updateEmployeeIdPreview);

async function registerDeveloper() {
    const name = document.getElementById("registerName").value.trim();
    const email = document.getElementById("registerEmail").value.trim();
    const password = document.getElementById("registerPassword").value;
    const confirmPassword = document.getElementById("confirmPassword").value;
    const message = document.getElementById("message");

    if (password !== confirmPassword) {
        message.className = "error-message";
        message.textContent = "Passwords do not match";
        return;
    }

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ name, email, password, confirm_password: confirmPassword })
        });
        const data = await readResponse(response);

        if (!response.ok) {
            throw new Error(data.message || "Registration failed");
        }

        toggleRegistration();
        message.className = "success-message";
        message.textContent = data.message;
    } catch (error) {
        message.className = "error-message";
        message.textContent = error.message;
    }
}