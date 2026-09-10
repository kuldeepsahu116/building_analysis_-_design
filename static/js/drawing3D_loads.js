
// =============================================
// 3D LOAD DRAWING
// =============================================


// =============================================
// LOAD MATERIAL
// =============================================

function createLoadMaterial() {

    return new THREE.MeshBasicMaterial({
        color: 0xe74c3c
    });

}


// =============================================
// CREATE 3D LOAD ARROW
// =============================================

function createThreeLoadArrow(
    origin,
    direction,
    length = 0.8
) {

    const dir =
        direction.clone().normalize();


    const arrow =
        new THREE.ArrowHelper(
            dir,
            origin,
            length,
            0xe74c3c,
            length * 0.22,
            length * 0.10
        );


    return arrow;
}

// =============================================
// DRAW 3D NODAL FORCE
// =============================================

function drawThreeNodalForce(
    nodeId,
    coordinate,
    load
) {

    const position =
        toThreeVector(coordinate);


    let direction;


    // -----------------------------------------
    // GLOBAL X
    // -----------------------------------------

    if (load.direction === "X") {

        direction =
            new THREE.Vector3(
                load.value1 >= 0 ? 1 : -1,
                0,
                0
            );

    }


    // -----------------------------------------
    // GLOBAL Y
    // -----------------------------------------

    else if (load.direction === "Y") {

        direction =
            new THREE.Vector3(
                0,
                load.value1 >= 0 ? 1 : -1,
                0
            );

    }


    // -----------------------------------------
    // GLOBAL Z
    // -----------------------------------------

    else if (load.direction === "Z") {

        direction =
            new THREE.Vector3(
                0,
                0,
                load.value1 >= 0 ? 1 : -1
            );

    }


    else {

        return;

    }


    // -----------------------------------------
    // ARROW
    // -----------------------------------------

    const arrow =
        createThreeLoadArrow(
            position,
            direction
        );


    // -----------------------------------------
    // USER DATA
    // -----------------------------------------

    arrow.userData = {

        type: "nodalLoad",

        loadType: "point",

        node: String(nodeId),

        direction: load.direction,

        value: load.value1

    };


    // -----------------------------------------
    // ADD TO LOAD GROUP
    // -----------------------------------------

    window.threeLoadGroup.add(
        arrow
    );
}

