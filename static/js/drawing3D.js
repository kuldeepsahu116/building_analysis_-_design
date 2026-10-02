// =============================================
// 3D VIEW STATE
// =============================================
window.viewScale = 1;

window.viewOptions = {
    loads: true,
    supports: true,
    labels: true,
    loadLabels: true    
};

window.threeScene = null;
window.threeCamera = null;
window.threeRenderer = null;
window.threeControls = null;

window.threeModelGroup = null;
window.threeNodeGroup = null;
window.threeMemberGroup = null;
window.threeSupportGroup = null;
window.threeLoadGroup = null;

// =============================================
// PAGE VIEW UPDATE
// =============================================

function updateViewForPage(page) {

    if (page === 1) {

        // Model page
        window.viewOptions.labels = true;
        window.viewOptions.supports = false;
        window.viewOptions.loads = false;
        window.showResultDiagrams = false;

    }

    else if (page ===2) {

        // Properties page
        window.viewOptions.labels = true;
        window.viewOptions.supports = false;
        window.viewOptions.loads = false;
        window.showResultDiagrams = false;

    }

    else if (page === 3) {

        // Supports & Loads page
        window.viewOptions.labels = true;
        window.viewOptions.supports = true;
        window.viewOptions.loads = true;
        window.showResultDiagrams = false;

    }

    else {

        // Results / Report
        window.viewOptions.labels = true;
        window.viewOptions.supports = true;
        window.viewOptions.loads = true;
        window.showResultDiagrams = true;
    }


    drawStructure();
}

function toThreeVector(c) {

    return new THREE.Vector3(
        Number(c[0]) || 0,
        Number(c[1]) || 0,
        Number(c[2]) || 0
    );
}

// =============================================
// THREE.JS INITIALIZATION
// =============================================

function initThreeJS() {

    const canvas = document.getElementById("structureCanvas");

    if (!canvas) {
        console.error("3D drawing: #structureCanvas not found.");
        return;
    }

    if (typeof THREE === "undefined") {
        console.error(
            "3D drawing: Three.js is not loaded. " +
            "Load Three.js before drawing3D.js."
        );
        return;
    }

    if (typeof THREE.OrbitControls === "undefined") {
        console.error(
            "3D drawing: OrbitControls is not loaded. " +
            "Load OrbitControls before drawing3D.js."
        );
        return;
    }


    // =========================================
    // SCENE
    // =========================================

    window.threeScene = new THREE.Scene();

    window.threeScene.background =
        new THREE.Color(0xffffff);


    // =========================================
    // CAMERA
    // =========================================

    const width = Math.max(
        canvas.clientWidth,
        1
    );

    const height = Math.max(
        canvas.clientHeight,
        1
    );

    window.threeCamera =
        new THREE.PerspectiveCamera(
            45,
            width / height,
            0.01,
            100000
        );

    // Temporary camera position.
    // This will be automatically fitted
    // to the structure in a later step.

    window.threeCamera.position.set(
        10,
        10,
        10
    );


    // =========================================
    // RENDERER
    // =========================================

    window.threeRenderer =
        new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true
        });

    window.threeRenderer.setPixelRatio(
        Math.min(
            window.devicePixelRatio || 1,
            2
        )
    );

    window.threeRenderer.setSize(
        width,
        height,
        false
    );

    window.threeRenderer.setClearColor(
        0xffffff,
        1
    );


    // =========================================
    // ORBIT CONTROLS
    // =========================================

    window.threeControls =
        new THREE.OrbitControls(
            window.threeCamera,
            window.threeRenderer.domElement
        );

    window.threeControls.enableRotate = true;
    window.threeControls.enableZoom = true;
    window.threeControls.enablePan = true;

    window.threeControls.enableDamping = true;
    window.threeControls.dampingFactor = 0.08;


    // =========================================
    // MODEL GROUPS
    // =========================================

    window.threeModelGroup =
        new THREE.Group();

    window.threeMemberGroup =
        new THREE.Group();

    window.threeNodeGroup =
        new THREE.Group();

    window.threeSupportGroup =
        new THREE.Group();

    window.threeLoadGroup =
        new THREE.Group();

    window.threeResultGroup =
        new THREE.Group();  

    window.threeAxisGroup =
        new THREE.Group();


    window.threeModelGroup.add(
        window.threeMemberGroup
    );

    window.threeModelGroup.add(
        window.threeNodeGroup
    );

    window.threeModelGroup.add(
        window.threeSupportGroup
    );

    window.threeModelGroup.add(
        window.threeLoadGroup
    );

    window.threeModelGroup.add(
        window.threeResultGroup
    );

    window.threeModelGroup.add(
        window.threeAxisGroup
    );


    window.threeScene.add(
        window.threeModelGroup
    );


    // =========================================
    // INITIAL CAMERA TARGET
    // =========================================

    window.threeControls.target.set(
        0,
        0,
        0
    );

    window.threeControls.update();


    // =========================================
    // RESIZE HANDLER
    // =========================================

    setupThreeResizeHandler();


    // =========================================
    // START RENDER LOOP
    // =========================================

    animateThree();


    console.log(
        "3D drawing: Three.js initialized."
    );
}

