// =====================================================
// 2D PLAN VIEW - THREE.JS
// =====================================================

window.drawing2D = {

    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    gridGroup: null,

    initialized: false,
    gridVisible: true,

    activeTool: "select",
    floor: "F0",

    gridMode: "spacing",

    grid: {

        initialized: false,

        xSpacing: 5,
        zSpacing: 4,

        xCount: 5,
        zCount: 5,

        xLines: [],
        zLines: []
    },

    // GRID SYSTEM SETTINGS
    gridSettings: {

        name: "G1",

        originX: 0,
        originZ: 0,

        rotation: 0,

        bubbleSize: 1250,

        color: "#C2C0C0",
    },

    // STORY SETTINGS
    storySettings: {
        addMode: "spacing",
        nextId: 4,
        stories: [
            {
                id: "F0",
                name: "Base",
                y: 0
            },
            {
                id: "F1",
                name: "Ground Floor",
                y: 3
            },
            {
                id: "F2",
                name: "First Floor",
                y: 6
            },
            {
                id: "F3",
                name: "Second Floor",
                y: 9
            },
            {
                id: "F4",
                name: "Third Floor",
                y: 12
            }
        ]
    },

    annotationLayout: null
};


// =====================================================
// CONFIGURATION
// =====================================================

const DRAWING2D_CONFIG = {

    colors: {
        background: 0xffffff,

        gridMinor: 0xcbd3dd,
        gridMajor: 0x9ba7b5,

        dimensionMain: 0x687482,
        dimensionExtension: 0x000000,
        dimensionTick: 0x000000,

        labelText: "#000000",
        dimensionText: "#000000",

        xAxis: 0xe74c3c,
        zAxis: 0x3498db,
        origin: 0x444444
    },

    camera: {
        defaultViewHeight: 25,
        near: 0.1,
        far: 1000,
        distance: 100
    },

    rendering: {
        maxPixelRatio: 2
    }
};


// =====================================================
// INITIALIZATION
// =====================================================

function initDrawing2D() {

    if (window.drawing2D.initialized) {
        resizeDrawing2D();
        return;
    }

    const canvas =
        document.getElementById("drawing2DCanvas");

    if (!canvas || typeof THREE === "undefined") {
        console.error(
            "2D Drawing initialization failed: Canvas or Three.js missing."
        );
        return;
    }


    // -------------------------------------------------
    // Scene
    // -------------------------------------------------

    const scene =
        new THREE.Scene();

    scene.background =
        new THREE.Color(
            DRAWING2D_CONFIG.colors.background
        );

    window.drawing2D.scene = scene;


    // -------------------------------------------------
    // Camera
    // -------------------------------------------------

    const width =
        Math.max(canvas.clientWidth, 1);

    const height =
        Math.max(canvas.clientHeight, 1);

    const aspect =
        width / height;

    const viewHeight =
        DRAWING2D_CONFIG.camera.defaultViewHeight;


    const camera =
        new THREE.OrthographicCamera(
            -viewHeight * aspect / 2,
             viewHeight * aspect / 2,
             viewHeight / 2,
            -viewHeight / 2,
            DRAWING2D_CONFIG.camera.near,
            DRAWING2D_CONFIG.camera.far
        );


    // -------------------------------------------------
    // PLAN ORIENTATION
    //
    // World X  -> screen right
    // World Z  -> screen up
    //
    // Camera is above the X-Z plane, looking down
    // along -Y.
    // -------------------------------------------------

    camera.position.set(
        0,
        DRAWING2D_CONFIG.camera.distance,
        0
    );

    camera.lookAt(
        0,
        0,
        0
    );

    camera.up.set(
        1,
        0,
        0
    );

    window.drawing2D.camera = camera;


    // -------------------------------------------------
    // Renderer
    // -------------------------------------------------

    const renderer =
        new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: "high-performance"
        });

    renderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            DRAWING2D_CONFIG.rendering.maxPixelRatio
        )
    );

    renderer.setSize(
        width,
        height,
        false
    );

    renderer.setClearColor(
        DRAWING2D_CONFIG.colors.background,
        1
    );

    window.drawing2D.renderer = renderer;


    // -------------------------------------------------
    // Controls
    // -------------------------------------------------

    if (typeof THREE.OrbitControls !== "undefined") {

        const controls =
            new THREE.OrbitControls(
                camera,
                renderer.domElement
            );

        controls.enableRotate = false;
        controls.enableZoom = true;
        controls.enablePan = true;

        controls.enableDamping = true;
        controls.dampingFactor = 0.08;

        controls.screenSpacePanning = true;

        window.drawing2D.controls =
            controls;
    }


    // -------------------------------------------------
    // Grid group
    // -------------------------------------------------

    window.drawing2D.gridGroup =
        new THREE.Group();

    scene.add(
        window.drawing2D.gridGroup
    );


    // -------------------------------------------------
    // Events
    // -------------------------------------------------

    window.addEventListener(
        "resize",
        resizeDrawing2D
    );

    canvas.addEventListener(
        "mousemove",
        handleDrawing2DMouseMove
    );


    // -------------------------------------------------
    // Initial drawing
    // -------------------------------------------------

    window.drawing2D.initialized = true;

    updateDrawing2DGrid();

    animateDrawing2D();
}


