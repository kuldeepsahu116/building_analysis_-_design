window.viewScale = 1;

window.viewOffsetX = 0;

window.viewOffsetY = 0;

// =============================================
// DIAGRAM SCALES
// =============================================

window.diagramScales = {

    sfd : 8,

    bmd : 11,

    deflection : 1
};

// =============================================
// VIEW OPTIONS
// =============================================

window.viewOptions = {

    loads : true,

    supports : true,

    labels : true
};


function updateViewForPage(page){

    if(page === 1){

        // Model page
        window.viewOptions.labels = true;
        window.viewOptions.supports = false;
        window.viewOptions.loads = false;

    }
    else if(page === 2){

        // Supports & Loads page
        window.viewOptions.labels = true;
        window.viewOptions.supports = true;
        window.viewOptions.loads = true;

    }
    else{

        // Results / other pages
        window.viewOptions.labels = true;
        window.viewOptions.supports = true;
        window.viewOptions.loads = true;
    }

    drawStructure();
}

// #region SUPPORT DRAWING FUNCTIONS
// =====================================================

// -----------------------------------------------------
// FIXED SUPPORT
// -----------------------------------------------------

function drawFixedSupport(ctx,size=28){

    let h = size;

    // Wall line
    ctx.beginPath();

    ctx.moveTo(20,-h/2);
    ctx.lineTo(20,h/2);

    ctx.stroke();

    // Hatch lines
    for(let i=-h/2;i<=h/2;i+=5){

        ctx.beginPath();

        ctx.moveTo(20,i);
        ctx.lineTo(28,i+3);

        ctx.stroke();
    }

    // Beam line
    ctx.beginPath();

    ctx.moveTo(0,0);
    ctx.lineTo(20,0);

    ctx.stroke();
}



// -----------------------------------------------------
// PIN SUPPORT
// -----------------------------------------------------

function drawPinSupport(ctx,size=26){

    let h = size;

    // Triangle
    ctx.beginPath();

    ctx.moveTo(0,0);

    ctx.lineTo(h,-h/2);

    ctx.lineTo(h,h/2);

    ctx.closePath();

    ctx.stroke();

    // Ground line
    ctx.beginPath();

    ctx.moveTo(h,-h/2-6);
    ctx.lineTo(h,h/2+6);

    ctx.stroke();

    // Ground hatch
    for(let i=-h/2-4;i<=h/2+4;i+=5){

        ctx.beginPath();

        ctx.moveTo(h,i);
        ctx.lineTo(h+5,i+3);

        ctx.stroke();
    }
}



// -----------------------------------------------------
// ROLLER SUPPORT
// -----------------------------------------------------

function drawRollerSupport(ctx,size=26){

    let h = size;

    // Triangle
    ctx.beginPath();

    ctx.moveTo(0,0);

    ctx.lineTo(-h/2,h-8);

    ctx.lineTo(h/2,h-8);

    ctx.closePath();

    ctx.stroke();

    // Rollers
    for(let i=-8;i<=8;i+=8){

        ctx.beginPath();

        ctx.arc(i,h-4,4,0,2*Math.PI);

        ctx.stroke();
    }

    // Ground line
    ctx.beginPath();

    ctx.moveTo(-h/2-8,h+4);
    ctx.lineTo(h/2+8,h+4);

    ctx.stroke();

    // Hatch
    for(let i=-h/2-6;i<=h/2+6;i+=5){

        ctx.beginPath();

        ctx.moveTo(i,h+4);
        ctx.lineTo(i-3,h+9);

        ctx.stroke();
    }
}



// -----------------------------------------------------
// GENERIC SUPPORT
// -----------------------------------------------------

