// =====================================================
// 2D NODE SYSTEM
// drawing2D_nodes.js
//
// Nodes are created ONLY from grid intersections.
//
// X grid UID + Z grid UID + Story UID
// uniquely identifies a node location.
//
// Node ID (N1, N2...) is permanent.
// =====================================================


// =====================================================
// NODE DATABASE
// =====================================================

window.nodeDatabase = [];

window.nodeSequence = 1;


// =====================================================
// NODE GROUP
// =====================================================

window.drawing2DNodeState = {

    group: null,

    nodeRadius: 0.18,

    snapPixels: 14,

    initialized: false
};


// =====================================================
// UID GENERATOR
// =====================================================

function generateNodeUID() {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        "node_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)
    );
}


// =====================================================
// NEXT NODE ID
// =====================================================

function getNextNodeId() {

    const id =
        `N${window.nodeSequence}`;

    window.nodeSequence++;

    return id;
}


// =====================================================
// CREATE NODE GROUP
// =====================================================

function initializeDrawing2DNodeSystem() {

    if (
        window.drawing2DNodeState.initialized
    ) {
        return;
    }

    if (
        !window.drawing2D ||
        !window.drawing2D.scene
    ) {
        return;
    }

    const group =
        new THREE.Group();

    group.name =
        "drawing2DNodes";

    window.drawing2D.scene.add(group);

    window.drawing2DNodeState.group =
        group;

    window.drawing2DNodeState.initialized =
        true;

    renderDrawing2DNodes();
}


// =====================================================
// GET CURRENT STORY
// =====================================================

function getCurrentDrawing2DStory() {

    const storyId =
        window.drawing2D.floor;

    return (
        window.drawing2D
            ?.storySettings
            ?.stories
            ?.find(
                story =>
                    String(story.id) ===
                    String(storyId)
            )
    );
}


// =====================================================
// UPDATE NODE COORDINATES
//
// Coordinates are always derived from
// the referenced grid lines and story.
// =====================================================

function syncDrawing2DNodeCoordinates() {

    const grid =
        window.drawing2D.grid;

    const stories =
        window.drawing2D
            .storySettings
            .stories || [];


    window.nodeDatabase.forEach(
        node => {

            const xGrid =
                grid.xLines.find(
                    line =>
                        line.uid ===
                        node.xGridUid
                );

            const zGrid =
                grid.zLines.find(
                    line =>
                        line.uid ===
                        node.zGridUid
                );

            const story =
                stories.find(
                    item =>
                        item.id ===
                        node.storyUid
                );


            if (xGrid) {

                node.x =
                    Number(
                        xGrid.coordinate
                    );
            }


            if (zGrid) {

                node.z =
                    Number(
                        zGrid.coordinate
                    );
            }


            if (story) {

                node.y =
                    Number(
                        story.y
                    );
            }
        }
    );
}


// =====================================================
// CREATE NODE
// =====================================================

function createDrawing2DNode(
    xGrid,
    zGrid,
    story
) {

    if (
        !xGrid ||
        !zGrid ||
        !story
    ) {
        return null;
    }


    // ---------------------------------------------
    // Prevent duplicate node on same floor
    // ---------------------------------------------

    const existing =
        window.nodeDatabase.find(
            node =>
                node.xGridUid ===
                    xGrid.uid &&
                node.zGridUid ===
                    zGrid.uid &&
                node.storyUid ===
                    story.id
        );


    if (existing) {

        return existing;
    }


    const node = {

        uid:
            generateNodeUID(),

        nodeId:
            getNextNodeId(),

        xGridUid:
            xGrid.uid,

        zGridUid:
            zGrid.uid,

        storyUid:
            story.id,

        x:
            Number(xGrid.coordinate),

        y:
            Number(story.y),

        z:
            Number(zGrid.coordinate)
    };


    window.nodeDatabase.push(node);


    if (!window.drawing2DMemberState?.batchCreating) {

        renderDrawing2DNodeTable();

        renderDrawing2DNodes();

        if (typeof refreshView === "function") {
            refreshView();
        }
    }


    return node;
}


// =====================================================
// WORLD POSITION FROM MOUSE
// =====================================================