// =====================================================
// RENDER LOOP
// =====================================================

function animateDrawing2D() {

    requestAnimationFrame(
        animateDrawing2D
    );

    if (window.drawing2D.controls) {
        window.drawing2D.controls.update();
    }

    const {
        renderer,
        scene,
        camera
    } = window.drawing2D;

    if (
        renderer &&
        scene &&
        camera
    ) {
        renderer.render(
            scene,
            camera
        );
    }
}


// =====================================================
// RESIZE
// =====================================================

function resizeDrawing2D() {

    const {
        renderer,
        camera
    } = window.drawing2D;


    if (!renderer || !camera) {
        return;
    }


    const canvas =
        renderer.domElement;


    const width =
        Math.max(
            canvas.clientWidth,
            1
        );

    const height =
        Math.max(
            canvas.clientHeight,
            1
        );


    const aspect =
        width / height;

    const viewHeight =
        camera.top -
        camera.bottom;

    const centerX =
        (
            camera.left +
            camera.right
        ) / 2;

    const centerZ =
        (
            camera.top +
            camera.bottom
        ) / 2;


    camera.left =
        centerX -
        (viewHeight * aspect) / 2;

    camera.right =
        centerX +
        (viewHeight * aspect) / 2;

    camera.top =
        centerZ +
        viewHeight / 2;

    camera.bottom =
        centerZ -
        viewHeight / 2;


    camera.updateProjectionMatrix();


    renderer.setSize(
        width,
        height,
        false
    );

}


// =====================================================
// GRID UPDATE
// =====================================================

function initializeDrawing2DGrid() {

    const grid =
        window.drawing2D.grid;


    const xSpacing =
        Number(
            document.getElementById(
                "gridXSpacing"
            )?.value
        ) || grid.xSpacing;


    const zSpacing =
        Number(
            document.getElementById(
                "gridZSpacing"
            )?.value
        ) || grid.zSpacing;


    const xCount =
        Math.max(
            1,
            Math.floor(
                Number(
                    document.getElementById(
                        "gridXCount"
                    )?.value
                ) || grid.xCount
            )
        );


    const zCount =
        Math.max(
            1,
            Math.floor(
                Number(
                    document.getElementById(
                        "gridZCount"
                    )?.value
                ) || grid.zCount
            )
        );


    grid.xSpacing = xSpacing;
    grid.zSpacing = zSpacing;

    grid.xCount = xCount;
    grid.zCount = zCount;


    // ---------------------------------------------
    // Initial X grid
    // ---------------------------------------------

    grid.xLines =
        Array.from(
            { length: xCount },
            (_, index) => ({
                uid:
                    generateDrawing2DGridUID("X"),

                coordinate:
                    index * xSpacing
            })
        );


    // ---------------------------------------------
    // Initial Z grid
    // ---------------------------------------------

    grid.zLines =
        Array.from(
            { length: zCount },
            (_, index) => ({
                uid:
                    generateDrawing2DGridUID("Z"),

                coordinate:
                    index * zSpacing
            })
        );


    generateDrawing2DGridLines();
}


function updateDrawing2DGrid() {

    const grid =
        window.drawing2D.grid;

    // First creation only

    if (!grid.initialized) {

        initializeDrawing2DGrid();

        grid.initialized = true;
    }

    // Refresh IDs from sorted ordinates
    generateDrawing2DGridLines();


    // Render
    drawDrawing2DGrid();

    updateDrawing2DGridStatus();

    fitDrawing2DView();
}