function drawGenericSupport(ctx,s){

    // Main square
    ctx.beginPath();

    ctx.rect(-8,-8,16,16);

    ctx.stroke();

    // UX restrained
    if(s.ux){

        ctx.beginPath();

        ctx.moveTo(-20,0);
        ctx.lineTo(20,0);

        ctx.stroke();
    }

    // UY restrained
    if(s.uy){

        ctx.beginPath();

        ctx.moveTo(0,-20);
        ctx.lineTo(0,20);

        ctx.stroke();
    }

    // Rotation restrained
    if(s.rz){

        ctx.beginPath();

        ctx.arc(0,0,16,-Math.PI/2,Math.PI);

        ctx.stroke();
    }
}

// #endregion

// #region LOAD DRAWING FUNCTIONS
// =====================================================

// -----------------------------------------------------
// FORCE
// Drawn along LOCAL +X
// -----------------------------------------------------

function drawForce(ctx,length=35){

    ctx.strokeStyle = "#e74c3c";

    ctx.fillStyle = "#e74c3c";

    ctx.lineWidth = 2;

    // Arrow line
    ctx.beginPath();

    ctx.moveTo(length,0);

    ctx.lineTo(0,0);

    ctx.stroke();

    // Arrow head
    ctx.beginPath();

    ctx.moveTo(0,0);

    ctx.lineTo(8,-5);

    ctx.lineTo(8,5);

    ctx.closePath();

    ctx.fill();
}



// -----------------------------------------------------
// MOMENT
// -----------------------------------------------------

function drawMoment(ctx,x,y,value){

    let clockwise = value < 0;

    ctx.strokeStyle = "#e74c3c";

    ctx.fillStyle = "#e74c3c";

    ctx.lineWidth = 2;

    // Arc
    ctx.beginPath();

    if(clockwise){

        ctx.arc(x,y,18,0,1.5*Math.PI);

    }else{

        ctx.arc(x,y,18,Math.PI,-0.5*Math.PI,true);
    }

    ctx.stroke();

    // Arrow head
    let ax,ay;

    if(clockwise){

        ax = x ;
        ay = y - 18;

    }else{

        ax = x;
        ay = y - 18;
    }

    ctx.beginPath();

    ctx.moveTo(ax,ay);

    if(clockwise){

        ctx.lineTo(ax-8,ay-2);
        ctx.lineTo(ax-4,ay+6);

    }else{

        ctx.lineTo(ax+8,ay-2);
        ctx.lineTo(ax+4,ay+6);
    }

    ctx.closePath();

    ctx.fill();
}

// #endregion

// #region =====================================================
// UDL DRAWING
// =====================================================

function drawUDL(ctx,L,value){

    let n = 6;

    for(let i=0;i<=n;i++){

        let x = i/n * L;

        ctx.save();

        ctx.translate(x,0);

        if(value > 0){
            ctx.rotate(Math.PI/2);
        }else{
            ctx.rotate(-Math.PI/2);
        }

        drawForce(ctx,25);

        ctx.restore();
    }



    ctx.beginPath();

    let y = value > 0 ? 25 : -25;

    ctx.moveTo(0,y);

    ctx.lineTo(L,y);

    ctx.strokeStyle = "#e74c3c";

    ctx.stroke();
}  

// #endregion

// #region =====================================================
// PARTIAL UDL DRAWING
// =====================================================    

function drawPartialUDL(ctx,x1,x2,value){

    let n = 5;

    for(let i=0;i<=n;i++){

        let x =
            x1 + (x2-x1)*i/n;

        ctx.save();

        ctx.translate(x,0);

        if(value > 0){
            ctx.rotate(Math.PI/2);
        }else{
            ctx.rotate(-Math.PI/2);
        }

        drawForce(ctx,25);

        ctx.restore();
    }



    ctx.beginPath();

    let y = value > 0 ? 25 : -25;

    ctx.moveTo(x1,y);

    ctx.lineTo(x2,y);

    ctx.strokeStyle = "#e74c3c";

    ctx.stroke();
}
// #endregion

// #region =====================================================
// TRAPEZOIDAL LOAD DRAWING
// =====================================================

