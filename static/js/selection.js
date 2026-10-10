
/* =====================================================
   SHARED STRUCTURAL SELECTION
   ===================================================== */

window.structuralSelection = {
    type: null,       // "member" or "node"
    memberType: null, // "beam" or "column"
    id: null,
    start: null,
    end: null
};

const SELECTION_COLORS = {
    member: 0xff2020,      // Red in drawing
    node: 0xff2020,
    table: "#cfe8ff"       // Light blue in tables
};


/* =====================================================
   SELECT A MEMBER OR NODE
   ===================================================== */

function selectStructuralMember(type, id, start, end) {
    window.structuralSelection = {
        type: "member",
        memberType: type,
        id: String(id),
        start: String(start),
        end: String(end)
    };

    refreshStructuralSelection();
}

function selectStructuralNode(id) {
    window.structuralSelection = {
        type: "node",
        memberType: null,
        id: String(id),
        start: null,
        end: null
    };

    refreshStructuralSelection();
}

function clearStructuralSelection() {
    window.structuralSelection = {
        type: null,
        memberType: null,
        id: null,
        start: null,
        end: null
    };

    refreshStructuralSelection();
}


/* =====================================================
   TABLE ROW HELPERS
   ===================================================== */

function getStructuralTableRow(tableId, id) {
    const table = document.getElementById(tableId);
    if (!table) return null;

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];
        const value = row.cells[0]
            ?.querySelector("input")
            ?.value;

        if (String(value) === String(id)) {
            return row;
        }
    }

    return null;
}

function refreshStructuralTableSelection() {
    const tableIds = [
        "nodesTable",
        "beamsTable",
        "columnsTable"
    ];

    tableIds.forEach(tableId => {
        const table = document.getElementById(tableId);
        if (!table) return;

        Array.from(table.rows).forEach((row, index) => {
            if (index === 0) return;
            row.classList.remove("structural-row-selected");
        });
    });

    const selection = window.structuralSelection;
    if (!selection.type) return;

    if (selection.type === "node") {
        getStructuralTableRow("nodesTable", selection.id)
            ?.classList.add("structural-row-selected");
        return;
    }

    const memberTable =
        selection.memberType === "column"
            ? "columnsTable"
            : "beamsTable";

    getStructuralTableRow(memberTable, selection.id)
        ?.classList.add("structural-row-selected");

    // Highlight the two endpoint node rows as well.
    getStructuralTableRow("nodesTable", selection.start)
        ?.classList.add("structural-row-selected");

    getStructuralTableRow("nodesTable", selection.end)
        ?.classList.add("structural-row-selected");
}


/* =====================================================
   RESTORE 2D DRAWING COLOURS, THEN APPLY SELECTION
   ===================================================== */

function refreshStructural2DSelection() {
    const memberGroup = window.drawing2DMemberState?.group;
    const nodeGroup = window.drawing2DNodeState?.group;
    const selection = window.structuralSelection;

    if (memberGroup) {
        memberGroup.children.forEach(object => {
            const data = object.userData || {};

            if (data.type === "member") {
                object.material.color.set(0x263238);
            } else if (data.type === "column") {
                object.material.color.set(0x263238);
            }
        });
    }

    if (nodeGroup) {
        nodeGroup.children.forEach(object => {
            if (object.userData?.type === "node") {
                object.material.color.set(0x1565c0);
            }
        });
    }

    if (!selection.type) return;

    const selectedNodeIds = new Set();

    if (selection.type === "node") {
        selectedNodeIds.add(String(selection.id));
    } else {
        selectedNodeIds.add(String(selection.start));
        selectedNodeIds.add(String(selection.end));
    }

    if (nodeGroup) {
        nodeGroup.children.forEach(object => {
            const data = object.userData || {};

            if (
                data.type === "node" &&
                selectedNodeIds.has(String(data.nodeId))
            ) {
                object.material.color.set(SELECTION_COLORS.node);
            }
        });
    }

    if (selection.type === "member" && memberGroup) {
        memberGroup.children.forEach(object => {
            const data = object.userData || {};

            const isSelected =
                String(data.memberId) === String(selection.id) &&
                (
                    (selection.memberType === "beam" &&
                        data.type === "member") ||
                    (selection.memberType === "column" &&
                        data.type === "column")
                );

            if (isSelected) {
                object.material.color.set(SELECTION_COLORS.member);
            }
        });
    }
}


/* =====================================================
   APPLY SELECTION TO THE 3D MODEL
   ===================================================== */

