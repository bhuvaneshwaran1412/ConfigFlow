const storedUser = localStorage.getItem("user");
let currentUser = null;

if (!storedUser) {
    window.location.href = "login.html";
} else {
    currentUser = JSON.parse(storedUser);

    document.getElementById("sidebarUserName").textContent =
        currentUser.name || "User";

    document.getElementById("sidebarUserRole").textContent =
        currentUser.role || "User";

    if (currentUser.role === "Admin") {
        document.getElementById("releaseNoteFormSection").hidden = false;
    }
}

function formatReleaseDate(date) {
    if (!date) {
        return "Date not provided";
    }

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
        ? "Date not provided"
        : parsedDate.toLocaleDateString();
}

function createReleaseNoteCard(note) {
    const card = document.createElement("article");
    card.className = "release-note-card";

    const heading = document.createElement("h3");
    heading.textContent = note.version || "Unversioned release";

    const meta = document.createElement("div");
    meta.className = "release-note-meta";

    const project = document.createElement("span");
    project.innerHTML = "Project: ";
    const projectName = document.createElement("strong");
    projectName.textContent = note.project_name || "Project not provided";
    project.appendChild(projectName);

    const releaseDate = document.createElement("span");
    releaseDate.textContent = `Released: ${formatReleaseDate(note.release_date)}`;

    meta.append(project, releaseDate);

    const body = document.createElement("p");
    body.className = "release-note-body";
    body.textContent = note.notes || "No release note details provided.";

    card.append(heading, meta, body);

    return card;
}

async function logout() {
    await fetch("/api/logout", { method: "POST" });
    localStorage.removeItem("user");
    window.location.href = "login.html";
}

async function loadVersionsForReleaseNote() {
    if (!currentUser || currentUser.role !== "Admin") {
        return;
    }

    const select = document.getElementById("releaseVersion");

    try {
        const response = await fetch("/api/versions");
        const versions = await response.json();

        if (!response.ok) {
            throw new Error("Failed to fetch versions");
        }

        versions.forEach(version => {
            const option = document.createElement("option");
            option.value = version.id;
            option.textContent = `${version.version} - ${version.project_name || "Project"}`;
            select.appendChild(option);
        });
    } catch (error) {
        console.error("Version loading error:", error);
        document.getElementById("releaseNoteMessage").textContent =
            "Versions could not be loaded.";
    }
}

async function publishReleaseNote() {
    const select = document.getElementById("releaseVersion");
    const text = document.getElementById("releaseNoteText");
    const message = document.getElementById("releaseNoteMessage");

    if (!select.value || !text.value.trim()) {
        message.textContent = "Select a version and enter release details.";
        return;
    }

    try {
        const response = await fetch("/api/release-notes", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                version_id: select.value,
                notes: text.value.trim(),
                created_by: currentUser.id
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Failed to publish release note");
        }

        message.textContent = result.message;
        text.value = "";
        select.value = "";
        await loadReleaseNotes();
    } catch (error) {
        console.error("Release note publishing error:", error);
        message.textContent = error.message;
    }
}

async function loadReleaseNotes() {
    const container = document.getElementById("releaseNotesContainer");
    const count = document.getElementById("releaseNoteCount");

    try {
        const response = await fetch("/api/release-notes");

        if (!response.ok) {
            throw new Error("Failed to fetch release notes");
        }

        const notes = await response.json();
        container.replaceChildren();
        count.textContent = `${notes.length} release${notes.length === 1 ? "" : "s"}`;

        if (notes.length === 0) {
            const emptyState = document.createElement("p");
            emptyState.className = "release-notes-status";
            emptyState.textContent = "No release notes have been published yet.";
            container.appendChild(emptyState);
            return;
        }

        notes.forEach(note => {
            container.appendChild(createReleaseNoteCard(note));
        });
    } catch (error) {
        console.error("Release notes error:", error);
        count.textContent = "Unavailable";
        container.replaceChildren();

        const errorState = document.createElement("p");
        errorState.className = "release-notes-status";
        errorState.textContent = "Release notes could not be loaded. Please try again later.";
        container.appendChild(errorState);
    }
}

document
    .getElementById("publishReleaseNoteButton")
    .addEventListener("click", publishReleaseNote);

loadVersionsForReleaseNote();
loadReleaseNotes();
