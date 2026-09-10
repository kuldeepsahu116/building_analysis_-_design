// =============================================
// 3D RESULT DIAGRAMS
// =============================================


// =============================================
// COMMON HELPERS
// =============================================

function getThreeMemberGeometry(member, nodes) {

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return null;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    const axes =
        getMemberLocalAxes(
            start,
            end,
            Number(member.beta) || 0
        );

    if (!axes) {
        return null;
    }

    const {
        localX,
        localY,
        localZ,
        length
    } = axes;
    
    return {
        start,
        end,
        length,
        localX,
        localY,
        localZ
    };
}


// =============================================
// CREATE DIAGRAM LINE
// =============================================

function createThreeDiagramLine(
    points,
    type
) {

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);

    let color = 0x0066ff;

    if (type === "afd") {
        color = 0xff6600;
    }
    else if (type === "sfd") {
        color = 0x0066ff;
    }
    else if (type === "bmd") {
        color = 0x009933;
    }
    else if (type === "tmd") {
        color = 0x9933cc;
    }
    else if (type === "deflection") {
        color = 0xcc0000;
    }

    const material =
        new THREE.LineBasicMaterial({
            color: color
        });

    return new THREE.Line(
        geometry,
        material
    );
}

// =============================================
// GET DIAGRAM COLOR
// =============================================

function getThreeDiagramColor(type) {

    if (type === "afd") {
        return 0xff6600;
    }

    if (type === "sfd") {
        return 0x0066ff;
    }

    if (type === "bmd") {
        return 0x009933;
    }

    if (type === "tmd") {
        return 0x9933cc;
    }

    if (type === "deflection") {
        return 0xcc0000;
    }

    return 0x0066ff;
}


// =============================================
// CREATE DIAGRAM HATCHING
// =============================================

function createThreeDiagramHatching(
    points,
    xValues,
    geometry,
    type
) {

    if (
        !Array.isArray(points) ||
        !Array.isArray(xValues) ||
        !geometry
    ) {
        return;
    }

    if (
        points.length < 2 ||
        xValues.length !== points.length
    ) {
        return;
    }

    const length = geometry.length;

    if (length <= 0) {
        return;
    }

    const color =
        getThreeDiagramColor(type);

    const material =
        new THREE.LineBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.35
        });

    // -----------------------------------------
    // HATCH POSITIONS
    // -----------------------------------------

    const hatchPositions = [];

    let x = 0;

    while (x < length) {

        hatchPositions.push(x);

        x += THREE_DIAGRAM_HATCH_SPACING;
    }

    // Always include the end
    if (
        hatchPositions.length === 0 ||
        Math.abs(
            hatchPositions[hatchPositions.length - 1] - length
        ) > 1e-6
    ) {
        hatchPositions.push(length);
    }

    // -----------------------------------------
    // INTERPOLATE DIAGRAM POINT
    // -----------------------------------------

    function getDiagramPointAtX(targetX) {

        if (targetX <= xValues[0]) {
            return points[0].clone();
        }

        const last =
            xValues.length - 1;

        if (targetX >= xValues[last]) {
            return points[last].clone();
        }

        for (let i = 0; i < last; i++) {

            const x1 =
                Number(xValues[i]);

            const x2 =
                Number(xValues[i + 1]);

            if (
                targetX >= x1 &&
                targetX <= x2
            ) {

                const dx = x2 - x1;

                if (Math.abs(dx) < 1e-12) {
                    return points[i].clone();
                }

                const ratio =
                    (targetX - x1) / dx;

                return points[i]
                    .clone()
                    .lerp(
                        points[i + 1],
                        ratio
                    );
            }
        }

        return points[last].clone();
    }

    // -----------------------------------------
    // DRAW HATCH LINES
    // -----------------------------------------

    hatchPositions.forEach(targetX => {

        const basePoint =
            geometry.start.clone()
                .add(
                    geometry.localX.clone()
                        .multiplyScalar(targetX)
                );

        const diagramPoint =
            getDiagramPointAtX(targetX);

        const hatchGeometry =
            new THREE.BufferGeometry()
                .setFromPoints([
                    basePoint,
                    diagramPoint
                ]);

        const hatchLine =
            new THREE.Line(
                hatchGeometry,
                material
            );

        hatchLine.userData = {
            type: "diagramHatch",
            diagramType: type,
            x: targetX
        };

        window.threeResultGroup.add(
            hatchLine
        );
    });
}