// =============================================
// RESIZE HANDLER
// =============================================

function resizeThreeView() {

    if (
        !window.threeRenderer ||
        !window.threeCamera
    ) {
        return;
    }


    const canvas =
        window.threeRenderer.domElement;


    const width = Math.max(
        canvas.clientWidth,
        1
    );

    const height = Math.max(
        canvas.clientHeight,
        1
    );


    window.threeCamera.aspect =
        width / height;

    window.threeCamera.updateProjectionMatrix();


    window.threeRenderer.setSize(
        width,
        height,
        false
    );
}


function setupThreeResizeHandler() {

    const canvas =
        document.getElementById(
            "structureCanvas"
        );

    if (!canvas) {
        return;
    }


    if (
        typeof ResizeObserver !==
        "undefined"
    ) {

        window.threeResizeObserver =
            new ResizeObserver(() => {

                resizeThreeView();

            });

        window.threeResizeObserver.observe(
            canvas
        );

    } else {

        window.addEventListener(
            "resize",
            resizeThreeView
        );
    }
}

// =============================================
// RENDER LOOP
// =============================================

function animateThree() {

    requestAnimationFrame(
        animateThree
    );


    if (
        !window.threeRenderer ||
        !window.threeScene ||
        !window.threeCamera
    ) {
        return;
    }


    if (window.threeControls) {

        window.threeControls.update();

    }


    window.threeRenderer.render(
        window.threeScene,
        window.threeCamera
    );
}

// =============================================
// MODEL DATA
// =============================================

function getThreeModelData() {

    const nodes = getNodes();
    const members = getMembers();

    return {
        nodes: nodes,
        members: members
    };
}


// =====================================================
// COMMON 3D MEMBER LOCAL AXES
// =====================================================
//
// This function MUST match the structural solver.
//
// Local X = member longitudinal axis
// Reference = Global Y normally
// Reference = Global X when member is close to Global Y
//
// Local Z = Local X × Reference
// Local Y = Local Z × Local X
// =====================================================

function getMemberLocalAxes(start, end, beta = 0) {

    const memberVector =
        new THREE.Vector3()
            .subVectors(end, start);

    const length =
        memberVector.length();

    if (length <= 0) {
        return null;
    }

    // ---------------------------------------------
    // LOCAL X
    // ---------------------------------------------

    const localX =
        memberVector
            .clone()
            .normalize();


    // ---------------------------------------------
    // REFERENCE VECTOR
    // SAME RULE AS STRUCTURAL SOLVER
    // ---------------------------------------------

    let reference;

    if (localX.y * localX.y > 0.5) {

        // Member is close to Global Y
        // Use Global X

        reference =
            new THREE.Vector3(1, 0, 0);

    }
    else {

        // Normally use Global Y

        reference =
            new THREE.Vector3(0, 1, 0);
    }


    // ---------------------------------------------
    // LOCAL Z
    // local Z = local X × reference
    // ---------------------------------------------

    const localZ =
        new THREE.Vector3()
            .crossVectors(
                localX,
                reference
            )
            .normalize();


    // ---------------------------------------------
    // LOCAL Y
    // local Y = local Z × local X
    // ---------------------------------------------

    const localY =
        new THREE.Vector3()
            .crossVectors(
                localZ,
                localX
            )
            .normalize();

    // ---------------------------------------------
    // BETA ANGLE
    //
    // Rotate local Y-Z about local X
    //
    // y' = cos(beta) y + sin(beta) z
    // z' = -sin(beta) y + cos(beta) z
    //
    // Positive beta follows right-hand rule
    // about local X.
    // ---------------------------------------------

    const betaRad =
        THREE.MathUtils.degToRad(
            Number(beta) || 0
        );

    const cosBeta =
        Math.cos(betaRad);

    const sinBeta =
        Math.sin(betaRad);


    const rotatedLocalY =
        localY.clone()
            .multiplyScalar(cosBeta)
            .add(
                localZ.clone()
                    .multiplyScalar(sinBeta)
            );


    const rotatedLocalZ =
        localY.clone()
            .multiplyScalar(-sinBeta)
            .add(
                localZ.clone()
                    .multiplyScalar(cosBeta)
            );



    return {

        localX,
        localY: rotatedLocalY.normalize(),
        localZ: rotatedLocalZ.normalize(),

        length

    };
}

