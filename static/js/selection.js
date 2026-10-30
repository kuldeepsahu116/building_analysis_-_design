
/* =====================================================
   SHARED STRUCTURAL SELECTION
   ===================================================== */

window.structuralSelection = {
    type: null,        // "node" or "member"
    memberType: null,  // "beam" or "column"
    id: null,
    start: null,
    end: null
};

const STRUCTURAL_SELECTION_COLORS = {
    selected: 0xff2020,
    beam2D: 0x263238,
    column2D: 0x263238,
    node2D: 0x1565c0,
    member3D: 0x444444,
    node3D: 0x1565c0,
    table: "#cfe8ff"
};




/* =====================================================
   TOOL STATE
   ===================================================== */

function isStructuralSelectToolActive() {
    return window.drawing2D?.activeTool === "select";
}


/* =====================================================
   SELECTION ENTRY POINTS
   ===================================================== */


window.structuralSelection = {
    items: []
};

function getStructuralSelectionKey(item) {
    return item.type === "node"
        ? `node:${item.id}`
        : `member:${item.memberType}:${item.id}`;
}

function setStructuralSelection(items, additive = false) {
    const current = window.structuralSelection.items || [];
    const map = new Map();

    if (additive) {
        current.forEach(item => {
            map.set(getStructuralSelectionKey(item), item);
        });
    }

    items.forEach(item => {
        const key = getStructuralSelectionKey(item);

        if (additive && map.has(key)) {
            // Ctrl + click toggles an item off if already selected.
            map.delete(key);
        } else {
            map.set(key, item);
        }
    });

    window.structuralSelection.items = [...map.values()];
    refreshStructuralSelection();

    if (typeof updateMemberPropertyPanel === "function") {
    updateMemberPropertyPanel();
}
}


function selectStructuralMember(
    type,
    id,
    start,
    end,
    additive = false
) {
    if (!isStructuralSelectToolActive()) return;

    const members =
        typeof getDrawing2DMembersFromTable === "function"
            ? getDrawing2DMembersFromTable()
            : [];

    const nodes = window.nodeDatabase || [];
    const nodeById = new Map(
        nodes.map(node => [String(node.nodeId), node])
    );

    const clickedMember = members.find(member =>
        member.type === type &&
        String(member.id) === String(id)
    );

    // Fall back to the clicked visual's identifiers if the row
    // could not be found in the table.
    const clickedStart =
        nodeById.get(String(start));

    const clickedEnd =
        nodeById.get(String(end));

    const selectedItems = [];

    function samePlanPoint(a, b) {
        return (
            a && b &&
            Math.abs(Number(a.x) - Number(b.x)) < 1e-6 &&
            Math.abs(Number(a.z) - Number(b.z)) < 1e-6
        );
    }

    function sameBeamSegment(a1, a2, b1, b2) {
        return (
            (samePlanPoint(a1, b1) && samePlanPoint(a2, b2)) ||
            (samePlanPoint(a1, b2) && samePlanPoint(a2, b1))
        );
    }

    const allStories =
        window.drawing2DStoryScope === "all";

    if (!allStories) {
        selectedItems.push({
            type: "member",
            memberType: type,
            id: String(id),
            start: String(start),
            end: String(end)
        });
    } else {
        const referenceStart =
            clickedMember
                ? nodeById.get(String(clickedMember.start))
                : clickedStart;

        const referenceEnd =
            clickedMember
                ? nodeById.get(String(clickedMember.end))
                : clickedEnd;

        if (referenceStart && referenceEnd) {
            members.forEach(member => {
                if (member.type !== type) return;

                const memberStart =
                    nodeById.get(String(member.start));

                const memberEnd =
                    nodeById.get(String(member.end));

                if (!memberStart || !memberEnd) return;

                let matches = false;

                if (type === "beam") {
                    // Match the same grid segment on every story.
                    matches = sameBeamSegment(
                        referenceStart,
                        referenceEnd,
                        memberStart,
                        memberEnd
                    );
                } else {
                    // Match columns at the same plan intersection.
                    matches = samePlanPoint(
                        referenceStart,
                        memberStart
                    );
                }

                if (matches) {
                    selectedItems.push({
                        type: "member",
                        memberType: member.type,
                        id: String(member.id),
                        start: String(member.start),
                        end: String(member.end)
                    });
                }
            });
        }

        // Keep the visible clicked member selected if it was not
        // found through the table lookup.
        if (!selectedItems.length) {
            selectedItems.push({
                type: "member",
                memberType: type,
                id: String(id),
                start: String(start),
                end: String(end)
            });
        }
    }

    setStructuralSelection(selectedItems, additive);
}