function drawTrapezoidalLoad(ctx,L,value1,value2){

    let n = 6;

    for(let i=0;i<=n;i++){

        let x = i/n * L;

        let h =
            10 + (25*i/n);

        ctx.save();

        ctx.translate(x,0);

        let avg = (value1 + value2)/2;
        if(avg > 0){
            ctx.rotate(Math.PI/2);
        }else{
            ctx.rotate(-Math.PI/2);
        }

        drawForce(ctx,h);

        ctx.restore();
    }



    ctx.beginPath();

    let avg = (value1 + value2)/2;

    if(avg > 0){
        ctx.moveTo(0,10);
        ctx.lineTo(L,35);
    }else{
        ctx.moveTo(0,-10);
        ctx.lineTo(L,-35);
    }

    ctx.strokeStyle = "#e74c3c";

    ctx.stroke();
}
// #endregion

// #region =====================================================
// MAIN STRUCTURE DRAWING
// =====================================================

function drawStructure(){

    let canvas =
        document.getElementById("structureCanvas");

    let ctx =
        canvas.getContext("2d");

    canvas.width  = canvas.clientWidth;

    canvas.height = canvas.clientHeight;

    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    let nodes   = getNodes();

    let members = getMembers();

    let nodeList =
        Object.entries(nodes);

    if(nodeList.length === 0) return;



    // -------------------------------------------------
    // BOUNDS
    // -------------------------------------------------

    let xs = nodeList.map(n=>n[1][0]);

    let ys = nodeList.map(n=>n[1][1]);

    let minX = Math.min(...xs);

    let maxX = Math.max(...xs);

    let minY = Math.min(...ys);

    let maxY = Math.max(...ys);


    // -------------------------------------------------
    // STRUCTURE SIZE
    // -------------------------------------------------
    let width  = Math.max(maxX - minX,1);
    let height = Math.max(maxY - minY,1);

    // -------------------------------------------------
    // FORCE MINIMUM HEIGHT
    // Prevent 1D beams from collapsing scaling
    // -------------------------------------------------
    if(height < width * 0.15){
        height = width * 0.15;
    }

    // -------------------------------------------------
    // BASE SCALE
    // -------------------------------------------------
    let baseScale = Math.min(
        (canvas.width  * 0.7) / width,
        (canvas.height * 0.7) / height
    );

    // FINAL SCALE WITH ZOOM
    let scale = baseScale * window.viewScale;


    // -------------------------------------------------
    // ORIGIN
    // -------------------------------------------------

    let structureWidth = (maxX - minX) * scale;
    let structureHeight = (maxY - minY) * scale;

    let originX =(canvas.width - structureWidth)/2 + window.viewOffsetX;

    let originY = (canvas.height + structureHeight)/2 + window.viewOffsetY;


    // -------------------------------------------------
    // GLOBAL → CANVAS
    // -------------------------------------------------

    function toCanvas(x,y){

        return [

            originX + (x-minX)*scale,

            originY - (y-minY)*scale
        ];
    }



    // -------------------------------------------------
    // MEMBERS
    // -------------------------------------------------

    ctx.strokeStyle = "#666";

    ctx.lineWidth = 2;

    members.forEach(m=>{

        let n1 = nodes[m.start];

        let n2 = nodes[m.end];

        if(!n1 || !n2) return;

        let [x1,y1] =
            toCanvas(n1[0],n1[1]);

        let [x2,y2] =
            toCanvas(n2[0],n2[1]);

        // MEMBER GEOMETRY

        let dx = x2 - x1;

        let dy = y2 - y1;

        let L = Math.sqrt(
            dx*dx + dy*dy
        );

        let angle = Math.atan2(dy,dx);

        ctx.beginPath();

        ctx.moveTo(x1,y1);

        ctx.lineTo(x2,y2);

        ctx.stroke();



        // MEMBER LABEL
        if(window.viewOptions.labels){
            let mx = (x1+x2)/2;

            let my = (y1+y2)/2 - 10;

            ctx.font =
                "bold 13px Segoe UI";

            ctx.fillStyle = "#1f3c88";

            ctx.fillText(
                m.name,
                mx,
                my
            );
        }
    });

    // =================================================
    // DIAGRAM DRAWING
    // =================================================

    ctx.save();

    ctx.beginPath();

    ctx.rect(
        0,
        0,
        canvas.width,
        canvas.height
    );

    ctx.clip();

    if(window.analysisResults && currentPage === 3){

        if(window.currentDiagram === "sfd"){
            drawSFD(ctx,toCanvas,nodes,members);
        }

        else if(window.currentDiagram === "bmd"){
            drawBMD(ctx,toCanvas,nodes,members);
        }

        else if(window.currentDiagram === "deflection"){
            drawDeflection(ctx,toCanvas,nodes,members);           
        }
    }
    ctx.restore();

    // -------------------------------------------------
    // NODES
    // -------------------------------------------------

    ctx.fillStyle = "#e74c3c";

    nodeList.forEach(([id,c])=>{

        let [x,y] =
            toCanvas(c[0],c[1]);

        ctx.beginPath();

        ctx.arc(x,y,4,0,2*Math.PI);

        ctx.fill();

        // NODE LABEL
        if(window.viewOptions.labels){
            ctx.fillStyle = "#222";

            ctx.font =
                "bold 14px Segoe UI";

            ctx.fillText(
                id,
                x+10,
                y-10
            );

            ctx.fillStyle = "#e74c3c";
        }
    });



    // -------------------------------------------------
    // SUPPORTS
    // -------------------------------------------------

    let supports = getSupports();

    let nodeSupports = {};

    supports.forEach(s => {

        s.assignedNodes.forEach(node => {
            nodeSupports[node] = {
                ux: s.ux,
                uy: s.uy,
                rz: s.rz
            };
        });
    });



    // DRAW SUPPORTS
    if(window.viewOptions.supports){
        for(let node in nodeSupports){

            let s = nodeSupports[node];

            let [x,y] =
                toCanvas(
                    nodes[node][0],
                    nodes[node][1]
                );

            ctx.save();

            ctx.translate(x,y);

            ctx.rotate(Math.PI/2);

            ctx.strokeStyle = "#2952cc";

            ctx.lineWidth = 1.5;



            // FIXED
            if(s.ux && s.uy && s.rz){

                drawFixedSupport(ctx);
            }

            // PIN
            else if(s.ux && s.uy && !s.rz){

                drawPinSupport(ctx);
            }

            // Y ROLLER
            else if(!s.ux && s.uy && !s.rz){

                ctx.rotate(-Math.PI/2);

                drawRollerSupport(ctx);
            }

            // X ROLLER
            else if(s.ux && !s.uy && !s.rz){

                drawRollerSupport(ctx);
            }

            // GENERIC
            else{

                drawGenericSupport(ctx,s);
            }

            ctx.restore();
        }
    }    


    // -------------------------------------------------
    // LOADS
    // -------------------------------------------------
    if(window.viewOptions.loads){
        let loads = getLoads();

        loads.forEach(load => {

            // NODAL LOADS

            if(load.category === "nodal"){

                drawNodalLoad(
                    ctx,
                    load,
                    nodes,
                    toCanvas
                );
            }

            // MEMBER LOADS

            else{

                drawMemberLoad(
                    ctx,
                    load,
                    nodes,
                    members,
                    toCanvas
                );
            }
        });
    }
}