function drawThreeNodalMoment(nodeId, coordinate, load) {
    const origin = toThreeVector(coordinate);

    const value = Number(load.value1) || 0;
    if (value === 0) return;

    let axis;

    switch (load.direction) {
        case "MX":
            axis = new THREE.Vector3(1, 0, 0);
            break;

        case "MY":
            axis = new THREE.Vector3(0, 1, 0);
            break;

        case "MZ":
            axis = new THREE.Vector3(0, 0, 1);
            break;

        default:
            return;
    }

    // Negative moment reverses the rotation direction
    if (value < 0) {
        axis.negate();
    }

    const radius = 0.18;

    // Create circular arc representing the moment
    const points = [];

    const segments = 32;

    for (let i = 0; i <= segments; i++) {
        const theta = (Math.PI * 1.5) * (i / segments);

        let point;

        if (load.direction === "MX") {
            point = new THREE.Vector3(
                0,
                radius * Math.cos(theta),
                radius * Math.sin(theta)
            );
        }
        else if (load.direction === "MY") {
            point = new THREE.Vector3(
                radius * Math.cos(theta),
                0,
                radius * Math.sin(theta)
            );
        }
        else {
            point = new THREE.Vector3(
                radius * Math.cos(theta),
                radius * Math.sin(theta),
                0
            );
        }

        points.push(point);
    }

    const curveGeometry = new THREE.BufferGeometry().setFromPoints(points);

    const curveMaterial = new THREE.LineBasicMaterial({
        color: 0xff6600
    });

    const curve = new THREE.Line(curveGeometry, curveMaterial);

    curve.position.copy(origin);

    threeLoadGroup.add(curve);

    // -------------------------------------------------
    // Arrow head at end of circular moment arrow
    // -------------------------------------------------

    const endPoint = points[points.length - 1];

    let tangent;

    if (load.direction === "MX") {
        tangent = new THREE.Vector3(
            0,
            -Math.sin(Math.PI * 1.5),
            Math.cos(Math.PI * 1.5)
        );
    }
    else if (load.direction === "MY") {
        tangent = new THREE.Vector3(
            -Math.sin(Math.PI * 1.5),
            0,
            Math.cos(Math.PI * 1.5)
        );
    }
    else {
        tangent = new THREE.Vector3(
            -Math.sin(Math.PI * 1.5),
            Math.cos(Math.PI * 1.5),
            0
        );
    }

    tangent.normalize();

    if (value < 0) {
        tangent.negate();
    }

    const arrowLength = 0.10;
    const arrowHeadLength = 0.08;
    const arrowHeadWidth = 0.06;

    const arrowOrigin = endPoint.clone().add(
        tangent.clone().multiplyScalar(-arrowLength)
    );

    const arrowDirection = tangent.clone();

    const arrowHelper = new THREE.ArrowHelper(
        arrowDirection,
        origin.clone().add(arrowOrigin),
        arrowLength,
        0xff6600,
        arrowHeadLength,
        arrowHeadWidth
    );

    threeLoadGroup.add(arrowHelper);

    // -------------------------------------------------
    // Moment label
    // -------------------------------------------------

    const label = createThreeLabel(
        `${load.direction}: ${value}`,
        "#ff6600"
    );

    label.position.copy(origin);

    if (load.direction === "MX") {
        label.position.y += 0.28;
        label.position.z += 0.28;
    }
    else if (load.direction === "MY") {
        label.position.x += 0.28;
        label.position.z += 0.28;
    }
    else {
        label.position.x += 0.28;
        label.position.y += 0.28;
    }

    threeLoadGroup.add(label);
}


// =============================================
// DRAW 3D MEMBER POINT LOAD
// =============================================

function drawThreeMemberPointLoad(
    member,
    nodes,
    load
) {

    // -----------------------------------------
    // GET MEMBER NODES
    // -----------------------------------------

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    // -----------------------------------------
    // MEMBER LOCAL AXES
    // -----------------------------------------

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) {
        return;
    }

    const {
        localX,
        localY,
        localZ,
        length: memberLength
    } = axes;

    // -----------------------------------------
    // LOAD DIRECTION
    // -----------------------------------------

    let direction;

    if (load.direction === "x") {

        direction = localX.clone();

    }
    else if (load.direction === "y") {

        direction = localY.clone();

    }
    else if (load.direction === "z") {

        direction = localZ.clone();

    }
    else {

        return;
    }

    // -----------------------------------------
    // LOAD SIGN
    // -----------------------------------------

    const value = Number(load.value1) || 0;

    if (value === 0) {
        return;
    }

    if (value < 0) {
        direction.negate();
    }

    // -----------------------------------------
    // LOAD POSITION
    //
    // a = distance from member start
    // -----------------------------------------

    let a = Number(load.a) || 0;

    // Keep load inside the member
    a = Math.max(
        0,
        Math.min(a, memberLength)
    );

    const loadPosition = start.clone()
        .add(
            localX.clone().multiplyScalar(a)
        );

    // -----------------------------------------
    // ARROW
    // -----------------------------------------

    const arrowLength = 0.45;

    const arrow = createThreeLoadArrow(
        loadPosition,
        direction,
        arrowLength
    );

    arrow.userData = {
        type: "memberLoad",
        loadType: "point",
        member: member.name,
        direction: load.direction,
        value: value,
        a: a
    };

    window.threeLoadGroup.add(arrow);

    // -----------------------------------------
    // LOAD LABEL
    // -----------------------------------------

    const label = createThreeLabel(
        `${load.direction}: ${value}`,
        "#e74c3c"
    );

    label.position.copy(loadPosition);

    label.position.add(
        direction.clone().multiplyScalar(0.55)
    );

    window.threeLoadGroup.add(label);
}