// =============================================
// DIAGRAM SCALES
// =============================================

window.diagramScales = {
    afd: null,
    sfd: null,
    bmd: null,
    tmd: null,
    deflection: null
};

// =============================================
// DIAGRAM HATCHING
// =============================================

// Distance between hatch lines along member
const THREE_DIAGRAM_HATCH_SPACING = 0.5;


// =============================================
// GET DIAGRAM SCALE
// =============================================

function getThreeDiagramScale(type) {

    if (
        window.diagramScales &&
        window.diagramScales[type] !== null &&
        window.diagramScales[type] !== undefined
    ) {
        const scale = Number(
            window.diagramScales[type]
        );

        if (isFinite(scale) && scale > 0) {
            return scale;
        }
    }

    return 1;
}

// =============================================
// AUTOMATIC DIAGRAM SCALE
// =============================================

function calculateThreeAutomaticScale(type) {

    if (
        !window.analysisResults
    ) {
        return 1;
    }

    const nodes = getNodes();

    if (!nodes) {
        return 1;
    }

    const nodeList = Object.values(nodes);

    if (nodeList.length === 0) {
        return 1;
    }

    // -----------------------------------------
    // STRUCTURE SIZE
    // -----------------------------------------

    const xs = nodeList.map(
        n => Number(n[0]) || 0
    );

    const ys = nodeList.map(
        n => Number(n[1]) || 0
    );

    const zs = nodeList.map(
        n => Number(n[2]) || 0
    );

    const structureSize = Math.max(
        Math.max(...xs) - Math.min(...xs),
        Math.max(...ys) - Math.min(...ys),
        Math.max(...zs) - Math.min(...zs),
        1
    );

    // -----------------------------------------
    // TARGET DIAGRAM SIZE
    // -----------------------------------------

    // Maximum diagram ordinate will be
    // approximately 15% of structure size.

    const targetDiagramSize =
        structureSize * 0.15;

    // -----------------------------------------
    // FIND MAXIMUM RESULT
    // -----------------------------------------

    let maxValue = 0;

    // -----------------------------------------
    // AFD
    // -----------------------------------------

    if (
        type === "afd" &&
        Array.isArray(window.analysisResults.afd)
    ) {

        window.analysisResults.afd.forEach(diagram => {

            if (
                diagram &&
                Array.isArray(diagram.N)
            ) {

                diagram.N.forEach(value => {

                    maxValue = Math.max(
                        maxValue,
                        Math.abs(Number(value) || 0)
                    );

                });
            }
        });
    }

    // -----------------------------------------
    // SFD
    // -----------------------------------------

    else if (
        type === "sfd" &&
        Array.isArray(window.analysisResults.sfd)
    ) {

        window.analysisResults.sfd.forEach(diagram => {

            if (
                !diagram ||
                !diagram.V
            ) {
                return;
            }

            ["y", "z"].forEach(direction => {

                if (
                    Array.isArray(
                        diagram.V[direction]
                    )
                ) {

                    diagram.V[direction].forEach(value => {

                        maxValue = Math.max(
                            maxValue,
                            Math.abs(
                                Number(value) || 0
                            )
                        );

                    });
                }
            });
        });
    }

    // -----------------------------------------
    // BMD
    // -----------------------------------------

    else if (
        type === "bmd" &&
        Array.isArray(window.analysisResults.bmd)
    ) {

        window.analysisResults.bmd.forEach(diagram => {

            if (
                !diagram ||
                !diagram.M
            ) {
                return;
            }

            ["y", "z"].forEach(direction => {

                if (
                    Array.isArray(
                        diagram.M[direction]
                    )
                ) {

                    diagram.M[direction].forEach(value => {

                        maxValue = Math.max(
                            maxValue,
                            Math.abs(
                                Number(value) || 0
                            )
                        );

                    });
                }
            });
        });
    }

    // -----------------------------------------
    // TMD
    // -----------------------------------------

    else if (
        type === "tmd" &&
        Array.isArray(window.analysisResults.tmd)
    ) {

        window.analysisResults.tmd.forEach(diagram => {

            if (
                diagram &&
                Array.isArray(diagram.T)
            ) {

                diagram.T.forEach(value => {

                    maxValue = Math.max(
                        maxValue,
                        Math.abs(Number(value) || 0)
                    );

                });
            }
        });
    }

    // -----------------------------------------
    // DEFLECTION
    // -----------------------------------------

    else if (
        type === "deflection"
    ) {

        const deflectionData =
            window.analysisResults.deflection_shapes;

        if (
            Array.isArray(deflectionData)
        ) {

            deflectionData.forEach(d => {

                if (
                    d &&
                    d.max_deflection &&
                    typeof d.max_deflection === "object"
                ) {

                    maxValue = Math.max(
                        maxValue,
                        Math.abs(
                            Number(
                                d.max_deflection.y
                            ) || 0
                        ),
                        Math.abs(
                            Number(
                                d.max_deflection.z
                            ) || 0
                        )
                    );
                }

                if (
                    d &&
                    d.min_deflection &&
                    typeof d.min_deflection === "object"
                ) {

                    maxValue = Math.max(
                        maxValue,
                        Math.abs(
                            Number(
                                d.min_deflection.y
                            ) || 0
                        ),
                        Math.abs(
                            Number(
                                d.min_deflection.z
                            ) || 0
                        )
                    );
                }
            });
        }
    }

    // -----------------------------------------
    // NO RESULT
    // -----------------------------------------

    if (maxValue <= 0) {
        return 1;
    }

    // -----------------------------------------
    // AUTOMATIC SCALE
    // -----------------------------------------

    let scale =
        targetDiagramSize / maxValue;

    // -----------------------------------------
    // SAFETY LIMITS
    // -----------------------------------------

    scale = Math.max(
        0.000001,
        Math.min(scale, 1000000)
    );

    return scale;
}

