// =====================================================
// 3D STRUCTURAL GRID
// drawing3D_grids.js
// =====================================================
//
// Uses the grid definition created in the 2D Grid Settings.
//
// Coordinate mapping:
//     2D X ordinate  -> 3D X
//     2D Z ordinate  -> 3D Z
//     Story Y ordinate -> 3D Y elevation
//
// The same plan grid is repeated at every story.
// The grid is independent from nodes/members/loads.
// =====================================================


window.threeGridState = {

    group: null,
    visible: true
};


// =====================================================
// CONFIGURATION
// =====================================================

const THREE_GRID_CONFIG = {

    lineOpacity: 0.34,
    boundaryOpacity: 0.55,

    labelBackground: "#ffffff",
    labelBorder: "#000000",
    labelText: "#000000",

    defaultLabelSize: 0.70,

    depthTest: true
};


// =====================================================
// CREATE / GET GRID GROUP
// =====================================================

function ensureThreeGridGroup() {

    if (
        window.threeGridState.group &&
        window.threeGridState.group.parent
    ) {
        return window.threeGridState.group;
    }


    if (!window.threeScene) {
        return null;
    }


    const group =
        new THREE.Group();


    group.name =
        "threeStructuralGrid";


    group.visible =
        window.threeGridState.visible;


    window.threeGridState.group =
        group;


    // Keep grid independent from
    // clearThreeModel().
    window.threeScene.add(group);


    return group;
}


// =====================================================
// DISPOSE GRID
// =====================================================

function clearThreeGrid() {

    const group =
        window.threeGridState.group;


    if (!group) {
        return;
    }


    group.traverse(
        object => {

            if (object.geometry) {
                object.geometry.dispose();
            }


            if (object.material) {

                const materials =
                    Array.isArray(object.material)
                        ? object.material
                        : [object.material];


                materials.forEach(
                    material => {

                        if (material.map) {
                            material.map.dispose();
                        }

                        material.dispose();
                    }
                );
            }
        }
    );


    group.clear();
}


// =====================================================
// GET GRID DATA
// =====================================================

function getThreeGridData() {

    const d2d =
        window.drawing2D;


    if (!d2d || !d2d.grid) {
        return null;
    }


    const grid =
        d2d.grid;


    const stories =
        d2d.storySettings?.stories || [];


    const xLines =
        Array.isArray(grid.xLines)
            ? grid.xLines
                .map(line => ({
                    id: line.id,
                    coordinate:
                        Number(line.coordinate)
                }))
                .filter(
                    line =>
                        Number.isFinite(
                            line.coordinate
                        )
                )
                .sort(
                    (a, b) =>
                        a.coordinate -
                        b.coordinate
                )
            : [];


    const zLines =
        Array.isArray(grid.zLines)
            ? grid.zLines
                .map(line => ({
                    id: line.id,
                    coordinate:
                        Number(line.coordinate)
                }))
                .filter(
                    line =>
                        Number.isFinite(
                            line.coordinate
                        )
                )
                .sort(
                    (a, b) =>
                        a.coordinate -
                        b.coordinate
                )
            : [];


    const storyList =
        stories.length
            ? stories
                .map(story => ({
                    id: story.id,
                    name: story.name,
                    elevation:
                        Number(story.y)
                }))
                .filter(
                    story =>
                        Number.isFinite(
                            story.elevation
                        )
                )
                .sort(
                    (a, b) =>
                        a.elevation -
                        b.elevation
                )
            : [
                {
                    id: "F0",
                    name: "Base",
                    elevation: 0
                }
            ];


    if (
        !xLines.length ||
        !zLines.length
    ) {
        return null;
    }


    return {
        xLines,
        zLines,
        stories: storyList
    };
}


// =====================================================
// MATERIALS
// =====================================================

function createThreeGridMaterials() {

    const color =
        new THREE.Color(
            window.drawing2D
                ?.gridSettings
                ?.color ||
            "#9BA7B5"
        );


    const lineMaterial =
        new THREE.LineBasicMaterial({

            color,

            transparent: true,

            opacity:
                THREE_GRID_CONFIG.lineOpacity,

            depthTest:
                THREE_GRID_CONFIG.depthTest,

            depthWrite: false
        });


    const boundaryMaterial =
        new THREE.LineBasicMaterial({

            color,

            transparent: true,

            opacity:
                THREE_GRID_CONFIG.boundaryOpacity,

            depthTest:
                THREE_GRID_CONFIG.depthTest,

            depthWrite: false
        });


    return {
        lineMaterial,
        boundaryMaterial
    };
}


// =====================================================
// ADD GRID LINE SEGMENT
// =====================================================

function addThreeGridSegment(
    array,
    x1,
    y1,
    z1,
    x2,
    y2,
    z2
) {

    array.push(
        x1, y1, z1,
        x2, y2, z2
    );
}


// =====================================================
// GRID LABEL SIZE
// =====================================================