function selectStructuralNode(id, additive = false) {
    if (!isStructuralSelectToolActive()) return;

    setStructuralSelection([{
        type: "node",
        id: String(id)
    }], additive);
}

function clearStructuralSelection() {
    window.structuralSelection.items = [];
    refreshStructuralSelection();

    if (typeof updateMemberPropertyPanel === "function") {
        updateMemberPropertyPanel();
    }

}


/* =====================================================
   TABLE HELPERS
   ===================================================== */

function getStructuralTableRow(tableId, id) {
    const table = document.getElementById(tableId);
    if (!table) return null;

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        const value =
            row.cells[0]?.querySelector("input")?.value ??
            row.cells[0]?.textContent?.trim();

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

        Array.from(table.rows).forEach(row => {
            row.classList.remove("structural-row-selected");
        });
    });

    if (!isStructuralSelectToolActive()) return;

    const items = window.structuralSelection.items || [];

    items.forEach(item => {
        if (item.type === "node") {
            getStructuralTableRow("nodesTable", item.id)
                ?.classList.add("structural-row-selected");
            return;
        }

        const tableId = item.memberType === "column"
            ? "columnsTable"
            : "beamsTable";

        getStructuralTableRow(tableId, item.id)
            ?.classList.add("structural-row-selected");

        getStructuralTableRow("nodesTable", item.start)
            ?.classList.add("structural-row-selected");

        getStructuralTableRow("nodesTable", item.end)
            ?.classList.add("structural-row-selected");
    });
}



/* =====================================================
   MATERIAL COLOUR HELPER
   ===================================================== */


function setStructuralObjectColor(object, color) {
    if (!object?.material) return;

    const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

    materials.forEach(material => {
        if (!material?.color) return;

        // Save the material's original color only once.
        // Do not overwrite it with the selection highlight.
        material.userData = material.userData || {};

        if (material.userData.structuralOriginalColor === undefined) {
            material.userData.structuralOriginalColor =
                material.color.getHex();
        }

        material.color.setHex(color);
    });
}

function restoreStructuralObjectColor(object) {
    if (!object?.material) return;

    const materials = Array.isArray(object.material)
        ? object.material
        : [object.material];

    materials.forEach(material => {
        const originalColor =
            material?.userData?.structuralOriginalColor;

        if (
            material?.color &&
            originalColor !== undefined
        ) {
            material.color.setHex(originalColor);
        }
    });
}



/* =====================================================
   2D HIGHLIGHTING
   ===================================================== */