// =============================================
// SET ALL AUTOMATIC DIAGRAM SCALES
// =============================================

function setAutomaticDiagramScales() {

    if (!window.analysisResults) {
        return;
    }

    const diagramTypes = [
        "afd",
        "sfd",
        "bmd",
        "tmd",
        "deflection"
    ];

    diagramTypes.forEach(type => {

        window.diagramScales[type] =
            calculateThreeAutomaticScale(type);

    });

    syncDiagramMenu();
}

// =============================================
// UPDATE SCALE FROM INPUT
// =============================================

function updateDiagramScale(type) {

    const input =
        document.getElementById(
            `${type}ScaleInput`
        );

    if (!input) {
        return;
    }

    const value =
        parseFloat(input.value);

    if (
        isNaN(value) ||
        value <= 0
    ) {
        return;
    }

    window.diagramScales[type] =
        value;

    drawStructure();
}


// =============================================
// CHANGE SCALE USING +/- BUTTONS
// =============================================

function changeDiagramScale(
    type,
    delta
) {

    const input =
        document.getElementById(
            `${type}ScaleInput`
        );

    if (!input) {
        return;
    }

    let value =
        parseFloat(input.value);

    if (isNaN(value)) {
        value =
            getThreeDiagramScale(type);
    }

    value += delta;

    if (value <= 0) {
        value = 1;
    }

    input.value = value;

    window.diagramScales[type] =
        value;

    drawStructure();
}


// =============================================
// RESET DIAGRAM SCALES
// =============================================

function resetDiagramScales() {

    // Clear current scales
    window.diagramScales = {
        afd: null,
        sfd: null,
        bmd: null,
        tmd: null,
        deflection: null
    };

    // Recalculate automatically
    setAutomaticDiagramScales();

    drawStructure();
}

// =============================================
// TOGGLE VIEW OPTIONS
// =============================================

