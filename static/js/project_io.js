
// =====================================================
// PROJECT JSON EXPORT / IMPORT
// =====================================================

const PROJECT_FORMAT = "FrameAnalyzer";
const PROJECT_VERSION = "1.0";


// =====================================================
// COLLECT PROJECT DATA
// =====================================================

function collectProjectData() {

    const collectMembers = tableId => {
        const table = document.getElementById(tableId);

        return [...table.rows].slice(1).map(row => ({
            id: row.cells[0].querySelector("input").value,
            start: row.cells[1].querySelector("input").value,
            end: row.cells[2].querySelector("input").value,
            sectionId: row.dataset.sectionId || null
        }));
    };

    const d2d = window.drawing2D;

    return {
        format: PROJECT_FORMAT,
        version: PROJECT_VERSION,
        exportedAt: new Date().toISOString(),

        model: {
            nodes: structuredClone(window.nodeDatabase),
            nodeSequence: window.nodeSequence,

            beams: collectMembers("beamsTable"),
            columns: collectMembers("columnsTable"),

            materials: structuredClone(materialDatabase),
            sections: structuredClone(sectionDatabase),
            beta: structuredClone(betaDatabase),

            supports: structuredClone(supportDatabase),
            loads: structuredClone(loadDatabase)
        },

        settings: {
            gridMode: d2d.gridMode,
            grid: structuredClone(d2d.grid),
            gridSettings: structuredClone(d2d.gridSettings),
            storySettings: structuredClone(d2d.storySettings),
            floor: d2d.floor,
            gridVisible: d2d.gridVisible,
            activeMemberSectionId: window.activeMemberSectionId
        }
    };
}


// =====================================================
// EXPORT JSON
// =====================================================

function exportProjectJSON() {
    try {
        const project = collectProjectData();

        let fileName = (currentProjectName || "Untitled Project").trim();

        if (!fileName?.trim()) return;

        fileName = fileName.trim();

        if (!fileName.toLowerCase().endsWith(".str")) {
            fileName += ".str";
        }

        const blob = new Blob(
            [JSON.stringify(project, null, 2)],
            { type: "application/json" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");

        link.href = url;
        link.download = fileName;
        link.click();

        URL.revokeObjectURL(url);

    } catch (error) {
        console.error(error);
        alert("Project export failed: " + error.message);
    }
}


// =====================================================
// VALIDATE JSON
// =====================================================

function validateProjectData(data) {

    if (
        data.format !== PROJECT_FORMAT ||
        data.version !== PROJECT_VERSION
    ) {
        throw new Error("Invalid or unsupported project file.");
    }

    const model = data.model;
    const settings = data.settings;

    if (
        !model ||
        !settings ||
        !Array.isArray(model.nodes) ||
        !Array.isArray(model.beams) ||
        !Array.isArray(model.columns) ||
        !Array.isArray(model.materials) ||
        !Array.isArray(model.sections) ||
        !Array.isArray(model.beta) ||
        !Array.isArray(model.supports) ||
        !Array.isArray(model.loads)
    ) {
        throw new Error("Project file is incomplete or corrupted.");
    }

    if (
        !settings.grid ||
        !settings.gridSettings ||
        !settings.storySettings
    ) {
        throw new Error("Project settings are missing.");
    }
}


// =====================================================
// RESTORE MEMBER TABLE
// =====================================================

function restoreMemberTable(tableId, members) {

    const table = document.getElementById(tableId);

    table.innerHTML = `
        <tr>
            <th>ID</th>
            <th>Start</th>
            <th>End</th>
        </tr>
    `;

    members.forEach(member => {

        const row = table.insertRow();

        [member.id, member.start, member.end].forEach(value => {
            const cell = row.insertCell();
            const input = document.createElement("input");

            input.value = value;
            input.readOnly = true;

            cell.appendChild(input);
        });

        row.dataset.sectionId = member.sectionId || "";
    });
}


// =====================================================
// RESTORE PROJECT DATA
// =====================================================

function restoreProjectData(data) {

    validateProjectData(data);

    const model = data.model;
    const settings = data.settings;
    const d2d = window.drawing2D;

    // Model databases
    window.nodeDatabase = structuredClone(model.nodes);
    window.nodeSequence = Number(model.nodeSequence) || 1;

    materialDatabase = structuredClone(model.materials);
    sectionDatabase = structuredClone(model.sections);
    betaDatabase = structuredClone(model.beta);

    supportDatabase = structuredClone(model.supports);
    loadDatabase = structuredClone(model.loads);

    // Member tables
    restoreMemberTable("beamsTable", model.beams);
    restoreMemberTable("columnsTable", model.columns);

    // Drawing settings
    d2d.gridMode = settings.gridMode;
    d2d.grid = structuredClone(settings.grid);
    d2d.gridSettings = structuredClone(settings.gridSettings);
    d2d.storySettings = structuredClone(settings.storySettings);
    d2d.floor = settings.floor;
    d2d.gridVisible = settings.gridVisible;

    window.activeMemberSectionId =
        settings.activeMemberSectionId;

    // Synchronize grid input fields
    const grid = d2d.grid;

    const gridInputs = {
        gridXSpacing: grid.xSpacing,
        gridZSpacing: grid.zSpacing,
        gridXCount: grid.xCount,
        gridZCount: grid.zCount
    };

    Object.entries(gridInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);
        if (input) input.value = value;
    });

    // Refresh existing UI
    renderMemberSectionDropdown();
    renderMaterialTable();
    renderSectionTable();

    renderDrawing2DNodeTable();
    renderDrawing2DNodes();
    renderDrawing2DMembers();

    renderSupportCards();
    renderLoadCards();

    // Restore floor dropdown
    const floorSelect = document.getElementById("drawing2DFloor");

    if (floorSelect) {
        floorSelect.innerHTML = "";

        d2d.storySettings.stories.forEach(story => {
            const option = document.createElement("option");
            option.value = story.id;
            option.textContent = story.name;
            floorSelect.appendChild(option);
        });

        floorSelect.value = d2d.floor;
    }

    // Redraw grid
    drawDrawing2DGrid();

    if (typeof refreshView === "function") {
        refreshView();
    }
}


// =====================================================
// IMPORT JSON
// =====================================================

async function importProjectJSON(event) {

    const file = event.target.files[0];

    if (!file) return;

    try {
        const text = await file.text();
        const data = JSON.parse(text);

        validateProjectData(data);

        if (!confirm("Open this project?")) {
            return;
        }

        const projectName = file.name.replace(/\.str$/i, "");

        // Create a new SQLite project
        const response = await fetch("/api/projects", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({
                name: projectName,
                project: data
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || "Could not create project.");
        }

        // Restore imported project
        restoreProjectData(data);

        currentProjectId = result.id;
        currentProjectName = projectName;

        setProjectSaveState("saved");

        alert("Project opened successfully.");

        await openProjectList();

    } catch (error) {
        console.error(error);
        alert("Project opening failed: " + error.message);

    } finally {
        event.target.value = "";
    }
}