// #endregion

// #region =====================================================
// Nodal Load DRAWING
// =====================================================

function drawNodalLoad(
    ctx,
    load,
    nodes,
    toCanvas
){

    load.assignedNodes.forEach(node => {
        node = String(node);
        if(!(node in nodes)) return;
        let [x,y] =
            toCanvas(
                nodes[node][0],
                nodes[node][1]
            );

        ctx.save();
        ctx.translate(x,y);

        // X FORCE
        if(load.direction === "X"){
            if(load.value1 < 0){
                ctx.rotate(-Math.PI);
            }

            drawForce(ctx);
        }

        // Y FORCE
        else if(load.direction === "Y"){
            if(load.value1 > 0){
                ctx.rotate(Math.PI/2);
            }else{
                ctx.rotate(-Math.PI/2);
            }

            drawForce(ctx);
        }



        // MOMENT
        else if(load.direction === "M"){

            drawMoment(
                ctx,
                0,
                0,
                load.value1
            );
        }

        ctx.restore();
    });
}
// #endregion

// #region =====================================================
// MEMBER LOAD DRAWING
// =====================================================

function drawMemberLoad(
    ctx,
    load,
    nodes,
    members,
    toCanvas
){

    load.assignedMembers.forEach(memberName => {

        // FIND MEMBER

        let member =
            members.find(
                m => String(m.name)
                ===
                String(memberName)
            );

        if(!member) return;

        let n1 = nodes[member.start];

        let n2 = nodes[member.end];

        let [x1,y1] =
            toCanvas(n1[0],n1[1]);

        let [x2,y2] =
            toCanvas(n2[0],n2[1]);

        let dx = x2 - x1;

        let dy = y2 - y1;

        let L = Math.sqrt(dx*dx + dy*dy);

        let angle = Math.atan2(dy,dx);

        ctx.save();

        ctx.translate(x1,y1);

        ctx.rotate(angle);



        // =================================================
        // POINT LOAD
        // =================================================

        if(load.type === "point"){

            let x = (load.a / memberLength(
                member,
                nodes
            )) * L;

            ctx.save();

            ctx.translate(x,0);

            if(load.value1 > 0){
                ctx.rotate(-Math.PI/2);
            }else{
                ctx.rotate(Math.PI/2);
            }

            drawForce(ctx);

            ctx.restore();
        }



        // =================================================
        // MEMBER MOMENT
        // =================================================

        else if(load.type === "moment"){

            let x = (load.a / memberLength(
                member,
                nodes
            )) * L;

            drawMoment(
                ctx,
                x,
                0,
                load.value1
            );
        }



        // =================================================
        // UDL
        // =================================================

        else if(load.type === "udl"){

            drawUDL(ctx,L,load.value1);
        }



        // =================================================
        // PARTIAL UDL
        // =================================================

        else if(load.type === "partial_udl"){

            let memberL =
                memberLength(member,nodes);

            let x1p =
                load.a/memberL * L;

            let x2p =
                load.b/memberL * L;

            drawPartialUDL(
                ctx,
                x1p,
                x2p,
                load.value1
            );
        }



        // =================================================
        // TRAPEZOIDAL
        // =================================================

        else if(load.type === "trapezoidal"){

            drawTrapezoidalLoad(
                ctx,
                L,
                load.value1,
                load.value2
            );
        }

        ctx.restore();
    });
}