function toggleViewOptions() {

    const loadsToggle =
        document.getElementById(
            "showLoadsToggle"
        );

    const supportsToggle =
        document.getElementById(
            "showSupportsToggle"
        );

    const labelsToggle =
        document.getElementById(
            "showLabelsToggle"
        );

    if (loadsToggle) {

        window.viewOptions.loads =
            loadsToggle.checked;
    }

    if (supportsToggle) {

        window.viewOptions.supports =
            supportsToggle.checked;
    }

    if (labelsToggle) {

        window.viewOptions.labels =
            labelsToggle.checked;
    }

    drawStructure();
}


// =============================================
// FORMAT DIAGRAM SCALES
// =============================================

function formatThreeDiagramScale(value) {

    if (!isFinite(value) || value <= 0) {
        return "1";
    }

    if (value >= 0.01 && value < 1000) {
        return Number(value.toFixed(3)).toString();
    }

    return Number(
        value.toExponential(3)
    ).toString();
}


// =============================================
// SYNC DIAGRAM MENU UI
// =============================================

function syncDiagramMenu(){

    // -----------------------------------------
    // AFD
    // -----------------------------------------

    const afdInput =
        document.getElementById("afdScaleInput");

    if (afdInput) {
        afdInput.value =
            formatThreeDiagramScale(
                window.diagramScales.afd);
    }

    // -----------------------------------------
    // SFD
    // -----------------------------------------

    const sfdInput =
        document.getElementById("sfdScaleInput");

    if (sfdInput) {
        sfdInput.value =
            formatThreeDiagramScale(
                window.diagramScales.sfd
            );
    }


    // -----------------------------------------
    // BMD
    // -----------------------------------------

    const bmdInput =
        document.getElementById("bmdScaleInput");

    if (bmdInput) {
        bmdInput.value =
            formatThreeDiagramScale(
                window.diagramScales.bmd
            );
    }

    // -----------------------------------------
    // TMD
    // -----------------------------------------

    const tmdInput =
        document.getElementById("tmdScaleInput");

    if (tmdInput) {
        tmdInput.value =
            formatThreeDiagramScale(
                window.diagramScales.tmd
            );
    }


    // -----------------------------------------
    // DEFLECTION
    // -----------------------------------------

    const deflectionInput =
        document.getElementById(
            "deflectionScaleInput"
        );

    if (deflectionInput) {
        deflectionInput.value =
            formatThreeDiagramScale(
                window.diagramScales.deflection
            );
    }


    // -----------------------------------------
    // LOADS
    // -----------------------------------------

    const loadsToggle =
        document.getElementById(
            "showLoadsToggle"
        );

    if(loadsToggle){

        loadsToggle.checked =
            window.viewOptions.loads;
    }


    // -----------------------------------------
    // SUPPORTS
    // -----------------------------------------

    const supportsToggle =
        document.getElementById(
            "showSupportsToggle"
        );

    if(supportsToggle){

        supportsToggle.checked =
            window.viewOptions.supports;
    }


    // -----------------------------------------
    // LABELS
    // -----------------------------------------

    const labelsToggle =
        document.getElementById(
            "showLabelsToggle"
        );

    if(labelsToggle){

        labelsToggle.checked =
            window.viewOptions.labels;
    }
}


// =============================================
// DRAW ONE MEMBER DIAGRAM
// =============================================