// =============================================
// DRAW 3D MEMBER MOMENT LOAD
// =============================================

function drawThreeMemberMomentLoad(
    member,
    nodes,
    load
) {

    // -----------------------------------------
    // GET MEMBER NODES
    // -----------------------------------------

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    // -----------------------------------------
    // MEMBER LOCAL AXES
    // -----------------------------------------

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) {
        return;
    }

    const {
        localX,
        localY,
        localZ,
        length: memberLength
    } = axes;

    // -----------------------------------------
    // MOMENT AXIS
    // -----------------------------------------

    let axis;

    if (load.direction === "x") {
        axis = localX.clone();
    }
    else if (load.direction === "y") {
        axis = localY.clone();
    }
    else if (load.direction === "z") {
        axis = localZ.clone();
    }
    else {
        return;
    }

    // -----------------------------------------
    // VALUE
    // -----------------------------------------

    const value = Number(load.value1) || 0;

    if (value === 0) {
        return;
    }

    // Negative moment reverses rotation
    if (value < 0) {
        axis.negate();
    }

    // -----------------------------------------
    // LOAD POSITION
    // a = distance from member start
    // -----------------------------------------

    let a = Number(load.a) || 0;

    a = Math.max(
        0,
        Math.min(a, memberLength)
    );

    const position = start.clone()
        .add(
            localX.clone().multiplyScalar(a)
        );

    // -----------------------------------------
    // MOMENT CIRCLE
    // -----------------------------------------

    const radius = 0.20;
    const segments = 32;

    const points = [];

    // We need two vectors perpendicular
    // to the moment axis.

    let radial1;

    if (Math.abs(axis.dot(new THREE.Vector3(0, 0, 1))) < 0.9) {
        radial1 = new THREE.Vector3(0, 0, 1);
    }
    else {
        radial1 = new THREE.Vector3(0, 1, 0);
    }

    radial1 = new THREE.Vector3()
        .crossVectors(axis, radial1)
        .normalize();

    const radial2 = new THREE.Vector3()
        .crossVectors(axis, radial1)
        .normalize();

    // -----------------------------------------
    // CREATE ARC
    // -----------------------------------------

    for (let i = 0; i <= segments; i++) {

        const theta =
            Math.PI * 1.5 * (i / segments);

        const point = position.clone()
            .add(
                radial1.clone()
                    .multiplyScalar(
                        radius * Math.cos(theta)
                    )
            )
            .add(
                radial2.clone()
                    .multiplyScalar(
                        radius * Math.sin(theta)
                    )
            );

        points.push(point);
    }

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);

    const material =
        new THREE.LineBasicMaterial({
            color: 0xff6600
        });

    const arc =
        new THREE.Line(
            geometry,
            material
        );

    window.threeLoadGroup.add(arc);

    // -----------------------------------------
    // ARROW HEAD
    // -----------------------------------------

    const endPoint =
        points[points.length - 1];

    const previousPoint =
        points[points.length - 2];

    const tangent =
        new THREE.Vector3()
            .subVectors(
                endPoint,
                previousPoint
            )
            .normalize();

    const arrow =
        new THREE.ArrowHelper(
            tangent,
            endPoint.clone()
                .add(
                    tangent.clone()
                        .multiplyScalar(-0.10)
                ),
            0.10,
            0xff6600,
            0.08,
            0.06
        );

    window.threeLoadGroup.add(arrow);

    // -----------------------------------------
    // LABEL
    // -----------------------------------------

    const label =
        createThreeLabel(
            `${load.direction}: ${value}`,
            "#ff6600"
        );

    label.position.copy(position);

    label.position.add(
        radial1.clone()
            .multiplyScalar(0.30)
    );

    window.threeLoadGroup.add(label);
}