function refreshStructural2DSelection() {
    const memberGroup = window.drawing2DMemberState?.group;
    const nodeGroup = window.drawing2DNodeState?.group;

    const isLoadPage =
        typeof currentPage !== "undefined" &&
        typeof PAGES !== "undefined" &&
        currentPage === PAGES.LOAD;

    // -------------------------------------------------
    // 1. RESET BASE COLOURS
    // -------------------------------------------------

    memberGroup?.children.forEach(object => {
        const type = object.userData?.type;

        if (type === "member" || type === "column") {
            setStructuralObjectColor(
                object,
                type === "column"
                    ? STRUCTURAL_SELECTION_COLORS.column2D
                    : STRUCTURAL_SELECTION_COLORS.beam2D
            );
        }
    });

    nodeGroup?.children.forEach(object => {
        if (object.userData?.type === "node") {
            setStructuralObjectColor(
                object,
                STRUCTURAL_SELECTION_COLORS.node2D
            );
        }
    });

    // -------------------------------------------------
    // 2. NORMAL STRUCTURAL SELECTION
    // -------------------------------------------------

    const structuralItems = isLoadPage
        ? []
        : (window.structuralSelection.items || []);

    const selectedKeys = new Set(
        structuralItems.map(getStructuralSelectionKey)
    );

    const selectedNodeIds = new Set();

    structuralItems.forEach(item => {
        if (item.type === "node") {
            selectedNodeIds.add(String(item.id));
        } else {
            selectedNodeIds.add(String(item.start));
            selectedNodeIds.add(String(item.end));
        }
    });

    // -------------------------------------------------
    // 3. SUPPORT ASSIGNMENT SELECTION
    // -------------------------------------------------

    if (
        !isLoadPage &&
        typeof supportAssignmentMode !== "undefined" &&
        supportAssignmentMode === "mouse" &&
        Array.isArray(supportMouseSelectedNodes)
    ) {
        supportMouseSelectedNodes.forEach(nodeId => {
            selectedNodeIds.add(String(nodeId));
        });
    }

    // -------------------------------------------------
    // 4. LOAD ASSIGNMENT STATE
    // -------------------------------------------------

    const load =
        typeof loadDatabase !== "undefined" &&
        typeof selectedLoadIndex !== "undefined" &&
        selectedLoadIndex >= 0
            ? loadDatabase[selectedLoadIndex]
            : null;

    const loadMouseActive =
        isLoadPage &&
        loadAssignmentMode === "mouse" &&
        !!load;

    const loadSelectedMemberIds = new Set();

    if (loadMouseActive) {
        if (load.category === "nodal") {
            (loadMouseSelectedNodes || []).forEach(nodeId => {
                selectedNodeIds.add(String(nodeId));
            });
        } else {
            (loadMouseSelectedMembers || []).forEach(memberId => {
                loadSelectedMemberIds.add(String(memberId));
            });
        }
    }

    // -------------------------------------------------
    // 5. HIGHLIGHT MEMBERS
    // -------------------------------------------------

    memberGroup?.children.forEach(object => {
        const data = object.userData || {};

        if (data.type !== "member" && data.type !== "column") {
            return;
        }

        const type = data.type === "column"
            ? "column"
            : "beam";

        const id = type === "column"
            ? data.columnId
            : data.memberId;

        const key = `member:${type}:${id}`;

        const isStructurallySelected =
            selectedKeys.has(key);

        const isLoadSelected =
            loadMouseActive &&
            load.category !== "nodal" &&
            loadSelectedMemberIds.has(String(id));

        if (isStructurallySelected || isLoadSelected) {
            setStructuralObjectColor(
                object,
                STRUCTURAL_SELECTION_COLORS.selected
            );
        }
    });

    // -------------------------------------------------
    // 6. HIGHLIGHT NODES
    // -------------------------------------------------

    nodeGroup?.children.forEach(object => {
        const data = object.userData || {};

        if (
            data.type === "node" &&
            selectedNodeIds.has(String(data.nodeId))
        ) {
            setStructuralObjectColor(
                object,
                STRUCTURAL_SELECTION_COLORS.selected
            );
        }
    });
}


/* =====================================================
   3D HIGHLIGHTING
   ===================================================== */