// =============================================
// CLEAR MODEL (To clear structure when refreshView() is called)
// =============================================

function clearThreeModel() {

    if (window.threeMemberGroup) {
        while (window.threeMemberGroup.children.length > 0) {
            window.threeMemberGroup.remove(
                window.threeMemberGroup.children[0]
            );
        }
    }

    if (window.threeNodeGroup) {
        while (window.threeNodeGroup.children.length > 0) {
            window.threeNodeGroup.remove(
                window.threeNodeGroup.children[0]
            );
        }
    }

    if (window.threeSupportGroup) {

        while (
            window.threeSupportGroup.children.length > 0
        ) {

            window.threeSupportGroup.remove(
                window.threeSupportGroup.children[0]
            );

        }
    }

    if (window.threeLoadGroup) {

        while (
            window.threeLoadGroup.children.length > 0
        ) {

            window.threeLoadGroup.remove(
                window.threeLoadGroup.children[0]
            );

        }
    }

    if (window.threeResultGroup) {

        while (
            window.threeResultGroup.children.length > 0
        ) {

            window.threeResultGroup.remove(
                window.threeResultGroup.children[0]
            );

        }
    }

    if (window.threeAxisGroup) {

        while (
            window.threeAxisGroup.children.length > 0
        ) {

            window.threeAxisGroup.remove(
                window.threeAxisGroup.children[0]
            );
        }
    }
}


// =============================================
// MODEL BOUNDS
// =============================================

function getThreeModelBounds(nodes) {

    const nodeList = Object.entries(nodes);

    if (nodeList.length === 0) {
        return null;
    }

    let minX = Infinity;
    let minY = Infinity;
    let minZ = Infinity;

    let maxX = -Infinity;
    let maxY = -Infinity;
    let maxZ = -Infinity;


    nodeList.forEach(([id, coordinate]) => {

        const p = toThreeVector(coordinate);

        minX = Math.min(minX, p.x);
        minY = Math.min(minY, p.y);
        minZ = Math.min(minZ, p.z);

        maxX = Math.max(maxX, p.x);
        maxY = Math.max(maxY, p.y);
        maxZ = Math.max(maxZ, p.z);

    });


    const center = new THREE.Vector3(
        (minX + maxX) / 2,
        (minY + maxY) / 2,
        (minZ + maxZ) / 2
    );


    const size = new THREE.Vector3(
        Math.max(maxX - minX, 0),
        Math.max(maxY - minY, 0),
        Math.max(maxZ - minZ, 0)
    );


    return {
        min: new THREE.Vector3(minX, minY, minZ),
        max: new THREE.Vector3(maxX, maxY, maxZ),
        center: center,
        size: size
    };
}


// =============================================
// DRAW 3D MEMBER
// =============================================

function drawThreeMember(member, nodes) {

    // -----------------------------------------
    // 3D SECTION RENDERING
    // -----------------------------------------

    if(
        window.section3DRendering &&
        typeof drawRenderedMember === "function"
    ){

        const rendered = drawRenderedMember(
            member,
            nodes
        );

        if(rendered){
            return;
        }
    }

    // -----------------------------------------
    // EXISTING LINE MEMBER RENDERING
    // -----------------------------------------

    const startCoordinate = nodes[member.start];
    const endCoordinate = nodes[member.end];


    if (!startCoordinate || !endCoordinate) {
        console.warn(
            "3D drawing: Invalid member nodes for member",
            member.name
        );

        return;
    }


    const start = toThreeVector(startCoordinate);
    const end = toThreeVector(endCoordinate);


    const direction = new THREE.Vector3()
        .subVectors(end, start);

    const length = direction.length();


    if (length <= 0) {
        return;
    }


    // -----------------------------------------
    // MEMBER GEOMETRY
    // -----------------------------------------

    const geometry =
        new THREE.BufferGeometry().setFromPoints([
            start,
            end
        ]);


    // -----------------------------------------
    // MEMBER MATERIAL
    // -----------------------------------------

    const material =
        new THREE.LineBasicMaterial({
            color: 0x444444,
            linewidth: 2
        });


    // -----------------------------------------
    // MEMBER LINE
    // -----------------------------------------

    const line =
        new THREE.Line(
            geometry,
            material
        );


    line.userData = {
        type: "member",
        name: member.name,
        start: member.start,
        end: member.end
    };


    window.threeMemberGroup.add(line);
}