// =============================================
// DRAW 3D MEMBER UDL
// =============================================

function drawThreeMemberUDL(
    member,
    nodes,
    load
) {

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    // -----------------------------------------
    // MEMBER LOCAL AXES
    // -----------------------------------------

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) {
        return;
    }

    const {
        localX,
        localY,
        localZ,
        length: memberLength
    } = axes;

    // -----------------------------------------
    // LOAD DIRECTION
    // -----------------------------------------

    let direction;

    if (load.direction === "y") {
        direction = localY.clone();
    }
    else if (load.direction === "z") {
        direction = localZ.clone();
    }
    else {
        return;
    }

    // -----------------------------------------
    // LOAD VALUE
    // -----------------------------------------

    const value = Number(load.value1) || 0;

    if (value === 0) {
        return;
    }

    if (value < 0) {
        direction.negate();
    }

    // -----------------------------------------
    // NUMBER OF LOAD ARROWS
    // -----------------------------------------

    const arrowCount = Math.max(
        2,
        Math.ceil(memberLength / 0.5)
    );

    const arrowLength = 0.35;

    // -----------------------------------------
    // DISTRIBUTED LOAD ARROWS
    // -----------------------------------------

    for (let i = 0; i <= arrowCount; i++) {

        const ratio = i / arrowCount;

        const position = start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(
                        memberLength * ratio
                    )
            );

        const arrow = createThreeLoadArrow(
            position,
            direction,
            arrowLength
        );

        arrow.userData = {
            type: "memberLoad",
            loadType: "udl",
            member: member.name,
            direction: load.direction,
            value: value
        };

        window.threeLoadGroup.add(arrow);
    }

    // -----------------------------------------
    // LOAD LINE
    // -----------------------------------------

    const lineOffset = direction.clone()
        .multiplyScalar(arrowLength);

    const lineStart = start.clone()
        .add(lineOffset);

    const lineEnd = end.clone()
        .add(lineOffset);

    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                lineStart,
                lineEnd
            ]);

    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: 0xe74c3c
        });

    const loadLine =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );

    loadLine.userData = {
        type: "memberLoad",
        loadType: "udl",
        member: member.name,
        direction: load.direction,
        value: value
    };

    window.threeLoadGroup.add(loadLine);

    // -----------------------------------------
    // LABEL
    // -----------------------------------------

    const midpoint = start.clone()
        .add(end)
        .multiplyScalar(0.5);

    const label = createThreeLabel(
        `${load.direction}: ${value}`,
        "#e74c3c"
    );

    label.position.copy(midpoint);

    label.position.add(
        direction.clone()
            .multiplyScalar(arrowLength + 0.18)
    );

    window.threeLoadGroup.add(label);
}

// =============================================
// DRAW 3D MEMBER PARTIAL UDL
// =============================================

