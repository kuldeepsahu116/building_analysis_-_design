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
    sfd: [],
    bmd: [],
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
                    <td>${coord[0]}</td>
                    <td>${coord[1]}</td>
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
                    <th>Rz</th>
                    <th>Ux Value</th>
                    <th>Uy Value</th>
                    <th>Rz Value</th>
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
                        <td>${s.ux ? "restrained" : ""}</td>
                        <td>${s.uy ? "restrained" : ""}</td>
                        <td>${s.rz ? "restrained" : ""}</td>
                        <td>${s.type === "support_deflection" ? s.uxValue : ""}</td>
                        <td>${s.type === "support_deflection" ? s.uyValue : ""}</td>
                        <td>${s.type === "support_deflection" ? s.rzValue : ""}</td>
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

            <table class="report-table">
                <thead>
                <tr>
                    <th>No.</th>
                    <th>Category</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Assignment</th>
                </tr>
                </thead>
                <tbody>
        `;

        loadDatabase.forEach((load,i)=>{

            let label = `Load ${i+1}`;

            if(
                !reportSelections.loads.includes(label)
            ){
                return;
            }

            let assignment =
                load.category==="nodal"
                ?
                load.assignedNodes.join(", ")
                :
                load.assignedMembers.join(", ");

            html += `
                <tr>

                    <td>${i+1}</td>

                    <td>${load.category}</td>

                    <td>${load.type}</td>

                    <td>

                        ${load.direction || ""}

                        ${load.value1}

                        ${load.value2 ? " → "+load.value2 : ""}

                    </td>

                    <td>${assignment}</td>

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

            let fx = R[3*i];
            let fy = R[3*i+1];
            let mz = R[3*i+2];

            html += `
                <tr>

                    <td>${nodeName}</td>

                    <td>${fx.toFixed(3)}</td>

                    <td>${fy.toFixed(3)}</td>

                    <td>${mz.toFixed(3)}</td>

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
                    <th>u</th>
                    <th>v</th>
                    <th>θ</th>
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

                    <td>${D[3*i].toFixed(5)}</td>

                    <td>${D[3*i+1].toFixed(5)}</td>

                    <td>${D[3*i+2].toFixed(5)}</td>

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
                    <th>Mz</th>
                </tr>
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

                    <td>${m[0].toFixed(3)}</td>

                    <td>${m[1].toFixed(3)}</td>

                    <td>${m[2].toFixed(3)}</td>

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
                    <th>Member</th>
                    <th>Max Shear</th>
                    <th>x @ Max</th>
                    <th>Min Shear</th>
                    <th>x @ Min</th>
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

                    <td>${d.max_V.toFixed(3)}</td>

                    <td>${d.x_max_V.toFixed(3)}</td>

                    <td>${d.min_V.toFixed(3)}</td>

                    <td>${d.x_min_V.toFixed(3)}</td>

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
                    <th>Member</th>
                    <th>Max Moment</th>
                    <th>x @ Max</th>
                    <th>Min Moment</th>
                    <th>x @ Min</th>
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

                    <td>${d.max_M.toFixed(3)}</td>

                    <td>${d.x_max_M.toFixed(3)}</td>

                    <td>${d.min_M.toFixed(3)}</td>

                    <td>${d.x_min_M.toFixed(3)}</td>

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
                    <th>Member</th>
                    <th>Max Deflection</th>
                    <th>x @ Max</th>
                    <th>Min Deflection</th>
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

                    <td>${d.max_deflection.toExponential(3)}</td>

                    <td>${d.x_max_deflection.toFixed(3)}</td>

                    <td>${d.min_deflection.toExponential(3)}</td>

                    <td>${d.x_min_deflection.toFixed(3)}</td>

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

        ${
        document.getElementById("chkSFD").checked
        ? buildMemberSFD(member)
        : ""
        }

        ${
        document.getElementById("chkBMD").checked
        ? buildMemberBMD(member)
        : ""
        }

        ${
        document.getElementById("chkDeflection").checked
        ? buildMemberDeflection(member)
        : ""
        }

    </div>

    `;

    return html;

}

function buildMemberGeometry(member){

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

            <td>Young's Modulus</td>

            <td>${member.E}</td>

        </tr>

        <tr>

            <td>Area</td>

            <td>${member.A}</td>

        </tr>

        <tr>

            <td>Moment of Inertia</td>

            <td>${member.I}</td>

        </tr>

    </table>

    `;

}

function buildMemberLoads(member){

    let html = `

    <h2>Applied Loads</h2>

    <table class="report-table">

        <tr>

            <th>Type</th>

            <th>Magnitude</th>

            <th>Direction</th>

        </tr>

    `;

    loadDatabase.forEach(load=>{

        if(

            load.category!="member"

        ) return;

        if(

            !load.assignedMembers.includes(

                String(member.name)

            )

        ) return;

        html += `

        <tr>

            <td>${load.type}</td>

            <td>${load.value1}</td>

            <td>${load.direction||"-"}</td>

        </tr>

        `;

    });

    html += "</table>";

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

            <th>Mz</th>

        </tr>

        <tr>

            <td>${F[0].toFixed(3)}</td>

            <td>${F[1].toFixed(3)}</td>

            <td>${F[2].toFixed(3)}</td>

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

            <th>Minimum</th>

        </tr>

        <tr>

            <td>Shear</td>

            <td>${sfd.max_V.toFixed(3)}</td>

            <td>${sfd.min_V.toFixed(3)}</td>

        </tr>

        <tr>

            <td>Moment</td>

            <td>${bmd.max_M.toFixed(3)}</td>

            <td>${bmd.min_M.toFixed(3)}</td>

        </tr>

        <tr>

            <td>Deflection</td>

            <td>${def.max_deflection.toExponential(3)}</td>

            <td>${def.min_deflection.toExponential(3)}</td>

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