// #endregion

function memberLength(member,nodes){

    let n1 = nodes[member.start];

    let n2 = nodes[member.end];

    let dx = n2[0] - n1[0];

    let dy = n2[1] - n1[1];

    return Math.sqrt(
        dx*dx + dy*dy
    );
}

// #region =====================================================
// REFRESH VIEW
// =====================================================

function refreshView(){

    drawStructure();
}

// #endregion

//#region ===================================================
// Diagram type
// ======================================================
function setDiagram(type){

    window.currentDiagram = type;

    drawStructure();
}
//#endregion

function drawReportMemberAxis(
    ctx,
    toCanvas,
    nodes,
    member
){

    let n1 = nodes[member.start];
    let n2 = nodes[member.end];

    if(!n1 || !n2) return;

    let [x1,y1] = toCanvas(n1[0],n1[1]);
    let [x2,y2] = toCanvas(n2[0],n2[1]);

    // ==========================
    // Beam Axis
    // ==========================

    ctx.beginPath();

    ctx.moveTo(x1,y1);

    ctx.lineTo(x2,y2);

    ctx.strokeStyle = "#444";

    ctx.lineWidth = 3;

    ctx.stroke();

    // ==========================
    // Start Node
    // ==========================

    ctx.beginPath();

    ctx.arc(x1,y1,5,0,2*Math.PI);

    ctx.fillStyle = "#e74c3c";

    ctx.fill();

    // ==========================
    // End Node
    // ==========================

    ctx.beginPath();

    ctx.arc(x2,y2,5,0,2*Math.PI);

    ctx.fill();

    // ==========================
    // Member Label
    // ==========================

    let mx = (x1+x2)/2;

    let my = (y1+y2)/2 - 18;

    ctx.fillStyle = "#1f3c88";

    ctx.font = "bold 16px Segoe UI";

    ctx.textAlign = "center";

    ctx.fillText(
        "Member " + member.name,
        mx,
        my
    );

    // ==========================
    // Node Labels
    // ==========================

    ctx.fillStyle = "#222";

    ctx.font = "13px Segoe UI";

    ctx.textAlign = "center";

    ctx.fillText(
        member.start,
        x1,
        y1 + 20
    );

    ctx.fillText(
        member.end,
        x2,
        y2 + 20
    );

}