function getThreeGridLabelSize() {

    const layout =
        window.drawing2D
            ?.annotationLayout;


    if (
        layout &&
        Number.isFinite(
            layout.xLabelSize
        )
    ) {

        return Math.max(
            layout.xLabelSize,
            THREE_GRID_CONFIG.defaultLabelSize
        );
    }


    return THREE_GRID_CONFIG.defaultLabelSize;
}


// =====================================================
// CREATE GRID BUBBLE
// =====================================================

function createThreeGridBubble(
    text,
    size
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    const ctx =
        canvas.getContext("2d");


    canvas.width = 512;
    canvas.height = 512;


    const center = 256;
    const radius = 176;


    // -----------------------------------------
    // Bubble
    // -----------------------------------------

    ctx.beginPath();

    ctx.arc(
        center,
        center,
        radius,
        0,
        Math.PI * 2
    );


    ctx.fillStyle =
        THREE_GRID_CONFIG.labelBackground;

    ctx.fill();


    ctx.lineWidth = 7;

    ctx.strokeStyle =
        THREE_GRID_CONFIG.labelBorder;

    ctx.stroke();


    // -----------------------------------------
    // Text
    // -----------------------------------------

    ctx.font =
        "600 170px Segoe UI";

    ctx.fillStyle =
        THREE_GRID_CONFIG.labelText;

    ctx.textAlign =
        "center";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        String(text),
        center,
        center
    );


    // -----------------------------------------
    // Texture
    // -----------------------------------------

    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.needsUpdate = true;


    if (
        typeof THREE.SRGBColorSpace !==
        "undefined"
    ) {
        texture.colorSpace =
            THREE.SRGBColorSpace;
    }


    texture.minFilter =
        THREE.LinearFilter;

    texture.magFilter =
        THREE.LinearFilter;


    const material =
        new THREE.SpriteMaterial({

            map: texture,

            transparent: true,

            depthTest: false,

            depthWrite: false
        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.scale.set(
        size,
        size,
        1
    );


    return sprite;
}


// =====================================================
// CREATE STORY LABEL
// =====================================================

function createThreeStoryLabel(
    text,
    size
) {

    const canvas =
        document.createElement(
            "canvas"
        );


    const ctx =
        canvas.getContext("2d");


    canvas.width = 1024;
    canvas.height = 256;


    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.font =
        "600 90px Segoe UI";

    ctx.fillStyle =
        "#4b5563";

    ctx.textAlign =
        "left";

    ctx.textBaseline =
        "middle";


    ctx.fillText(
        String(text),
        30,
        canvas.height / 2
    );


    const texture =
        new THREE.CanvasTexture(
            canvas
        );


    texture.needsUpdate = true;


    if (
        typeof THREE.SRGBColorSpace !==
        "undefined"
    ) {
        texture.colorSpace =
            THREE.SRGBColorSpace;
    }


    const material =
        new THREE.SpriteMaterial({

            map: texture,

            transparent: true,

            depthTest: false,

            depthWrite: false
        });


    const sprite =
        new THREE.Sprite(
            material
        );


    sprite.scale.set(
        size * 2.2,
        size * 0.55,
        1
    );


    return sprite;
}


// =====================================================
// DRAW 3D GRID
// =====================================================

function drawThreeGrid() {

    const group =
        ensureThreeGridGroup();

    if (!group) {
        return;
    }


    const data =
        getThreeGridData();

    if (!data) {
        clearThreeGrid();
        return;
    }


    clearThreeGrid();


    const {
        xLines,
        zLines,
        stories
    } = data;


    if (
        !xLines.length ||
        !zLines.length ||
        !stories.length
    ) {
        return;
    }


    // -------------------------------------------------
    // PLAN EXTENTS
    // -------------------------------------------------

    const minX =
        xLines[0].coordinate;

    const maxX =
        xLines[xLines.length - 1].coordinate;

    const minZ =
        zLines[0].coordinate;

    const maxZ =
        zLines[zLines.length - 1].coordinate;


    // -------------------------------------------------
    // STORY EXTENTS
    // -------------------------------------------------

    const baseStory =
        stories[0];

    const topStory =
        stories[stories.length - 1];

    const baseY =
        baseStory.elevation;

    const topY =
        topStory.elevation;


    // -------------------------------------------------
    // LABEL SIZE
    // -------------------------------------------------

    const labelSize =
        getThreeGridLabelSize();

    const labelOffset =
        Math.max(
            labelSize * 0.9,
            0.6
        );


    // -------------------------------------------------
    // MATERIALS
    // -------------------------------------------------

    const materials =
        createThreeGridMaterials();


    // =================================================
    // 1. HORIZONTAL GRID PLANES
    // =================================================

    stories.forEach(
        story => {

            const elevation =
                story.elevation;


            const minorPositions = [];
            const boundaryPositions = [];


            // -----------------------------------------
            // X GRID LINES
            // -----------------------------------------

            xLines.forEach(
                (line, index) => {

                    const target =
                        index === 0 ||
                        index === xLines.length - 1
                            ? boundaryPositions
                            : minorPositions;


                    addThreeGridSegment(
                        target,

                        line.coordinate,
                        elevation,
                        minZ,

                        line.coordinate,
                        elevation,
                        maxZ
                    );
                }
            );


            // -----------------------------------------
            // Z GRID LINES
            // -----------------------------------------

            zLines.forEach(
                (line, index) => {

                    const target =
                        index === 0 ||
                        index === zLines.length - 1
                            ? boundaryPositions
                            : minorPositions;


                    addThreeGridSegment(
                        target,

                        minX,
                        elevation,
                        line.coordinate,

                        maxX,
                        elevation,
                        line.coordinate
                    );
                }
            );


            // -----------------------------------------
            // MINOR GRID
            // -----------------------------------------

            const minor =
                createThreeGridSegments(
                    minorPositions,
                    materials.lineMaterial,
                    "gridMinor"
                );


            if (minor) {
                group.add(minor);
            }


            // -----------------------------------------
            // BOUNDARY GRID
            // -----------------------------------------

            const boundary =
                createThreeGridSegments(
                    boundaryPositions,
                    materials.boundaryMaterial,
                    "gridBoundary"
                );


            if (boundary) {
                group.add(boundary);
            }
        }
    );


    // =================================================
    // 2. VERTICAL GRID LINES
    // =================================================

    const verticalPositions = [];


    // Every X-Y grid intersection gets
    // one continuous vertical line.

    xLines.forEach(
        xLine => {

            zLines.forEach(
                zLine => {

                    addThreeGridSegment(
                        verticalPositions,

                        xLine.coordinate,
                        baseY,
                        zLine.coordinate,

                        xLine.coordinate,
                        topY,
                        zLine.coordinate
                    );
                }
            );
        }
    );


    const verticalMaterial =
        new THREE.LineBasicMaterial({

            color:
                new THREE.Color(
                    window.drawing2D
                        ?.gridSettings
                        ?.color ||
                    "#9BA7B5"
                ),

            transparent: true,

            opacity: 0.24,

            depthTest: true,

            depthWrite: false
        });


    const verticalGrid =
        createThreeGridSegments(
            verticalPositions,
            verticalMaterial,
            "gridVertical"
        );


    if (verticalGrid) {
        group.add(verticalGrid);
    }


    // =================================================
    // 3. GRID BUBBLES
    //    ONLY ON BASE FLOOR
    // =================================================

    // X labels
    xLines.forEach(
        line => {

            const label =
                createThreeGridBubble(
                    line.id,
                    labelSize
                );


            label.position.set(

                line.coordinate,

                baseY,

                maxZ + labelOffset
            );


            label.userData = {

                type: "gridLabel",

                axis: "X",

                gridId: line.id,

                coordinate:
                    line.coordinate,

                storyId:
                    baseStory.id
            };


            group.add(label);
        }
    );


    // Z labels
    zLines.forEach(
        line => {

            const label =
                createThreeGridBubble(
                    line.id,
                    labelSize
                );


            label.position.set(

                minX - labelOffset,

                baseY,

                line.coordinate
            );


            label.userData = {

                type: "gridLabel",

                axis: "Z",

                gridId: line.id,

                coordinate:
                    line.coordinate,

                storyId:
                    baseStory.id
            };


            group.add(label);
        }
    );


    // =================================================
    // 4. STORY NAMES
    //    ONE AT EACH FLOOR
    // =================================================

    stories.forEach(
        story => {

            const storyLabel =
                createThreeStoryLabel(
                    story.name,
                    labelSize
                );


            storyLabel.position.set(

                minX -
                labelOffset,

                story.elevation,

                minZ -
                labelOffset
            );


            storyLabel.userData = {

                type:
                    "storyLabel",

                storyId:
                    story.id
            };


            group.add(
                storyLabel
            );
        }
    );


    // =================================================
    // VISIBILITY
    // =================================================

    group.visible =
        window.threeGridState.visible;
}


// =====================================================
// CREATE LINE SEGMENTS
// =====================================================

function createThreeGridSegments(
    positions,
    material,
    type
) {

    if (!positions.length) {
        return null;
    }


    const geometry =
        new THREE.BufferGeometry();


    geometry.setAttribute(
        "position",

        new THREE.Float32BufferAttribute(
            positions,
            3
        )
    );


    const line =
        new THREE.LineSegments(
            geometry,
            material
        );


    line.userData = {
        type
    };


    line.renderOrder = 0;


    return line;
}


// =====================================================
// GRID VISIBILITY
// =====================================================

function toggleThreeDGrid() {

    const group =
        window.threeGridState.group;


    window.threeGridState.visible =
        !window.threeGridState.visible;


    if (group) {

        group.visible =
            window.threeGridState.visible;
    }


    const button =
        document.getElementById(
            "threeDGridBtn"
        );


    if (button) {

        button.classList.toggle(
            "active",
            window.threeGridState.visible
        );

        button.textContent =
            window.threeGridState.visible
                ? "GRID"
                : "GRID";
    }
}


// =====================================================
// REFRESH 3D GRID
// =====================================================

function refreshThreeDGrid() {

    drawThreeGrid();
}