function drawThreeMemberPartialUDL(
    member,
    nodes,
    load
) {

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    // -----------------------------------------
    // MEMBER LOCAL AXES
    // -----------------------------------------

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) {
        return;
    }

    const {
        localX,
        localY,
        localZ,
        length: memberLength
    } = axes;

    // -----------------------------------------
    // LOAD DIRECTION
    // -----------------------------------------

    let direction;

    if (load.direction === "y") {
        direction = localY.clone();
    }
    else if (load.direction === "z") {
        direction = localZ.clone();
    }
    else {
        return;
    }

    // -----------------------------------------
    // LOAD VALUE
    // -----------------------------------------

    const value = Number(load.value1) || 0;

    if (value === 0) {
        return;
    }

    if (value < 0) {
        direction.negate();
    }

    // -----------------------------------------
    // LOAD LIMITS
    //
    // a = distance from start
    // b = distance from end
    // -----------------------------------------

    let a = Number(load.a) || 0;
    let b = Number(load.b) || 0;

    a = Math.max(
        0,
        Math.min(a, memberLength)
    );

    b = Math.max(
        0,
        Math.min(b, memberLength)
    );

    // Loaded region
    const loadStart = a;
    const loadEnd = b;

    // Invalid / zero-length loaded region
    if (loadEnd <= loadStart) {
        return;
    }

    // -----------------------------------------
    // NUMBER OF ARROWS
    // -----------------------------------------

    const loadedLength = loadEnd - loadStart;

    const arrowCount = Math.max(
        2,
        Math.ceil(loadedLength / 0.5)
    );

    const arrowLength = 0.35;

    // -----------------------------------------
    // DISTRIBUTED LOAD ARROWS
    // -----------------------------------------

    for (let i = 0; i <= arrowCount; i++) {

        const ratio = i / arrowCount;

        const distance =
            loadStart +
            loadedLength * ratio;

        const position = start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(distance)
            );

        const arrow = createThreeLoadArrow(
            position,
            direction,
            arrowLength
        );

        arrow.userData = {
            type: "memberLoad",
            loadType: "partial_udl",
            member: member.name,
            direction: load.direction,
            value: value,
            a: a,
            b: b
        };

        window.threeLoadGroup.add(arrow);
    }

    // -----------------------------------------
    // LOAD LINE
    // -----------------------------------------

    const lineOffset = direction.clone()
        .multiplyScalar(arrowLength);

    const lineStart = start.clone()
        .add(
            localX.clone()
                .multiplyScalar(loadStart)
        )
        .add(lineOffset);

    const lineEnd = start.clone()
        .add(
            localX.clone()
                .multiplyScalar(loadEnd)
        )
        .add(lineOffset);

    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                lineStart,
                lineEnd
            ]);

    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: 0xe74c3c
        });

    const loadLine =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );

    loadLine.userData = {
        type: "memberLoad",
        loadType: "partial_udl",
        member: member.name,
        direction: load.direction,
        value: value,
        a: a,
        b: b
    };

    window.threeLoadGroup.add(loadLine);

    // -----------------------------------------
    // LABEL
    // -----------------------------------------

    const midpoint = start.clone()
        .add(
            localX.clone()
                .multiplyScalar(
                    (loadStart + loadEnd) / 2
                )
        );

    const label = createThreeLabel(
        `${load.direction}: ${value}`,
        "#e74c3c"
    );

    label.position.copy(midpoint);

    label.position.add(
        direction.clone()
            .multiplyScalar(arrowLength + 0.18)
    );

    window.threeLoadGroup.add(label);
}

// =============================================
// DRAW 3D MEMBER TRAPEZOIDAL LOAD
// =============================================