//#region ====================================================
// SFD Drawing
// =======================================================
function drawSFD(ctx,toCanvas,nodes,members){

    let data = window.analysisResults.sfd;

    members.forEach((member,i)=>{

        drawMemberSFD(
            ctx,
            toCanvas,
            nodes,
            member,
            data[i]
        );

    });
}

function drawMemberSFD(
    ctx,
    toCanvas,
    nodes,
    member,
    diagram
){

    let n1 = nodes[member.start];
    let n2 = nodes[member.end];

    let [x1,y1] = toCanvas(n1[0],n1[1]);
    let [x2,y2] = toCanvas(n2[0],n2[1]);

    let dx = x2-x1;
    let dy = y2-y1;

    let L = Math.sqrt(dx*dx+dy*dy);

    let angle = Math.atan2(dy,dx);

    ctx.save();

    ctx.translate(x1,y1);

    ctx.rotate(angle);

    let scale = window.diagramScales.sfd;

    let actualL = diagram.x[diagram.x.length-1];

    ctx.beginPath();

    for(let j=0;j<diagram.x.length;j+=2){

        let px = diagram.x[j]*L/actualL;

        let py = -diagram.V[j]*scale;

        ctx.moveTo(px,0);

        ctx.lineTo(px,py);

    }

    ctx.strokeStyle="rgba(0,0,255,0.25)";
    ctx.lineWidth=1;
    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(0,0);

    diagram.x.forEach((x,j)=>{

        ctx.lineTo(
            x*L/actualL,
            -diagram.V[j]*scale
        );

    });

    ctx.lineTo(L,0);

    ctx.strokeStyle="blue";
    ctx.lineWidth=2;
    ctx.stroke();

    ctx.restore();

}
//#endregion

//#region ==================================================
// BMD Drawing
// =================================================
function drawBMD(ctx,toCanvas,nodes,members){

    let data = window.analysisResults.bmd;

    members.forEach((member,i)=>{

        drawMemberBMD(
            ctx,
            toCanvas,
            nodes,
            member,
            data[i]
        );
    });
}

