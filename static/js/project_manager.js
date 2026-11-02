// =====================================================
// FILE MENU
// =====================================================

let currentProjectId = null;
let currentProjectName = "Untitled Project";

let projectSaveState = "not-saved";

function updateProjectHeader() {
    const nameBox = document.getElementById("currentProjectName");
    const statusBox = document.getElementById("projectSaveStatus");

    if (nameBox) {
        nameBox.textContent = currentProjectId
            ? currentProjectName
            : "Untitled Project";

        nameBox.title = nameBox.textContent;
    }

    if (statusBox) {
        const labels = {
            "saved": "Saved",
            "not-saved": "Not saved",
            "saving": "Saving"
        };

        statusBox.textContent = labels[projectSaveState];

        statusBox.className =
            `project-save-status ${projectSaveState.replace("-", "-")}`;
    }
}

function setProjectSaveState(state) {
    projectSaveState = state;
    updateProjectHeader();
}

function markProjectDirty() {
    if (projectSaveState !== "saving") {
        setProjectSaveState("not-saved");
    }
}


// =====================================================
// FILE PANEL POPUP
// =====================================================

function toggleFilePanel() {
    const overlay = document.getElementById("filePanelOverlay");
    const panel = document.getElementById("filePanel");

    const isOpen = overlay.style.display === "flex";

    overlay.style.display = isOpen ? "none" : "flex";
    panel.style.display = isOpen ? "none" : "flex";
}


// =====================================================
// NEW PROJECT
// =====================================================

async function newProject() {

    const name = prompt("Enter project name:");

    if (!name?.trim()) return;

    const project = collectProjectData();

    // Clear existing model data
    project.model.nodes = [];
    project.model.nodeSequence = 1;
    project.model.beams = [];
    project.model.columns = [];
    project.model.supports = [];
    project.model.loads = [];
    project.model.beta = [];

    try {
        const response = await fetch("/api/projects", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: name.trim(),
                project: project
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not create project.");
        }

        // Restore the empty project
        restoreProjectData(project);

        currentProjectId = result.id;
        currentProjectName = name.trim();

        setProjectSaveState("saved");

        toggleFilePanel();
        await openProjectList();

    } catch (error) {
        console.error(error);
        alert("New project creation failed: " + error.message);
    }
}


// =====================================================
// SAVE
// =====================================================

async function saveCurrentProject() {

    const name = currentProjectId
        ? currentProjectName
        : prompt("Enter project name:", "Untitled Project");

    if (!name?.trim()) return;

    setProjectSaveState("saving");

    try {
        const response = await fetch(
            currentProjectId
                ? `/api/projects/${currentProjectId}`
                : "/api/projects",
            {
                method: currentProjectId ? "PUT" : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    name: name.trim(),
                    project: collectProjectData()
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Project save failed.");
        }

        if (!currentProjectId) {
            currentProjectId = result.id;
        }

        currentProjectName = name.trim();

        setProjectSaveState("saved");

        await openProjectList();

    } catch (error) {
        console.error(error);
        setProjectSaveState("not-saved");
        alert(error.message);

    }
}

// Save project using Ctrl + S (Windows/Linux) or Cmd + S (Mac)
document.addEventListener("keydown", function (event) {

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {

        event.preventDefault(); // Prevent browser's default Save Page action

        saveCurrentProject();
    }

});

// =====================================================
// SAVE AS
// =====================================================

async function duplicateProject() {

    const name = prompt("Enter new project name:");

    if (!name?.trim()) return;

    const response = await fetch("/api/projects", {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
            name: name.trim(),
            project: collectProjectData()
        })
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.error || "Project duplication failed.");
        return;
    }

    currentProjectId = result.id;
    currentProjectName = name.trim();

    setProjectSaveState("saved");

    alert("Project duplicated successfully.");
    await openProjectList();
}


// =====================================================
// OPEN PROJECT
// =====================================================

async function openProject(id) {

    const response = await fetch(`/api/projects/${id}`);
    const result = await response.json();

    if (!response.ok) {
        alert(result.error || "Could not open project.");
        return;
    }

    restoreProjectData(result.project);

    currentProjectId = result.id;
    currentProjectName = result.name;

    setProjectSaveState("saved");

    await openProjectList();

    toggleFilePanel();
}


// =====================================================
// RECENT PROJECTS
// =====================================================

