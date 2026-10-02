// ======================================
// REPORT SYSTEM
// ======================================

let currentReportSection = "nodes";

let reportSelections = {

    nodes: [],
    members: [],
    supports: [],
    loads: [],
    reactions: [],
    displacements: [],
    forces: [],
    afd: [],
    sfd: [],
    bmd: [],
    tmd: [],
    deflection: []
};

let memberReportSelections = [];

// #region Report Navigation Function

// =============================

function showReportSection(section,btn){

    saveCurrentReportSelections();

    currentReportSection = section;

    document
        .querySelectorAll(".report-nav-btn")
        .forEach(b=>{
            b.classList.remove(
                "active-report-tab"
            );
        });

    btn.classList.add(
        "active-report-tab"
    );

    populateReportSelection();
}

function populateReportSelection(){

    let container =
        document.getElementById(
            "reportSelectionContent"
        );

    let title =
        document.getElementById(
            "reportSelectionTitle"
        );

    container.innerHTML = "";

    title.innerText =
        currentReportSection
            .toUpperCase();

    let items = [];

    switch(currentReportSection){

        case "nodes":

            items =
                Object.keys(
                    getNodes()
                );

            break;

        case "members":

            items =
                getMembers()
                .map(m=>m.name);

            break;

        case "supports":

            items = [
                ...new Set(
                    getSupports().flatMap(
                        s => s.assignedNodes.map(
                            node => String(node)
                        )
                    )
                )
            ];

            break;

        case "loads":

            items =
                loadDatabase.map(
                    (_,i)=>
                    `Load ${i+1}`
                );

            break;

        case "reactions":

            if(window.analysisResults){

                items = [
                    ...new Set(
                        getSupports().flatMap(
                            s => s.assignedNodes.map(
                                node => `Node ${node}`
                            )
                        )
                    )
                ];

            }

            break;

        case "displacements":

            if(window.analysisResults){

                items = Object.keys(
                    getNodes()
                );
            }

            break;

        case "forces":

            if(window.analysisResults){

                items =
                    window.memberLabels;
            }

            break;

        case "sfd":

        case "bmd":

        case "tmd":

        case "deflection":

            if(window.analysisResults){

                items =
                    window.memberLabels;
            }

            break;
    }

    items.forEach(item=>{

        let checked =

            reportSelections[currentReportSection]
                .includes(item);

        container.innerHTML += `

            <label class="report-item">

                <input
                    type="checkbox"
                    ${checked ? "checked" : ""}
                    value="${item}"
                    onchange="saveCurrentReportSelections()">

                ${item}

            </label>

        `;
    });
}

function populateMemberSelectionPanel(){

    if(getReportStyle()=="tabular"){

        populateReportSelection();

        return;
    }

    document.getElementById(
        "reportSelectionTitle"
    ).innerText = "Members";

    let html="";

    if(memberReportSelections.length===0){
        memberReportSelections =
            getMembers().map(m=>String(m.name));
    }

    getMembers().forEach(member=>{

        const checked =
            memberReportSelections.includes(
                String(member.name)
            );

        html += `

        <label class="report-item">

            <input
                type="checkbox"
                value="${member.name}"
                ${checked?"checked":""}
                onchange="saveMemberSelection()">

            Member ${member.name}

        </label>

        `;

    });

    document.getElementById(
        "reportSelectionContent"
    ).innerHTML = html;

}

function toggleSelectAllReport(){

    const allSelected = areAllReportItemsSelected();

    if(allSelected){

        reportSelections = {

            nodes: [],
            members: [],
            supports: [],
            loads: [],
            reactions: [],
            displacements: [],
            forces: [],
            sfd: [],
            bmd: [],
            tmd: [],
            deflection: []

        };

    }else{

        reportSelections.nodes =
            Object.keys(getNodes());

        reportSelections.members =
            getMembers().map(m=>String(m.name));

        reportSelections.supports = [
            ...new Set(getSupports().flatMap(
                    s => s.assignedNodes.map(
                        node => String(node))))
            ];

        reportSelections.loads =
            loadDatabase.map((_,i)=>`Load ${i+1}`);

        if(window.analysisResults){

            reportSelections.reactions = [
                ...new Set(getSupports().flatMap(
                        s => s.assignedNodes.map(
                        node => `Node ${node}`)))
                ];

            reportSelections.displacements =
                Object.keys(getNodes());

            reportSelections.forces =
                window.memberLabels.map(String);

            reportSelections.sfd =
                window.memberLabels.map(String);

            reportSelections.bmd =
                window.memberLabels.map(String);

            reportSelections.tmd =
            window.memberLabels.map(String);

            reportSelections.deflection =
                window.memberLabels.map(String);
        }
    }

    populateReportSelection();

    updateGlobalSelectButton();
}

function updateGlobalSelectButton(){

    const checkbox = document.getElementById("reportSelectAll");

    if(!checkbox) return;

    checkbox.checked = areAllReportItemsSelected();
}

