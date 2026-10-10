
/* =====================================================
   MEMBER SYSTEM — GLOBAL STATE AND CONFIGURATION
   ===================================================== */

window.drawing2DMemberState = {

    group: null,

    initialized: false,

    batchCreating: false,

    hoverSegment: null,

    hoverVisual: null,

    beamBetweenPointsStartNode: null,

    beamBetweenPointsPreview: null,

    rectangleDrag: {
        active: false,
        startClientX: 0,
        startClientY: 0,
        startWorldPoint: null,
        currentClientX: 0,
        currentClientY: 0,
        moved: false,
        previousControlsEnabled: true,
        preview: null,
        suppressNextClick: false
    }
};

window.drawing2DStoryScope = "one";


/* =====================================================
   STORY SCOPE AND STORY SELECTION
   ===================================================== */

function setDrawing2DStoryScope(scope) {
    window.drawing2DStoryScope =
        scope === "all" ? "all" : "one";

    // Cancel an unfinished point-to-point beam
    if (
        typeof clearDrawing2DBeamBetweenPointsPreview ===
        "function"
    ) {
        clearDrawing2DBeamBetweenPointsPreview();
    }

    if (
        typeof updateDrawing2DMemberToolState ===
        "function"
    ) {
        updateDrawing2DMemberToolState(
            window.drawing2D.activeTool
        );
    }

    const status =
        document.getElementById("drawing2DToolStatus");

    if (status) {
        status.innerText =
            window.drawing2DStoryScope === "all"
                ? "All Stories: new beams and columns will be created on every story"
                : "One Story: new members will be created on the selected floor";
    }
}

function getDrawing2DStoriesForCreation() {
    const stories =
        window.drawing2D?.storySettings?.stories || [];

    if (window.drawing2DStoryScope === "all") {
        return [...stories];
    }

    const currentStory =
        typeof getCurrentDrawing2DStory === "function"
            ? getCurrentDrawing2DStory()
            : null;

    return currentStory ? [currentStory] : [];
}


/* =====================================================
   MEMBER ID GENERATION
   ===================================================== */

function getNextDrawing2DBeamId() {

    const table =
        document.getElementById(
            "beamsTable"
        );


    if (!table) {

        return "B1";

    }


    let maxNumber = 0;


    for (
        let i = 1;
        i < table.rows.length;
        i++
    ) {

        const input =
            table.rows[i]
                ?.cells[0]
                ?.querySelector("input");


        if (!input) {

            continue;

        }


        const value =
            String(
                input.value
            ).trim();


        const match =
            value.match(
                /^B(\d+)$/i
            );


        if (match) {

            maxNumber =
                Math.max(
                    maxNumber,
                    Number(match[1])
                );

        }

    }


    return `B${maxNumber + 1}`;
}


function getNextDrawing2DColumnId() {

    const table =
        document.getElementById(
            "columnsTable"
        );


    if (!table) {

        return "C1";

    }


    let maxNumber = 0;


    for (
        let i = 1;
        i < table.rows.length;
        i++
    ) {

        const input =
            table.rows[i]
                ?.cells[0]
                ?.querySelector("input");


        if (!input) {

            continue;

        }


        const value =
            String(
                input.value
            ).trim();


        const match =
            value.match(
                /^C(\d+)$/i
            );


        if (match) {

            maxNumber =
                Math.max(
                    maxNumber,
                    Number(match[1])
                );

        }

    }


    return `C${maxNumber + 1}`;
}


/* =====================================================
   NODE AND MEMBER DATA ACCESS
   Read existing nodes and members.
   ===================================================== */

function getDrawing2DNodeById(
    nodeId
) {

    if (
        !window.nodeDatabase ||
        !Array.isArray(
            window.nodeDatabase
        )
    ) {

        return null;
    }


    return window.nodeDatabase.find(
        node =>
            String(node.nodeId) ===
            String(nodeId)
    ) || null;
}

function getDrawing2DMembersFromTable() {

    const members = [];


    const tables = [

        {
            table:
                document.getElementById(
                    "beamsTable"
                ),

            type: "beam"
        },

        {
            table:
                document.getElementById(
                    "columnsTable"
                ),

            type: "column"
        }

    ];


    tables.forEach(
        config => {

            const table =
                config.table;


            if (!table) {
                return;
            }


            for (
                let i = 1;
                i < table.rows.length;
                i++
            ) {

                const cells =
                    table.rows[i].cells;


                if (
                    !cells ||
                    cells.length < 3
                ) {
                    continue;
                }


                const idInput =
                    cells[0]
                        ?.querySelector(
                            "input"
                        );


                const startInput =
                    cells[1]
                        ?.querySelector(
                            "input"
                        );


                const endInput =
                    cells[2]
                        ?.querySelector(
                            "input"
                        );


                if (
                    !idInput ||
                    !startInput ||
                    !endInput
                ) {
                    continue;
                }


                const id =
                    String(
                        idInput.value
                    ).trim();


                const start =
                    String(
                        startInput.value
                    ).trim();


                const end =
                    String(
                        endInput.value
                    ).trim();


                if (
                    !id ||
                    !start ||
                    !end
                ) {
                    continue;
                }


                members.push({

                    id,

                    start,

                    end,

                    type: config.type,

                    sectionId: table.rows[i].dataset.sectionId || null
                });

            }

        }
    );


    return members;
}

function drawing2DMemberExists(
    startNodeId,
    endNodeId
) {

    const members =
        getDrawing2DMembersFromTable();


    return members.some(
        member => {

            const sameDirection =
                String(member.start) ===
                    String(startNodeId) &&
                String(member.end) ===
                    String(endNodeId);


            const reverseDirection =
                String(member.start) ===
                    String(endNodeId) &&
                String(member.end) ===
                    String(startNodeId);


            return (
                sameDirection ||
                reverseDirection
            );
        }
    );
}

function findDrawing2DNodeAtGridIntersection(
    xGridUid,
    zGridUid,
    storyUid
) {

    if (
        !window.nodeDatabase ||
        !Array.isArray(
            window.nodeDatabase
        )
    ) {
        return null;
    }


    return window.nodeDatabase.find(
        node =>

            String(node.xGridUid) ===
            String(xGridUid)

            &&

            String(node.zGridUid) ===
            String(zGridUid)

            &&

            String(node.storyUid) ===
            String(storyUid)
    ) || null;
}

function getOrCreateDrawing2DNodeAtGridIntersection(
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


    // -------------------------------------------------
    // Existing node
    // -------------------------------------------------

    const existing =
        findDrawing2DNodeAtGridIntersection(

            xGrid.uid,

            zGrid.uid,

            story.id
        );


    if (existing) {

        return existing;
    }


    // -------------------------------------------------
    // Create new node
    // -------------------------------------------------

    return createDrawing2DNode(

        xGrid,

        zGrid,

        story
    );
}


/* =====================================================
   MEMBER TABLE OPERATIONS

   Add beam and column rows, delete member rows, and clean
   up property/load assignments for deleted members.
   ===================================================== */

