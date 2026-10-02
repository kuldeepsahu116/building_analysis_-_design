// =====================================================
// 3D SECTION RENDERING
// drawing3D_rendering.js
// =====================================================
//
// Purpose:
// Render structural members as actual 3D cross-sections.
//
// This file is intentionally separate from drawing3D.js.
// The existing structural renderer remains unchanged.
//
// Local coordinate convention:
//
//              local Y
//                ↑
//                │
//                │
//                └────────→ local Z
//
// Member longitudinal axis = local X
//
// Section dimensions:
//     depth / height  -> local Y
//     width           -> local Z
//
// =====================================================


// =====================================================
// 3D RENDERING STATE
// =====================================================

window.section3DRendering = false;


// =====================================================
// TOGGLE 3D SECTION RENDERING
// =====================================================

function toggleSection3DRendering(){

    const button =
        document.getElementById(
            "section3DRenderBtn"
        );

    if(!button){
        return;
    }

    window.section3DRendering =
        !window.section3DRendering;


    // ---------------------------------------------
    // BUTTON STATE
    // ---------------------------------------------

    if(window.section3DRendering){

        button.innerText =
            "3D RENDERING ON";

        button.classList.add(
            "active"
        );

    }
    else{

        button.innerText =
            "3D RENDERING";

        button.classList.remove(
            "active"
        );
    }


    // ---------------------------------------------
    // REDRAW
    // ---------------------------------------------

    refreshView();
}


// =====================================================
// UPDATE BUTTON VISIBILITY
// =====================================================
//
// Properties page = page 2
//
// Button should ONLY exist visually on Properties.
// =====================================================

function updateSection3DRenderingButton(page){

    const button =
        document.getElementById(
            "section3DRenderBtn"
        );

    if(!button){
        return;
    }


    if(page === 2){

        button.style.display =
            "inline-block";

    }
    else{

        button.style.display =
            "none";


        // Turn rendering OFF when leaving
        // Properties page.

        if(window.section3DRendering){

            window.section3DRendering =
                false;

            button.innerText =
                "3D RENDERING";

            button.classList.remove(
                "active"
            );
        }
    }
}


// =====================================================
// GET SECTION FOR MEMBER
// =====================================================
//
// Uses the existing sectionDatabase.
//
// A member can have only one assigned section.
// =====================================================

function getSectionFor3DMember(member){

    if(
        !Array.isArray(window.sectionDatabase) &&
        !Array.isArray(sectionDatabase)
    ){
        return null;
    }

    const database =
        Array.isArray(sectionDatabase)
            ? sectionDatabase
            : window.sectionDatabase;


    if(!Array.isArray(database)){
        return null;
    }


    const memberName =
        String(member.name);


    return (
        database.find(
            section =>
                Array.isArray(
                    section.assignedMembers
                ) &&
                section.assignedMembers
                    .map(String)
                    .includes(memberName)
        )
        || null
    );
}


// =====================================================
// CREATE LOCAL-TO-GLOBAL MATRIX
// =====================================================
//
// Local coordinate system:
//
// X = member direction
// Y = section depth
// Z = section width
//
// THREE.Matrix4 columns represent the local axes.
// =====================================================

function createSectionOrientationMatrix(
    axes
){

    const matrix =
        new THREE.Matrix4();


    matrix.makeBasis(
        axes.localX,
        axes.localY,
        axes.localZ
    );


    return matrix;
}


// =====================================================
// CREATE SECTION GROUP
// =====================================================