function drawMemberBMD(ctx,toCanvas,nodes,member,d){

    let m = member;

    let n1 = nodes[m.start];
    let n2 = nodes[m.end];

    let [x1,y1] = toCanvas(n1[0],n1[1]);
    let [x2,y2] = toCanvas(n2[0],n2[1]);

    let dx = x2-x1;
    let dy = y2-y1;

    let L = Math.sqrt(dx*dx+dy*dy);

    let angle = Math.atan2(dy,dx);

    ctx.save();

    ctx.translate(x1,y1);
    ctx.rotate(angle);

    let scale = window.diagramScales.bmd;
    let actualL = d.x[d.x.length-1];

    // Draw vertical ordinates

    ctx.beginPath();

    for(let j=0;j<d.x.length;j+=2){

        let px = d.x[j] * L / actualL;
        let py = -d.M[j] * scale;

        ctx.moveTo(px,0);
        ctx.lineTo(px,-py);
    }

    ctx.strokeStyle = "rgba(0,150,0,0.25)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw moment diagram

    ctx.beginPath();
    ctx.moveTo(0,0);

    d.x.forEach((x,j)=>{

        let mVal = -d.M[j] * scale;

        ctx.lineTo(x*L/actualL,-mVal);
    });

    ctx.lineTo(L,0)

    ctx.strokeStyle = "green";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
}

//#endregion

//#region ===============================================
// Deflected Shape Drawing
// =============================================
function drawDeflection(ctx,toCanvas,nodes,members){

    let data = window.analysisResults.deflection_shapes;

    members.forEach((member,i)=>{

        drawMemberDeflection(
            ctx,
            toCanvas,
            nodes,
            member,
            data[i]
        );
    });
}

function drawMemberDeflection(ctx,toCanvas,nodes,member,d){

    let n1 = nodes[member.start];
    let n2 = nodes[member.end];

    let scale = window.diagramScales.deflection;

    let dx = n2[0] - n1[0];
    let dy = n2[1] - n1[1];

    let L = Math.sqrt(dx*dx + dy*dy);

    let C = dx / L;
    let S = dy / L;

    ctx.beginPath();

    d.position.forEach((x,j)=>{

        // Original global position
        let x_original = n1[0] + C * x;

        let y_original = n1[1] + S * x;

        // Global displacement
        let ux = d.x[j] - x_original;

        let uy = d.y[j] - y_original;

        // Scale only displacement
        let x_deflected = x_original + ux * scale;

        let y_deflected = y_original + uy * scale;

        let [px,py] = toCanvas(x_deflected, y_deflected);

        if(j === 0){
            ctx.moveTo(px,py);
        }
        else{
            ctx.lineTo(px,py);
        }
    });

    ctx.strokeStyle = "red";
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore
}

//#endregion




// #region ======================================
// PAN DRAGGING
// =============================================
let isDragging = false;

let lastX = 0;
let lastY = 0;

window.addEventListener("load",()=>{

    let canvas =
        document.getElementById(
            "structureCanvas"
        );

    // -----------------------------
    // MOUSE DOWN
    // -----------------------------

    canvas.addEventListener(
        "mousedown",
        e=>{

            isDragging = true;

            lastX = e.clientX;
            lastY = e.clientY;
        }
    );

    // -----------------------------
    // MOUSE MOVE
    // -----------------------------

    window.addEventListener(
        "mousemove",
        e=>{

            if(!isDragging) return;

            let dx =
                e.clientX - lastX;

            let dy =
                e.clientY - lastY;

            window.viewOffsetX += dx;

            window.viewOffsetY += dy;

            lastX = e.clientX;
            lastY = e.clientY;

            drawStructure();
        }
    );

    // -----------------------------
    // MOUSE UP
    // -----------------------------

    window.addEventListener(
        "mouseup",
        ()=>{

            isDragging = false;
        }
    );

    // =================================================
    // SCROLL ZOOM
    // =================================================

    canvas.addEventListener(
        "wheel",
        e=>{

            e.preventDefault();

            let zoomFactor =
                e.deltaY < 0
                ? 1.1
                : 0.9;

            window.viewScale *= zoomFactor;

            // LIMITS
            window.viewScale =
                Math.max(
                    0.2,
                    Math.min(
                        window.viewScale,
                        10
                    )
                );

            drawStructure();
        }
    );
});