function addDrawing2DBeamToTable(
    startNodeId,
    endNodeId
) {

    const table =
        document.getElementById(
            "beamsTable"
        );


    if (!table) {

        console.error(
            "membersTable not found."
        );

        return null;
    }


    // ---------------------------------------------
    // Validate nodes
    // ---------------------------------------------

    const startNode =
        getDrawing2DNodeById(
            startNodeId
        );


    const endNode =
        getDrawing2DNodeById(
            endNodeId
        );


    if (
        !startNode ||
        !endNode
    ) {

        alert(
            "Both selected points must be existing nodes."
        );

        return null;
    }


    // ---------------------------------------------
    // Same node check
    // ---------------------------------------------

    if (
        String(startNodeId) ===
        String(endNodeId)
    ) {

        alert(
            "A member cannot connect a node to itself."
        );

        return null;
    }


    // ---------------------------------------------
    // Duplicate member check
    // ---------------------------------------------

    if (
        drawing2DMemberExists(
            startNodeId,
            endNodeId
        )
    ) {

        alert(
            `A member already exists between ${startNodeId} and ${endNodeId}.`
        );

        return null;
    }


    // ---------------------------------------------
    // Create row
    // ---------------------------------------------

    const memberId =
        getNextDrawing2DBeamId();


    const row =
        table.insertRow();


    row.innerHTML = `

        <td>

            <input
                value="${memberId}"
                readonly
            >

        </td>


        <td>

            <input
                value="${startNodeId}"
                readonly
            >

        </td>


        <td>

            <input
                value="${endNodeId}"
                readonly
            >

        </td>

    `;

    // Store the section selected at creation time.
    // Changing the dropdown later will not change this member.
    row.dataset.sectionId =
        getActiveMemberSectionId() || "";


    // ---------------------------------------------
    // UPDATE 2D and 3D MEMBER DRAWING
    // ---------------------------------------------
    if (!window.drawing2DMemberState?.batchCreating) {
        if (typeof refreshDrawing2DMembers === "function") {
            refreshDrawing2DMembers();
        }

        if (typeof refreshView === "function") {
            refreshView();
        }
    }


    return memberId;
}

function addDrawing2DColumnToTable(
    startNodeId,
    endNodeId
) {

    const table =
        document.getElementById(
            "columnsTable"
        );

    if (!table) {
        return null;
    }


    const startNode =
        getDrawing2DNodeById(
            startNodeId
        );

    const endNode =
        getDrawing2DNodeById(
            endNodeId
        );


    if (
        !startNode ||
        !endNode
    ) {
        return null;
    }


    if (
        String(startNodeId) ===
        String(endNodeId)
    ) {
        return null;
    }


    if (
        drawing2DMemberExists(
            startNodeId,
            endNodeId
        )
    ) {
        return null;
    }


    const columnId =
        getNextDrawing2DColumnId();


    const row =
        table.insertRow();


    row.innerHTML = `

        <td>

            <input
                value="${columnId}"
                readonly
            >

        </td>


        <td>

            <input
                value="${startNodeId}"
                readonly
            >

        </td>


        <td>

            <input
                value="${endNodeId}"
                readonly
            >

        </td>

    `;

    // Store the section selected at creation time.
    // Changing the dropdown later will not change this member.
    row.dataset.sectionId =
        getActiveMemberSectionId() || "";


    
    if (!window.drawing2DMemberState?.batchCreating) {
        if (typeof refreshDrawing2DMembers === "function") {
            refreshDrawing2DMembers();
        }

        if (typeof refreshView === "function") {
            refreshView();
        }
    }

    return columnId;

}

function deleteDrawing2DMemberFromTable(memberId) {
    const id = String(memberId).trim();

    const beamTable = document.getElementById("beamsTable");
    const columnTable = document.getElementById("columnsTable");

    // Locate the selected member and determine its type.
    let selectedTable = null;
    let selectedRow = null;

    for (const table of [beamTable, columnTable]) {
        if (!table) continue;

        for (let i = 1; i < table.rows.length; i++) {
            const rowId = row =>
                String(
                    row.cells[0]?.querySelector("input")?.value || ""
                ).trim();

            if (rowId(table.rows[i]) === id) {
                selectedTable = table;
                selectedRow = table.rows[i];
                break;
            }
        }

        if (selectedRow) break;
    }

    if (!selectedTable || !selectedRow) {
        return false;
    }

    const isBeam = selectedTable.id === "beamsTable";

    const startId =
        selectedRow.cells[1]?.querySelector("input")?.value;

    const endId =
        selectedRow.cells[2]?.querySelector("input")?.value;

    const selectedStart = getDrawing2DNodeById(startId);
    const selectedEnd = getDrawing2DNodeById(endId);

    // Default: delete only the selected member.
    const idsToDelete = new Set([id]);

    // In All Stories mode, find the corresponding members
    // using their grid locations rather than their node IDs.
    if (
        window.drawing2DStoryScope === "all" &&
        selectedStart &&
        selectedEnd
    ) {
        const sameGridPoint = (a, b) =>
            a &&
            b &&
            String(a.xGridUid) === String(b.xGridUid) &&
            String(a.zGridUid) === String(b.zGridUid);

        const sameBeamLocation = (a, b) =>
            (
                sameGridPoint(a, selectedStart) &&
                sameGridPoint(b, selectedEnd)
            ) ||
            (
                sameGridPoint(a, selectedEnd) &&
                sameGridPoint(b, selectedStart)
            );

        const sameColumnLocation = (a, b) =>
            sameGridPoint(a, selectedStart) &&
            sameGridPoint(b, selectedStart) &&
            sameGridPoint(a, b);

        const targetTable = isBeam ? beamTable : columnTable;

        if (targetTable) {
            for (let i = 1; i < targetTable.rows.length; i++) {
                const row = targetTable.rows[i];

                const rowId = String(
                    row.cells[0]?.querySelector("input")?.value || ""
                ).trim();

                const rowStartId =
                    row.cells[1]?.querySelector("input")?.value;

                const rowEndId =
                    row.cells[2]?.querySelector("input")?.value;

                const a = getDrawing2DNodeById(rowStartId);
                const b = getDrawing2DNodeById(rowEndId);

                if (!a || !b) continue;

                const matches = isBeam
                    ? sameBeamLocation(a, b)
                    : sameColumnLocation(a, b);

                if (matches && rowId) {
                    idsToDelete.add(rowId);
                }
            }
        }
    }

    // Capture endpoints before deleting member rows.
    const candidateNodeIds = new Set();

    for (const table of [beamTable, columnTable]) {
        if (!table) continue;

        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];

            const rowId = String(
                row.cells[0]?.querySelector("input")?.value || ""
            ).trim();

            if (!idsToDelete.has(rowId)) continue;

            const startId =
                row.cells[1]?.querySelector("input")?.value;

            const endId =
                row.cells[2]?.querySelector("input")?.value;

            if (startId != null) candidateNodeIds.add(String(startId));
            if (endId != null) candidateNodeIds.add(String(endId));
        }
    }

    // Delete rows from the appropriate table.
    const targetIds = idsToDelete;

    for (const table of [beamTable, columnTable]) {
        if (!table) continue;

        for (let i = table.rows.length - 1; i >= 1; i--) {
            const row = table.rows[i];

            const rowId = String(
                row.cells[0]?.querySelector("input")?.value || ""
            ).trim();

            if (targetIds.has(rowId)) {
                table.deleteRow(i);
            }
        }
    }

    // Clean up assignments for every deleted member.
    targetIds.forEach(deletedId => {
        cleanupDeletedMemberAssignments(deletedId);
    });

    // Remove endpoints that no remaining beam or column uses.
    cleanupOrphanedDrawing2DNodes([...candidateNodeIds]);

    renderDrawing2DMembers();

    if (typeof refreshView === "function") {
        refreshView();
    }

    return true;
}

function cleanupDeletedMemberAssignments(
    memberId
) {

    const id =
        String(memberId);


    if (
        typeof materialDatabase !==
        "undefined"
    ) {

        materialDatabase.forEach(
            material => {

                material.assignedMembers =
                    (
                        material.assignedMembers ||
                        []
                    ).filter(
                        member =>
                            String(member) !== id
                    );

            }
        );

    }


    if (
        typeof sectionDatabase !==
        "undefined"
    ) {

        sectionDatabase.forEach(
            section => {

                section.assignedMembers =
                    (
                        section.assignedMembers ||
                        []
                    ).filter(
                        member =>
                            String(member) !== id
                    );

            }
        );

    }


    if (
        typeof betaDatabase !==
        "undefined"
    ) {

        betaDatabase.forEach(
            beta => {

                beta.assignedMembers =
                    (
                        beta.assignedMembers ||
                        []
                    ).filter(
                        member =>
                            String(member) !== id
                    );

            }
        );

    }


    if (
        typeof loadDatabase !==
        "undefined"
    ) {

        loadDatabase.forEach(
            load => {

                if (
                    Array.isArray(
                        load.assignedMembers
                    )
                ) {

                    load.assignedMembers =
                        load.assignedMembers.filter(
                            member =>
                                String(member) !== id
                        );

                }

            }
        );

    }
}


