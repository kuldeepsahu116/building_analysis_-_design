// =====================================================
// 2D MEMBER SYSTEM
// drawing2D_members.js
//
// Members can be created in two ways:
//
// 1. Grid / 2D view:
//    Click Member tool -> click Node 1 -> click Node 2
//
// 2. Members table:
//    Existing + Add button creates a new editable row.
//
// The Members table remains the source of member data.
// =====================================================


// =====================================================
// MEMBER DRAWING STATE
// =====================================================

window.drawing2DMemberState = {

    group: null,

    initialized: false,

    hoverSegment: null,

    hoverVisual: null
};


// =====================================================
// MEMBER ID SEQUENCE
// =====================================================

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


// =====================================================
// INITIALIZE MEMBER GROUP
// =====================================================

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


// =====================================================
// GET NODE
// =====================================================

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


// =====================================================
// GET MEMBERS FROM TABLE
// =====================================================

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

                    type:
                        config.type
                });

            }

        }
    );


    return members;
}


// =====================================================
// CHECK IF MEMBER ALREADY EXISTS
// =====================================================

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


// =====================================================
// ADD MEMBER TO TABLE
// =====================================================

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


    // ---------------------------------------------
    // UPDATE 2D MEMBER DRAWING
    // ---------------------------------------------
    if (
        typeof refreshDrawing2DMembers ==="function") {

        refreshDrawing2DMembers();
    }

    // ---------------------------------------------
    // UPDATE 3D / STRUCTURAL VIEW
    // ---------------------------------------------
    if (
        typeof refreshView ==="function") {

        refreshView();
    }


    return memberId;
}

// =====================================================
// ADD COLUMN TO TABLE
// =====================================================

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


    if (
        typeof refreshDrawing2DMembers ===
        "function"
    ) {
        refreshDrawing2DMembers();
    }


    if (
        typeof refreshView ===
        "function"
    ) {
        refreshView();
    }


    return columnId;
}

// =====================================================
// BEAM TOOL CLICK
// =====================================================


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
    // Get or create first node
    // -------------------------------------------------

    const startNode =
        getOrCreateDrawing2DNodeAtGridIntersection(

            startXGrid,

            startZGrid,

            story
        );


    // -------------------------------------------------
    // Get or create second node
    // -------------------------------------------------

    const endNode =
        getOrCreateDrawing2DNodeAtGridIntersection(

            endXGrid,

            endZGrid,

            story
        );


    if (
        !startNode ||
        !endNode
    ) {

        console.error(
            "Unable to create or find beam endpoints."
        );

        return;
    }


    // -------------------------------------------------
    // Same node protection
    // -------------------------------------------------

    if (
        String(startNode.nodeId) ===
        String(endNode.nodeId)
    ) {

        updateDrawing2DMemberStatus(
            "Beam: invalid segment"
        );

        return;
    }


    // -------------------------------------------------
    // Create member
    // -------------------------------------------------

    const memberId =
        addDrawing2DBeamToTable(

            startNode.nodeId,

            endNode.nodeId
        );


    // -------------------------------------------------
    // Result
    // -------------------------------------------------

    if (memberId) {

        updateDrawing2DMemberStatus(

            `Beam ${memberId}: ` +
            `${startNode.nodeId} → ` +
            `${endNode.nodeId}`
        );

    } else {

        updateDrawing2DMemberStatus(

            `${startNode.nodeId} → ` +
            `${endNode.nodeId}`
        );
    }
}