function createSectionGroup(
    member,
    start,
    end,
    section
){

    if(!section){
        return null;
    }


    const axes =
        getMemberLocalAxes(
            start,
            end,
            Number(member.beta) || 0
        );


    if(!axes){
        return null;
    }


    const group =
        new THREE.Group();


    // ---------------------------------------------
    // POSITION
    // ---------------------------------------------

    group.position.copy(
        start
    );


    // ---------------------------------------------
    // ORIENTATION
    // ---------------------------------------------

    group.setRotationFromMatrix(
        createSectionOrientationMatrix(
            axes
        )
    );


    // ---------------------------------------------
    // CREATE SECTION GEOMETRY
    // ---------------------------------------------

    let geometry =
        createSectionGeometry(
            section,
            axes.length
        );


    if(!geometry){
        return null;
    }

    geometry =
        stretchSectionGeometryToMemberLength(
            geometry,
            axes.length
        );

        
    if (
        section.type === "rectangular" ||
        section.type === "circular"
    ) {

        geometry.translate(
            axes.length / 2,
            0,
            0
        );
    }


    // ---------------------------------------------
    // MATERIAL
    // ---------------------------------------------

    const material =
        new THREE.MeshBasicMaterial({

            color: 0x4DD0E1,

            side:
                THREE.DoubleSide,

            transparent: false,

            opacity: 1.0,

            depthWrite: true
        });


    const mesh =
        new THREE.Mesh(
            geometry,
            material
        );


    mesh.userData = {

        type:
            "section3DMember",

        member:
            member.name,

        section:
            section.name,

        sectionType:
            section.type
    };


    group.add(mesh);

    const edgesGeometry =
        new THREE.EdgesGeometry(
            geometry
        );

    const edgesMaterial =
        new THREE.LineBasicMaterial({
            color: 0x007777
        });

    const edges =
        new THREE.LineSegments(
            edgesGeometry,
            edgesMaterial
        );

    group.add(edges);


    return group;
}


// =====================================================
// CREATE SECTION GEOMETRY
// =====================================================

function createSectionGeometry(
    section,
    memberLength
){

    if(!section){
        return null;
    }


    switch(section.type){

        case "rectangular":

            return createRectangularSectionGeometry(
                section
            );


        case "circular":

            return createCircularSectionGeometry(
                section
            );


        case "hollow_circular":

            return createHollowCircularSectionGeometry(
                section
            );


        case "i_section":

            return createISectionGeometry(
                section
            );


        case "box":

            return createBoxSectionGeometry(
                section
            );


        case "custom":

            console.warn(
                "3D rendering: Custom section " +
                "cannot be rendered from A, Iyy, Izz and J alone."
            );

            return null;


        default:

            console.warn(
                "3D rendering: Unknown section type:",
                section.type
            );

            return null;
    }
}


// =====================================================
// RECTANGULAR SECTION
// =====================================================
//
// b -> local Z
// d -> local Y
// =====================================================

function createRectangularSectionGeometry(
    section
){

    const dimensions =
        section.dimensions || {};


    const b =
        Number(dimensions.b);


    const d =
        Number(dimensions.d);


    if(
        !Number.isFinite(b) ||
        !Number.isFinite(d) ||
        b <= 0 ||
        d <= 0
    ){

        return null;
    }


    return new THREE.BoxGeometry(
        1,
        d,
        b
    );
}


// =====================================================
// SOLID CIRCULAR SECTION
// =====================================================
//
// Radius lies in local Y-Z plane.
// Cylinder longitudinal axis initially = Y.
//
// We will rotate it so that its longitudinal
// direction becomes local X.
// =====================================================

function createCircularSectionGeometry(
    section
){

    const dimensions =
        section.dimensions || {};


    const r =
        Number(dimensions.r);


    if(
        !Number.isFinite(r) ||
        r <= 0
    ){

        return null;
    }


    const geometry =
        new THREE.CylinderGeometry(
            r,
            r,
            1,
            32
        );


    // Cylinder default axis = Y.
    //
    // Rotate Y → X.

    geometry.rotateZ(
        -Math.PI / 2
    );


    return geometry;
}


// =====================================================
// HOLLOW CIRCULAR SECTION
// =====================================================