/* =====================================================
   MOUSE COORDINATES AND GRID HIT-TESTING
   ===================================================== */

function getDrawing2DMemberMouseWorldPoint(
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

function findDrawing2DGridSegmentAtMouse(
    event
) {

    const point =
        getDrawing2DMemberMouseWorldPoint(
            event
        );


    if (!point) {
        return null;
    }


    const grid =
        window.drawing2D?.grid;


    if (
        !grid ||
        !grid.xLines?.length ||
        !grid.zLines?.length
    ) {
        return null;
    }


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


    // -------------------------------------------------
    // Convert pixel tolerance to model units
    // -------------------------------------------------

    const worldPerPixel =
        (
            camera.top -
            camera.bottom
        ) /
        Math.max(
            canvas.clientHeight,
            1
        );


    const tolerance =
        worldPerPixel * 12;


    let bestSegment = null;

    let bestDistance =
        Infinity;


    // =================================================
    // X-GRID SEGMENTS
    //
    // X = constant
    // Z changes between two adjacent Z grids
    // =================================================

    grid.xLines.forEach(
        xGrid => {

            const x =
                Number(
                    xGrid.coordinate
                );


            const distanceX =
                Math.abs(
                    point.x - x
                );


            if (
                distanceX >
                tolerance
            ) {
                return;
            }


            for (
                let i = 0;
                i < grid.zLines.length - 1;
                i++
            ) {

                const zGridStart =
                    grid.zLines[i];

                const zGridEnd =
                    grid.zLines[i + 1];


                const z1 =
                    Number(
                        zGridStart.coordinate
                    );

                const z2 =
                    Number(
                        zGridEnd.coordinate
                    );


                const minZ =
                    Math.min(
                        z1,
                        z2
                    );

                const maxZ =
                    Math.max(
                        z1,
                        z2
                    );


                // Mouse must lie inside this segment
                if (
                    point.z < minZ ||
                    point.z > maxZ
                ) {
                    continue;
                }


                const distance =
                    distanceX;


                if (
                    distance <
                    bestDistance
                ) {

                    bestDistance =
                        distance;


                    bestSegment = {

                        type: "X",

                        xGrid,

                        startGrid:
                            zGridStart,

                        endGrid:
                            zGridEnd,

                        startPoint: {

                            x:
                                Number(
                                    xGrid.coordinate
                                ),

                            z:
                                Number(
                                    zGridStart.coordinate
                                )
                        },

                        endPoint: {

                            x:
                                Number(
                                    xGrid.coordinate
                                ),

                            z:
                                Number(
                                    zGridEnd.coordinate
                                )
                        }
                    };
                }
            }
        }
    );


    // =================================================
    // Z-GRID SEGMENTS
    //
    // Z = constant
    // X changes between two adjacent X grids
    // =================================================

    grid.zLines.forEach(
        zGrid => {

            const z =
                Number(
                    zGrid.coordinate
                );


            const distanceZ =
                Math.abs(
                    point.z - z
                );


            if (
                distanceZ >
                tolerance
            ) {
                return;
            }


            for (
                let i = 0;
                i < grid.xLines.length - 1;
                i++
            ) {

                const xGridStart =
                    grid.xLines[i];

                const xGridEnd =
                    grid.xLines[i + 1];


                const x1 =
                    Number(
                        xGridStart.coordinate
                    );

                const x2 =
                    Number(
                        xGridEnd.coordinate
                    );


                const minX =
                    Math.min(
                        x1,
                        x2
                    );

                const maxX =
                    Math.max(
                        x1,
                        x2
                    );


                // Mouse must lie inside this segment
                if (
                    point.x < minX ||
                    point.x > maxX
                ) {
                    continue;
                }


                const distance =
                    distanceZ;


                if (
                    distance <
                    bestDistance
                ) {

                    bestDistance =
                        distance;


                    bestSegment = {

                        type: "Z",

                        zGrid,

                        startGrid:
                            xGridStart,

                        endGrid:
                            xGridEnd,

                        startPoint: {

                            x:
                                Number(
                                    xGridStart.coordinate
                                ),

                            z:
                                Number(
                                    zGrid.coordinate
                                )
                        },

                        endPoint: {

                            x:
                                Number(
                                    xGridEnd.coordinate
                                ),

                            z:
                                Number(
                                    zGrid.coordinate
                                )
                        }
                    };
                }
            }
        }
    );


    return bestSegment;
}

function getDrawing2DMemberVisualAtMouse(
    event
) {

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;


    const camera =
        window.drawing2D
            ?.camera;


    const group =
        window.drawing2DMemberState
            ?.group;


    if (
        !canvas ||
        !camera ||
        !group
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


    const intersects =
        raycaster.intersectObjects(
            group.children,
            true
        );


    if (
        !intersects.length
    ) {

        return null;

    }


    return intersects[0].object;
}


/* =====================================================
   MEMBER VISUAL CREATION AND RENDERING
   ===================================================== */

function initializeDrawing2DMemberSystem() {

    if (
        window.drawing2DMemberState
            .initialized
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
        "drawing2DMembers";


    window.drawing2D.scene.add(
        group
    );


    window.drawing2DMemberState.group =
        group;


    window.drawing2DMemberState.initialized =
        true;


    renderDrawing2DMembers();
}

function createDrawing2DMemberVisual(
    member
) {

    const startNode =
        getDrawing2DNodeById(
            member.start
        );


    const endNode =
        getDrawing2DNodeById(
            member.end
        );


    if (
        !startNode ||
        !endNode
    ) {

        return null;
    }


    const geometry =
        new THREE.BufferGeometry();


    const positions =
        new Float32Array([

            Number(startNode.x),
            0.08,
            Number(startNode.z),

            Number(endNode.x),
            0.08,
            Number(endNode.z)

        ]);


    geometry.setAttribute(

        "position",

        new THREE.BufferAttribute(
            positions,
            3
        )
    );


    const material =
        new THREE.LineBasicMaterial({

            color: 0x263238,

            linewidth: 2
        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    line.userData = {

        type:
            "member",

        memberId:
            member.id,

        start:
            member.start,

        end:
            member.end
    };


    return line;
}

function createDrawing2DColumnVisual(
    member,
    currentFloor
) {

    const startNode =
        getDrawing2DNodeById(
            member.start
        );

    const endNode =
        getDrawing2DNodeById(
            member.end
        );


    if (
        !startNode ||
        !endNode
    ) {
        return null;
    }


    if (
        String(startNode.storyUid) !==
        String(currentFloor)
    ) {
        return null;
    }

    const node = startNode;


    const size = 0.32;


    const geometry =
        new THREE.PlaneGeometry(
            size,
            size
        );


    const material =
        new THREE.MeshBasicMaterial({
            color: 0x263238,
            side: THREE.DoubleSide
        });


    const square =
        new THREE.Mesh(
            geometry,
            material
        );


    square.rotation.x =
        -Math.PI / 2;


    square.position.set(
        Number(node.x),
        0.12,
        Number(node.z)
    );


    square.userData = {

        type: "column",

        columnId:
            member.id,

        start:
            member.start,

        end:
            member.end,

        nodeId:
            node.nodeId
    };


    return square;
}

function renderDrawing2DMembers() {

    const state =
        window.drawing2DMemberState;


    if (!state.group) {
        return;
    }


    // -------------------------------------------------
    // Clear old visuals
    // -------------------------------------------------

    while (
        state.group.children.length
    ) {

        const object =
            state.group.children.pop();


        if (object.geometry) {
            object.geometry.dispose();
        }


        if (object.material) {
            object.material.dispose();
        }
    }

    state.beamBetweenPointsPreview = null;

    const currentFloor =
        window.drawing2D.floor;


    const members =
        getDrawing2DMembersFromTable();


    members.forEach(
        member => {

            const startNode =
                getDrawing2DNodeById(
                    member.start
                );

            const endNode =
                getDrawing2DNodeById(
                    member.end
                );


            if (
                !startNode ||
                !endNode
            ) {
                return;
            }


            // =================================================
            // COLUMN
            // =================================================

            if (
                /^C\d+$/i.test(
                    String(member.id)
                )
            ) {

                const visual =
                    createDrawing2DColumnVisual(
                        member,
                        currentFloor
                    );


                if (visual) {

                    state.group.add(
                        visual
                    );
                }


                return;
            }


            // =================================================
            // BEAM
            // =================================================

            if (
                String(
                    startNode.storyUid
                ) !==
                String(currentFloor)
            ) {
                return;
            }


            if (
                String(
                    endNode.storyUid
                ) !==
                String(currentFloor)
            ) {
                return;
            }


            const visual =
                createDrawing2DMemberVisual(
                    member
                );


            if (visual) {

                state.group.add(
                    visual
                );
            }

        }
    );
}

function refreshDrawing2DMembers() {

    renderDrawing2DMembers();
}


/* =====================================================
   TOOL STATUS AND CURSOR MANAGEMENT
   ===================================================== */

function updateDrawing2DMemberStatus(
    message
) {

    const status =
        document.getElementById(
            "drawing2DToolStatus"
        );

    if (status) {

        status.innerText =
            message;
    }
}

function updateDrawing2DColumnStatus(
    message
) {

    const status =
        document.getElementById(
            "drawing2DToolStatus"
        );

    if (status) {

        status.innerText =
            message;
    }
}

function updateDrawing2DMemberToolState(
    tool
) {

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;


    if (!canvas) {
        return;
    }


    // ---------------------------------------------
    // BEAM
    // ---------------------------------------------

    if (
        tool === "beam"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DMemberStatus(
            "Beam: click a grid segment"
        );

        return;
    }

    if (
        tool === "beamBetweenPoints"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DMemberStatus(
            "Beam: click the first grid point"
        );

        return;
    }


    // ---------------------------------------------
    // COLUMN
    // ---------------------------------------------

    if (
        tool === "column"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DColumnStatus(
            "Column: click a grid intersection"
        );

        return;
    }


    // ---------------------------------------------
    // DELETE BEAM
    // ---------------------------------------------

    if (
        tool === "deleteBeam"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DMemberStatus(
            "Delete Beam: click a beam"
        );

        return;
    }


    // ---------------------------------------------
    // DELETE COLUMN
    // ---------------------------------------------

    if (
        tool === "deleteColumn"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DColumnStatus(
            "Delete Column: click a column"
        );

        return;
    }


    // ---------------------------------------------
    // SELECT / DEFAULT
    // ---------------------------------------------

    canvas.style.cursor =
        "default";
}


/* =====================================================
   SHARED MEMBER CREATION LOGIC
   ===================================================== */

function createDrawing2DBeamAcrossStories(
    xGridStart,
    zGridStart,
    xGridEnd,
    zGridEnd
) {
    const stories =
        getDrawing2DStoriesForCreation();

    const createdIds = [];

    stories.forEach(story => {
        const startNode =
            getOrCreateDrawing2DNodeAtGridIntersection(
                xGridStart,
                zGridStart,
                story
            );

        const endNode =
            getOrCreateDrawing2DNodeAtGridIntersection(
                xGridEnd,
                zGridEnd,
                story
            );

        if (!startNode || !endNode) {
            return;
        }

        if (
            String(startNode.nodeId) ===
            String(endNode.nodeId)
        ) {
            return;
        }

        // Do not create a duplicate beam on this story.
        if (
            drawing2DMemberExists(
                startNode.nodeId,
                endNode.nodeId
            )
        ) {
            return;
        }

        const id =
            addDrawing2DBeamToTable(
                startNode.nodeId,
                endNode.nodeId
            );

        if (id) {
            createdIds.push(id);
        }
    });

    return createdIds;
}


/* =====================================================
   BEAM TOOL — CREATE BY CLICKING A GRID SEGMENT
   ===================================================== */

function handleDrawing2DBeamClick(
    event
) {

    if (
        window.drawing2D.activeTool !==
        "beam"
    ) {
        return;
    }


    // -------------------------------------------------
    // Find clicked grid segment
    // -------------------------------------------------

    const segment =
        findDrawing2DGridSegmentAtMouse(
            event
        );


    if (!segment) {

        updateDrawing2DMemberStatus(
            "Beam: click on a grid segment"
        );

        return;
    }


    // -------------------------------------------------
    // Current story
    // -------------------------------------------------

    const story =
        typeof getCurrentDrawing2DStory ===
        "function"
            ? getCurrentDrawing2DStory()
            : null;


    if (!story) {

        alert(
            "Please select a valid floor."
        );

        return;
    }


    // -------------------------------------------------
    // Determine endpoint grid lines
    // -------------------------------------------------

    let startXGrid;
    let startZGrid;

    let endXGrid;
    let endZGrid;


    if (
        segment.type === "X"
    ) {

        // X grid remains constant
        startXGrid =
            segment.xGrid;

        endXGrid =
            segment.xGrid;


        // Z changes
        startZGrid =
            segment.startGrid;

        endZGrid =
            segment.endGrid;

    } else {

        // Z grid remains constant
        startZGrid =
            segment.zGrid;

        endZGrid =
            segment.zGrid;


        // X changes
        startXGrid =
            segment.startGrid;

        endXGrid =
            segment.endGrid;
    }


    
    // -------------------------------------------------
    // Create beam on selected story or all stories
    // -------------------------------------------------

    const createdIds =
        createDrawing2DBeamAcrossStories(
            startXGrid,
            startZGrid,
            endXGrid,
            endZGrid
        );

    if (createdIds.length) {
        updateDrawing2DMemberStatus(
            `Created ${createdIds.length} beam(s): ` +
            createdIds.join(", ")
        );
    } else {
        updateDrawing2DMemberStatus(
            "No new beam created. A beam may already exist on the selected story/stories."
        );
    }
}

/* =====================================================
   BEAM TOOL — CREATE BETWEEN TWO GRID POINTS
   ===================================================== */

function clearDrawing2DBeamBetweenPointsPreview() {
    const state = window.drawing2DMemberState;
    if (!state) return;

    if (state.beamBetweenPointsPreview) {
        const preview = state.beamBetweenPointsPreview;
        
        if (preview.parent) {
            preview.parent.remove(preview);
        }

        if (preview.geometry) {
            preview.geometry.dispose();
        }

        if (preview.material) {
            if (Array.isArray(preview.material)) {
                preview.material.forEach(m => m.dispose());
            } else {
                preview.material.dispose();
            }
        }

        state.beamBetweenPointsPreview = null;
    }

    state.beamBetweenPointsStartNode = null;
}

function createDrawing2DBeamBetweenPointsPreview() {

    const state =
        window.drawing2DMemberState;


    if (!state.group) {
        return null;
    }

    if (state.beamBetweenPointsPreview) {
        clearDrawing2DBeamBetweenPointsPreview();
    }

    const material =
        new THREE.LineDashedMaterial({

            color: 0x2979ff,

            dashSize: 0.35,

            gapSize: 0.20,

            transparent: true,

            opacity: 0.85

        });


    const geometry =
        new THREE.BufferGeometry();


    geometry.setFromPoints([

        new THREE.Vector3(
            0,
            0.08,
            0
        ),

        new THREE.Vector3(
            0,
            0.08,
            0
        )

    ]);


    const line =
        new THREE.Line(
            geometry,
            material
        );


    line.computeLineDistances();


    line.userData = {

        type:
            "beamBetweenPointsPreview"

    };


    state.group.add(line);


    state.beamBetweenPointsPreview =
        line;


    return line;
}

function updateDrawing2DBeamBetweenPointsPreview(
    endPoint
) {

    const state =
        window.drawing2DMemberState;


    const startNode =
        state.beamBetweenPointsStartNode;


    if (
        !startNode ||
        !endPoint
    ) {
        return;
    }


    if (
        !state.beamBetweenPointsPreview
    ) {

        createDrawing2DBeamBetweenPointsPreview();

    }


    const line =
        state.beamBetweenPointsPreview;


    const start =
        new THREE.Vector3(

            Number(startNode.x),

            0.08,

            Number(startNode.z)

        );


    const end =
        new THREE.Vector3(

            Number(endPoint.x),

            0.08,

            Number(endPoint.z)

        );


    line.geometry.setFromPoints([

        start,

        end

    ]);


    line.computeLineDistances();


    state.beamBetweenPointsPreviewPoint =
        endPoint.clone();

}

function handleDrawing2DBeamBetweenPointsMouseMove(
    event
) {

    if (
        window.drawing2D.activeTool !==
        "beamBetweenPoints"
    ) {
        return;
    }


    const state =
        window.drawing2DMemberState;


    /*
     * No first point yet.
     *
     * Nothing to draw.
     */

    if (
        !state.beamBetweenPointsStartNode
    ) {
        return;
    }


    const point =
        getDrawing2DMemberMouseWorldPoint(
            event
        );


    if (!point) {
        return;
    }


    /*
     * Construction line follows the
     * actual mouse position.
     *
     * When the mouse is close to a
     * grid intersection, snap the
     * endpoint to that intersection.
     */

    const intersection =
        findDrawing2DGridIntersection(
            point
        );


    let endPoint;


    if (intersection) {

        endPoint =
            new THREE.Vector3(

                Number(
                    intersection.xGrid.coordinate
                ),

                0,

                Number(
                    intersection.zGrid.coordinate
                )

            );

    } else {

        endPoint =
            new THREE.Vector3(

                Number(point.x),

                0,

                Number(point.z)

            );

    }


    updateDrawing2DBeamBetweenPointsPreview(
        endPoint
    );


    updateDrawing2DMemberStatus(

        intersection

            ? "Beam: click the second grid point"

            : "Beam: move to a grid point"

    );

}

function handleDrawing2DBeamBetweenPointsClick(
    event
) {

    if (
        window.drawing2D.activeTool !==
        "beamBetweenPoints"
    ) {
        return;
    }


    const state =
        window.drawing2DMemberState;


    /*
     * Find the actual mouse position.
     */

    const point =
        getDrawing2DMemberMouseWorldPoint(
            event
        );


    if (!point) {
        return;
    }


    /*
     * The endpoint MUST be a grid
     * intersection.
     */

    const intersection =
        findDrawing2DGridIntersection(
            point
        );


    if (!intersection) {

        updateDrawing2DMemberStatus(
            "Beam: click on a grid point"
        );

        return;
    }


    /*
     * Current story.
     */

    const story =
        typeof getCurrentDrawing2DStory ===
        "function"

            ? getCurrentDrawing2DStory()

            : null;


    if (!story) {

        alert(
            "Please select a valid floor."
        );

        return;
    }


    /*
     * -------------------------------------------------
     * FIRST CLICK
     * -------------------------------------------------
     */

    if (
        !state.beamBetweenPointsStartNode
    ) {

        const startNode =
            getOrCreateDrawing2DNodeAtGridIntersection(

                intersection.xGrid,

                intersection.zGrid,

                story

            );


        if (!startNode) {

            return;

        }


        state.beamBetweenPointsStartNode =
            startNode;


        /*
         * Create construction line
         * starting at the selected point.
         */

        createDrawing2DBeamBetweenPointsPreview();


        const startPoint =
            new THREE.Vector3(

                Number(startNode.x),

                0,

                Number(startNode.z)

            );


        updateDrawing2DBeamBetweenPointsPreview(
            startPoint
        );


        updateDrawing2DMemberStatus(
            `Beam: start point ${startNode.nodeId} selected — click second grid point`
        );


        return;
    }


    /*
     * -------------------------------------------------
     * SECOND CLICK
     * -------------------------------------------------
     */

    const startNode =
        state.beamBetweenPointsStartNode;

    // Resolve the grid lines used by the first point.
    const grid =
        window.drawing2D.grid;

    const xGridStart =
        grid.xLines.find(
            line =>
                line.uid === startNode.xGridUid
        );

    const zGridStart =
        grid.zLines.find(
            line =>
                line.uid === startNode.zGridUid
        );

    if (!xGridStart || !zGridStart) {
        clearDrawing2DBeamBetweenPointsPreview();

        updateDrawing2DMemberStatus(
            "Unable to resolve the first grid point."
        );

        return;
    }

    // Create the beam on one story or all stories.
    const createdIds =
        createDrawing2DBeamAcrossStories(
            xGridStart,
            zGridStart,
            intersection.xGrid,
            intersection.zGrid
        );

    // Remove the temporary construction line.
    clearDrawing2DBeamBetweenPointsPreview();

    if (createdIds.length) {
        updateDrawing2DMemberStatus(
            `Created ${createdIds.length} beam(s): ` +
            createdIds.join(", ")
        );
    } else {
        updateDrawing2DMemberStatus(
            "No new beam created. Check whether the beam already exists."
        );
    }
}


/* =====================================================
   COLUMN CREATION LOGIC
   ===================================================== */

function createDrawing2DColumnsAtIntersection(intersection) {
    const allStories =
        window.drawing2D?.storySettings?.stories || [];

    const currentStory =
        typeof getCurrentDrawing2DStory === "function"
            ? getCurrentDrawing2DStory()
            : null;

    if (!currentStory) {
        return { ids: [], error: "Please select a valid floor." };
    }

    let columnPairs = [];

    if (window.drawing2DStoryScope === "all") {
        for (let i = 0; i < allStories.length - 1; i++) {
            columnPairs.push({
                bottom: allStories[i],
                top: allStories[i + 1]
            });
        }
    } else {
        const currentIndex = allStories.findIndex(
            story => String(story.id) === String(currentStory.id)
        );

        if (currentIndex < 0 || currentIndex >= allStories.length - 1) {
            return {
                ids: [],
                error: "There is no floor above the current floor."
            };
        }

        columnPairs.push({
            bottom: allStories[currentIndex],
            top: allStories[currentIndex + 1]
        });
    }

    const createdIds = [];

    for (const pair of columnPairs) {
        const bottomNode = getOrCreateDrawing2DNodeAtGridIntersection(
            intersection.xGrid,
            intersection.zGrid,
            pair.bottom
        );

        const topNode = getOrCreateDrawing2DNodeAtGridIntersection(
            intersection.xGrid,
            intersection.zGrid,
            pair.top
        );

        if (!bottomNode || !topNode) continue;

        if (
            drawing2DMemberExists(
                bottomNode.nodeId,
                topNode.nodeId
            )
        ) {
            continue;
        }

        const columnId = addDrawing2DColumnToTable(
            bottomNode.nodeId,
            topNode.nodeId
        );

        if (columnId) createdIds.push(columnId);
    }

    return { ids: createdIds, error: null };
}

function handleDrawing2DColumnClick(event) {

    if (
        window.drawing2D.activeTool !==
        "column"
    ) {
        return;
    }


    // -------------------------------------------------
    // Get mouse position
    // -------------------------------------------------

    const point =
        getDrawing2DMemberMouseWorldPoint(
            event
        );

    if (!point) {
        return;
    }


    // -------------------------------------------------
    // Find nearest grid intersection
    // -------------------------------------------------

    const intersection =
        findDrawing2DGridIntersection(
            point
        );

    if (!intersection) {

        updateDrawing2DColumnStatus(
            "Column: click on a grid intersection"
        );

        return;
    }
    
    // -------------------------------------------------
    // Create columns using the shared story-scope logic
    // -------------------------------------------------

    const result =
        createDrawing2DColumnsAtIntersection(intersection);

    if (result.error) {
        alert(result.error);
        return;
    }

    if (result.ids.length) {
        updateDrawing2DColumnStatus(
            `Created ${result.ids.length} column(s): ` +
            result.ids.join(", ")
        );
    } else {
        updateDrawing2DColumnStatus(
            "No new columns created. They may already exist."
        );
    }
}

/* =====================================================
   MEMBER DELETION TOOL HANDLERS
   ===================================================== */

function cleanupOrphanedDrawing2DNodes(candidateNodeIds) {
    if (!Array.isArray(candidateNodeIds) || !candidateNodeIds.length) {
        return 0;
    }

    const beamTable = document.getElementById("beamsTable");
    const columnTable = document.getElementById("columnsTable");

    // Collect every node still referenced by any beam or column.
    const usedNodeIds = new Set();

    for (const table of [beamTable, columnTable]) {
        if (!table) continue;

        for (let i = 1; i < table.rows.length; i++) {
            const row = table.rows[i];

            const startId =
                row.cells[1]?.querySelector("input")?.value;

            const endId =
                row.cells[2]?.querySelector("input")?.value;

            if (startId != null && String(startId).trim()) {
                usedNodeIds.add(String(startId).trim());
            }

            if (endId != null && String(endId).trim()) {
                usedNodeIds.add(String(endId).trim());
            }
        }
    }

    // Only delete candidate nodes that no remaining member uses.
    const orphanNodeIds = new Set(
        candidateNodeIds
            .map(id => String(id).trim())
            .filter(id => id && !usedNodeIds.has(id))
    );

    if (!orphanNodeIds.size) {
        return 0;
    }

    // Remove orphan nodes from the node database.
    const previousCount = window.nodeDatabase.length;

    window.nodeDatabase = window.nodeDatabase.filter(
        node => !orphanNodeIds.has(String(node.nodeId))
    );

    const deletedCount = previousCount - window.nodeDatabase.length;

    if (!deletedCount) {
        return 0;
    }

    // Remove references to deleted nodes from supports.
    if (typeof supportDatabase !== "undefined") {
        supportDatabase.forEach(support => {
            support.assignedNodes = (
                support.assignedNodes || []
            ).filter(
                id => !orphanNodeIds.has(String(id))
            );
        });
    }

    // Remove references to deleted nodes from nodal loads.
    if (typeof loadDatabase !== "undefined") {
        loadDatabase.forEach(load => {
            if (load.category === "nodal") {
                load.assignedNodes = (
                    load.assignedNodes || []
                ).filter(
                    id => !orphanNodeIds.has(String(id))
                );
            }
        });
    }

    // Update node UI. The caller performs the final 3D refresh.
    if (typeof renderDrawing2DNodeTable === "function") {
        renderDrawing2DNodeTable();
    }

    if (typeof renderDrawing2DNodes === "function") {
        renderDrawing2DNodes();
    }

    if (typeof renderSupportCards === "function") {
        renderSupportCards();
    }

    if (typeof renderLoadCards === "function") {
        renderLoadCards();
    }

    return deletedCount;
}

function handleDrawing2DDeleteBeamClick(
    event
) {

    if (
        window.drawing2D.activeTool !==
        "deleteBeam"
    ) {

        return;

    }


    const object =
        getDrawing2DMemberVisualAtMouse(
            event
        );


    if (!object) {

        updateDrawing2DMemberStatus(
            "Delete Beam: click a beam"
        );

        return;

    }


    const memberId =
        object.userData
            ?.memberId;


    if (!memberId) {

        return;

    }


    if (
        !/^B\d+$/i.test(
            String(memberId)
        )
    ) {

        return;

    }


    if (
        confirm(
            window.drawing2DStoryScope === "all"
                ? `Delete Beam ${memberId} and its corresponding beams on all stories?`
                : `Delete Beam ${memberId}?`
        )
    ) {

        deleteDrawing2DMemberFromTable(
            memberId
        );

        updateDrawing2DMemberStatus(
            `Beam ${memberId} deleted`
        );

    }

}

function handleDrawing2DDeleteColumnClick(
    event
) {

    if (
        window.drawing2D.activeTool !==
        "deleteColumn"
    ) {

        return;

    }


    const object =
        getDrawing2DMemberVisualAtMouse(
            event
        );


    if (!object) {

        updateDrawing2DColumnStatus(
            "Delete Column: click a column"
        );

        return;

    }


    const memberId =
        object.userData
            ?.columnId;


    if (!memberId) {

        return;

    }


    if (
        !/^C\d+$/i.test(
            String(memberId)
        )
    ) {

        return;

    }


    if (
        confirm(
            window.drawing2DStoryScope === "all"
                ? `Delete Column ${memberId} and its corresponding columns on all stories?`
                : `Delete Column ${memberId}?`
        )
    ) {

        deleteDrawing2DMemberFromTable(
            memberId
        );

        updateDrawing2DColumnStatus(
            `Column ${memberId} deleted`
        );

    }

}


/* =====================================================
   RECTANGLE DRAG DELETE — POINT AND PREVIEW HELPERS
   ===================================================== */

function getDrawing2DMemberIdsInsideRectangle(bounds, type) {
    const tableId = type === "beam"
        ? "beamsTable"
        : "columnsTable";

    const table = document.getElementById(tableId);
    if (!table) return [];

    const currentFloor = String(window.drawing2D.floor);
    const selectedMembers = [];

    // Read member rows and identify members selected
    // on the currently displayed floor.
    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        const id = String(
            row.cells[0]?.querySelector("input")?.value || ""
        ).trim();

        const startId = row.cells[1]?.querySelector("input")?.value;
        const endId = row.cells[2]?.querySelector("input")?.value;

        if (!id || !startId || !endId) continue;

        const start = getDrawing2DNodeById(startId);
        const end = getDrawing2DNodeById(endId);

        if (!start || !end) continue;

        let inside = false;

        if (type === "beam") {
            // Both endpoints must lie inside the rectangle.
            inside =
                String(start.storyUid) === currentFloor &&
                String(end.storyUid) === currentFloor &&
                isDrawing2DPointInsideRectangle(
                    Number(start.x),
                    Number(start.z),
                    bounds
                ) &&
                isDrawing2DPointInsideRectangle(
                    Number(end.x),
                    Number(end.z),
                    bounds
                );
        } else {
            // A column is represented by its lower/start node
            // in the current floor's plan view.
            inside =
                String(start.storyUid) === currentFloor &&
                isDrawing2DPointInsideRectangle(
                    Number(start.x),
                    Number(start.z),
                    bounds
                );
        }

        if (inside) {
            selectedMembers.push({
                id,
                start,
                end
            });
        }
    }

    // Expand the selection to corresponding members on all
    // stories when All Stories scope is active.
    const idsToDelete = new Set(
        selectedMembers.map(member => member.id)
    );

    if (window.drawing2DStoryScope === "all") {
        for (const selected of selectedMembers) {
            for (let i = 1; i < table.rows.length; i++) {
                const row = table.rows[i];

                const id = String(
                    row.cells[0]?.querySelector("input")?.value || ""
                ).trim();

                const startId =
                    row.cells[1]?.querySelector("input")?.value;

                const endId =
                    row.cells[2]?.querySelector("input")?.value;

                if (!id || !startId || !endId) continue;

                const start = getDrawing2DNodeById(startId);
                const end = getDrawing2DNodeById(endId);

                if (!start || !end) continue;

                const sameGridPoint = (a, b) =>
                    String(a.xGridUid) === String(b.xGridUid) &&
                    String(a.zGridUid) === String(b.zGridUid);

                let matches = false;

                if (type === "beam") {
                    // Match the same beam geometry, regardless
                    // of endpoint ordering.
                    matches =
                        (
                            sameGridPoint(start, selected.start) &&
                            sameGridPoint(end, selected.end)
                        ) ||
                        (
                            sameGridPoint(start, selected.end) &&
                            sameGridPoint(end, selected.start)
                        );
                } else {
                    // Match columns at the same grid intersection.
                    matches =
                        sameGridPoint(start, selected.start) &&
                        sameGridPoint(end, selected.end) &&
                        sameGridPoint(start, end);
                }

                if (matches) {
                    idsToDelete.add(id);
                }
            }
        }
    }

    return [...idsToDelete];
}


function deleteDrawing2DMembersByIds(ids, type) {
    const table = document.getElementById(
        type === "beam" ? "beamsTable" : "columnsTable"
    );

    if (!table || !ids.length) return 0;

    const idsToDelete = new Set(ids.map(id => String(id)));
    let deletedCount = 0;

    // Collect candidate node IDs for cleanup after member deletion.
    const candidateNodeIds = new Set();

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        const id = String(
            row.cells[0]?.querySelector("input")?.value || ""
        ).trim();

        if (!idsToDelete.has(id)) continue;

        const startId =
            row.cells[1]?.querySelector("input")?.value;

        const endId =
            row.cells[2]?.querySelector("input")?.value;

        if (startId != null) candidateNodeIds.add(String(startId));
        if (endId != null) candidateNodeIds.add(String(endId));
    }

    // Delete rows backwards so row indices remain valid.
    for (let i = table.rows.length - 1; i >= 1; i--) {
        const row = table.rows[i];

        const id = String(
            row.cells[0]?.querySelector("input")?.value || ""
        ).trim();

        if (idsToDelete.has(id)) {
            table.deleteRow(i);
            deletedCount++;
        }
    }

    // Remove material, section, load, and other assignments
    // associated with every deleted member.
    idsToDelete.forEach(id => {
        cleanupDeletedMemberAssignments(id);
    });

    cleanupOrphanedDrawing2DNodes([...candidateNodeIds]);

    // One final refresh for the entire deletion batch.
    if (typeof renderDrawing2DMembers === "function") {
        renderDrawing2DMembers();
    }

    if (typeof refreshView === "function") {
        refreshView();
    }

    return deletedCount;
}

/* =====================================================
   RECTANGLE DRAG DRAW — POINT AND PREVIEW HELPERS
   ===================================================== */

function isDrawing2DPointInsideRectangle(x, z, bounds) {
    const eps = 1e-8;

    return (
        x >= bounds.minX - eps &&
        x <= bounds.maxX + eps &&
        z >= bounds.minZ - eps &&
        z <= bounds.maxZ + eps
    );
}

function createDrawing2DRectanglePreview() {
    const state = window.drawing2DMemberState.rectangleDrag;

    if (state.preview) return state.preview;

    const preview = document.createElement("div");

    Object.assign(preview.style, {
        position: "fixed",
        display: "none",
        pointerEvents: "none",
        zIndex: "99999",
        border: "1px solid #1976d2",
        background: "rgba(25, 118, 210, 0.12)",
        boxSizing: "border-box"
    });

    document.body.appendChild(preview);
    state.preview = preview;

    return preview;
}

function updateDrawing2DRectanglePreview(clientX, clientY) {
    const state = window.drawing2DMemberState.rectangleDrag;
    const preview = createDrawing2DRectanglePreview();

    const left = Math.min(state.startClientX, clientX);
    const top = Math.min(state.startClientY, clientY);
    const width = Math.abs(clientX - state.startClientX);
    const height = Math.abs(clientY - state.startClientY);

    Object.assign(preview.style, {
        display: "block",
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`
    });
}

function clearDrawing2DRectanglePreview() {
    const state = window.drawing2DMemberState.rectangleDrag;

    if (state.preview) {
        state.preview.style.display = "none";
    }
}


/* =====================================================
   RECTANGLE DRAG — BEAM CREATION
   ===================================================== */

function createDrawing2DBeamsInsideRectangle(bounds) {
    const grid = window.drawing2D?.grid;

    if (!grid?.xLines?.length || !grid?.zLines?.length) {
        return [];
    }

    const createdIds = [];

    function tryCreateBeam(xGridStart, zGridStart, xGridEnd, zGridEnd) {
        const startInside = isDrawing2DPointInsideRectangle(
            Number(xGridStart.coordinate),
            Number(zGridStart.coordinate),
            bounds
        );

        const endInside = isDrawing2DPointInsideRectangle(
            Number(xGridEnd.coordinate),
            Number(zGridEnd.coordinate),
            bounds
        );

        // Only include segments whose two endpoints are inside.
        if (!startInside || !endInside) return;

        const ids = createDrawing2DBeamAcrossStories(
            xGridStart,
            zGridStart,
            xGridEnd,
            zGridEnd
        );

        createdIds.push(...ids);
    }

    // Segments along each X grid line (Z changes).
    for (const xGrid of grid.xLines) {
        for (let j = 0; j < grid.zLines.length - 1; j++) {
            tryCreateBeam(
                xGrid,
                grid.zLines[j],
                xGrid,
                grid.zLines[j + 1]
            );
        }
    }

    // Segments along each Z grid line (X changes).
    for (const zGrid of grid.zLines) {
        for (let i = 0; i < grid.xLines.length - 1; i++) {
            tryCreateBeam(
                grid.xLines[i],
                zGrid,
                grid.xLines[i + 1],
                zGrid
            );
        }
    }

    return createdIds;
}


/* =====================================================
   RECTANGLE DRAG — COLUMN CREATION
   ===================================================== */

function createDrawing2DColumnsInsideRectangle(bounds) {
    const grid = window.drawing2D?.grid;

    if (!grid?.xLines?.length || !grid?.zLines?.length) {
        return [];
    }

    const createdIds = [];

    for (const xGrid of grid.xLines) {
        for (const zGrid of grid.zLines) {
            const x = Number(xGrid.coordinate);
            const z = Number(zGrid.coordinate);

            if (!isDrawing2DPointInsideRectangle(x, z, bounds)) {
                continue;
            }

            const result = createDrawing2DColumnsAtIntersection({
                xGrid,
                zGrid
            });

            createdIds.push(...result.ids);
        }
    }

    return createdIds;
}


/* =====================================================
   RECTANGLE DRAG — MOUSE EVENT HANDLERS
   ===================================================== */


function getDrawing2DMemberDragMouseWorldPoint(event) {
    const drawing = window.drawing2D;
    const canvas = drawing?.renderer?.domElement;
    const camera = drawing?.camera;

    if (!canvas || !camera) return null;

    // Use the canvas's actual displayed position and dimensions.
    const rect = canvas.getBoundingClientRect();

    if (rect.width <= 0 || rect.height <= 0) return null;

    // Convert browser coordinates to normalized device coordinates.
    // Both mouse-down and mouse-up must use this same conversion.
    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);

    // The 2D plan lies in the X-Z plane at Y = 0.
    const planPlane = new THREE.Plane(
        new THREE.Vector3(0, 1, 0),
        0
    );

    const worldPoint = new THREE.Vector3();

    const intersects = raycaster.ray.intersectPlane(
        planPlane,
        worldPoint
    );

    return intersects ? worldPoint : null;
}

function handleDrawing2DRectangleMouseDown(event) {

    const drawing = window.drawing2D;
    const canvas = drawing?.renderer?.domElement;
    const structureCard = document.querySelector(
        "#drawing2DViewport"
    );

    if (!canvas || !structureCard) return;

    // Rectangle creation is allowed only for beam/column tools.
    if (!["beam", "column", "deleteBeam","deleteColumn"].includes(drawing.activeTool)) {
        return;
    }

    // Check the actual visible card bounds, not elementFromPoint().
    const cardRect = structureCard.getBoundingClientRect();

    const insideCard =
        event.clientX >= cardRect.left &&
        event.clientX <= cardRect.right &&
        event.clientY >= cardRect.top &&
        event.clientY <= cardRect.bottom;

    if (!insideCard) return;

    // The mouse must also be inside the actual Three.js canvas.
    const canvasRect = canvas.getBoundingClientRect();

    const insideCanvas =
        event.clientX >= canvasRect.left &&
        event.clientX <= canvasRect.right &&
        event.clientY >= canvasRect.top &&
        event.clientY <= canvasRect.bottom;

    if (!insideCanvas) return;

    const state =
        window.drawing2DMemberState.rectangleDrag;

    const worldPoint =
        getDrawing2DMemberDragMouseWorldPoint(event);

    if (!worldPoint) return;

    state.active = true;
    state.startClientX = event.clientX;
    state.startClientY = event.clientY;
    state.currentClientX = event.clientX;
    state.currentClientY = event.clientY;

    state.startWorldPoint = {
        x: worldPoint.x,
        z: worldPoint.z
    };

    state.moved = false;
    state.suppressNextClick = false;

    const controls = window.drawing2D?.controls;

    state.previousControlsEnabled =
        controls ? controls.enabled : true;

    if (controls) {
        controls.enabled = false;
    }
}

function handleDrawing2DRectangleMouseMove(event) {
    const state = window.drawing2DMemberState.rectangleDrag;
    if (!state.active) return;

    state.currentClientX = event.clientX;
    state.currentClientY = event.clientY;

    const dx = event.clientX - state.startClientX;
    const dy = event.clientY - state.startClientY;

    if (Math.hypot(dx, dy) >= 5) {
        state.moved = true;
        updateDrawing2DRectanglePreview(event.clientX, event.clientY);
    }
}

function handleDrawing2DRectangleMouseUp(event) {
    const state = window.drawing2DMemberState.rectangleDrag;
    if (!state.active) return;

    const wasDrag = state.moved;
    const startPoint = state.startWorldPoint;

    const endWorldPoint = getDrawing2DMemberDragMouseWorldPoint(event);

    state.active = false;
    state.startWorldPoint = null;


    if (window.drawing2D.controls) {
        window.drawing2D.controls.enabled =
            state.previousControlsEnabled;
    }

    // A normal click continues to the existing click handlers.
    if (!wasDrag || !startPoint || !endWorldPoint) return;

    // Suppress the click event generated after mouseup so that
    // the ordinary single-member click handler does not run too.
    state.suppressNextClick = true;

    // Clear the flag if the browser does not dispatch a click
    // on the canvas after the drag.
    setTimeout(() => {
        state.suppressNextClick = false;
    }, 100);

    const bounds = {
        minX: Math.min(startPoint.x, endWorldPoint.x),
        maxX: Math.max(startPoint.x, endWorldPoint.x),
        minZ: Math.min(startPoint.z, endWorldPoint.z),
        maxZ: Math.max(startPoint.z, endWorldPoint.z)
    };

    const tool = window.drawing2D.activeTool;

    if (tool === "beam") {
        updateDrawing2DMemberStatus(
            "⏳ Processing beams across stories... Please wait."
        );
    } else if (tool === "column") {
        updateDrawing2DColumnStatus(
            "⏳ Processing columns across stories... Please wait."
        );
    }

    setTimeout(() => {

        let ids = [];

        // Begin batch: suppress intermediate 2D and 3D refreshes.
        window.drawing2DMemberState.batchCreating = true;

        try {
            if (window.drawing2D.activeTool === "beam") {
                ids = createDrawing2DBeamsInsideRectangle(bounds);

                updateDrawing2DMemberStatus(
                    ids.length
                        ? `Rectangle: created ${ids.length} beam(s)`
                        : "Rectangle: no new beams created."
                );

            } else if (window.drawing2D.activeTool === "column") {
                ids = createDrawing2DColumnsInsideRectangle(bounds);

                updateDrawing2DColumnStatus(
                    ids.length
                        ? `Rectangle: created ${ids.length} column(s)`
                        : "Rectangle: no new columns created."
                );
            } else if (tool === "deleteBeam" || tool === "deleteColumn") {
                const type = tool === "deleteBeam" ? "beam" : "column";
                const label = type === "beam" ? "beam" : "column";

                const ids = getDrawing2DMemberIdsInsideRectangle(bounds, type);

                clearDrawing2DRectanglePreview();

                if (!ids.length) {
                    const message = `Rectangle: no ${label}s selected.`;

                    if (type === "beam") {
                        updateDrawing2DMemberStatus(message);
                    } else {
                        updateDrawing2DColumnStatus(message);
                    }

                    return;
                }

                const storyMessage =
                    window.drawing2DStoryScope === "all"
                        ? " Corresponding members on all stories are included."
                        : "";

                const confirmed = confirm(
                    `Delete ${ids.length} ${label}(s)?` +
                    storyMessage +
                    "\n\nThis action cannot be undone."
                );

                if (!confirmed) {
                    const message = "Rectangle deletion cancelled.";

                    if (type === "beam") {
                        updateDrawing2DMemberStatus(message);
                    } else {
                        updateDrawing2DColumnStatus(message);
                    }

                    return;
                }

                const deletedCount = deleteDrawing2DMembersByIds(ids, type);

                const message =
                    `Rectangle: deleted ${deletedCount} ${label}(s).`;

                if (type === "beam") {
                    updateDrawing2DMemberStatus(message);
                } else {
                    updateDrawing2DColumnStatus(message);
                }

                return;
            }
        } finally {
            // Restore normal behavior after batch creation.
            window.drawing2DMemberState.batchCreating = false;
        }

        // Remove rectangle only after creation finishes.
        clearDrawing2DRectanglePreview();

        
        // FINAL BATCH REFRESH

        // Update the node table once
        if (typeof renderDrawing2DNodeTable === "function") {
            renderDrawing2DNodeTable();
        }

        // Rebuild 2D node visuals once for the current floor.
        if (typeof renderDrawing2DNodes === "function") {
            renderDrawing2DNodes();
        }

        // Rebuild 2D member visuals once.
        if (typeof renderDrawing2DMembers === "function") {
            renderDrawing2DMembers();
        }

        // Rebuild the 3D structural model once.
        if (typeof refreshView === "function") {
            refreshView();
        }
    }, 0);
}

function handleDrawing2DSuppressRectangleClick(event) {
    const state = window.drawing2DMemberState?.rectangleDrag;

    if (!state?.suppressNextClick) return;

    state.suppressNextClick = false;

    event.preventDefault();
    event.stopImmediatePropagation();
}


/* =====================================================
   INITIALIZATION AND EVENT REGISTRATION 
   ===================================================== */


window.initializeDrawing2DMemberEvents = function () {
    const drawing = window.drawing2D;
    const canvas = drawing?.renderer?.domElement;

    // 1. Validate the renderer and canvas.
    if (!canvas) {
        console.error(
            "[2D Members] Cannot initialize: canvas is missing."
        );
        return false;
    }

    // 2. Initialize the Three.js member group.
    initializeDrawing2DMemberSystem();

    // 3. Register the existing single-click member tools once.
    if (!window.drawing2DMemberEventsBound) {
        canvas.addEventListener(
            "click",
            handleDrawing2DBeamClick
        );

        canvas.addEventListener(
            "click",
            handleDrawing2DBeamBetweenPointsClick
        );

        canvas.addEventListener(
            "click",
            handleDrawing2DColumnClick
        );

        canvas.addEventListener(
            "click",
            handleDrawing2DDeleteBeamClick
        );

        canvas.addEventListener(
            "click",
            handleDrawing2DDeleteColumnClick
        );

        window.drawing2DMemberEventsBound = true;
    }

    // 4. Register rectangle events at window capture phase.
    if (!window.drawing2DRectangleEventsBound) {
        window.addEventListener(
            "pointerdown",
            handleDrawing2DRectangleMouseDown,
            true
        );

        window.addEventListener(
            "pointermove",
            handleDrawing2DRectangleMouseMove,
            true
        );

        window.addEventListener(
            "pointerup",
            handleDrawing2DRectangleMouseUp,
            true
        );

        window.addEventListener(
            "pointercancel",
            handleDrawing2DRectangleMouseUp,
            true
        );

        window.addEventListener(
            "click",
            handleDrawing2DSuppressRectangleClick,
            true
        );

        window.drawing2DRectangleEventsBound = true;
    }

    console.info(
        "[2D Members] Events initialized successfully.",
        {
            canvas: canvas,
            memberEventsBound:
                window.drawing2DMemberEventsBound,
            rectangleEventsBound:
                window.drawing2DRectangleEventsBound
        }
    );

    return true;
};