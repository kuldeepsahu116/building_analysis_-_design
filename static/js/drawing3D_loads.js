
// =============================================
// 3D LOAD DRAWING
// =============================================


// =============================================
// LOAD LABEL
// =============================================

function createThreeLoadLabel(
    text,
    position,
    color = "#e74c3c"
) {

    if (!window.viewOptions.loadLabels) {
        return;
    }

    const label = createThreeLabel(text, color);

    if (!label) {
        return;
    }

    label.position.copy(position);

    label.scale.multiplyScalar(0.75);

    label.userData = {
        type: "loadLabel"
    };

    window.threeLoadGroup.add(label);

    return label;
}

// =====================================================
// LOAD DIRECTION HELPERS
// =====================================================

function getGlobalLoadDirection(axis, value = 1) {

    let direction;

    switch (String(axis).toLowerCase()) {

        case "x":
            direction =
                new THREE.Vector3(1, 0, 0);
            break;

        case "y":
            direction =
                new THREE.Vector3(0, 1, 0);
            break;

        case "z":
            direction =
                new THREE.Vector3(0, 0, 1);
            break;

        default:
            return null;
    }

    if (value < 0) {
        direction.negate();
    }

    return direction;
}


// =====================================================
// GET MEMBER LOAD DIRECTION
// =====================================================