function createHollowCircularSectionGeometry(
    section
){

    const dimensions =
        section.dimensions || {};


    const rOuter =
        Number(dimensions.r);


    const t =
        Number(dimensions.t);


    if(
        !Number.isFinite(rOuter) ||
        !Number.isFinite(t) ||
        rOuter <= 0 ||
        t <= 0
    ){

        return null;
    }


    const rInner =
        rOuter - t;


    if(rInner <= 0){
        return null;
    }


    // ---------------------------------------------
    // ANNULAR EXTRUSION
    // ---------------------------------------------

    const shape =
        new THREE.Shape();


    const outerPoints = 64;


    for(
        let i = 0;
        i <= outerPoints;
        i++
    ){

        const theta =
            (i / outerPoints)
            * Math.PI
            * 2;


        const x =
            rOuter *
            Math.cos(theta);


        const y =
            rOuter *
            Math.sin(theta);


        if(i === 0){

            shape.moveTo(
                x,
                y
            );

        }
        else{

            shape.lineTo(
                x,
                y
            );
        }
    }


    const hole =
        new THREE.Path();


    for(
        let i = 0;
        i <= outerPoints;
        i++
    ){

        const theta =
            (i / outerPoints)
            * Math.PI
            * 2;


        const x =
            rInner *
            Math.cos(theta);


        const y =
            rInner *
            Math.sin(theta);


        if(i === 0){

            hole.moveTo(
                x,
                y
            );

        }
        else{

            hole.lineTo(
                x,
                y
            );
        }
    }


    shape.holes.push(
        hole
    );


    const geometry =
        new THREE.ExtrudeGeometry(
            shape,
            {

                depth: 1,

                bevelEnabled:
                    false,

                curveSegments:
                    32
            }
        );


    // ExtrudeGeometry axis = Z.
    //
    // Rotate Z → X.

    geometry.rotateY(
        Math.PI / 2
    );


    return geometry;
}


// =====================================================
// I-SECTION
// =====================================================
//
// Local Y = section depth
// Local Z = flange width
//
// bf = flange width
// h  = total depth
// tw = web thickness
// tf = flange thickness
// =====================================================

function createISectionGeometry(
    section
){

    const d =
        section.dimensions || {};


    const bf =
        Number(d.bf);


    const h =
        Number(d.h);


    const tw =
        Number(d.tw);


    const tf =
        Number(d.tf);


    if(
        !Number.isFinite(bf) ||
        !Number.isFinite(h) ||
        !Number.isFinite(tw) ||
        !Number.isFinite(tf) ||

        bf <= 0 ||
        h <= 0 ||
        tw <= 0 ||
        tf <= 0 ||

        tw >= bf ||
        2 * tf >= h
    ){

        return null;
    }


    const shape =
        new THREE.Shape();


    // ---------------------------------------------
    // LOCAL SECTION PLANE
    //
    // shape X -> local Z
    // shape Y -> local Y
    // ---------------------------------------------

    const z =
        bf / 2;


    const y =
        h / 2;


    const zw =
        tw / 2;


    const yi =
        y - tf;


    shape.moveTo(
        -z,
        -y
    );


    shape.lineTo(
        z,
        -y
    );


    shape.lineTo(
        z,
        -yi
    );


    shape.lineTo(
        zw,
        -yi
    );


    shape.lineTo(
        zw,
        yi
    );


    shape.lineTo(
        z,
        yi
    );


    shape.lineTo(
        z,
        y
    );


    shape.lineTo(
        -z,
        y
    );


    shape.lineTo(
        -z,
        yi
    );


    shape.lineTo(
        -zw,
        yi
    );


    shape.lineTo(
        -zw,
        -yi
    );


    shape.lineTo(
        -z,
        -yi
    );


    shape.closePath();


    const geometry =
        new THREE.ExtrudeGeometry(
            shape,
            {

                depth: 1,

                bevelEnabled:
                    false,

                curveSegments:
                    1
            }
        );


    // Extrusion Z → local X

    geometry.rotateY(
        Math.PI / 2
    );


    return geometry;
}