function refreshStructural3DSelection() {
    const memberGroup = window.threeMemberGroup;
    const nodeGroup = window.threeNodeGroup;
    
    if (memberGroup) {
        memberGroup.traverse(object => {
            const data = object.userData || {};

            if (
                data.type === "member" ||
                data.type === "section3DMember"
            ) {
                restoreStructuralObjectColor(object);
            }
        });
    }

    if (nodeGroup) {
        nodeGroup.traverse(object => {
            if (object.userData?.type === "node") {
                restoreStructuralObjectColor(object);
            }
        });
    }


    const items = window.structuralSelection.items || [];
    const selectedMemberKeys = new Set();
    const selectedNodeIds = new Set();

    items.forEach(item => {
        if (item.type === "node") {
            selectedNodeIds.add(String(item.id));
        } else {
            selectedMemberKeys.add(
                `member:${item.memberType}:${item.id}`
            );
            selectedNodeIds.add(String(item.start));
            selectedNodeIds.add(String(item.end));
        }
    });

    // SUPPORT ASSIGNMENT SELECTION
    if (
        typeof supportAssignmentMode !==
            "undefined" &&
        supportAssignmentMode === "mouse" &&
        Array.isArray(supportMouseSelectedNodes)
    ) {

        supportMouseSelectedNodes.forEach(
            nodeId => {selectedNodeIds.add(
                    String(nodeId));}
        );
    }

    if (memberGroup) {
        memberGroup.traverse(object => {
            const data = object.userData || {};

            if (
                data.type !== "member" &&
                data.type !== "section3DMember"
            ) {
                return;
            }

            const id = String(
                data.name ??
                data.memberId ??
                data.member ??
                ""
            );

            // Prefer the explicit member type stored on the object.
            const memberType = String(
                data.memberType ?? ""
            ).toLowerCase();

            // Match by ID first, then by type when available.
            const isSelected = [...selectedMemberKeys].some(key => {
                const parts = key.split(":");
                const selectedType = parts[1];
                const selectedId = parts.slice(2).join(":");

                if (selectedId !== id) {
                    return false;
                }

                // Rendered sections can be highlighted by ID because
                // they represent the same structural member.
                if (data.type === "section3DMember") {
                    return true;
                }

                // If the wireframe object has no type metadata,
                // fall back to its member ID.
                if (!memberType) {
                    return true;
                }

                return selectedType === memberType;
            });

            if (isSelected) {
                setStructuralObjectColor(
                    object,
                    STRUCTURAL_SELECTION_COLORS.selected
                );
            }
        });
    }

    if (nodeGroup) {
        nodeGroup.traverse(object => {
            const data = object.userData || {};
            const id = data.nodeId ?? data.id;

            if (
                data.type === "node" &&
                selectedNodeIds.has(String(id))
            ) {
                setStructuralObjectColor(
                    object,
                    STRUCTURAL_SELECTION_COLORS.selected
                );
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
   2D CANVAS CLICK SELECTION
   ===================================================== */


function handleStructural2DPointerUp(event) {
    if (!isStructuralSelectToolActive()) return;

    const rectangleState =
        window.drawing2DMemberState?.rectangleDrag;

    if (rectangleState?.moved) {
        return;
    }

    // Only respond to the primary mouse button or a touch interaction.
    if (event.pointerType === "mouse" && event.button !== 0) {
        return;
    }

    const drawing = window.drawing2D;
    const canvas = drawing?.renderer?.domElement;

    if (
        !canvas ||
        !drawing.camera ||
        !drawing.scene ||
        typeof THREE === "undefined"
    ) {
        return;
    }

    // Ignore a pointer gesture that moved/panned the drawing.
    if (window.structural2DPointerDown) {
        const down = window.structural2DPointerDown;
        window.structural2DPointerDown = null;

        const dx = event.clientX - down.x;
        const dy = event.clientY - down.y;

        if (Math.hypot(dx, dy) > 5) return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.35;

    raycaster.setFromCamera(mouse, drawing.camera);

    const memberGroup = window.drawing2DMemberState?.group;
    const nodeGroup = window.drawing2DNodeState?.group;

    const targets = [memberGroup, nodeGroup].filter(Boolean);

    const intersections = raycaster.intersectObjects(targets, true);

    const hit = intersections.find(intersection => {
        const type = intersection.object.userData?.type;

        return ["node", "member", "column"].includes(type);
    });

    if (!hit) {
        if (!event.ctrlKey) {
            clearStructuralSelection();
        }
        return;
    }

    const object = hit.object;
    const data = object.userData || {};

    if (data.type === "node") {
        selectStructuralNode(data.nodeId, Boolean(event.ctrlKey));
        return;
    }

    if (data.type === "column") {
        selectStructuralMember(
            "column",
            data.columnId,
            data.start,
            data.end,
            Boolean(event.ctrlKey)
        );
        return;
    }

    if (data.type === "member") {
        selectStructuralMember(
            "beam",
            data.memberId,
            data.start,
            data.end,
            Boolean(event.ctrlKey)
        );
    }
}


/* =====================================================
   2D CANVAS DRAG SELECTION
   ===================================================== */


function structuralPointInBounds(x, z, bounds) {
    return (
        x >= bounds.minX &&
        x <= bounds.maxX &&
        z >= bounds.minZ &&
        z <= bounds.maxZ
    );
}

function structuralSegmentIntersectsBounds(a, b, bounds) {
    // Liang–Barsky line clipping.
    const dx = b.x - a.x;
    const dz = b.z - a.z;

    let t0 = 0;
    let t1 = 1;

    const p = [-dx, dx, -dz, dz];
    const q = [
        a.x - bounds.minX,
        bounds.maxX - a.x,
        a.z - bounds.minZ,
        bounds.maxZ - a.z
    ];

    for (let i = 0; i < 4; i++) {
        if (Math.abs(p[i]) < 1e-9) {
            if (q[i] < 0) return false;
            continue;
        }

        const t = q[i] / p[i];

        if (p[i] < 0) {
            t0 = Math.max(t0, t);
        } else {
            t1 = Math.min(t1, t);
        }

        if (t0 > t1) return false;
    }

    return true;
}


function selectStructuralItemsInBounds(bounds, additive = false) {
    if (!isStructuralSelectToolActive()) return;

    const items = [];
    const nodes = window.nodeDatabase || [];
    const nodeById = new Map(
        nodes.map(node => [String(node.nodeId), node])
    );

    const allStories =
        window.drawing2DStoryScope === "all";

    const currentFloor =
        String(window.drawing2D?.floor ?? "");

    // Story filter:
    // One Story -> only the displayed story.
    // All Stories -> members from every story.
    function isMemberOnAllowedStory(member, start, end) {
        if (allStories) return true;

        if (member.type === "beam") {
            return (
                String(start.storyUid) === currentFloor &&
                String(end.storyUid) === currentFloor
            );
        }

        // A column is represented in plan view by its start/lower node.
        return String(start.storyUid) === currentFloor;
    }

    // Select nodes inside the rectangle, respecting story scope.
    nodes.forEach(node => {
        if (
            (allStories ||
                String(node.storyUid) === currentFloor) &&
            structuralPointInBounds(
                Number(node.x),
                Number(node.z),
                bounds
            )
        ) {
            items.push({
                type: "node",
                id: String(node.nodeId)
            });
        }
    });

    const members =
        typeof getDrawing2DMembersFromTable === "function"
            ? getDrawing2DMembersFromTable()
            : [];

    members.forEach(member => {
        const start = nodeById.get(String(member.start));
        const end = nodeById.get(String(member.end));

        if (!start || !end) return;

        if (!isMemberOnAllowedStory(member, start, end)) {
            return;
        }

        const startInside = structuralPointInBounds(
            Number(start.x),
            Number(start.z),
            bounds
        );

        let fullyInside = false;

        if (member.type === "beam") {
            const endInside = structuralPointInBounds(
                Number(end.x),
                Number(end.z),
                bounds
            );

            // Do not select beams that only cross/touch the rectangle.
            fullyInside = startInside && endInside;
        } else {
            // Columns are represented by a point in the 2D plan.
            fullyInside = startInside;
        }

        if (!fullyInside) return;

        items.push({
            type: "member",
            memberType: member.type,
            id: String(member.id),
            start: String(member.start),
            end: String(member.end)
        });
    });

    setStructuralSelection(items, additive);
}



/* =====================================================
   TABLE CLICK SELECTION
   ===================================================== */

function initialiseStructuralTableSelection() {
    const nodeTable = document.getElementById("nodesTable");

    if (nodeTable) {
        nodeTable.addEventListener("click", event => {
            if (!isStructuralSelectToolActive()) return;
            if (event.target.closest("button")) return;

            const row = event.target.closest("tr");

            if (!row || row.parentElement.tagName === "THEAD") {
                return;
            }

            const id =
                row.cells[0]?.querySelector("input")?.value ??
                row.cells[0]?.textContent?.trim();

            if (id) {
                selectStructuralNode(id, Boolean(event.ctrlKey));
            }
        });
    }

    [
        { tableId: "beamsTable", type: "beam" },
        { tableId: "columnsTable", type: "column" }
    ].forEach(config => {
        const table = document.getElementById(config.tableId);
        if (!table) return;

        table.addEventListener("click", event => {
            if (!isStructuralSelectToolActive()) return;
            if (event.target.closest("button")) return;

            const row = event.target.closest("tr");

            if (!row || row.parentElement.tagName === "THEAD") {
                return;
            }

            const id =
                row.cells[0]?.querySelector("input")?.value;

            const start =
                row.cells[1]?.querySelector("input")?.value;

            const end =
                row.cells[2]?.querySelector("input")?.value;

            if (id && start && end) {
                selectStructuralMember(
                    config.type,
                    id,
                    start,
                    end,
                    Boolean(event.ctrlKey)
                );
            }
        });
    });
}


/* =====================================================
   INITIALISATION
   ===================================================== */

function initialiseStructuralSelection() {

    initialiseStructuralTableSelection();

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