function getMemberLoadDirection(
    member,
    nodes,
    coordinateSystem,
    axis,
    value
) {

    const startCoordinate =
        nodes[member.start];

    const endCoordinate =
        nodes[member.end];

    if (
        !startCoordinate ||
        !endCoordinate
    ) {
        return null;
    }


    // ---------------------------------------------
    // GLOBAL
    // ---------------------------------------------

    if (
        String(coordinateSystem)
            .toLowerCase() === "global"
    ) {

        return getGlobalLoadDirection(
            axis,
            value
        );
    }


    // ---------------------------------------------
    // LOCAL
    // ---------------------------------------------

    const start =
        toThreeVector(startCoordinate);

    const end =
        toThreeVector(endCoordinate);


    const axes =
        getMemberLocalAxes(
            start,
            end,
            Number(member.beta) || 0
        );


    if (!axes) {
        return null;
    }


    let direction;


    switch (String(axis).toLowerCase()) {

        case "x":
            direction =
                axes.localX.clone();
            break;

        case "y":
            direction =
                axes.localY.clone();
            break;

        case "z":
            direction =
                axes.localZ.clone();
            break;

        default:
            return null;
    }


    if (value < 0) {
        direction.negate();
    }


    return direction;
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


// =====================================================
// DRAW ONE MOMENT COMPONENT
// =====================================================

function drawThreeMomentArrow(
    origin,
    axisName,
    value,
    userData = {}
) {

    const axis =
        getGlobalLoadDirection(
            axisName.replace("M", ""),
            value
        );


    if (!axis) {
        return;
    }


    const radius = 0.20;
    const segments = 24;


    let radial1;


    if (
        Math.abs(
            axis.dot(
                new THREE.Vector3(0, 0, 1)
            )
        ) < 0.9
    ) {

        radial1 =
            new THREE.Vector3(0, 0, 1);

    }
    else {

        radial1 =
            new THREE.Vector3(0, 1, 0);

    }


    radial1 =
        new THREE.Vector3()
            .crossVectors(
                axis,
                radial1
            )
            .normalize();


    const radial2 =
        new THREE.Vector3()
            .crossVectors(
                axis,
                radial1
            )
            .normalize();


    const points = [];


    for(let i = 0; i <= segments; i++){

        const theta =
            Math.PI * 1.5 *
            i / segments;


        points.push(

            origin.clone()

                .add(
                    radial1.clone()
                        .multiplyScalar(
                            radius *
                            Math.cos(theta)
                        )
                )

                .add(
                    radial2.clone()
                        .multiplyScalar(
                            radius *
                            Math.sin(theta)
                        )
                )

        );

    }


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints(points);


    const material =
        new THREE.LineBasicMaterial({
            color: 0xff6600
        });


    const curve =
        new THREE.Line(
            geometry,
            material
        );


    window.threeLoadGroup.add(
        curve
    );


    // ---------------------------------------------
    // ARROW HEAD
    // ---------------------------------------------

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


    arrow.userData =
        userData;


    window.threeLoadGroup.add(
        arrow
    );
}


// =====================================================
// DRAW MEMBER MOMENT ABOUT ARBITRARY AXIS
// =====================================================

function drawThreeMemberMomentAxis(
    origin,
    axis,
    value,
    memberName,
    axisName
) {

    if(!axis || value === 0){
        return;
    }


    const radius = 0.20;
    const segments = 24;


    let radial1;


    if(
        Math.abs(
            axis.dot(
                new THREE.Vector3(0,0,1)
            )
        ) < 0.9
    ){

        radial1 =
            new THREE.Vector3(0,0,1);

    }
    else{

        radial1 =
            new THREE.Vector3(0,1,0);

    }


    radial1 =
        new THREE.Vector3()
            .crossVectors(
                axis,
                radial1
            )
            .normalize();


    const radial2 =
        new THREE.Vector3()
            .crossVectors(
                axis,
                radial1
            )
            .normalize();


    const points = [];


    for(
        let i = 0;
        i <= segments;
        i++
    ){

        const theta =
            Math.PI * 1.5 *
            i / segments;


        points.push(

            origin.clone()

                .add(
                    radial1.clone()
                        .multiplyScalar(
                            radius *
                            Math.cos(theta)
                        )
                )

                .add(
                    radial2.clone()
                        .multiplyScalar(
                            radius *
                            Math.sin(theta)
                        )
                )

        );

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


    window.threeLoadGroup.add(
        arc
    );


    const endPoint =
        points[points.length - 1];

    const previousPoint =
        points[points.length - 2];


    let tangent =
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


    window.threeLoadGroup.add(
        arrow
    );

}



// =====================================================
// DRAW ONE LOAD COMPONENT
// =====================================================

function drawThreeLoadComponent(
    position,
    direction,
    magnitude,
    arrowLength = 0.45,
    userData = {}
) {

    if (
        !direction ||
        !Number.isFinite(magnitude) ||
        magnitude === 0
    ) {
        return;
    }


    const arrow =
        createThreeLoadArrow(
            position,
            direction,
            arrowLength
        );


    arrow.userData = {
        ...userData,
        magnitude: magnitude
    };


    window.threeLoadGroup.add(
        arrow
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


    const components = [

        {
            axis: "X",
            value: Number(load.Fx) || 0
        },

        {
            axis: "Y",
            value: Number(load.Fy) || 0
        },

        {
            axis: "Z",
            value: Number(load.Fz) || 0
        }

    ];


const arrowLength = 0.45;


    components.forEach(component => {

        if (component.value === 0) {
            return;
        }


        const direction =
            getGlobalLoadDirection(
                component.axis,
                component.value
            );


        drawThreeLoadComponent(
            position,
            direction,
            Math.abs(component.value),
            arrowLength,
            {
                type: "nodalLoad",
                loadType: "point",
                node: String(nodeId),
                coordinate_system: "global",
                direction: component.axis,
                value: component.value
            }
        );

        createThreeLoadLabel(
            `G ${component.axis}: ${component.value} kN`,
            position.clone()
                .add(
                    direction.clone()
                        .normalize()
                        .multiplyScalar(0.60)
                )
        );

    });
}

// =====================================================
// DRAW 3D NODAL MOMENTS
// =====================================================

function drawThreeNodalMoments(
    nodeId,
    coordinate,
    load
) {

    const origin =
        toThreeVector(coordinate);


    const moments = [

        {
            axis: "MX",
            value: Number(load.Mx) || 0
        },

        {
            axis: "MY",
            value: Number(load.My) || 0
        },

        {
            axis: "MZ",
            value: Number(load.Mz) || 0
        }

    ];


    moments.forEach(moment => {

        if (moment.value === 0) {
            return;
        }


        drawThreeMomentArrow(
            origin,
            moment.axis,
            moment.value,
            {
                type: "nodalLoad",
                loadType: "moment",
                node: String(nodeId),
                coordinate_system: "global",
                direction: moment.axis,
                value: moment.value
            }
        );

        createThreeLoadLabel(
            `G ${moment.axis}: ${moment.value} kN-m`,
            origin.clone()
                .add(
                    getGlobalLoadDirection(
                        moment.axis.replace("M", ""),
                        moment.value
                    )
                    .multiplyScalar(0.40)
                )
        );

    });
}

// =====================================================
// DRAW 3D MEMBER POINT LOAD
// =====================================================

function drawThreeMemberPointLoad(
    member,
    nodes,
    load
) {

    const startCoordinate =
        nodes[member.start];

    const endCoordinate =
        nodes[member.end];


    if (
        !startCoordinate ||
        !endCoordinate
    ) {
        return;
    }


    const start =
        toThreeVector(startCoordinate);

    const end =
        toThreeVector(endCoordinate);


    const axes =
        getMemberLocalAxes(
            start,
            end,
            Number(member.beta) || 0
        );


    if (!axes) {
        return;
    }


    const {
        localX,
        length: memberLength
    } = axes;


    let a =
        Number(load.a) || 0;


    a =
        Math.max(
            0,
            Math.min(
                a,
                memberLength
            )
        );


    const position =
        start.clone()
            .add(
                localX.clone()
                    .multiplyScalar(a)
            );


    const coordinateSystem =
        String(
            load.coordinate_system ||
            "local"
        ).toLowerCase();


    const forceComponents = [

        {
            axis: "x",
            value: Number(load.Fx) || 0
        },

        {
            axis: "y",
            value: Number(load.Fy) || 0
        },

        {
            axis: "z",
            value: Number(load.Fz) || 0
        }

    ];


    forceComponents.forEach(component => {

        if(component.value === 0){
            return;
        }


        const direction =
            getMemberLoadDirection(
                member,
                nodes,
                coordinateSystem,
                component.axis,
                component.value
            );


        if(!direction){
            return;
        }


        drawThreeLoadComponent(
            position,
            direction,
            Math.abs(component.value),
            0.45,
            {
                type: "memberLoad",
                loadType: "point",
                member: member.name,
                coordinate_system:
                    coordinateSystem,
                direction:
                    component.axis,
                value:
                    component.value,
                a: a
            }
        );

        createThreeLoadLabel(
            `${coordinateSystem.charAt(0).toUpperCase()} ${component.axis.toUpperCase()}: ${component.value} kN`,
            position.clone()
                .add(
                    direction.clone()
                        .normalize()
                        .multiplyScalar(0.60)
                )
        );

    });


    // ---------------------------------------------
    // MOMENT COMPONENTS
    // ---------------------------------------------

    const momentComponents = [

        {
            axis: "x",
            value: Number(load.Mx) || 0
        },

        {
            axis: "y",
            value: Number(load.My) || 0
        },

        {
            axis: "z",
            value: Number(load.Mz) || 0
        }

    ];


    momentComponents.forEach(component => {

        if(component.value === 0){
            return;
        }


        const axis =
            getMemberLoadDirection(
                member,
                nodes,
                coordinateSystem,
                component.axis,
                component.value
            );


        if(!axis){
            return;
        }


        drawThreeMemberMomentAxis(
            position,
            axis,
            component.value,
            member.name,
            component.axis
        );

    });

}

// =============================================
// DRAW 3D MEMBER DISTRIBUTED LOAD
// =============================================

function drawThreeDistributedComponent(
    start,
    localX,
    member,
    nodes,
    coordinateSystem,
    axis,
    value1,
    value2,
    loadStart,
    loadEnd
) {

    if(
        value1 === 0 &&
        value2 === 0
    ){
        return;
    }

    const loadedLength =
        loadEnd - loadStart;


    const arrowCount =
        Math.max(
            2,
            Math.ceil(
                loadedLength / 0.5
            )
        );


    const maxValue =
        Math.max(
            Math.abs(value1),
            Math.abs(value2)
        );


    if(maxValue === 0){
        return;
    }


    for(
        let i = 0;
        i <= arrowCount;
        i++
    ){

        const ratio =
            i / arrowCount;


        const distance =
            loadStart +
            loadedLength *
            ratio;


        const value =
            value1 +
            (
                value2 - value1
            ) *
            ratio;


        if(value === 0){
            continue;
        }


        const position =
            start.clone()
                .add(
                    localX.clone()
                        .multiplyScalar(
                            distance
                        )
                );


        const direction =
            getMemberLoadDirection(
                member,
                nodes,
                coordinateSystem,
                axis,
                value
            );


        if(!direction){
            continue;
        }


        const arrowLength =
            0.55 *
            Math.abs(value) /
            maxValue;


        drawThreeLoadComponent(
            position,
            direction,
            Math.abs(value),
            arrowLength,
            {
                type: "memberLoad",
                loadType:
                    "distributed",
                member:
                    member.name,
                coordinate_system:
                    coordinateSystem,
                direction:
                    axis,
                value1,
                value2
            }
        );

    }
}


function drawThreeLoadEndLine(
    memberPoint,
    loadPoint
) {

    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                memberPoint,
                loadPoint
            ]);

    const material =
        new THREE.LineBasicMaterial({
            color: 0xe74c3c
        });

    const line =
        new THREE.Line(
            geometry,
            material
        );

    window.threeLoadGroup.add(line);

    return line;
}


function drawThreeDistributedLoadLine(
    start,
    end,
    loadDirection,
    value1,
    value2,
    maxDisplayLength = 0.7
) {

    if (!loadDirection) {
        return;
    }


    const maxValue =
        Math.max(
            Math.abs(value1),
            Math.abs(value2)
        );


    if (maxValue === 0) {
        return;
    }


    const offset1 =
        (value1 / maxValue) *
        maxDisplayLength;


    const offset2 =
        (value2 / maxValue) *
        maxDisplayLength;


    const p1 =
        start.clone().add(
            loadDirection.clone()
                .multiplyScalar(offset1)
        );


    const p2 =
        end.clone().add(
            loadDirection.clone()
                .multiplyScalar(offset2)
        );


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([
                p1,
                p2
            ]);


    const material =
        new THREE.LineBasicMaterial({
            color: 0xe74c3c
        });


    const line =
        new THREE.Line(
            geometry,
            material
        );


    window.threeLoadGroup.add(line);

    drawThreeLoadEndLine(start, p1);

    drawThreeLoadEndLine(end, p2);

    return line;
}


function drawThreeMemberDistributedLoad(member, nodes, load) {

    const startCoordinate = nodes[member.start];
    const endCoordinate   = nodes[member.end];

    if (!startCoordinate || !endCoordinate) return;

    const start = toThreeVector(startCoordinate);
    const end   = toThreeVector(endCoordinate);

    const axes = getMemberLocalAxes(
        start,
        end,
        Number(member.beta) || 0
    );

    if (!axes) return;

    const {
        localX,
        length: memberLength
    } = axes;

    const coordinateSystem = String(
        load.coordinate_system || "local"
    ).toLowerCase();

    let startPosition = 0;
    let endPosition   = memberLength;

    if (load.type === "partial_udl") {

        startPosition = Math.max(
            0,
            Math.min(Number(load.a) || 0, memberLength)
        );

        endPosition = Math.max(
            0,
            Math.min(Number(load.b) || 0, memberLength)
        );

        if (endPosition <= startPosition) return;
    }

     // COMPONENTS
    let components;

    if (load.type === "trapezoidal") {

        components = [
            {
                axis: "x",
                value1: Number(load.wx1) || 0,
                value2: Number(load.wx2) || 0
            },
            {
                axis: "y",
                value1: Number(load.wy1) || 0,
                value2: Number(load.wy2) || 0
            },
            {
                axis: "z",
                value1: Number(load.wz1) || 0,
                value2: Number(load.wz2) || 0
            }
        ];

    } else {

        const valueX = Number(load.wx) || 0;
        const valueY = Number(load.wy) || 0;
        const valueZ = Number(load.wz) || 0;

        components = [
            {
                axis: "x",
                value1: valueX,
                value2: valueX
            },
            {
                axis: "y",
                value1: valueY,
                value2: valueY
            },
            {
                axis: "z",
                value1: valueZ,
                value2: valueZ
            }
        ];
    }

    // DRAW EACH COMPONENT
    components.forEach(component => {

        const {
            axis,
            value1,
            value2
        } = component;

        if (value1 === 0 && value2 === 0) return;


        const baseDirection = getMemberLoadDirection(
            member,
            nodes,
            coordinateSystem,
            axis,
            1
        );

        if (!baseDirection) return;

    
        // DISTRIBUTED LOAD ARROWS
        drawThreeDistributedComponent(
            start,
            localX,
            member,
            nodes,
            coordinateSystem,
            axis,
            value1,
            value2,
            startPosition,
            endPosition
        );

        // LOAD ENVELOPE
        const loadStartPoint = start.clone().add(
            localX.clone().multiplyScalar(startPosition)
        );

        const loadEndPoint = start.clone().add(
            localX.clone().multiplyScalar(endPosition)
        );

        drawThreeDistributedLoadLine(
            loadStartPoint,
            loadEndPoint,
            baseDirection,
            value1,
            value2,
            0.55
        );

        // LABEL
        const midpoint = loadStartPoint
            .clone()
            .add(loadEndPoint)
            .multiplyScalar(0.5);

        const midpointValue =
            (value1 + value2) * 0.5;

        let labelPosition = midpoint.clone();

        if (midpointValue !== 0) {

            const labelDirection =
                getMemberLoadDirection(
                    member,
                    nodes,
                    coordinateSystem,
                    axis,
                    midpointValue
                );

            if (labelDirection) {

                labelPosition.add(
                    labelDirection
                        .normalize()
                        .multiplyScalar(0.70)
                );
            }
        }

        let labelText;

        if (value1 === value2) {

            labelText =
                `${coordinateSystem.charAt(0).toUpperCase()} ` +
                `${axis.toUpperCase()}: ` +
                `${value1} kN/m`;

        } else {

            labelText =
                `${coordinateSystem.charAt(0).toUpperCase()} ` +
                `${axis.toUpperCase()}: ` +
                `${value1} → ${value2} kN/m`;
        }

        createThreeLoadLabel(
            labelText,
            labelPosition
        );
    });
}