// =============================================
// DRAW 3D NODE
// =============================================

function drawThreeNode(id, coordinate) {

    const position = toThreeVector(coordinate);


    // -----------------------------------------
    // NODE GEOMETRY
    // -----------------------------------------

    const geometry =
        new THREE.SphereGeometry(
            0.03,
            16,
            16
        );


    // -----------------------------------------
    // NODE MATERIAL
    // -----------------------------------------

    const material =
        new THREE.MeshBasicMaterial({
            color: 0xe74c3c
        });


    // -----------------------------------------
    // NODE MESH
    // -----------------------------------------

    const node =
        new THREE.Mesh(
            geometry,
            material
        );


    node.position.copy(position);


    node.userData = {
        type: "node",
        id: String(id)
    };


    window.threeNodeGroup.add(node);
}

// =============================================
// CREATE 3D TEXT SPRITE
// =============================================

function createThreeLabel(text, color = "#222222") {

    const canvas = document.createElement("canvas");

    canvas.width = 256;
    canvas.height = 64;

    const ctx = canvas.getContext("2d");

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.font = "bold 32px Segoe UI";

    ctx.fillStyle = color;

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText(
        String(text),
        canvas.width / 2,
        canvas.height / 2
    );

    const texture =
        new THREE.CanvasTexture(canvas);

    texture.needsUpdate = true;

    const material =
        new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false
        });

    const sprite =
        new THREE.Sprite(material);

    sprite.scale.set(
        0.5,
        0.125,
        1
    );

    return sprite;
}


// =============================================
// DRAW NODE LABEL
// =============================================

function drawThreeNodeLabel(
    id,
    coordinate
) {

    if (!window.viewOptions.labels) {
        return;
    }

    const position =
        toThreeVector(coordinate);

    const label =
        createThreeLabel(
            id,
            "#222222"
        );

    label.position.set(
        position.x + 0.12,
        position.y + 0.12,
        position.z
    );

    label.userData = {
        type: "nodeLabel",
        id: String(id)
    };

    window.threeNodeGroup.add(label);
}


// =============================================
// DRAW MEMBER LABEL
// =============================================

function drawThreeMemberLabel(
    member,
    nodes
) {

    if (!window.viewOptions.labels) {
        return;
    }

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

    const midpoint =
        new THREE.Vector3()
            .addVectors(start, end)
            .multiplyScalar(0.5);

    const label =
        createThreeLabel(
            "Member " + member.name,
            "#1f3c88"
        );

    label.position.set(
        midpoint.x,
        midpoint.y + 0.12,
        midpoint.z
    );

    label.userData = {
        type: "memberLabel",
        name: member.name
    };

    window.threeMemberGroup.add(label);
}


// =============================================
// GLOBAL ORIGIN AND AXES
// =============================================