function updateMemberContentSelectAll(){

    const checks = document.querySelectorAll(
        "#memberSidebar input[type='checkbox']:not(#memberContentSelectAll)"
    );

    const allChecked =
        [...checks].every(chk => chk.checked);

    document.getElementById(
        "memberContentSelectAll"
    ).checked = allChecked;

}

function toggleCurrentSectionSelection(){

    let checks =
        document.querySelectorAll(
            "#reportSelectionContent input[type='checkbox']"
        );

    let allChecked =
        [...checks].every(c=>c.checked);

    checks.forEach(c=>{

        c.checked = !allChecked;

    });

    saveCurrentReportSelections();
}

function toggleReportMemberSelection(){

    const checks =
        document.querySelectorAll(
            "#reportSelectionContent input"
        );

    const all =
        [...checks].every(c=>c.checked);

    checks.forEach(c=>

        c.checked=!all

    );

    saveReportMemberSelection();

}

function toggleReportMemberContentSelection(){

    const master =
        document.getElementById(
            "memberContentSelectAll"
        ).checked;

    document.querySelectorAll(
        "#memberSidebar input[type='checkbox']"
    ).forEach(chk=>{

        if(chk.id!="memberContentSelectAll")
            chk.checked=master;

    });

    updateMemberContentSelectAll();

}

function areAllReportItemsSelected(){

    const supportNodes = [
        ...new Set(getSupports().flatMap(
                s => s.assignedNodes.map(
                node => String(node))))];

    const totals = {
        nodes: Object.keys(getNodes()).length,
        members: getMembers().length,
        supports: supportNodes.length,
        loads: loadDatabase.length,
        reactions: window.analysisResults ? supportNodes.length : 0,
        displacements: window.analysisResults ? Object.keys(getNodes()).length : 0,
        forces: window.analysisResults ? window.memberLabels.length : 0,
        sfd: window.analysisResults ? window.memberLabels.length : 0,
        bmd: window.analysisResults ? window.memberLabels.length : 0,
        tmd:window.analysisResults? window.memberLabels.length: 0,
        deflection: window.analysisResults ? window.memberLabels.length : 0
    };

    for(const section in totals){

        if(reportSelections[section].length !== totals[section]){
            return false;
        }
    }

    return true;
}

function saveCurrentReportSelections(){

    let checks =
        document.querySelectorAll(
            "#reportSelectionContent input[type='checkbox']"
        );

    reportSelections[currentReportSection] =
        [...checks]
        .filter(c => c.checked)
        .map(c => c.value);

    updateGlobalSelectButton();
}

function saveReportMemberSelection(){

    memberReportSelections = [

        ...document.querySelectorAll(
            "#reportSelectionContent input:checked"
        )

    ].map(x=>x.value);

}

function formatReportLoadValues(load){

    const category =
        String(load.category ?? "-").toLowerCase();

    const type =
        String(load.type ?? "-").toLowerCase();

    const coordinate =
        load.coordinate_system ??
        load.coordinateSystem ??
        "-";

    const fmt = value =>
        value === undefined ||
        value === null ||
        value === ""
            ? "-"
            : value;

    const forceText = `
        Fx = ${fmt(load.Fx)} kN<br>
        Fy = ${fmt(load.Fy)} kN<br>
        Fz = ${fmt(load.Fz)} kN
    `;

    const momentText = `
        Mx = ${fmt(load.Mx)} kN·m<br>
        My = ${fmt(load.My)} kN·m<br>
        Mz = ${fmt(load.Mz)} kN·m
    `;


    // ==========================================
    // NODAL LOAD
    // ==========================================

    if(category === "nodal"){

        return `
            <b>Applied Nodal Load</b><br><br>

            <b>Forces</b><br>
            ${forceText}<br>

            <b>Moments</b><br>
            ${momentText}
        `;
    }


    // ==========================================
    // POINT LOAD
    // ==========================================

    if(type === "point"){

        return `
            <b>Coordinate System:</b>
            ${coordinate}<br><br>

            <b>Forces</b><br>
            ${forceText}<br>

            <b>Moments</b><br>
            ${momentText}<br>

            <b>Position:</b>
            a = ${fmt(load.a)} m
            (from member start node)
        `;
    }


    // ==========================================
    // UDL
    // ==========================================

    if(type === "udl"){

        return `
            <b>Coordinate System:</b>
            ${coordinate}<br><br>

            <b>Distributed Load Intensity</b><br>

            wx = ${fmt(load.wx)} kN/m<br>
            wy = ${fmt(load.wy)} kN/m<br>
            wz = ${fmt(load.wz)} kN/m
        `;
    }


    // ==========================================
    // PARTIAL UDL
    // ==========================================

    if(type === "partial_udl"){

        return `
            <b>Coordinate System:</b>
            ${coordinate}<br><br>

            <b>Distributed Load Intensity</b><br>

            wx = ${fmt(load.wx)} kN/m<br>
            wy = ${fmt(load.wy)} kN/m<br>
            wz = ${fmt(load.wz)} kN/m<br><br>

            <b>Load Extent</b><br>

            Start position:
            a = ${fmt(load.a)} m<br>

            End position:
            b = ${fmt(load.b)} m
        `;
    }


    // ==========================================
    // TRAPEZOIDAL LOAD
    // ==========================================

    if(type === "trapezoidal"){

        return `
            <b>Coordinate System:</b>
            ${coordinate}<br><br>

            <b>Start Load Intensity</b><br>

            wx₁ = ${fmt(load.wx1)} kN/m<br>
            wy₁ = ${fmt(load.wy1)} kN/m<br>
            wz₁ = ${fmt(load.wz1)} kN/m<br><br>

            <b>End Load Intensity</b><br>

            wx₂ = ${fmt(load.wx2)} kN/m<br>
            wy₂ = ${fmt(load.wy2)} kN/m<br>
            wz₂ = ${fmt(load.wz2)} kN/m
        `;
    }


    return `
        <b>Coordinate System:</b>
        ${coordinate}<br>
        No additional load information available.
    `;
}