function getDrawing2DMouseWorldPoint(
    event
) {

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;

    const camera =
        window.drawing2D
            ?.camera;


    if (
        !canvas ||
        !camera
    ) {
        return null;
    }


    const rect =
        canvas.getBoundingClientRect();


    const mouse =
        new THREE.Vector2(

            (
                (event.clientX - rect.left) /
                rect.width
            ) * 2 - 1,

            -(
                (event.clientY - rect.top) /
                rect.height
            ) * 2 + 1
        );


    const raycaster =
        new THREE.Raycaster();


    raycaster.setFromCamera(
        mouse,
        camera
    );


    const plane =
        new THREE.Plane(
            new THREE.Vector3(
                0,
                1,
                0
            ),
            0
        );


    const point =
        new THREE.Vector3();


    if (
        !raycaster.ray.intersectPlane(
            plane,
            point
        )
    ) {
        return null;
    }


    return point;
}


// =====================================================
// FIND NEAREST GRID INTERSECTION
// =====================================================

function findDrawing2DGridIntersection(
    point
) {

    const grid =
        window.drawing2D.grid;


    if (
        !grid ||
        !grid.xLines?.length ||
        !grid.zLines?.length
    ) {
        return null;
    }


    const canvas =
        window.drawing2D
            .renderer
            .domElement;


    const worldPerPixel =
        (
            window.drawing2D.camera.top -
            window.drawing2D.camera.bottom
        ) /
        Math.max(
            canvas.clientHeight,
            1
        );


    const snapDistance =
        worldPerPixel *
        window.drawing2DNodeState
            .snapPixels;


    let nearestX = null;
    let nearestXDistance = Infinity;


    grid.xLines.forEach(
        line => {

            const distance =
                Math.abs(
                    Number(line.coordinate) -
                    point.x
                );


            if (
                distance <
                nearestXDistance
            ) {

                nearestXDistance =
                    distance;

                nearestX =
                    line;
            }
        }
    );


    let nearestZ = null;
    let nearestZDistance = Infinity;


    grid.zLines.forEach(
        line => {

            const distance =
                Math.abs(
                    Number(line.coordinate) -
                    point.z
                );


            if (
                distance <
                nearestZDistance
            ) {

                nearestZDistance =
                    distance;

                nearestZ =
                    line;
            }
        }
    );


    if (
        !nearestX ||
        !nearestZ
    ) {
        return null;
    }


    if (
        nearestXDistance >
            snapDistance ||
        nearestZDistance >
            snapDistance
    ) {
        return null;
    }


    return {

        xGrid: nearestX,

        zGrid: nearestZ
    };
}



// =====================================================
// CREATE NODE VISUAL
// =====================================================