function drawThreeMemberDiagram(
    member,
    nodes,
    diagram,
    type,
    direction = null,
    drawBase = true
) {

    const geometry =
        getThreeMemberGeometry(
            member,
            nodes
        );

    if (!geometry || !diagram) {
        return;
    }

    const {
        start,
        length,
        localX,
        localY,
        localZ
    } = geometry;

    if (!Array.isArray(diagram.x)) {
        return;
    }

    // -----------------------------------------
    // GET VALUES
    // -----------------------------------------

    let values;

    if (type === "afd") {

        values = diagram.N;

    }
    else if (type === "sfd") {

        if (
            !diagram.V ||
            !Array.isArray(diagram.V[direction])
        ) {
            return;
        }

        values = diagram.V[direction];

    }
    else if (type === "bmd") {

        if (
            !diagram.M ||
            !Array.isArray(diagram.M[direction])
        ) {
            return;
        }

        values = diagram.M[direction];

    }
    else if (type === "tmd") {

        values = diagram.T;
    }

    if (!Array.isArray(values)) {
        return;
    }

    if (values.length === 0) {
        return;
    }

    const actualLength =
        Number(
            diagram.x[
                diagram.x.length - 1
            ]
        );

    if (actualLength <= 0) {
        return;
    }

    const scale =
        getThreeDiagramScale(type);

    const points = [];

    // -----------------------------------------
    // DRAW DIAGRAM
    // -----------------------------------------

    for (
        let i = 0;
        i < diagram.x.length;
        i++
    ) {

        const x =
            Number(diagram.x[i]);

        const value =
            Number(values[i]) || 0;

        const position =
            start.clone()
                .add(
                    localX.clone()
                        .multiplyScalar(x)
                );

        let offsetDirection;

        // -------------------------------------
        // AFD
        // -------------------------------------

        if (type === "afd") {

            offsetDirection = localY;
        }

        // -------------------------------------
        // SFD
        // Vy -> local Y
        // Vz -> local Z
        // -------------------------------------

        else if (type === "sfd") {

            if (direction === "y") {
                offsetDirection = localY;
            }
            else {
                offsetDirection = localZ;
            }
        }

        // -------------------------------------
        // BMD
        // My -> local Z
        // Mz -> local Y
        // -------------------------------------

        else if (type === "bmd") {

            if (direction === "y") {
                offsetDirection = localZ;
            }
            else {
                offsetDirection = localY;
            }
        }

        // -------------------------------------
        // TMD
        // -------------------------------------

        else if (type === "tmd") {

            offsetDirection = localZ;
        }

        if (!offsetDirection) {
            return;
        }

        const offset =
            offsetDirection.clone()
                .multiplyScalar(
                    value * scale
                );

        points.push(
            position.clone()
                .add(offset)
        );
    }

    if (points.length < 2) {
        return;
    }

    // -----------------------------------------
    // DIAGRAM LINE
    // -----------------------------------------

    const diagramLine =
        createThreeDiagramLine(
            points,
            type
        );

    diagramLine.userData = {
        type: "resultDiagram",
        diagramType: type,
        direction: direction,
        member: member.name
    };

    window.threeResultGroup.add(
        diagramLine
    );

    // -----------------------------------------
    // DIAGRAM HATCHING
    // -----------------------------------------

    createThreeDiagramHatching(
        points,
        diagram.x,
        geometry,
        type
    );

    // -----------------------------------------
    // BASE MEMBER AXIS
    // Only draw once for SFD/BMD
    // -----------------------------------------

    if (drawBase) {

        const basePoints = [
            start.clone(),
            geometry.end.clone()
        ];

        const baseLine =
            new THREE.Line(
                new THREE.BufferGeometry()
                    .setFromPoints(
                        basePoints
                    ),
                new THREE.LineBasicMaterial({
                    color: 0xaaaaaa
                })
            );

        baseLine.userData = {
            type: "diagramBase",
            diagramType: type,
            member: member.name
        };

        window.threeResultGroup.add(
            baseLine
        );
    }
}

// =============================================
// AFD
// =============================================

function drawThreeAFD(nodes, members) {

    if (
        !window.analysisResults ||
        !Array.isArray(window.analysisResults.afd)
    ) {
        return;
    }

    const data =
        window.analysisResults.afd;

    members.forEach((member, i) => {

        const diagram = data[i];

        if (!diagram) {
            return;
        }

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "afd"
        );
    });
}


// =============================================
// SFD
// =============================================

function drawThreeSFD(nodes, members) {

    if (
        !window.analysisResults ||
        !Array.isArray(window.analysisResults.sfd)
    ) {
        return;
    }

    const data = window.analysisResults.sfd;

    members.forEach((member, i) => {

        const diagram = data[i];

        if (!diagram) {
            return;
        }

        // -----------------------------------------
        // SFD - LOCAL Y DIRECTION
        // -----------------------------------------

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "sfd",
            "y",
            true
        );

        // -----------------------------------------
        // SFD - LOCAL Z DIRECTION
        // -----------------------------------------

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "sfd",
            "z",
            false
        );

    });
}

// =============================================
// BMD
// =============================================