// #endregion   

function resetView(){

    window.viewScale = 1;

    window.viewOffsetX = 0;

    window.viewOffsetY = 0;

    drawStructure();
}



// #region  =============================================
// MENU TOGGLE
// =============================================

function toggleDiagramMenu(){

    let popup =document.getElementById("diagramMenuPopup");

    if(popup.style.display === "block"){
        popup.style.display = "none";}

    else{popup.style.display = "block";}
}

document.addEventListener("click", function(e){

    const popup = document.getElementById("diagramMenuPopup");
    const button = document.getElementById("diagramMenuBtn");

    if(!popup || !button) return;

    // If click is outside both the popup and the menu button
    if(
        !popup.contains(e.target) &&
        !button.contains(e.target)
    ){
        popup.style.display = "none";
    }

});

// =============================================
// UPDATE SCALE FROM INPUT
// =============================================

function updateDiagramScale(type){

    let input =document.getElementById(`${type}ScaleInput`);

    let value =parseFloat(input.value);

    if(isNaN(value) || value <= 0){
        return;
    }

    window.diagramScales[type] = value;

    drawStructure();
}

function setAutomaticDeflectionScale(){

    if(!window.analysisResults ||
       !window.analysisResults.deflection_shapes){
        return;
    }

    let nodes = getNodes();
    let nodeList = Object.values(nodes);

    if(nodeList.length === 0){
        return;
    }

    // Structure width
    let xs = nodeList.map(n => n[0]);
    let structureWidth =
        Math.max(...xs) - Math.min(...xs);

    if(structureWidth <= 0){
        return;
    }

    // Maximum actual deflection
    let maxDeflection = 0;

    window.analysisResults.deflection_shapes.forEach(d => {

        if(d.max_deflection !== undefined){
            maxDeflection = Math.max(
                maxDeflection,
                Math.abs(d.max_deflection)
            );
        }

        if(d.min_deflection !== undefined){
            maxDeflection = Math.max(
                maxDeflection,
                Math.abs(d.min_deflection)
            );
        }
    });

    if(maxDeflection <= 0){
        window.diagramScales.deflection = 1;
    }
    else{

        // Display maximum deflection ≈ 15% of structure width
        let targetDeflection =
            structureWidth * 0.15;

        window.diagramScales.deflection =
            targetDeflection / maxDeflection;
    }

    // Keep a reasonable range
    window.diagramScales.deflection =
        Math.max(
            0.01,
            Math.min(
                window.diagramScales.deflection,
                1000
            )
        );

    // Show calculated value in UI
    let input =
        document.getElementById("deflectionScaleInput");

    if(input){
        input.value =
            Number(
                window.diagramScales.deflection
            ).toFixed(2);
    }
}



// =============================================
// +/- BUTTONS
// =============================================
function changeDiagramScale(type,delta){

    let input = document.getElementById(`${type}ScaleInput`);

    let value =parseFloat(input.value);

    value += delta;

    if(value <= 0){
        value = 1;
    }

    input.value = value;

    window.diagramScales[type] = value;

    drawStructure();
}

// #endregion   

// #region =============================================
// TOGGLE VIEW OPTIONS
// =============================================

function toggleViewOptions(){

    window.viewOptions.loads =
        document.getElementById("showLoadsToggle").checked;

    window.viewOptions.supports =
        document.getElementById("showSupportsToggle").checked;

    window.viewOptions.labels =
        document.getElementById("showLabelsToggle").checked;

    drawStructure();
}
// #endregion

// #region =============================================
// RESET DIAGRAM SCALES
// =============================================

function resetDiagramScales(){

    window.diagramScales = {

        sfd : 8,

        bmd : 11,
    };

    document.getElementById("sfdScaleInput").value = 8;

    document.getElementById("bmdScaleInput").value = 11;

    setAutomaticDeflectionScale();

    drawStructure();
}

// #endregion