function drawThreeGlobalAxes() {

    if (!window.threeAxisGroup) {
        return;
    }


    // -----------------------------------------
    // AXIS SIZE
    // -----------------------------------------

    const axisLength = 1.0;


    // -----------------------------------------
    // ORIGIN
    // -----------------------------------------

    const origin =
        new THREE.Vector3(0, 0, 0);


    // -----------------------------------------
    // X AXIS
    // -----------------------------------------

    const xAxis =
        new THREE.ArrowHelper(
            new THREE.Vector3(1, 0, 0),
            origin,
            axisLength,
            0xff0000,
            0.12,
            0.06
        );

    window.threeAxisGroup.add(
        xAxis
    );


    // -----------------------------------------
    // Y AXIS
    // -----------------------------------------

    const yAxis =
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 1, 0),
            origin,
            axisLength,
            0x00aa00,
            0.12,
            0.06
        );

    window.threeAxisGroup.add(
        yAxis
    );


    // -----------------------------------------
    // Z AXIS
    // -----------------------------------------

    const zAxis =
        new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            origin,
            axisLength,
            0x0000ff,
            0.12,
            0.06
        );

    window.threeAxisGroup.add(
        zAxis
    );


    // -----------------------------------------
    // ORIGIN MARKER
    // -----------------------------------------

    const originGeometry =
        new THREE.SphereGeometry(
            0.06,
            12,
            12
        );


    const originMaterial =
        new THREE.MeshBasicMaterial({
            color: 0x222222
        });


    const originMarker =
        new THREE.Mesh(
            originGeometry,
            originMaterial
        );


    originMarker.position.copy(
        origin
    );


    window.threeAxisGroup.add(
        originMarker
    );


    // -----------------------------------------
    // AXIS LABELS
    // -----------------------------------------

    const xLabel =
        createThreeLabel(
            "X",
            "#ff0000"
        );

    xLabel.position.set(
        axisLength + 0.12,
        0,
        0
    );

    window.threeAxisGroup.add(
        xLabel
    );


    const yLabel =
        createThreeLabel(
            "Y",
            "#00aa00"
        );

    yLabel.position.set(
        0,
        axisLength + 0.12,
        0
    );

    window.threeAxisGroup.add(
        yLabel
    );


    const zLabel =
        createThreeLabel(
            "Z",
            "#0000ff"
        );

    zLabel.position.set(
        0,
        0,
        axisLength + 0.12
    );

    window.threeAxisGroup.add(
        zLabel
    );
}


// =============================================
// MAIN STRUCTURE DRAWING
// =============================================

function drawStructure() {

    // -----------------------------------------
    // INITIALIZE THREE.JS
    // -----------------------------------------

    if (!window.threeScene) {

        initThreeJS();

        if (!window.threeScene) {
            return;
        }
    }


    // -----------------------------------------
    // GET MODEL DATA
    // -----------------------------------------

    const model = getThreeModelData();

    const nodes = model.nodes;
    const members = model.members;


    const nodeList =
        Object.entries(nodes);


    // -----------------------------------------
    // CLEAR OLD MODEL
    // -----------------------------------------

    clearThreeModel();


    // -----------------------------------------
    // NO NODES
    // -----------------------------------------

    if (nodeList.length === 0) {

        console.log(
            "3D drawing: No nodes to draw."
        );

        return;
    }

    // GLOBAL AXES
    drawThreeGlobalAxes();

    // -----------------------------------------
    // DRAW MEMBERS
    // -----------------------------------------

    members.forEach(member => {

        drawThreeMember(
            member,
            nodes
        );

        if (window.viewOptions.labels) {

            drawThreeMemberLabel(
                member,
                nodes
            );
        }

    });


    // -----------------------------------------
    // DRAW NODES
    // -----------------------------------------

    nodeList.forEach(
        ([id, coordinate]) => {

            drawThreeNode(
                id,
                coordinate
            );

            if (window.viewOptions.labels) {

                drawThreeNodeLabel(
                    id,
                    coordinate
                );
            }

        }
    );

    // -----------------------------------------
    // DRAW SUPPORTS
    // -----------------------------------------

    if (window.viewOptions.supports) {

        const nodeSupports =
            getThreeNodeSupports();


        Object.entries(
            nodeSupports
        ).forEach(
            ([nodeId, support]) => {

                const coordinate =
                    nodes[nodeId];

                if (!coordinate) {
                    return;
                }


                drawThreeSupport(
                    nodeId,
                    coordinate,
                    support
                );

            }
        );
    }

    // =========================================
    // DRAW LOADS
    // =========================================

    const loads = getLoads();

    if (window.viewOptions.loads && Array.isArray(loads)) {

        loads.forEach(load => {

            // -----------------------------------------
            // ONLY NODAL LOADS FOR NOW
            // -----------------------------------------

            if (load.category == "nodal"){
          
                if (
                    !load.assignedNodes ||
                    !Array.isArray(load.assignedNodes)
                ) {
                    return;
                }

                // -----------------------------------------
                // DRAW LOAD ON EACH ASSIGNED NODE
                // -----------------------------------------

                load.assignedNodes.forEach(nodeId => {

                    const id = String(nodeId);

                    const coordinate = nodes[id];

                    if (!coordinate) {
                        console.warn(
                            "3D drawing: Node not found for load:",
                            nodeId
                        );
                        return;
                    }

                    // -------------------------------------
                    // NODAL LOAD
                    // -------------------------------------

                    if (load.type === "point") {

                        drawThreeNodalForce(
                            id,
                            coordinate,
                            load
                        );

                        drawThreeNodalMoments(
                            id,
                            coordinate,
                            load
                        );
                    }
                });

                return;
            }

            // =====================================
            // MEMBER LOADS
            // =====================================

            if (load.category === "member") {

                if (
                    !load.assignedMembers ||
                    !Array.isArray(load.assignedMembers)
                ) {
                    return;
                }

                load.assignedMembers.forEach(memberName => {

                    const member = members.find(m =>
                        String(m.name) === String(memberName)
                    );

                    if (!member) {
                        return;
                    }

                    // ---------------------------------
                    // MEMBER POINT LOAD
                    // ---------------------------------

                    if (load.type === "point") {

                        drawThreeMemberPointLoad(
                            member,
                            nodes,
                            load
                        );
                    }

                    else if (
                        load.type === "udl" ||
                        load.type === "partial_udl" ||
                        load.type === "trapezoidal"
                    ) {

                        drawThreeMemberDistributedLoad(
                            member,
                            nodes,
                            load
                        );

                    }
                });
            }

        });
    }

    // =========================================
    // DRAW RESULT DIAGRAM
    // =========================================

    if (
        window.showResultDiagrams &&
        window.currentDiagram &&
        window.currentDiagram !== "structure" &&
        window.analysisResults
    ) {

        drawThreeResults(
            nodes,
            members
        );
    }

    // -----------------------------------------
    // FIT CAMERA
    // -----------------------------------------

    fitThreeCamera(nodes);
}