async function openProjectList() {
    const container = document.getElementById("recentProjectsList");
    container.innerHTML = "";

    try {
        const response = await fetch("/api/projects");
        const projects = await response.json();

        if (!response.ok) {
            throw new Error(projects.error || "Could not load projects.");
        }

        // Keep the currently active project at the top
        projects.sort((a, b) =>
            new Date(b.last_opened || b.updated_at) -
            new Date(a.last_opened || a.updated_at)
        );

        if (projects.length === 0) {
            container.textContent = "No recent projects.";
            return;
        }

        projects.forEach(project => {
            const row = document.createElement("div");
            row.className = "recent-project-row";

            const openBtn = document.createElement("button");
            openBtn.className = "recent-project";
            openBtn.textContent = project.name;
            openBtn.title = project.updated_at;
            openBtn.onclick = () => openProject(project.id);

            const menu = document.createElement("div");
            menu.className = "recent-project-menu";

            const openOption = document.createElement("button");
            openOption.textContent = "Open";
            openOption.onclick = () => {
                menu.style.display = "none";
                openProject(project.id);
            };

            const renameOption = document.createElement("button");
            renameOption.textContent = "Rename";
            renameOption.onclick = () => {
                menu.style.display = "none";
                renameProject(project.id, project.name);
            };

            const deleteOption = document.createElement("button");
            deleteOption.textContent = "Delete";
            deleteOption.className = "delete-option";
            deleteOption.onclick = () => {
                menu.style.display = "none";
                deleteProject(project.id, project.name);
            };

            menu.append(openOption, renameOption, deleteOption);
            row.append(openBtn, menu);

            row.addEventListener("contextmenu", event => {
                event.preventDefault();

                document.querySelectorAll(".recent-project-menu")
                    .forEach(item => item.style.display = "none");

                menu.style.display = "flex";

                menu.style.left = Math.min(
                    event.clientX,
                    window.innerWidth - 150
                ) + "px";

                menu.style.top = Math.min(
                    event.clientY,
                    window.innerHeight - 120
                ) + "px";
            });

            container.appendChild(row);
        });

    } catch (error) {
        console.error(error);
        container.textContent = "Unable to load recent projects.";
    }
}

// Close project menu when clicking elsewhere
document.addEventListener("click", function (event) {
    if (!event.target.closest(".recent-project-menu")) {
        document.querySelectorAll(".recent-project-menu")
            .forEach(menu => menu.style.display = "none");
    }
});

async function deleteProject(id, name) {
    if (!confirm(`Permanently delete "${name}"?`)) return;

    const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE"
    });

    const result = await response.json();

    if (!response.ok) {
        alert(result.error || "Project deletion failed.");
        return;
    }

    if (currentProjectId === id) {
        currentProjectId = null;
        currentProjectName = "Untitled Project";
        setProjectSaveState("not-saved");
    }

    openProjectList();
}

async function renameProject(id, oldName) {
    const newName = prompt("Enter new project name:", oldName);

    if (!newName?.trim() || newName.trim() === oldName) return;

    try {
        const response = await fetch(`/api/projects/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: newName.trim()
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Project rename failed.");
        }

        if (currentProjectId === id) {
            currentProjectName = newName.trim();
            updateProjectHeader();
        }

        await openProjectList();

    } catch (error) {
        console.error(error);
        alert(error.message);
    }
}

// Load recent projects automatically when the page opens
document.addEventListener("DOMContentLoaded", openProjectList);


// =====================================================
// PROJECT CHANGE DETECTION
// =====================================================

// Detect changes in project input fields
document.addEventListener("input", function (event) {
    if (
        event.target.closest(".main-container") &&
        !event.target.closest("#filePanel")
    ) {
        markProjectDirty();
    }
});

document.addEventListener("change", function (event) {
    if (
        event.target.closest(".main-container") &&
        !event.target.closest("#filePanel")
    ) {
        markProjectDirty();
    }
});

// Detect actions that modify the model
document.addEventListener("click", function (event) {

    const button = event.target.closest(".main-container button");

    if (!button) return;

    // Ignore sidebar tools and file-panel controls
    if (
        button.closest(".page-tool-sidebar") ||
        button.closest("#filePanel")
    ) {
        return;
    }

    markProjectDirty();
});

// Detect drawing operations on the 2D canvas
document.addEventListener("pointerup", function (event) {

    if (event.target.id !== "drawing2DCanvas") return;

    if (
        window.drawing2D &&
        window.drawing2D.activeTool !== "select"
    ) {
        markProjectDirty();
    }
});

// Initial header state
document.addEventListener("DOMContentLoaded", function () {
    updateProjectHeader();
    setProjectSaveState("not-saved");
});