// #endregion

function getReportStyle(){

    return document.querySelector(

        "input[name='reportStyle']:checked"

    ).value;

}

function changeReportStyle(){

    const isMember =
        getReportStyle() === "member";

    document.getElementById("tabularSidebar").style.display =
        isMember ? "none" : "flex";

    document.getElementById("memberSidebar").style.display =
        isMember ? "flex" : "none";

    const title =
        document.getElementById("reportSelectionTitle");

    const button =
    document.getElementById("reportSelectionButton");

    if(isMember){

        title.innerText = "Members";

        button.setAttribute("onclick",
            "toggleReportMemberSelection()");

    }
    else{

        title.innerText =
            currentReportSection.toUpperCase();

        button.setAttribute("onclick",
            "toggleCurrentSectionSelection()");

    }

    if(isMember){
        populateMemberSelectionPanel();}
    else{
        populateReportSelection();}

}

// #region Report Preview Generation Function
// =============================

function generateReportPreview(){

    if(getReportStyle()=="tabular"){
        saveCurrentReportSelections();
        generateTabularReport();
    }
    else{
        saveReportMemberSelection();
        generateMemberWiseReport();
    }
}


function generateTabularReport(){

    let totalSelected = Object.values(
        reportSelections
    ).reduce(
        (sum,arr)=>sum+arr.length,
        0
    );

    if(totalSelected===0){

        document.getElementById("reportPreview").innerHTML = `
            <div class="report-preview-placeholder">

                <div class="placeholder-icon">📄</div>

                <h3>Report Preview</h3>

                <p>
                    Select the desired report contents from the left panel and 
                    click <strong>Generate Preview</strong> to view the report.
                </p>

            </div>
        `;

        return;
    }

    saveCurrentReportSelections();

    let html = `

        <div class="report-preview">

            <h1>
                Structural Analysis Report
            </h1>

            <hr>

    `;

    // =====================================
    // NODES
    // =====================================

    if(reportSelections.nodes.length){

        html += `

        <div class="report-section">
            <h2>Nodes</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>X</th>
                    <th>Y</th>
                    <th>Z</th>
                </tr>
                </thead>
                <tbody>
        `;

        let nodes = getNodes();

        Object.entries(nodes).forEach(([id,coord])=>{

            if(
                !reportSelections.nodes.includes(id)
            ){
                return;
            }

            html += `
                <tr>
                    <td>${id}</td>
                    <td>${Number(coord[0]).toFixed(3)}</td>
                    <td>${Number(coord[1]).toFixed(3)}</td>
                    <td>${Number(coord[2]).toFixed(3)}</td>
                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    // =====================================
    // MEMBERS
    // =====================================

    if(reportSelections.members.length){

        html += `
        <div class="report-section">
            <h2>Members</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Start</th>
                    <th>End</th>
                    <th>β (°)</th>
                </tr>
                </thead>
                <tbody>
        `;

        getMembers().forEach(member=>{

            if(
                !reportSelections.members.includes(
                    String(member.name)
                )
            ){
                return;
            }

            html += `
                <tr>
                    <td>${member.name}</td>
                    <td>${member.start}</td>
                    <td>${member.end}</td>
                    <td>${Number(member.beta || 0).toFixed(3)}</td>
                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    // =====================================
    // SUPPORTS
    // =====================================

    if(reportSelections.supports.length){

        html += `
        <div class="report-section">
            <h2>Supports</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>Node</th>
                    <th>Ux</th>
                    <th>Uy</th>
                    <th>Uz</th>
                    <th>Rx</th>
                    <th>Ry</th>
                    <th>Rz</th>
                </tr>
                </thead>
                <tbody>
        `;

        getSupports().forEach(s => {

            s.assignedNodes.forEach(node => {
                node = String(node);

                if(
                    !reportSelections.supports.includes(node)
                ){
                    return;
                }

                html += `
                    <tr>
                        <td>${node}</td>

                        <td>${s.ux ? "Restrained" : ""}</td>
                        <td>${s.uy ? "Restrained" : ""}</td>
                        <td>${s.uz ? "Restrained" : ""}</td>

                        <td>${s.rx ? "Restrained" : ""}</td>
                        <td>${s.ry ? "Restrained" : ""}</td>
                        <td>${s.rz ? "Restrained" : ""}</td>

                    </tr>
                `;

            });

        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }
    
    // =====================================
    // LOADS
    // =====================================

    if(reportSelections.loads.length){

        html += `

        <div class="report-section">

            <h2>Loads</h2>

            <table class="report-table load-report-table">

                <thead>

                    <tr>

                        <th>No.</th>

                        <th>Category</th>

                        <th>Type</th>

                        <th>Load Information</th>

                        <th>Assignment</th>

                    </tr>

                </thead>

                <tbody>

        `;


        loadDatabase.forEach((load,i)=>{

            const label = `Load ${i+1}`;


            if(
                !reportSelections.loads.includes(label)
            ){
                return;
            }


            const category =
                load.category === "nodal"
                    ? "Nodal"
                    : "Member";


            const type =
                String(load.type ?? "-")
                    .replaceAll("_"," ")
                    .toUpperCase();


            const assignment =
                load.category === "nodal"

                    ?

                    `Nodes:
                    ${(load.assignedNodes ?? []).join(", ") || "-"}`

                    :

                    `Members:
                    ${(load.assignedMembers ?? []).join(", ") || "-"}`;


            html += `

                <tr>

                    <td>
                        ${i + 1}
                    </td>


                    <td>
                        ${category}
                    </td>


                    <td>
                        ${type}
                    </td>


                    <td class="load-details-cell">

                        ${formatReportLoadValues(load)}

                    </td>


                    <td>

                        ${assignment}

                    </td>

                </tr>

            `;

        });


        html += `

                </tbody>

            </table>

        </div>

        `;
    }

    // =====================================
    // REACTIONS
    // =====================================

    if(
        window.analysisResults &&
        reportSelections.reactions.length
    ){

        html += `
        <div class="report-section">
            <h2>Reactions</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>Node</th>

                    <th>Fx</th>
                    <th>Fy</th>
                    <th>Fz</th>

                    <th>Mx</th>
                    <th>My</th>
                    <th>Mz</th>
                </tr>
                </thead>
                <tbody>
        `;

        let R = window.analysisResults.reactions;

        for(let i=0;i<R.length/3;i++){

            let nodeName = String(window.nodeLabels[i]);

            if(
                !reportSelections.reactions.includes(
                    "Node " + nodeName
                )
            ){
                continue;
            }

            html += `
                <tr>

                    <td>${nodeName}</td>

                    <td>${Number(R[6*i]).toFixed(3)}</td>
                    <td>${Number(R[6*i+1]).toFixed(3)}</td>
                    <td>${Number(R[6*i+2]).toFixed(3)}</td>

                    <td>${Number(R[6*i+3]).toFixed(3)}</td>
                    <td>${Number(R[6*i+4]).toFixed(3)}</td>
                    <td>${Number(R[6*i+5]).toFixed(3)}</td>

                </tr>
            `;

        }

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }
 
    // =====================================
    // DISPLACEMENTS
    // =====================================
    if(
        window.analysisResults &&
        reportSelections.displacements.length
    ){

        html += `
        <div class="report-section">
            <h2>Displacements</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>Node</th>

                    <th>Ux</th>
                    <th>Uy</th>
                    <th>Uz</th>

                    <th>Rx</th>
                    <th>Ry</th>
                    <th>Rz</th>
                </tr>
                </thead>
                <tbody>
        `;

        let D =
            window.analysisResults.displacements;

        for(let i=0;i<D.length/3;i++){

            let nodeName =
                String(
                    window.nodeLabels[i]
                );

            if(
                !reportSelections.displacements
                .includes(nodeName)
            ){
                continue;
            }

            html += `
                <tr>

                    <td>${nodeName}</td>

                    <td>${Number(D[6*i]).toExponential(4)}</td>
                    <td>${Number(D[6*i+1]).toExponential(4)}</td>
                    <td>${Number(D[6*i+2]).toExponential(4)}</td>

                    <td>${Number(D[6*i+3]).toExponential(4)}</td>
                    <td>${Number(D[6*i+4]).toExponential(4)}</td>
                    <td>${Number(D[6*i+5]).toExponential(4)}</td>

                </tr>
            `;
        }

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }


    // =====================================
    // MEMBER FORCES
    // =====================================
    if(
        window.analysisResults &&
        reportSelections.forces.length
    ){

        html += `
        <div class="report-section">
            <h2>Member Forces</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th>Member</th>

                    <th>Fx</th>
                    <th>Fy</th>
                    <th>Fz</th>

                    <th>Mx</th>
                    <th>My</th>
                    <th>Mz</th>
                </thead>
                <tbody>
        `;

        window.analysisResults.member_forces.forEach((m,i)=>{

            let memberName =
                String(window.memberLabels[i]);

            if(
                !reportSelections.forces.includes(
                    memberName
                )
            ){
                return;
            }

            html += `
                <tr>

                    <td>${memberName}</td>

                    <td>${Number(m[0]).toFixed(3)}</td>
                    <td>${Number(m[1]).toFixed(3)}</td>
                    <td>${Number(m[2]).toFixed(3)}</td>

                    <td>${Number(m[3]).toFixed(3)}</td>
                    <td>${Number(m[4]).toFixed(3)}</td>
                    <td>${Number(m[5]).toFixed(3)}</td>

                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    // =====================================
    // SFD
    // =====================================

    if(
        window.analysisResults &&
        reportSelections.sfd.length
    ){

        html += `
        <div class="report-section">
            <h2>Shear Force Summary</h2>

            <table class="report-table">
                <thead>

                <tr>
                    <th rowspan="2">Member</th>

                    <th colspan="4">Local Y</th>
                    <th colspan="4">Local Z</th>
                </tr>

                <tr>
                    <th>Max V</th>
                    <th>x @ Max V</th>
                    <th>Min V</th>
                    <th>x @ Min V</th>

                    <th>Max V</th>
                    <th>x @ Max V</th>
                    <th>Min V</th>
                    <th>x @ Min V</th>
                </tr>
                </thead>
                <tbody>

        `;

        window.analysisResults.sfd.forEach(d=>{

            if(
                !reportSelections.sfd.includes(
                    String(d.member)
                )
            ){
                return;
            }

            html += `
                <tr>

                    <td>${d.member}</td>

                    <td>${Number(d.max_V.y).toFixed(3)}</td>
                    <td>${Number(d.x_max_V.y).toFixed(3)}</td>
                    <td>${Number(d.min_V.y).toFixed(3)}</td>
                    <td>${Number(d.x_min_V.y).toFixed(3)}</td>

                    <td>${Number(d.max_V.z).toFixed(3)}</td>
                    <td>${Number(d.x_max_V.z).toFixed(3)}</td>
                    <td>${Number(d.min_V.z).toFixed(3)}</td>
                    <td>${Number(d.x_min_V.z).toFixed(3)}</td>

                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    // =====================================
    // BMD
    // =====================================

    if(
        window.analysisResults &&
        reportSelections.bmd.length
    ){

        html += `
        <div class="report-section">
            <h2>Bending Moment Summary</h2>

            <table class="report-table">
                <thead>

                <tr>
                    <th rowspan="2">Member</th>

                    <th colspan="4">Local Y</th>
                    <th colspan="4">Local Z</th>
                </tr>

                <tr>
                    <th>Max M</th>
                    <th>x @ Max M</th>
                    <th>Min M</th>
                    <th>x @ Min M</th>

                    <th>Max M</th>
                    <th>x @ Max M</th>
                    <th>Min M</th>
                    <th>x @ Min M</th>
                </tr>
                </thead>
                <tbody>
        `;

        window.analysisResults.bmd.forEach(d=>{

            if(
                !reportSelections.bmd.includes(
                    String(d.member)
                )
            ){
                return;
            }

            html += `
                <tr>

                    <td>${d.member}</td>

                    <td>${Number(d.max_M.y).toFixed(3)}</td>
                    <td>${Number(d.x_max_M.y).toFixed(3)}</td>
                    <td>${Number(d.min_M.y).toFixed(3)}</td>
                    <td>${Number(d.x_min_M.y).toFixed(3)}</td>

                    <td>${Number(d.max_M.z).toFixed(3)}</td>
                    <td>${Number(d.x_max_M.z).toFixed(3)}</td>
                    <td>${Number(d.min_M.z).toFixed(3)}</td>
                    <td>${Number(d.x_min_M.z).toFixed(3)}</td>

                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    // =====================================
    // TMD
    // =====================================

    if(
        window.analysisResults &&
        reportSelections.tmd.length
    ){

        html += `

        <div class="report-section">

            <h2>Torsional Moment Summary</h2>

            <table class="report-table">

                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Max T</th>
                        <th>x @ Max</th>
                        <th>Min T</th>
                        <th>x @ Min</th>
                    </tr>
                </thead>

                <tbody>
        `;

        window.analysisResults.tmd
            .forEach(d => {

                if(
                    !reportSelections.tmd
                        .includes(String(d.member))
                ){
                    return;
                }

                html += `
                    <tr>

                        <td>${d.member}</td>

                        <td>${Number(d.max_T).toFixed(3)}</td>

                        <td>${Number(d.x_max_T).toFixed(3)}</td>

                        <td>${Number(d.min_T).toFixed(3)}</td>

                        <td>${Number(d.x_min_T).toFixed(3)}</td>

                    </tr>
                `;
            });

        html += `
                </tbody>
            </table>

        </div>
        `;
    }

    // =====================================
    // DEFLECTION
    // =====================================

    if(
        window.analysisResults &&
        reportSelections.deflection.length
    ){

        html += `
        <div class="report-section">
            <h2>Deflection Summary</h2>

            <table class="report-table">
                <thead>
                <tr>
                    <th rowspan="2">Member</th>

                    <th colspan="4">Local Y</th>
                    <th colspan="4">Local Z</th>
                </tr>

                <tr>
                    <th>Max</th>
                    <th>x @ Max</th>
                    <th>Min</th>
                    <th>x @ Min</th>

                    <th>Max</th>
                    <th>x @ Max</th>
                    <th>Min</th>
                    <th>x @ Min</th>
                </tr>
                </thead>
                <tbody>
        `;

        window.analysisResults.deflection_shapes.forEach(d=>{

            if(
                !reportSelections.deflection.includes(
                    String(d.member)
                )
            ){
                return;
            }

            html += `
                <tr>

                    <td>${d.member}</td>
                    <td>${d.max_deflection.y.toExponential(3)}</td>
                    <td>${d.x_max_deflection.y.toFixed(3)}</td>
                    <td>${d.min_deflection.y.toExponential(3)}</td>
                    <td>${d.x_min_deflection.y.toFixed(3)}</td>

                    <td>${d.max_deflection.z.toExponential(3)}</td>
                    <td>${d.x_max_deflection.z.toFixed(3)}</td>
                    <td>${d.min_deflection.z.toExponential(3)}</td>
                    <td>${d.x_min_deflection.z.toFixed(3)}</td>

                </tr>
            `;
        });

        html += `              
                </tbody>
            </table>
        </div>
        `;
    }

    html += `
        </div>
    `;

    document.getElementById(
        "reportPreview"
    ).innerHTML = html;
}



let memberWiseReportSelections = {

    geometry:true,

    loads:true,

    endForces:true,

    maximumValues:true,

    sfd:true,

    bmd:true,

    deflection:true,

    members:[]
};


function generateMemberWiseReport(){

    if(!window.analysisResults){

        document.getElementById(
            "reportPreview"
        ).innerHTML = `
            <div class="report-preview-placeholder">

                <div class="placeholder-icon">📄</div>

                <h3>Report Preview</h3>

                <p>
                    Select the desired report contents from the left panel and 
                    click <strong>Generate Preview</strong> to view the report.
                </p>

            </div>
        `;

        return;
    }

    saveReportMemberSelection();

    if(memberReportSelections.length==0){

        document.getElementById(
            "reportPreview"
        ).innerHTML=`
            <div class="report-preview-placeholder">

                <div class="placeholder-icon">📄</div>

                <h3>No Member Selected</h3>

            </div>
        `;

        return;

    }

    let html = `

    <div class="report-preview">

        <h1>
            Member-wise Structural Analysis Report
        </h1>

        <hr>

    `;

    getMembers().forEach(member=>{

        if(
            !memberReportSelections.includes(
                String(member.name)
            )
        ) return;

        html+=buildMemberPage(member);

    });

    html+="</div>";

    document.getElementById(
        "reportPreview"
    ).innerHTML=html;

}

// #region Member-wise Report Generation Function

function buildMemberPage(member){

    let html = `

    <div class="member-report">

        <h1>
            Member ${member.name}
        </h1>

        ${
        document.getElementById("chkGeometry").checked
        ? buildMemberGeometry(member)
        : ""
        }

        ${
        document.getElementById("chkLoads").checked
        ? buildMemberLoads(member)
        : ""
        }

        ${
        document.getElementById("chkForces").checked
        ? buildMemberForces(member)
        : ""
        }

        ${
        document.getElementById("chkMaximum").checked
        ? buildMemberMaximumValues(member)
        : ""
        }
        

    </div>

    `;

    return html;

}

function buildMemberGeometry(member){

    const nodes = getNodes();

    const start =
        nodes[member.start];

    const end =
        nodes[member.end];

    return `

    <h2>Geometry</h2>

    <table class="report-table">

        <tr>
            <td>Start Node</td>
            <td>${member.start}</td>
        </tr>

        <tr>
            <td>End Node</td>
            <td>${member.end}</td>
        </tr>

        <tr>
            <td>Start Coordinates</td>
            <td>
                (${start?.[0] ?? "-"},
                 ${start?.[1] ?? "-"},
                 ${start?.[2] ?? "-"})
            </td>
        </tr>

        <tr>
            <td>End Coordinates</td>
            <td>
                (${end?.[0] ?? "-"},
                 ${end?.[1] ?? "-"},
                 ${end?.[2] ?? "-"})
            </td>
        </tr>

        <tr>
            <td>Young's Modulus, E</td>
            <td>${member.E}</td>
        </tr>

        <tr>
            <td>Shear Modulus, G</td>
            <td>${member.G}</td>
        </tr>

        <tr>
            <td>Area, A</td>
            <td>${member.A}</td>
        </tr>

        <tr>
            <td>Iyy</td>
            <td>${member.Iyy}</td>
        </tr>

        <tr>
            <td>Izz</td>
            <td>${member.Izz}</td>
        </tr>

        <tr>
            <td>Torsional Constant, J</td>
            <td>${member.J}</td>
        </tr>

        <tr>
            <td>Beta Angle, β</td>
            <td>${member.beta ?? 0}°</td>
        </tr>

    </table>

    `;

}

function buildMemberLoads(member){

    let html = `

    <h2>Applied Loads</h2>

    <table class="report-table load-report-table">

        <thead>

            <tr>

                <th>No.</th>

                <th>Type</th>

                <th>Coordinate System</th>

                <th>Load Information</th>

                <th>Assignment</th>

            </tr>

        </thead>

        <tbody>

    `;


    let found = false;


    loadDatabase.forEach((load,index)=>{


        // Only member loads
        if(
            load.category !== "member"
        ){
            return;
        }


        // Check whether this load is assigned
        // to the current member

        if(
            !(load.assignedMembers ?? [])
                .map(String)
                .includes(String(member.name))
        ){
            return;
        }


        found = true;


        const type =
            String(load.type ?? "-")
                .replaceAll("_"," ")
                .toUpperCase();


        const coordinate =
            load.coordinate_system ??
            load.coordinateSystem ??
            "-";


        const assignment =
            `Members:
            ${(load.assignedMembers ?? []).join(", ") || "-"}`;


        html += `

        <tr>

            <td>
                ${index + 1}
            </td>


            <td>
                ${type}
            </td>


            <td>
                ${coordinate}
            </td>


            <td class="load-details-cell">

                ${formatReportLoadValues(load)}

            </td>


            <td>

                ${assignment}

            </td>

        </tr>

        `;

    });


    // No load assigned to this member

    if(!found){

        html += `

        <tr>

            <td colspan="5">

                No member loads are assigned
                to Member ${member.name}.

            </td>

        </tr>

        `;

    }


    html += `

        </tbody>

    </table>

    `;


    return html;

}

function buildMemberForces(member){

    let index =
        window.memberLabels.indexOf(
            String(member.name)
        );

    if(index==-1)
        return "";

    let F =
        window.analysisResults.member_forces[index];

    return `

    <h2>End Forces</h2>

    <table class="report-table">

        <tr>

            <th>Fx</th>
            <th>Fy</th>
            <th>Fz</th>
            <th>Mx</th>
            <th>My</th>
            <th>Mz</th>

        </tr>

        <tr>

            <td>${Number(F[0]).toFixed(3)}</td>
            <td>${Number(F[1]).toFixed(3)}</td>
            <td>${Number(F[2]).toFixed(3)}</td>
            <td>${Number(F[3]).toFixed(3)}</td>
            <td>${Number(F[4]).toFixed(3)}</td>
            <td>${Number(F[5]).toFixed(3)}</td>

        </tr>

    </table>

    `;

}

function buildMemberMaximumValues(member){

    let sfd =
        window.analysisResults.sfd.find(

            x=>String(x.member)==String(member.name)

        );

    let bmd =
        window.analysisResults.bmd.find(

            x=>String(x.member)==String(member.name)

        );

    const tmd =
        window.analysisResults.tmd.find(
            x =>
                String(x.member) ===
                String(member.name)
        );

    let def =
        window.analysisResults.deflection_shapes.find(

            x=>String(x.member)==String(member.name)

        );

    return `

    <h2>Maximum Values</h2>

    <table class="report-table">

        <tr>

            <th>Property</th>

            <th>Maximum</th>
            <th>x @ Maximum</th>
            <th>Minimum</th>
            <th>x @ Minimum</th>

        </tr>

        <tr>

            <td>Vy</td>

            <td>${Number(sfd.max_V.y).toFixed(3)}</td>
            <td>${Number(sfd.x_max_V.y).toFixed(3)}</td>

            <td>${Number(sfd.min_V.y).toFixed(3)}</td>
            <td>${Number(sfd.x_min_V.y).toFixed(3)}</td>

        </tr>

        <tr>

            <td>Vz</td>

            <td>${Number(sfd.max_V.z).toFixed(3)}</td>
            <td>${Number(sfd.x_max_V.z).toFixed(3)}</td>

            <td>${Number(sfd.min_V.z).toFixed(3)}</td>
            <td>${Number(sfd.x_min_V.z).toFixed(3)}</td>

        </tr>

        <tr>

            <td>My</td>

            <td>${Number(bmd.max_M.y).toFixed(3)}</td>
            <td>${Number(bmd.x_max_M.y).toFixed(3)}</td>

            <td>${Number(bmd.min_M.y).toFixed(3)}</td>
            <td>${Number(bmd.x_min_M.y).toFixed(3)}</td>

        </tr>

        <tr>

            <td>Mz</td>

            <td>${Number(bmd.max_M.z).toFixed(3)}</td>
            <td>${Number(bmd.x_max_M.z).toFixed(3)}</td>

            <td>${Number(bmd.min_M.z).toFixed(3)}</td>
            <td>${Number(bmd.x_min_M.z).toFixed(3)}</td>

        </tr>

        <tr>

            <td>T</td>

            <td>${Number(tmd.max_T).toFixed(3)}</td>
            <td>${Number(tmd.x_max_T).toFixed(3)}</td>

            <td>${Number(tmd.min_T).toFixed(3)}</td>
            <td>${Number(tmd.x_min_T).toFixed(3)}</td>

        </tr>

        <tr>
            <td>Deflection y</td>

            <td>${def.max_deflection.y.toExponential(3)}</td>
            <td>${def.x_max_deflection.y.toExponential(3)}</td>
            <td>${def.min_deflection.y.toExponential(3)}</td>
            <td>${def.x_min_deflection.y.toExponential(3)}</td>
        </tr>

        <tr>
            <td>Deflection z</td>

            <td>${def.max_deflection.z.toExponential(3)}</td>
            <td>${def.x_max_deflection.z.toExponential(3)}</td>
            <td>${def.min_deflection.z.toExponential(3)}</td>
            <td>${def.x_min_deflection.z.toExponential(3)}</td>
        </tr>

    </table>

    `;

}

function buildMemberSFD(member){

    const index =
        window.memberLabels.indexOf(
            String(member.name)
        );

    if(index==-1)
        return "";

    const canvas =
        createReportCanvas();

    const ctx =
        canvas.getContext("2d");

    drawReportMemberAxis(
        ctx,
        getReportToCanvas(member),
        getNodes(),
        member
    );

    drawMemberSFD(
        ctx,
        getReportToCanvas(member),
        getNodes(),
        member,
        window.analysisResults.sfd[index]
    );

    return `

    <h2>Shear Force Diagram</h2>

    <img
        src="${canvas.toDataURL()}">

    `;

}

function buildMemberBMD(member){

    const index =
        window.memberLabels.indexOf(
            String(member.name)
        );

    if(index==-1)
        return "";

    const canvas =
        createReportCanvas();

    const ctx =
        canvas.getContext("2d");

    drawReportMemberAxis(
        ctx,
        getReportToCanvas(member),
        getNodes(),
        member
    );

    drawMemberBMD(
        ctx,
        getReportToCanvas(member),
        getNodes(),
        member,
        window.analysisResults.bmd[index]

    );

    return `

    <h2>Bending Moment Diagram</h2>

    <img
        src="${canvas.toDataURL()}">

    `;

}

function buildMemberDeflection(member){

    const index =
        window.memberLabels.indexOf(
            String(member.name)
        );

    if(index==-1)
        return "";

    const canvas =
        createReportCanvas();

    const ctx =
        canvas.getContext("2d");

    drawReportMemberAxis(
        ctx,
        getReportToCanvas(member),
        getNodes(),
        member
    );

    drawReportMemberDeflection(
        ctx,
        window.analysisResults.deflection_shapes[index]
    );

    return `

    <h2>Deflected Shape</h2>

    <img
        src="${canvas.toDataURL()}">

    `;

}

function drawReportMemberDeflection(ctx, d){

    const margin = 60;

    const x1 = margin;
    const x2 = 700 - margin;

    const yAxis = 110;

    const reportWidth = x2 - x1;

    const positions = d.position;

    const localY = d.local_y;

    if(!positions || !localY || positions.length === 0
    ){
        return;
    }

    // MEMBER LENGTH
    const L = positions[positions.length - 1];

    if(L <= 0)
        return;

    // AUTOMATIC REPORT SCALE

    const maxDeflection =
        Math.max(
            ...localY.map(v => Math.abs(v))
        );

    const targetAmplitude = 55;

    const scale = maxDeflection > 0 ? targetAmplitude / maxDeflection : 1;

    // MEMBER AXIS
    ctx.save();

    ctx.beginPath();

    ctx.moveTo( x1, yAxis);

    ctx.lineTo( x2, yAxis);

    ctx.strokeStyle = "#777";

    ctx.lineWidth = 1;

    ctx.stroke();

    // DEFLECTED CURVE
    ctx.beginPath();

    positions.forEach((x,i)=>{

        const px = x1 + (x / L) * reportWidth;

        const py = yAxis - localY[i] * scale;

        if(i === 0){
            ctx.moveTo(px, py);
        }
        else{
            ctx.lineTo(px,py);
        }
    });


    ctx.strokeStyle = "red";

    ctx.lineWidth = 2.5;

    ctx.stroke();

    // END NODES
    ctx.fillStyle = "#e74c3c";

    ctx.beginPath();

    ctx.arc(x1, yAxis, 4, 0, 2*Math.PI);

    ctx.fill();

    ctx.beginPath();

    ctx.arc(x2, yAxis, 4, 0, 2*Math.PI);

    ctx.fill();

    ctx.restore();
}


function createReportCanvas(){

    const canvas = document.createElement("canvas");
    canvas.width = 700;
    canvas.height = 220;
    return canvas;

}

function getReportToCanvas(member){

    const nodes = getNodes();

    const n1 = nodes[member.start];

    const n2 = nodes[member.end];

    const margin = 60;

    const width = 700 - 2*margin;

    const x1 = margin;

    const x2 = margin + width;

    const y = 110;

    return function(x0,y0){

        if(x0==n1[0] && y0==n1[1])
            return [x1,y];

        if(x0==n2[0] && y0==n2[1])
            return [x2,y];

        return [x1,y];

    };

}

// #endregion

// #endregion



function exportReportPDF(){

    saveCurrentReportSelections();

    generateReportPreview();

    const element = document.getElementById("reportPreview");

    const opt = {
        margin: 10,
        filename: "Structural_Analysis_Report.pdf",
        image: {
            type: "jpeg",
            quality: 1
        },
        html2canvas: {
            scale: 2,
            useCORS: true,
            scrollY: 0
        },
        jsPDF: {
            unit: "mm",
            format: "a4",
            orientation: "portrait"
        },
        pagebreak: {
            mode: ["css", "legacy"]
        }
    };

    html2pdf().set(opt).from(element).save();
}