// =====================================================
// PERMANENT GRID UID
// =====================================================

function generateDrawing2DGridUID(
    axis
) {

    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {

        return (
            axis.toLowerCase() +
            "_" +
            crypto.randomUUID()
        );
    }


    return (

        axis.toLowerCase() +
        "_" +
        Date.now().toString(36) +
        "_" +
        Math.random()
            .toString(36)
            .substring(2, 9)

    );
}

// =====================================================
// GRID LABEL GENERATION
// =====================================================

function generateGridLabel(index) {

    let label = "";
    let n = index;

    while (n >= 0) {

        label =
            String.fromCharCode(
                65 + (n % 26)
            ) + label;

        n =
            Math.floor(n / 26) - 1;
    }

    return label;
}


// =====================================================
// GRID DATA GENERATION
// =====================================================

function generateDrawing2DGridLines() {

    const grid =
        window.drawing2D.grid;


    // ---------------------------------------------
    // X grids
    // ---------------------------------------------

    grid.xLines =
        grid.xLines
            .map(line => ({

                uid:
                    line.uid ||
                    generateDrawing2DGridUID("X"),

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
            );


    // ---------------------------------------------
    // Z grids
    // ---------------------------------------------

    grid.zLines =
        grid.zLines
            .map(line => ({
                uid:
                    line.uid ||
                    generateDrawing2DGridUID("Z"),

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
            );


    // ---------------------------------------------
    // IDs are automatic and non-editable
    // ---------------------------------------------

    grid.xLines.forEach(
        (line, index) => {

            line.id =
                generateGridLabel(index);
        }
    );


    grid.zLines.forEach(
        (line, index) => {

            line.id =
                String(index + 1);
        }
    );
}


// =====================================================
// ANNOTATION HELPERS
// =====================================================

function getGridSpacings(lines) {

    const coordinates =
        lines
            .map(
                line =>
                    Number(line.coordinate)
            )
            .filter(Number.isFinite)
            .sort(
                (a, b) => a - b
            );


    const spacings = [];

    for (
        let i = 1;
        i < coordinates.length;
        i++
    ) {

        const spacing =
            coordinates[i] -
            coordinates[i - 1];

        if (spacing > 1e-9) {
            spacings.push(spacing);
        }
    }


    return spacings;
}


function getMedian(values) {

    if (!values.length) {
        return 1;
    }

    const sorted =
        [...values]
            .sort(
                (a, b) => a - b
            );

    const mid =
        Math.floor(
            sorted.length / 2
        );


    return (
        sorted.length % 2
            ? sorted[mid]
            : (
                sorted[mid - 1] +
                sorted[mid]
            ) / 2
    );
}


function getAnnotationScale(grid) {

    const bubbleModelSize =
        Number(window.drawing2D.gridSettings.bubbleSize
        ) / 1000;

    const xSpacing =
        getGridSpacings(
            grid.xLines
        );

    const zSpacing =
        getGridSpacings(
            grid.zLines
        );


    const xReference =
        getMedian(xSpacing);

    const zReference =
        getMedian(zSpacing);


    const xLabelSize =
        THREE.MathUtils.clamp(
            Math.min(
                xReference * 0.32,
                bubbleModelSize
            ),
            0.60,
            2.80
        );


    const zLabelSize =
        THREE.MathUtils.clamp(
            Math.min(
                zReference * 0.32,
                bubbleModelSize
            ),
            0.60,
            2.80
        );


    const xDimensionTextSize =
        THREE.MathUtils.clamp(
            xReference * 0.32,
            0.70,
            2.80
        );

    const zDimensionTextSize =
        THREE.MathUtils.clamp(
            zReference * 0.32,
            0.70,
            2.80
        );


    return {

        xReference,
        zReference,

        xLabelSize,
        zLabelSize,

        xDimensionTextSize,
        zDimensionTextSize,

        xLabelGap:
            THREE.MathUtils.clamp(
                xReference * 0.18,
                0.35,
                0.80
            ),

        zLabelGap:
            THREE.MathUtils.clamp(
                zReference * 0.18,
                0.35,
                0.80
            ),

        xDimensionGap:
            THREE.MathUtils.clamp(
                xReference * 0.2,
                0.60,
                2.00
            ),

        zDimensionGap:
            THREE.MathUtils.clamp(
                zReference * 0.2,
                0.60,
                2.00
            ),

        extensionLength:
            THREE.MathUtils.clamp(
                Math.min(
                    xReference,
                    zReference
                ) * 0.08,
                0.20,
                0.50
            ),

        xLabelLaneStep:
            Math.max(
                xLabelSize * 0.90,
                0.60
            ),

        zLabelLaneStep:
            Math.max(
                zLabelSize * 0.90,
                0.60
            ),

        xDimensionLaneStep:
            Math.max(
                xDimensionTextSize * 0.75,
                0.65
            ),

        zDimensionLaneStep:
            Math.max(
                zDimensionTextSize * 0.75,
                0.65
            ),

        xDimensionTextOffset:
            Math.max(
                xDimensionTextSize * 0.35,
                0.20
            ),

        zDimensionTextOffset:
            Math.max(
                zDimensionTextSize * 0.35,
                0.20
            )
    };
}


// -----------------------------------------------------
// Point-label lane assignment
// -----------------------------------------------------

function assignPointAnnotationLanes(
    coordinates,
    labelSize,
    gap = 0.10
) {

    const laneLastCoordinate = [];
    const lanes = [];

    const minDistance =
        labelSize + gap;


    coordinates.forEach(
        coordinate => {

            let lane = 0;

            while (
                laneLastCoordinate[lane] !== undefined &&
                coordinate -
                laneLastCoordinate[lane] <
                minDistance
            ) {
                lane++;
            }


            lanes.push(lane);

            laneLastCoordinate[lane] =
                coordinate;
        }
    );


    return {
        lanes,
        count:
            laneLastCoordinate.length
    };
}


// -----------------------------------------------------
// Dimension lane assignment
// -----------------------------------------------------

function assignDimensionLanes(
    intervals,
    labelWidth,
    gap = 0.15
) {

    const laneLastEnd = [];
    const lanes = [];


    intervals.forEach(
        ({ start, end }) => {

            const center =
                (start + end) / 2;

            const halfWidth =
                labelWidth / 2;

            const occupiedStart =
                center - halfWidth;

            const occupiedEnd =
                center + halfWidth;


            let lane = 0;

            while (
                laneLastEnd[lane] !== undefined &&
                occupiedStart <
                laneLastEnd[lane] + gap
            ) {
                lane++;
            }


            lanes.push(lane);

            laneLastEnd[lane] =
                occupiedEnd;
        }
    );


    return {
        lanes,
        count:
            laneLastEnd.length
    };
}


// =====================================================
// THREE.JS OBJECT HELPERS
// =====================================================

function addSegment(
    array,
    x1,
    z1,
    x2,
    z2
) {

    array.push(
        x1, 0, z1,
        x2, 0, z2
    );
}


function createLineSegments(
    positions,
    material,
    type,
    dashed = false
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


    if (
        dashed &&
        typeof line.computeLineDistances ===
        "function"
    ) {
        line.computeLineDistances();
    }


    line.userData = {
        type
    };


    return line;
}


// =====================================================
// GRID RENDERING
// =====================================================

function drawDrawing2DGrid() {

    const group =
        window.drawing2D.gridGroup;

    if (!group) {
        return;
    }


    const grid =
        window.drawing2D.grid;

    if (
        !grid.xLines?.length ||
        !grid.zLines?.length
    ) {
        return;
    }


    // -------------------------------------------------
    // Dispose previous grid objects
    // -------------------------------------------------

    disposeDrawing2DGroup(group);


    // -------------------------------------------------
    // Extents
    // -------------------------------------------------

    const minX = 0;
    const minZ = 0;

    const maxX =
        Math.max(
            ...grid.xLines.map(
                line =>
                    Number(line.coordinate)
            ),
            0
        );

    const maxZ =
        Math.max(
            ...grid.zLines.map(
                line =>
                    Number(line.coordinate)
            ),
            0
        );


    if (maxX <= 0 && maxZ <= 0) {
        return;
    }


    // -------------------------------------------------
    // Annotation scale
    // -------------------------------------------------

    const scale =
        getAnnotationScale(grid);


    // -------------------------------------------------
    // Label lanes
    // -------------------------------------------------

    const xLabelLayout =
        assignPointAnnotationLanes(
            grid.xLines.map(
                line =>
                    Number(line.coordinate)
            ),
            scale.xLabelSize
        );


    const zLabelLayout =
        assignPointAnnotationLanes(
            grid.zLines.map(
                line =>
                    Number(line.coordinate)
            ),
            scale.zLabelSize
        );


    // -------------------------------------------------
    // Dimension lanes
    // -------------------------------------------------

    const xIntervals =
        grid.xLines.slice(1)
            .map(
                (line, index) => ({
                    start:
                        Number(
                            grid.xLines[index]
                                .coordinate
                        ),

                    end:
                        Number(
                            line.coordinate
                        )
                })
            );


    const zIntervals =
        grid.zLines.slice(1)
            .map(
                (line, index) => ({
                    start:
                        Number(
                            grid.zLines[index]
                                .coordinate
                        ),

                    end:
                        Number(
                            line.coordinate
                        )
                })
            );


    const xDimensionLayout =
        assignDimensionLanes(
            xIntervals,
            scale.xDimensionTextSize * 2.15
        );


    const zDimensionLayout =
        assignDimensionLanes(
            zIntervals,
            scale.zDimensionTextSize * 2.15
        );


    // -------------------------------------------------
    // Store layout for fit()
    // -------------------------------------------------

    window.drawing2D.annotationLayout = {
        ...scale,

        xLabelLanes:
            xLabelLayout.count,

        zLabelLanes:
            zLabelLayout.count,

        xDimensionLanes:
            Math.max(
                xDimensionLayout.count,
                1
            ),

        zDimensionLanes:
            Math.max(
                zDimensionLayout.count,
                1
            )
    };


    // -------------------------------------------------
    // Grid materials
    // -------------------------------------------------

    const baseGridColor =
        new THREE.Color(
            window.drawing2D.gridSettings.color
        );

    const minorGridColor =
        baseGridColor.clone().lerp(
            new THREE.Color(0xffffff),
            0.45
        );

    const majorGridColor =
        baseGridColor.clone();


    const minorMaterial =
        new THREE.LineBasicMaterial({
            color: minorGridColor
        });


    const majorMaterial =
        new THREE.LineBasicMaterial({
            color: majorGridColor
        });


    const minorPositions = [];
    const majorPositions = [];


    // -------------------------------------------------
    // Vertical grid lines
    // X = constant
    // -------------------------------------------------

    grid.xLines.forEach(
        (line, index) => {

            const x =
                Number(line.coordinate);

            const boundary =
                index === 0 ||
                index ===
                    grid.xLines.length - 1;


            addSegment(
                boundary
                    ? majorPositions
                    : minorPositions,

                x,
                minZ,

                x,
                maxZ
            );
        }
    );


    // -------------------------------------------------
    // Horizontal grid lines
    // Z = constant
    // -------------------------------------------------

    grid.zLines.forEach(
        (line, index) => {

            const z =
                Number(line.coordinate);

            const boundary =
                index === 0 ||
                index ===
                    grid.zLines.length - 1;


            addSegment(
                boundary
                    ? majorPositions
                    : minorPositions,

                minX,
                z,

                maxX,
                z
            );
        }
    );


    // -------------------------------------------------
    // Add grid geometry
    // -------------------------------------------------

    const minorLines =
        createLineSegments(
            minorPositions,
            minorMaterial,
            "gridMinor"
        );

    if (minorLines) {
        group.add(minorLines);
    }


    const majorLines =
        createLineSegments(
            majorPositions,
            majorMaterial,
            "gridMajor"
        );

    if (majorLines) {
        group.add(majorLines);
    }


    // -------------------------------------------------
    // Grid label bands
    // -------------------------------------------------

    const xLabelBaseZ =
        maxZ +
        scale.xLabelGap;


    const zLabelBaseX =
        minX -
        scale.zLabelGap;


    // -------------------------------------------------
    // X labels -> A, B, C...
    // -------------------------------------------------

    grid.xLines.forEach(
        (line, index) => {

            const x =
                Number(line.coordinate);

            const lane =
                xLabelLayout.lanes[index];


            const label =
                createDrawing2DGridBubble(
                    line.id,
                    scale.xLabelSize
                );


            label.position.set(
                x,
                0,
                xLabelBaseZ +
                lane *
                scale.xLabelLaneStep
            );


            label.userData = {
                type: "gridLabel",
                axis: "X",
                label: line.id,
                coordinate: x,
                lane
            };


            group.add(label);
        }
    );


    // -------------------------------------------------
    // Z labels -> 1, 2, 3...
    // -------------------------------------------------

    grid.zLines.forEach(
        (line, index) => {

            const z =
                Number(line.coordinate);

            const lane =
                zLabelLayout.lanes[index];


            const label =
                createDrawing2DGridBubble(
                    line.id,
                    scale.zLabelSize
                );


            label.position.set(
                zLabelBaseX -
                lane *
                scale.zLabelLaneStep,

                0,

                z
            );


            label.userData = {
                type: "gridLabel",
                axis: "Z",
                label: line.id,
                coordinate: z,
                lane
            };


            group.add(label);
        }
    );


    // =================================================
    // DIMENSIONS
    // =================================================

    const dimensionMainPositions = [];
    const dimensionExtensionPositions = [];
    const dimensionTickPositions = [];


    // -------------------------------------------------
    // Dimension materials
    // -------------------------------------------------

    const dimensionMainMaterial =
        new THREE.LineDashedMaterial({
            color:
                DRAWING2D_CONFIG.colors.dimensionMain,

            dashSize: 0.20,
            gapSize: 0.12,

            transparent: true,
            opacity: 0.95
        });


    const dimensionExtensionMaterial =
        new THREE.LineBasicMaterial({
            color:
                DRAWING2D_CONFIG.colors.dimensionExtension
        });


    const dimensionTickMaterial =
        new THREE.LineBasicMaterial({
            color:
                DRAWING2D_CONFIG.colors.dimensionTick
        });


    // -------------------------------------------------
    // X dimension base
    // -------------------------------------------------

    const xDimensionBaseZ =
        maxZ +
        scale.xLabelGap +
        xLabelLayout.count *
        scale.xLabelLaneStep +
        scale.xDimensionGap;


    // -------------------------------------------------
    // X dimensions
    // -------------------------------------------------

    grid.xLines.forEach(
        (line, index) => {

            const x =
                Number(line.coordinate);


            const lane =
                index > 0
                    ? xDimensionLayout.lanes[index - 1]
                    : 0;


            const dimensionZ =
                xDimensionBaseZ +
                lane *
                scale.xDimensionLaneStep;


            // Extension
            addSegment(
                dimensionExtensionPositions,

                x,
                maxZ,

                x,
                dimensionZ
            );


            if (index === 0) {
                return;
            }


            const previousX =
                Number(
                    grid.xLines[index - 1]
                        .coordinate
                );


            // Main dimension
            addSegment(
                dimensionMainPositions,

                previousX,
                dimensionZ,

                x,
                dimensionZ
            );


            // Ticks
            addSegment(
                dimensionTickPositions,

                previousX,
                dimensionZ -
                scale.extensionLength,

                previousX,
                dimensionZ +
                scale.extensionLength
            );


            addSegment(
                dimensionTickPositions,

                x,
                dimensionZ -
                scale.extensionLength,

                x,
                dimensionZ +
                scale.extensionLength
            );


            // Label
            const distance =
                x - previousX;


            const label =
                createDrawing2DDimensionLabel(
                    `${distance.toFixed(2)} m`,
                    scale.xDimensionTextSize
                );


            label.position.set(
                (previousX + x) / 2,
                0,
                dimensionZ +
                scale.xDimensionTextOffset
            );


            group.add(label);
        }
    );


    // -------------------------------------------------
    // Z dimension base
    // -------------------------------------------------

    const zDimensionBaseX =
        minX -
        scale.zLabelGap -
        zLabelLayout.count *
        scale.zLabelLaneStep -
        scale.zDimensionGap;


    // -------------------------------------------------
    // Z dimensions
    // -------------------------------------------------

    grid.zLines.forEach(
        (line, index) => {

            const z =
                Number(line.coordinate);


            const lane =
                index > 0
                    ? zDimensionLayout.lanes[index - 1]
                    : 0;


            const dimensionX =
                zDimensionBaseX -
                lane *
                scale.zDimensionLaneStep;


            // Extension
            addSegment(
                dimensionExtensionPositions,

                minX,
                z,

                dimensionX,
                z
            );


            if (index === 0) {
                return;
            }


            const previousZ =
                Number(
                    grid.zLines[index - 1]
                        .coordinate
                );


            // Main dimension
            addSegment(
                dimensionMainPositions,

                dimensionX,
                previousZ,

                dimensionX,
                z
            );


            // Ticks
            addSegment(
                dimensionTickPositions,

                dimensionX -
                scale.extensionLength,
                previousZ,

                dimensionX +
                scale.extensionLength,
                previousZ
            );


            addSegment(
                dimensionTickPositions,

                dimensionX -
                scale.extensionLength,
                z,

                dimensionX +
                scale.extensionLength,
                z
            );


            // Label
            const distance =
                z - previousZ;


            const label =
                createDrawing2DDimensionLabel(
                    `${distance.toFixed(2)} m`,
                    scale.zDimensionTextSize
                );


            label.position.set(
                dimensionX -
                scale.zDimensionTextOffset,
                0,
                (previousZ + z) / 2
            );


            label.rotation.z =
                Math.PI / 2;


            group.add(label);
        }
    );


    // -------------------------------------------------
    // Add dimensions
    // -------------------------------------------------

    const mainDimensions =
        createLineSegments(
            dimensionMainPositions,
            dimensionMainMaterial,
            "gridDimensionMain",
            true
        );

    if (mainDimensions) {
        group.add(mainDimensions);
    }


    const extensionDimensions =
        createLineSegments(
            dimensionExtensionPositions,
            dimensionExtensionMaterial,
            "gridDimensionExtension"
        );

    if (extensionDimensions) {
        group.add(extensionDimensions);
    }


    const tickDimensions =
        createLineSegments(
            dimensionTickPositions,
            dimensionTickMaterial,
            "gridDimensionTicks"
        );

    if (tickDimensions) {
        group.add(tickDimensions);
    }


    // =================================================
    // GLOBAL AXES
    // =================================================

    const axisLength =
        Math.max(
            Math.min(maxX, maxZ) * 0.12,
            1.0
        );


    const axisHead =
        Math.min(
            axisLength * 0.18,
            0.24
        );


    // -------------------------------------------------
    // X axis
    // -------------------------------------------------

    const xAxis =
        new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 0, 0),
            axisLength,
            DRAWING2D_CONFIG.colors.xAxis,
            axisHead,
            axisHead * 0.5
        );


    xAxis.userData = {
        type: "globalAxis",
        axis: "X"
    };


    group.add(xAxis);


    // -------------------------------------------------
    // Z axis
    // World Z is the second plan direction
    // -------------------------------------------------

    const zAxis =
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, 0, 0),
            axisLength,
            DRAWING2D_CONFIG.colors.zAxis,
            axisHead,
            axisHead * 0.5
        );


    zAxis.userData = {
        type: "globalAxis",
        axis: "Z"
    };


    group.add(zAxis);


    // -------------------------------------------------
    // X axis label
    // -------------------------------------------------

    const xLabel =
        createDrawing2DText(
            "X",
            {
                font:
                    "600 128px Segoe UI",

                color:
                    "#e74c3c",

                width:
                    scale.xLabelSize * 1.4,

                height:
                    scale.xLabelSize * 0.50
            }
        );


    xLabel.position.set(
        axisLength +
        scale.xLabelGap,
        0,
        0
    );


    xLabel.userData = {
        type: "axisLabel",
        axis: "X"
    };


    group.add(xLabel);


    // -------------------------------------------------
    // Z axis label
    // -------------------------------------------------

    const zLabel =
        createDrawing2DText(
            "Z",
            {
                font:
                    "600 128px Segoe UI",

                color:
                    "#3498db",

                width:
                    scale.zLabelSize * 1.4,

                height:
                    scale.zLabelSize * 0.50
            }
        );


    zLabel.position.set(
        0,
        0,
        axisLength +
        scale.zLabelGap
    );


    zLabel.userData = {
        type: "axisLabel",
        axis: "Z"
    };


    group.add(zLabel);


    // -------------------------------------------------
    // Origin marker
    // -------------------------------------------------

    const originGeometry =
        new THREE.CircleGeometry(
            Math.min(
                scale.xLabelSize,
                scale.zLabelSize
            ) * 0.12,
            16
        );

    originGeometry.rotateX(
        -Math.PI / 2
    );


    const originMaterial =
        new THREE.MeshBasicMaterial({
            color:
                DRAWING2D_CONFIG.colors.origin
        });


    const origin =
        new THREE.Mesh(
            originGeometry,
            originMaterial
        );


    origin.position.set(
        0,
        0.001,
        0
    );


    origin.userData = {
        type: "origin"
    };


    group.add(origin);


    group.visible =
        window.drawing2D.gridVisible;
}