function drawThreeMemberTrapezoidalLoad(
    member,
    nodes,
    load
) {

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];

    if (!startCoordinate || !endCoordinate) {
        return;
    }

    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);

    // -----------------------------------------
    // MEMBER LOCAL AXES
    // -----------------------------------------

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) {
        return;
    }

    const {
        localX,
        localY,
        localZ,
        length: memberLength
    } = axes;

    
    // -----------------------------------------
    // LOAD DIRECTION
    // -----------------------------------------

    let direction;

    if (load.direction === "y") {

        direction = localY.clone();

    }
    else if (load.direction === "z") {

        direction = localZ.clone();

    }
    else {

        return;
    }

    // -----------------------------------------
    // LOAD VALUES
    // -----------------------------------------

    const value1 = Number(load.value1) || 0;
    const value2 = Number(load.value2) || 0;

    if (value1 === 0 && value2 === 0) {
        return;
    }

    // -----------------------------------------
    // COMMON LOAD DIRECTION
    //
    // Positive load -> local direction
    // Negative load -> opposite direction
    //
    // We use the first non-zero value to
    // determine the direction of the load line.
    // -----------------------------------------

    const directionSign =
        value1 !== 0
            ? Math.sign(value1)
            : Math.sign(value2);

    const loadDirection =
        direction.clone();

    if (directionSign < 0) {
        loadDirection.negate();
    }

    // -----------------------------------------
    // LOAD LIMITS
    // -----------------------------------------

    const loadStart = 0;
    const loadEnd = memberLength;

    const loadedLength =
        memberLength;

    // -----------------------------------------
    // MAX LOAD MAGNITUDE
    // -----------------------------------------

    const maxValue = Math.max(
        Math.abs(value1),
        Math.abs(value2)
    );

    if (maxValue <= 0) {
        return;
    }

    // -----------------------------------------
    // ARROW PARAMETERS
    // -----------------------------------------

    const arrowCount = Math.max(
        2,
        Math.ceil(loadedLength / 0.5)
    );

    const maxArrowLength = 0.55;

    // -----------------------------------------
    // DRAW ARROWS
    // -----------------------------------------

    for (let i = 0; i <= arrowCount; i++) {

        const ratio = i / arrowCount;

        const distance =
            loadStart +
            loadedLength * ratio;

        // Linear interpolation of intensity
        const value =
            value1 +
            (value2 - value1) * ratio;

        const magnitude =
            Math.abs(value);

        if (magnitude <= 0) {
            continue;
        }

        // -------------------------------------
        // POSITION
        // -------------------------------------

        const position =
            start.clone()
                .add(
                    localX.clone()
                        .multiplyScalar(distance)
                );

        // -------------------------------------
        // ARROW LENGTH
        // -------------------------------------

        const arrowLength =
            maxArrowLength *
            magnitude /
            maxValue;

        // -------------------------------------
        // ARROW
        //
        // IMPORTANT:
        // All arrows use the same direction
        // as the load line.
        // -------------------------------------

        const arrow =
            createThreeLoadArrow(
                position,
                loadDirection,
                arrowLength
            );

        arrow.userData = {
            type: "memberLoad",
            loadType: "trapezoidal",
            member: member.name,
            direction: load.direction,
            value1: value1,
            value2: value2,
            a: 0,
            b: 0
        };

        window.threeLoadGroup.add(arrow);
    }

    // -----------------------------------------
    // LOAD LINE
    // -----------------------------------------

    const startArrowLength =
        maxArrowLength *
        Math.abs(value1) /
        maxValue;

    const endArrowLength =
        maxArrowLength *
        Math.abs(value2) /
        maxValue;

    const lineStart =
        start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(loadStart)
            )
            .add(
                loadDirection.clone()
                    .multiplyScalar(startArrowLength)
            );

    const lineEnd =
        start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(loadEnd)
            )
            .add(
                loadDirection.clone()
                    .multiplyScalar(endArrowLength)
            );

    const lineGeometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                lineStart,
                lineEnd
            ]);

    const lineMaterial =
        new THREE.LineBasicMaterial({
            color: 0xe74c3c
        });

    const loadLine =
        new THREE.Line(
            lineGeometry,
            lineMaterial
        );

    loadLine.userData = {
        type: "memberLoad",
        loadType: "trapezoidal",
        member: member.name,
        direction: load.direction,
        value1: value1,
        value2: value2,
        a: 0,
        b: 0
    };

    window.threeLoadGroup.add(loadLine);

    // -----------------------------------------
    // LABEL
    // -----------------------------------------

    const midpoint =
        start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(
                        (loadStart + loadEnd) / 2
                    )
            );

    const label =
        createThreeLabel(
            `${load.direction}: ${value1} → ${value2}`,
            "#e74c3c"
        );

    label.position.copy(midpoint);

    label.position.add(
        loadDirection.clone()
            .multiplyScalar(
                maxArrowLength + 0.18
            )
    );

    window.threeLoadGroup.add(label);
}

