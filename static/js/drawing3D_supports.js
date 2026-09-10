// =============================================
// 3D SUPPORT DRAWING
// =============================================


// =============================================
// CREATE SUPPORT MATERIAL
// =============================================

function createSupportMaterial() {

    return new THREE.MeshBasicMaterial({
        color: 0x2952cc
    });

}


// =============================================
// CREATE SUPPORT LINE MATERIAL
// =============================================

function createSupportLineMaterial() {

    return new THREE.LineBasicMaterial({
        color: 0x2952cc
    });

}


// =============================================
// CREATE LINE BETWEEN TWO POINTS
// =============================================

function createSupportLine(
    start,
    end
) {

    const geometry =
        new THREE.BufferGeometry().setFromPoints([
            start,
            end
        ]);

    const material =
        createSupportLineMaterial();

    return new THREE.Line(
        geometry,
        material
    );
}


// =============================================
// DRAW TRANSLATIONAL SUPPORT
// =============================================

function drawThreeTranslationSupport(
    position,
    support
) {

    const group =
        new THREE.Group();

    const size = 0.18;

    // -----------------------------------------
    // SUPPORT BASE
    // -----------------------------------------

    const baseGeometry =
        new THREE.BoxGeometry(
            size,
            size,
            size
        );

    const baseMaterial =
        createSupportMaterial();

    const base =
        new THREE.Mesh(
            baseGeometry,
            baseMaterial
        );

    base.position.copy(position);

    group.add(base);


    // -----------------------------------------
    // UX RESTRAINT
    // -----------------------------------------

    if (support.ux) {

        const line =
            createSupportLine(
                new THREE.Vector3(
                    position.x - 0.35,
                    position.y,
                    position.z
                ),
                new THREE.Vector3(
                    position.x - 0.08,
                    position.y,
                    position.z
                )
            );

        group.add(line);

    }


    // -----------------------------------------
    // UY RESTRAINT
    // -----------------------------------------

    if (support.uy) {

        const line =
            createSupportLine(
                new THREE.Vector3(
                    position.x,
                    position.y - 0.35,
                    position.z
                ),
                new THREE.Vector3(
                    position.x,
                    position.y - 0.08,
                    position.z
                )
            );

        group.add(line);

    }


    // -----------------------------------------
    // UZ RESTRAINT
    // -----------------------------------------

    if (support.uz) {

        const line =
            createSupportLine(
                new THREE.Vector3(
                    position.x,
                    position.y,
                    position.z - 0.35
                ),
                new THREE.Vector3(
                    position.x,
                    position.y,
                    position.z - 0.08
                )
            );

        group.add(line);

    }


    group.userData = {
        type: "support",
        ux: !!support.ux,
        uy: !!support.uy,
        uz: !!support.uz,
        rx: !!support.rx,
        ry: !!support.ry,
        rz: !!support.rz
    };

    window.threeSupportGroup.add(
        group
    );
}


// =============================================
// DRAW ROTATIONAL SUPPORT
// =============================================

function drawThreeRotationSupport(
    position,
    support
) {

    const group =
        new THREE.Group();

    const radius = 0.24;

    // -----------------------------------------
    // RX
    // Rotation about X
    // -----------------------------------------

    if (support.rx) {

        const curve =
            new THREE.EllipseCurve(
                0,
                0,
                radius,
                radius,
                0,
                Math.PI * 1.5,
                false,
                0
            );

        const points =
            curve.getPoints(20);

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points.map(p =>
                        new THREE.Vector3(
                            0,
                            p.x,
                            p.y
                        )
                    )
                );

        const material =
            createSupportLineMaterial();

        const arc =
            new THREE.Line(
                geometry,
                material
            );

        arc.position.copy(
            position
        );

        group.add(arc);
    }


    // -----------------------------------------
    // RY
    // Rotation about Y
    // -----------------------------------------

    if (support.ry) {

        const curve =
            new THREE.EllipseCurve(
                0,
                0,
                radius,
                radius,
                0,
                Math.PI * 1.5,
                false,
                0
            );

        const points =
            curve.getPoints(20);

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points.map(p =>
                        new THREE.Vector3(
                            p.x,
                            0,
                            p.y
                        )
                    )
                );

        const material =
            createSupportLineMaterial();

        const arc =
            new THREE.Line(
                geometry,
                material
            );

        arc.position.copy(
            position
        );

        group.add(arc);
    }


    // -----------------------------------------
    // RZ
    // Rotation about Z
    // -----------------------------------------

    if (support.rz) {

        const curve =
            new THREE.EllipseCurve(
                0,
                0,
                radius,
                radius,
                0,
                Math.PI * 1.5,
                false,
                0
            );

        const points =
            curve.getPoints(20);

        const geometry =
            new THREE.BufferGeometry()
                .setFromPoints(
                    points.map(p =>
                        new THREE.Vector3(
                            p.x,
                            p.y,
                            0
                        )
                    )
                );

        const material =
            createSupportLineMaterial();

        const arc =
            new THREE.Line(
                geometry,
                material
            );

        arc.position.copy(
            position
        );

        group.add(arc);
    }


    group.userData = {
        type: "rotationSupport",
        rx: !!support.rx,
        ry: !!support.ry,
        rz: !!support.rz
    };

    window.threeSupportGroup.add(
        group
    );
}


// =============================================
// DRAW ONE 3D SUPPORT
// =============================================

function drawThreeSupport(
    nodeId,
    coordinate,
    support
) {

    const position =
        toThreeVector(coordinate);

    // -----------------------------------------
    // TRANSLATIONAL RESTRAINTS
    // -----------------------------------------

    if (
        support.ux ||
        support.uy ||
        support.uz
    ) {

        drawThreeTranslationSupport(
            position,
            support
        );

    }


    // -----------------------------------------
    // ROTATIONAL RESTRAINTS
    // -----------------------------------------

    if (
        support.rx ||
        support.ry ||
        support.rz
    ) {

        drawThreeRotationSupport(
            position,
            support
        );

    }
}


// =============================================
// COLLECT NODE SUPPORTS
// =============================================

function getThreeNodeSupports() {

    const supports =
        getSupports();

    const nodeSupports = {};


    supports.forEach(support => {

        if (
            !support.assignedNodes ||
            !Array.isArray(
                support.assignedNodes
            )
        ) {
            return;
        }


        support.assignedNodes.forEach(
            nodeId => {

                const id =
                    String(nodeId);


                if (!nodeSupports[id]) {

                    nodeSupports[id] = {
                        ux: false,
                        uy: false,
                        uz: false,
                        rx: false,
                        ry: false,
                        rz: false
                    };

                }


                // ---------------------------------
                // COMBINE RESTRAINTS
                // ---------------------------------

                nodeSupports[id].ux =
                    nodeSupports[id].ux ||
                    !!support.ux;

                nodeSupports[id].uy =
                    nodeSupports[id].uy ||
                    !!support.uy;

                nodeSupports[id].uz =
                    nodeSupports[id].uz ||
                    !!support.uz;

                nodeSupports[id].rx =
                    nodeSupports[id].rx ||
                    !!support.rx;

                nodeSupports[id].ry =
                    nodeSupports[id].ry ||
                    !!support.ry;

                nodeSupports[id].rz =
                    nodeSupports[id].rz ||
                    !!support.rz;

            }
        );

    });


    return nodeSupports;
}