// =====================================================
// DISPOSE GRID OBJECTS
// =====================================================

function disposeDrawing2DGroup(group) {

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
// TEXT SPRITE
// =====================================================

function createDrawing2DText(
    text,
    options = {}
) {

    const canvas =
        document.createElement("canvas");


    const ctx =
        canvas.getContext("2d");


    const width =
        options.canvasWidth || 1024;

    const height =
        options.canvasHeight || 256;


    canvas.width = width;
    canvas.height = height;


    ctx.clearRect(
        0,
        0,
        width,
        height
    );


    ctx.font =
        options.font ||
        "600 128px Segoe UI";


    ctx.fillStyle =
        options.color ||
        "#0B0B0B";


    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        String(text),
        width / 2,
        height / 2
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
        new THREE.Sprite(material);


    sprite.scale.set(
        options.width || 1.2,
        options.height || 0.30,
        1
    );


    return sprite;
}


// =====================================================
// GRID LABEL BUBBLE
// =====================================================

function createDrawing2DGridBubble(
    text,
    size = 1.0
) {

    const canvas =
        document.createElement("canvas");


    const ctx =
        canvas.getContext("2d");


    canvas.width = 512;
    canvas.height = 512;


    const center = 256;
    const radius = 178;


    // Background
    ctx.beginPath();

    ctx.arc(
        center,
        center,
        radius,
        0,
        Math.PI * 2
    );

    ctx.fillStyle =
        "#ffffff";

    ctx.fill();


    // Border
    ctx.lineWidth = 16;

    ctx.strokeStyle =
        "#000000";

    ctx.stroke();


    // Text
    ctx.font =
        "600 200px Segoe UI";

    ctx.fillStyle =
        DRAWING2D_CONFIG.colors.labelText;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";


    ctx.fillText(
        String(text),
        center,
        center
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
        new THREE.Sprite(material);


    sprite.scale.set(
        size,
        size,
        1
    );


    return sprite;
}


// =====================================================
// DIMENSION LABEL
// =====================================================

function createDrawing2DDimensionLabel(
    text,
    size = 0.8
) {

    return createDrawing2DText(
        text,
        {
            font:
                "600 128px Segoe UI",

            color:
                DRAWING2D_CONFIG.colors.dimensionText,

            width:
                size * 2.15,

            height:
                size * 0.42,

            canvasWidth:
                1024,

            canvasHeight:
                256
        }
    );
}


// =====================================================
// MOUSE COORDINATES
// =====================================================

function handleDrawing2DMouseMove(event) {

    const {
        camera,
        renderer
    } = window.drawing2D;


    if (!camera || !renderer) {
        return;
    }


    const canvas =
        renderer.domElement;


    const rect =
        canvas.getBoundingClientRect();


    const mouse =
        new THREE.Vector2(

            (
                (event.clientX -
                rect.left) /
                rect.width
            ) * 2 - 1,

            -(
                (event.clientY -
                rect.top) /
                rect.height
            ) * 2 + 1
        );


    const raycaster =
        new THREE.Raycaster();


    raycaster.setFromCamera(
        mouse,
        camera
    );


    // -------------------------------------------------
    // Plan plane
    // World Y = 0
    // World Z = plan Z
    // -------------------------------------------------

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
        raycaster.ray.intersectPlane(
            plane,
            point
        )
    ) {

        const status =
            document.getElementById(
                "drawing2DCoordinateStatus"
            );


        if (status) {

            status.innerText =
                `X: ${point.x.toFixed(2)} m    ` +
                `Z: ${point.z.toFixed(2)} m`;
        }
    }

    if (
        typeof handleDrawing2DBeamBetweenPointsMouseMove ===
        "function"
    ) {

        handleDrawing2DBeamBetweenPointsMouseMove(
            event
        );

    }
}