function refreshStructural3DSelection() {
    const selection = window.structuralSelection;

    const memberGroup = window.threeMemberGroup;
    const nodeGroup = window.threeNodeGroup;

    if (memberGroup) {
        memberGroup.traverse(object => {
            const data = object.userData || {};
            if (!object.material?.color) return;

            if (
                data.type === "member" ||
                data.type === "memberLabel"
            ) {
                if (data.type === "member") {
                    object.material.color.set(0x444444);
                }
            }
        });
    }

    if (nodeGroup) {
        nodeGroup.traverse(object => {
            const data = object.userData || {};

            if (
                data.type === "node" &&
                object.material?.color
            ) {
                object.material.color.set(0x1565c0);
            }
        });
    }

    if (!selection.type) return;

    const selectedNodeIds = new Set();

    if (selection.type === "node") {
        selectedNodeIds.add(String(selection.id));
    } else {
        selectedNodeIds.add(String(selection.start));
        selectedNodeIds.add(String(selection.end));
    }

    if (nodeGroup) {
        nodeGroup.traverse(object => {
            const data = object.userData || {};

            if (
                data.type === "node" &&
                selectedNodeIds.has(String(data.id)) &&
                object.material?.color
            ) {
                object.material.color.set(SELECTION_COLORS.node);
            }
        });
    }

    if (selection.type === "member" && memberGroup) {
        memberGroup.traverse(object => {
            const data = object.userData || {};
            if (!object.material?.color) return;

            const matchesMember =
                String(data.name) === String(selection.id) ||
                String(data.memberId) === String(selection.id);

            const matchesEndpoints =
                String(data.start) === String(selection.start) &&
                String(data.end) === String(selection.end);

            if (
                data.type === "member" &&
                (matchesMember || matchesEndpoints)
            ) {
                object.material.color.set(SELECTION_COLORS.member);
            }
        });
    }
}


/* =====================================================
   REFRESH ALL VIEWS
   ===================================================== */

function refreshStructuralSelection() {
    refreshStructuralTableSelection();
    refreshStructural2DSelection();
    refreshStructural3DSelection();
}


/* =====================================================
   SELECT OBJECT IN 2D DRAWING
   ===================================================== */

function handleStructural2DSelectionClick(event) {
    const drawing = window.drawing2D;

    if (
        !drawing ||
        drawing.activeTool !== "select" ||
        !drawing.camera ||
        !drawing.renderer
    ) {
        return;
    }

    // Ignore clicks that are part of a rectangle drag.
    if (window.drawing2DMemberState?.rectangleDrag?.moved) {
        return;
    }

    const canvas = drawing.renderer.domElement;
    const rect = canvas.getBoundingClientRect();

    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.18;
    raycaster.setFromCamera(mouse, drawing.camera);

    const memberGroup = window.drawing2DMemberState?.group;
    const nodeGroup = window.drawing2DNodeState?.group;

    const groups = [memberGroup, nodeGroup].filter(Boolean);
    const hits = raycaster.intersectObjects(groups, true);

    const hit = hits.find(item => {
        const data = item.object.userData || {};
        return (
            data.type === "node" ||
            data.type === "member" ||
            data.type === "column"
        );
    });

    if (!hit) {
        clearStructuralSelection();
        return;
    }

    const data = hit.object.userData || {};

    if (data.type === "node") {
        selectStructuralNode(data.nodeId);
        return;
    }

    if (data.type === "member") {
        selectStructuralMember(
            "beam",
            data.memberId,
            data.start,
            data.end
        );
        return;
    }

    if (data.type === "column") {
        selectStructuralMember(
            "column",
            data.columnId,
            data.start,
            data.end
        );
    }
}


/* =====================================================
   SELECT OBJECT FROM TABLE ROW
   ===================================================== */

function initialiseStructuralTableSelection() {
    const nodeTable = document.getElementById("nodesTable");
    const beamTable = document.getElementById("beamsTable");
    const columnTable = document.getElementById("columnsTable");

    if (nodeTable) {
        nodeTable.addEventListener("click", event => {
            if (event.target.closest("button")) return;

            const row = event.target.closest("tr");
            if (!row || row.rowIndex === 0) return;

            const id = row.cells[0]
                ?.querySelector("input")
                ?.value;

            if (id) selectStructuralNode(id);
        });
    }

    [
        { table: beamTable, type: "beam" },
        { table: columnTable, type: "column" }
    ].forEach(({ table, type }) => {
        if (!table) return;

        table.addEventListener("click", event => {
            if (event.target.closest("button")) return;

            const row = event.target.closest("tr");
            if (!row || row.rowIndex === 0) return;

            const id = row.cells[0]
                ?.querySelector("input")
                ?.value;

            const start = row.cells[1]
                ?.querySelector("input")
                ?.value;

            const end = row.cells[2]
                ?.querySelector("input")
                ?.value;

            if (id && start && end) {
                selectStructuralMember(type, id, start, end);
            }
        });
    });
}


/* =====================================================
   INITIALISE
   ===================================================== */

function initialiseStructuralSelection() {
    initialiseStructuralTableSelection();

    const canvas = document.getElementById("drawing2DCanvas");

    if (canvas) {
        canvas.addEventListener(
            "click",
            handleStructural2DSelectionClick
        );
    }

    refreshStructuralSelection();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initialiseStructuralSelection
    );
} else {
    initialiseStructuralSelection();
}