// =====================================================
// BOX / RECTANGULAR HOLLOW SECTION
// =====================================================
//
// b -> local Z
// h -> local Y
// tw -> side wall thickness
// tf -> top/bottom thickness
// =====================================================

function createBoxSectionGeometry(
    section
){

    const d =
        section.dimensions || {};


    const b =
        Number(d.b);


    const h =
        Number(d.h);


    const tw =
        Number(d.tw);


    const tf =
        Number(d.tf);


    if(
        !Number.isFinite(b) ||
        !Number.isFinite(h) ||
        !Number.isFinite(tw) ||
        !Number.isFinite(tf) ||

        b <= 0 ||
        h <= 0 ||
        tw <= 0 ||
        tf <= 0 ||

        2 * tw >= b ||
        2 * tf >= h
    ){

        return null;
    }


    const shape =
        new THREE.Shape();


    // ---------------------------------------------
    // OUTER RECTANGLE
    // ---------------------------------------------

    shape.moveTo(
        -b / 2,
        -h / 2
    );


    shape.lineTo(
        b / 2,
        -h / 2
    );


    shape.lineTo(
        b / 2,
        h / 2
    );


    shape.lineTo(
        -b / 2,
        h / 2
    );


    shape.closePath();


    // ---------------------------------------------
    // INNER VOID
    // ---------------------------------------------

    const hole =
        new THREE.Path();


    const bi =
        b - 2 * tw;


    const hi =
        h - 2 * tf;


    hole.moveTo(
        -bi / 2,
        -hi / 2
    );


    hole.lineTo(
        bi / 2,
        -hi / 2
    );


    hole.lineTo(
        bi / 2,
        hi / 2
    );


    hole.lineTo(
        -bi / 2,
        hi / 2
    );


    hole.closePath();


    shape.holes.push(
        hole
    );


    const geometry =
        new THREE.ExtrudeGeometry(
            shape,
            {

                depth: 1,

                bevelEnabled:
                    false
            }
        );


    // Extrusion Z → local X

    geometry.rotateY(
        Math.PI / 2
    );


    return geometry;
}


// =====================================================
// DRAW ONE SOLID MEMBER
// =====================================================

function drawRenderedMember(
    member,
    nodes
){

    const startCoordinate =
        nodes[member.start];


    const endCoordinate =
        nodes[member.end];


    if(
        !startCoordinate ||
        !endCoordinate
    ){

        return false;
    }


    const start =
        toThreeVector(
            startCoordinate
        );


    const end =
        toThreeVector(
            endCoordinate
        );


    const section =
        getSectionFor3DMember(
            member
        );


    if(!section){

        return false;
    }


    const group =
        createSectionGroup(
            member,
            start,
            end,
            section
        );


    if(!group){

        return false;
    }


    window.threeMemberGroup.add(
        group
    );
    return true;
}


// =====================================================
// DRAW ALL RENDERED MEMBERS
// =====================================================

function draw3DRenderedMembers(){

    if(
        !window.section3DRendering
    ){

        return;
    }


    if(
        !window.threeMemberGroup
    ){

        return;
    }


    const model =
        getThreeModelData();


    const nodes =
        model.nodes;


    const members =
        model.members;


    if(
        !Array.isArray(members)
    ){

        return;
    }


    members.forEach(
        member => {

            drawRenderedMember(
                member,
                nodes
            );

        }
    );
}


// =====================================================
// PUBLIC RENDER FUNCTION
// =====================================================
//
// Called from drawing3D.js integration.
// =====================================================

function renderSection3DModel(){

    draw3DRenderedMembers();
}



function stretchSectionGeometryToMemberLength(
    geometry,
    memberLength
){

    if(
        !geometry ||
        !Number.isFinite(memberLength) ||
        memberLength <= 0
    ){
        return geometry;
    }

    geometry.scale(
        memberLength,
        1,
        1
    );

    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();

    return geometry;
}