// =====================================================
// COLUMN TOOL CLICK
// =====================================================

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
    // Current story
    // -------------------------------------------------

    const currentStory =
        typeof getCurrentDrawing2DStory ===
        "function"
            ? getCurrentDrawing2DStory()
            : null;

    if (!currentStory) {

        alert(
            "Please select a valid floor."
        );

        return;
    }


    // -------------------------------------------------
    // Find next story
    // -------------------------------------------------

    const stories =
        window.drawing2D
            ?.storySettings
            ?.stories || [];

    const currentIndex =
        stories.findIndex(
            story =>
                String(story.id) ===
                String(currentStory.id)
        );

    if (
        currentIndex < 0 ||
        currentIndex >= stories.length - 1
    ) {

        alert(
            "There is no floor above the current floor."
        );

        return;
    }


    const nextStory =
        stories[currentIndex + 1];


    // -------------------------------------------------
    // Get / create bottom node
    // -------------------------------------------------

    const bottomNode =
        getOrCreateDrawing2DNodeAtGridIntersection(
            intersection.xGrid,
            intersection.zGrid,
            currentStory
        );


    // -------------------------------------------------
    // Get / create top node
    // -------------------------------------------------

    const topNode =
        getOrCreateDrawing2DNodeAtGridIntersection(
            intersection.xGrid,
            intersection.zGrid,
            nextStory
        );


    if (
        !bottomNode ||
        !topNode
    ) {

        console.error(
            "Unable to create column nodes."
        );

        return;
    }


    // -------------------------------------------------
    // Prevent duplicate column
    // -------------------------------------------------

    if (
        drawing2DMemberExists(
            bottomNode.nodeId,
            topNode.nodeId
        )
    ) {

        updateDrawing2DColumnStatus(
            `Column already exists at ${bottomNode.nodeId}`
        );

        return;
    }


    // -------------------------------------------------
    // Create column
    // -------------------------------------------------

    const columnId =
        addDrawing2DColumnToTable(
            bottomNode.nodeId,
            topNode.nodeId
        );


    if (columnId) {

        updateDrawing2DColumnStatus(
            `Column ${columnId}: ` +
            `${bottomNode.nodeId} → ${topNode.nodeId}`
        );
    }
}


// =====================================================
// DELETE BEAM / COLUMN FROM GRID
// =====================================================

function deleteDrawing2DMemberFromTable(
    memberId
) {

    const id =
        String(memberId);


    const tableIds = [

        "beamsTable",

        "columnsTable"

    ];


    for (
        const tableId of tableIds
    ) {

        const table =
            document.getElementById(
                tableId
            );


        if (!table) {
            continue;
        }


        for (
            let i = 1;
            i < table.rows.length;
            i++
        ) {

            const input =
                table.rows[i]
                    ?.cells[0]
                    ?.querySelector(
                        "input"
                    );


            if (
                input &&
                String(input.value)
                    .trim() === id
            ) {

                table.deleteRow(i);

                cleanupDeletedMemberAssignments(
                    id
                );

                renderDrawing2DMembers();


                if (
                    typeof refreshView ===
                    "function"
                ) {

                    refreshView();

                }


                return true;
            }
        }
    }


    return false;
}


// =====================================================
// FIND MEMBER VISUAL UNDER MOUSE
// =====================================================

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


// =====================================================
// DELETE BEAM CLICK
// =====================================================

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
            `Delete Beam ${memberId}?`
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


// =====================================================
// DELETE COLUMN CLICK
// =====================================================

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
            `Delete Column ${memberId}?`
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

// =====================================================
// CLEAN PROPERTY / LOAD ASSIGNMENTS
// =====================================================

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

// =====================================================
// GET MOUSE WORLD POINT
// =====================================================

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

// =====================================================
// FIND GRID SEGMENT AT MOUSE
// =====================================================

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

// =====================================================
// FIND NODE AT GRID INTERSECTION
// =====================================================

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


// =====================================================
// GET OR CREATE NODE AT GRID INTERSECTION
// =====================================================

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


// =====================================================
// MEMBER STATUS
// =====================================================

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


// =====================================================
// RENDER MEMBER LINE
// =====================================================

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


// =====================================================
// RENDER MEMBERS
// =====================================================

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


// =====================================================
// CREATE COLUMN VISUAL
// =====================================================

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

// =====================================================
// REFRESH MEMBERS
// =====================================================

function refreshDrawing2DMembers() {

    renderDrawing2DMembers();
}


// =====================================================
// DELETE MEMBER ROW SUPPORT
// =====================================================
//
// Existing deleteRow() remains the actual
// table-row deletion mechanism.
//
// This function is used after any member
// table update.
// =====================================================

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

// =====================================================
// MEMBER TOOL STATE
// =====================================================

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
        tool === "column"
    ) {

        canvas.style.cursor =
            "crosshair";

        updateDrawing2DColumnStatus(
            "Column: click a grid intersection"
        );

        return;
    }


    canvas.style.cursor =
        "default";
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


                initializeDrawing2DMemberSystem();


                const canvas =
                    window.drawing2D
                        .renderer
                        .domElement;


                canvas.addEventListener(
                    "click",
                    handleDrawing2DBeamClick
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
            };


        initialize();
    }
);