// =============================================
// FIT CAMERA TO MODEL
// =============================================

function fitThreeCamera(nodes) {

    if (
        !window.threeCamera ||
        !window.threeControls
    ) {
        return;
    }


    const bounds =
        getThreeModelBounds(nodes);


    if (!bounds) {
        return;
    }


    const center = bounds.center;


    const size =
        Math.max(
            bounds.size.x,
            bounds.size.y,
            bounds.size.z,
            1
        );


    // -----------------------------------------
    // CAMERA DISTANCE
    // -----------------------------------------

    const distance = size * 1.2;


    // -----------------------------------------
    // CAMERA POSITION
    // -----------------------------------------

    window.threeCamera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
    );


    // -----------------------------------------
    // CAMERA TARGET
    // -----------------------------------------

    window.threeControls.target.copy(
        center
    );


    window.threeControls.update();
}


// =============================================
// RESET VIEW
// =============================================

function resetView() {

    if (
        !window.threeCamera ||
        !window.threeControls
    ) {
        return;
    }


    const model = getThreeModelData();

    const bounds =
        getThreeModelBounds(
            model.nodes
        );


    if (!bounds) {
        return;
    }


    const center = bounds.center;


    const size =
        Math.max(
            bounds.size.x,
            bounds.size.y,
            bounds.size.z,
            1
        );


    const distance = size * 1.2;


    window.threeCamera.position.set(
        center.x + distance,
        center.y + distance,
        center.z + distance
    );


    window.threeControls.target.copy(
        center
    );


    window.threeControls.update();
}

// =============================================
// REFRESH VIEW
// =============================================

function refreshView() {

    drawStructure();

}


// =============================================
// DIAGRAM MENU POPUP
// =============================================

function toggleDiagramMenu(){

    const popup =
        document.getElementById("diagramMenuPopup");

    if(!popup){
        return;
    }

    if(popup.style.display === "block"){
        popup.style.display = "none";
    }
    else{
        popup.style.display = "block";
    }
}


// =============================================
// CLOSE POPUP WHEN CLICKING OUTSIDE
// =============================================

document.addEventListener("click", function(e){

    const popup =
        document.getElementById("diagramMenuPopup");

    const button =
        document.getElementById("diagramMenuBtn");

    if(!popup || !button){
        return;
    }

    // Click outside popup and menu button
    if(
        !popup.contains(e.target) &&
        !button.contains(e.target)
    ){
        popup.style.display = "none";
    }

});