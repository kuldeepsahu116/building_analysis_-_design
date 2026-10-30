// =====================================================
// 2D SUPPORT VISUALIZATION
// =====================================================

window.drawing2DSupportState = {

    group: null,
    visible: false,
    initialized: false

};


// =====================================================
// INITIALIZE
// =====================================================

function initializeDrawing2DSupportSystem() {

    if (
        window.drawing2DSupportState
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
        "drawing2DSupports";


    window.drawing2D.scene.add(
        group
    );


    window.drawing2DSupportState.group =
        group;


    window.drawing2DSupportState.initialized =
        true;


    renderDrawing2DSupports();
}

// =====================================================
// CLEAR
// =====================================================

function clearDrawing2DSupports() {

    const group =
        window.drawing2DSupportState
            ?.group;


    if (!group) {
        return;
    }


    while (
        group.children.length
    ) {

        const object =
            group.children.pop();


        object.geometry?.dispose();


        if (
            Array.isArray(
                object.material
            )
        ) {

            object.material.forEach(
                material =>
                    material.dispose()
            );

        }
        else {

            object.material?.dispose();

        }

    }

}


// =====================================================
// HAS ANY SUPPORT
// =====================================================

function nodeHasSupport(nodeId) {

    return (
        Array.isArray(
            supportDatabase
        ) &&
        supportDatabase.some(
            support =>
                Array.isArray(
                    support.assignedNodes
                ) &&
                support.assignedNodes
                    .map(String)
                    .includes(
                        String(nodeId)
                    )
        )
    );

}


// =====================================================
// CREATE CROSS
// =====================================================

function createDrawing2DSupportCross(node) {

    const size =
        window.drawing2DNodeState
            .nodeRadius * 1.4;


    const material =
        new THREE.LineBasicMaterial({

            color:
                0x000000

        });


    const geometry =
        new THREE.BufferGeometry()
            .setFromPoints([

                new THREE.Vector3(
                    -size,
                    0,
                    -size
                ),

                new THREE.Vector3(
                    size,
                    0,
                    size
                ),

                new THREE.Vector3(
                    -size,
                    0,
                    size
                ),

                new THREE.Vector3(
                    size,
                    0,
                    -size
                )

            ]);


    const cross =
        new THREE.LineSegments(
            geometry,
            material
        );


    cross.position.set(
        Number(node.x),
        0.08,
        Number(node.z)
    );


    cross.userData = {

        type:
            "supportCross",

        nodeId:
            node.nodeId

    };


    return cross;

}


// =====================================================
// RENDER SUPPORTS
// =====================================================

function renderDrawing2DSupports() {

    const group =
        window.drawing2DSupportState
            ?.group;


    if (!group) {
        return;
    }


    clearDrawing2DSupports();


    if (
        !window.drawing2DSupportState
            .visible
    ) {
        return;
    }


    const currentFloor =
        window.drawing2D.floor;


    const floorNodes =
        window.nodeDatabase.filter(
            node =>
                String(
                    node.storyUid
                ) ===
                String(
                    currentFloor
                )
        );


    floorNodes.forEach(
        node => {

            if (
                !nodeHasSupport(
                    node.nodeId
                )
            ) {
                return;
            }


            const cross =
                createDrawing2DSupportCross(
                    node
                );


            group.add(
                cross
            );

        }
    );

}


// =====================================================
// VISIBILITY
// =====================================================

function setDrawing2DSupportVisibility(visible) {

    if (
        !window.drawing2DSupportState
    ) {
        return;
    }


    window.drawing2DSupportState.visible =
        !!visible;


    const group =
        window.drawing2DSupportState
            .group;


    if (group) {

        group.visible =
            !!visible;

    }


    if (visible) {

        renderDrawing2DSupports();

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
                    !window.drawing2D.scene
                ) {

                    setTimeout(
                        initialize,
                        50
                    );

                    return;

                }


                initializeDrawing2DSupportSystem();

            };


        initialize();

    }
);