function createDrawing2DNodeVisual(
    node
) {

    const geometry =
        new THREE.CircleGeometry(
            window.drawing2DNodeState
                .nodeRadius,
            24
        );


    const material =
        new THREE.MeshBasicMaterial({

            color: 0x1565c0,

            side:
                THREE.DoubleSide
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.rotation.x =
        -Math.PI / 2;


    mesh.position.set(

        Number(node.x),

        0.04,

        Number(node.z)
    );


    mesh.userData = {

        type: "node",

        nodeId:
            node.nodeId,

        uid:
            node.uid
    };


    return mesh;
}


// =====================================================
// RENDER NODES FOR CURRENT FLOOR
// =====================================================

function renderDrawing2DNodes() {

    const state =
        window.drawing2DNodeState;


    if (!state.group) {
        return;
    }


    // ---------------------------------------------
    // Clear previous visuals
    // ---------------------------------------------

    while (
        state.group.children.length
    ) {

        const object =
            state.group.children.pop();


        if (object.geometry) {
            object.geometry.dispose();
        }


        if (object.material) {

            if (
                Array.isArray(
                    object.material
                )
            ) {

                object.material.forEach(
                    material =>
                        material.dispose()
                );

            } else {

                object.material.dispose();
            }
        }
    }


    syncDrawing2DNodeCoordinates();


    const currentFloor =
        window.drawing2D.floor;


    const floorNodes =
        window.nodeDatabase.filter(
            node =>
                String(node.storyUid) ===
                String(currentFloor)
        );


    floorNodes.forEach(
        node => {

            const visual =
                createDrawing2DNodeVisual(
                    node
                );

            state.group.add(
                visual
            );
        }
    );
}


// =====================================================
// RENDER NODE TABLE
// =====================================================

function renderDrawing2DNodeTable() {

    const table =
        document.getElementById(
            "nodesTable"
        );


    if (!table) {
        return;
    }


    syncDrawing2DNodeCoordinates();


    table.innerHTML = `

        <tr>

            <th>ID</th>

            <th>X</th>

            <th>Y</th>

            <th>Z</th>

            <th></th>

        </tr>
    `;


    window.nodeDatabase.forEach(
        node => {

            const row =
                table.insertRow();


            row.innerHTML = `

                <td>

                    <input
                        value="${node.nodeId}"
                        readonly
                    >

                </td>


                <td>

                    <input
                        value="${Number(node.x).toFixed(3)}"
                        readonly
                    >

                </td>


                <td>

                    <input
                        value="${Number(node.y).toFixed(3)}"
                        readonly
                    >

                </td>


                <td>

                    <input
                        value="${Number(node.z).toFixed(3)}"
                        readonly
                    >

                </td>

            `;
        }
    );
}


// =====================================================
// DELETE NODE
// =====================================================

function deleteDrawing2DNode(
    nodeId
) {

    const node =
        window.nodeDatabase.find(
            item =>
                String(item.nodeId) ===
                String(nodeId)
        );


    if (!node) {
        return;
    }


    const members =
        typeof getMembers ===
        "function"
            ? getMembers().filter(
                member =>
                    String(member.start) ===
                        String(nodeId) ||
                    String(member.end) ===
                        String(nodeId)
            )
            : [];


    const supports =
        typeof supportDatabase !==
        "undefined"
            ? supportDatabase.filter(
                support =>
                    support.assignedNodes
                        ?.map(String)
                        .includes(
                            String(nodeId)
                        )
            )
            : [];


    const loads =
        typeof loadDatabase !==
        "undefined"
            ? loadDatabase.filter(
                load =>
                    load.category === "nodal" &&
                    load.assignedNodes
                        ?.map(String)
                        .includes(
                            String(nodeId)
                        )
            )
            : [];


    let message =
        `Delete Node ${nodeId}?`;


    if (
        members.length ||
        supports.length ||
        loads.length
    ) {

        message +=
            `\n\nThis node is referenced by ` +
            `${members.length} member(s), ` +
            `${supports.length} support(s), ` +
            `${loads.length} nodal load(s).`;
    }


    if (
        !confirm(message)
    ) {
        return;
    }


    // ---------------------------------------------
    // Remove node
    // ---------------------------------------------

    window.nodeDatabase =
        window.nodeDatabase.filter(
            item =>
                item.nodeId !==
                nodeId
        );


    // ---------------------------------------------
    // Remove node from supports
    // ---------------------------------------------

    if (
        typeof supportDatabase !==
        "undefined"
    ) {

        supportDatabase.forEach(
            support => {

                support.assignedNodes =
                    (
                        support.assignedNodes ||
                        []
                    ).filter(
                        id =>
                            String(id) !==
                            String(nodeId)
                    );
            }
        );
    }


    // ---------------------------------------------
    // Remove node from nodal loads
    // ---------------------------------------------

    if (
        typeof loadDatabase !==
        "undefined"
    ) {

        loadDatabase.forEach(
            load => {

                if (
                    load.category ===
                    "nodal"
                ) {

                    load.assignedNodes =
                        (
                            load.assignedNodes ||
                            []
                        ).filter(
                            id =>
                                String(id) !==
                                String(nodeId)
                        );
                }
            }
        );
    }


    renderDrawing2DNodeTable();

    renderDrawing2DNodes();


    if (
        typeof renderSupportCards ===
        "function"
    ) {
        renderSupportCards();
    }


    if (
        typeof renderLoadCards ===
        "function"
    ) {
        renderLoadCards();
    }


    if (
        typeof refreshView ===
        "function"
    ) {
        refreshView();
    }
}


// =====================================================
// GRID CHANGE → UPDATE NODES
// =====================================================

function refreshDrawing2DNodes() {

    syncDrawing2DNodeCoordinates();

    renderDrawing2DNodeTable();

    renderDrawing2DNodes();
}


// =====================================================
// NODE TOOL CURSOR
// =====================================================

function updateDrawing2DNodeToolState(
    tool
) {

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;


    if (!canvas) {
        return;
    }


    // Node tool no longer creates nodes.
    // Member tool controls the modeling cursor.

    if (
        tool === "node"
    ) {

        canvas.style.cursor =
            "default";

        return;
    }


    if (
        tool !== "member"
    ) {

        canvas.style.cursor =
            "default";
    }
}


// =====================================================
// STARTUP
// =====================================================

document.addEventListener(
    "DOMContentLoaded",
    () => {

        const initialize =
            () => {

                if (
                    !window.drawing2D ||
                    !window.drawing2D.renderer
                ) {

                    setTimeout(
                        initialize,
                        50
                    );

                    return;
                }


                initializeDrawing2DNodeSystem();

                updateDrawing2DNodeToolState(
                    window.drawing2D.activeTool
                );
            };


        initialize();
    }
);