function drawThreeBMD(nodes, members) {

    if (
        !window.analysisResults ||
        !Array.isArray(window.analysisResults.bmd)
    ) {
        return;
    }

    const data = window.analysisResults.bmd;

    members.forEach((member, i) => {

        const diagram = data[i];

        if (!diagram) {
            return;
        }

        // -----------------------------------------
        // BMD - My
        // -----------------------------------------

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "bmd",
            "y",
            true
        );

        // -----------------------------------------
        // BMD - Mz
        // -----------------------------------------

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "bmd",
            "z",
            false
        );

    });
}

// =============================================
// TMD
// =============================================

function drawThreeTMD(nodes, members) {

    if (
        !window.analysisResults ||
        !Array.isArray(window.analysisResults.tmd)
    ) {
        return;
    }

    const data =
        window.analysisResults.tmd;

    members.forEach((member, i) => {

        const diagram = data[i];

        if (!diagram) {
            return;
        }

        drawThreeMemberDiagram(
            member,
            nodes,
            diagram,
            "tmd"
        );
    });
}


// =============================================
// DEFLECTION
// =============================================

function drawThreeDeflection(nodes, members) {

    if (
        !window.analysisResults ||
        !Array.isArray(
            window.analysisResults.deflection_shapes
        )
    ) {
        return;
    }

    const data =
        window.analysisResults.deflection_shapes;

    const scale =
        getThreeDiagramScale("deflection");

    members.forEach((member, i) => {

        const diagram = data[i];

        if (
            !diagram ||
            !Array.isArray(diagram.position) ||
            !Array.isArray(diagram.x) ||
            !Array.isArray(diagram.y) ||
            !Array.isArray(diagram.z)
        ) {
            return;
        }

        const geometry =
            getThreeMemberGeometry(
                member,
                nodes
            );

        if (!geometry) {
            return;
        }

        const points = [];

        for (
            let j = 0;
            j < diagram.position.length;
            j++
        ) {

            const original =
                geometry.start.clone()
                    .add(
                        geometry.localX.clone()
                            .multiplyScalar(
                                Number(
                                    diagram.position[j]
                                ) || 0
                            )
                    );

            const actual =
                new THREE.Vector3(
                    Number(diagram.x[j]) || 0,
                    Number(diagram.y[j]) || 0,
                    Number(diagram.z[j]) || 0
                );

            const displacement =
                actual.clone()
                    .sub(original);

            const deflected =
                original.clone()
                    .add(
                        displacement.multiplyScalar(
                            scale
                        )
                    );

            points.push(deflected);
        }

        if (points.length < 2) {
            return;
        }

        const line =
            createThreeDiagramLine(
                points,
                "deflection"
            );

        line.userData = {
            type: "resultDiagram",
            diagramType: "deflection",
            member: member.name
        };

        window.threeResultGroup.add(
            line
        );
    });
}


// =============================================
// DRAW CURRENT RESULT DIAGRAM
// =============================================

function drawThreeResults(nodes, members) {

    if (
        !window.analysisResults ||
        !window.currentDiagram
    ) {
        return;
    }

    // -----------------------------------------
    // AUTOMATIC SCALE INITIALIZATION
    // -----------------------------------------

    const scalesNeedCalculation =
        !window.diagramScales ||
        window.diagramScales.afd === null ||
        window.diagramScales.sfd === null ||
        window.diagramScales.bmd === null ||
        window.diagramScales.tmd === null ||
        window.diagramScales.deflection === null;

    if (scalesNeedCalculation) {
        setAutomaticDiagramScales();
    }

    switch (window.currentDiagram) {

        case "afd":
            drawThreeAFD(nodes, members);
            break;

        case "sfd":
            drawThreeSFD(nodes, members);
            break;

        case "bmd":
            drawThreeBMD(nodes, members);
            break;

        case "tmd":
            drawThreeTMD(nodes, members);
            break;

        case "deflection":
            drawThreeDeflection(nodes, members);
            break;

        default:
            break;
    }
}


// =============================================
// DIAGRAM SELECTION
// =============================================

function setDiagram(type) {

    window.currentDiagram = type;

    drawStructure();
}

window.addEventListener("load", function(){

    syncDiagramMenu();

});