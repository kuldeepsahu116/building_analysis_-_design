// #region =====================================================
// ANALYZE FRAME
// =====================================================

let lastAnalyzedInput = null;

function analyzeFrame(){

    console.log("Analyzing...");

    // UI RESET

    document.getElementById(
        "resultPlaceholder"
    ).style.display = "none";

    document.querySelector(
        ".results-layout"
    ).style.display = "none";

    document.getElementById(
        "loading"
    ).style.display = "block";


    // CREATE ANALYSIS DATA

    let data = {

        nodes: getNodes(),

        members: getMembers(),

        supports: getSupports(),

        loads: getLoads()

    };

    let currentInputSnapshot = JSON.stringify(data);


    // SEND TO FLASK

    fetch("/analyze", {

        method : "POST",

        headers : {"Content-Type":"application/json"},

        body : JSON.stringify(data)
    })

    // RESPONSE
 
    .then(res => res.json())

    .then(data => {

        console.log("Response:", data);

        // HIDE LOADING
        document.getElementById("loading").style.display = "none";

        // ERROR

        if(data.error){

            console.error(
                "ANALYSIS ERROR:",
                data.error
            );

            window.analysisResults = null;

            document.getElementById(
                "loading"
            ).style.display = "none";

            document.querySelector(
                ".results-layout"
            ).style.display = "none";

            const placeholder =
                document.getElementById(
                    "resultPlaceholder"
                );

            placeholder.style.display = "block";

            placeholder.innerHTML = `
                <div style="
                    text-align:center;
                    padding:25px;
                ">

                    <div style="
                        font-size:18px;
                        font-weight:600;
                        color:#c0392b;
                        margin-bottom:12px;
                    ">
                        Analysis Error
                    </div>

                    <div style="
                        font-size:14px;
                        color:#c0392b;
                    ">
                        ${data.error}
                    </div>

                </div>
            `;

            return;
        }


        // SUCCESSFUL ANALYSIS

        document.getElementById(
            "resultPlaceholder"
        ).style.display = "none";

        document.querySelector(
            ".results-layout"
        ).style.display = "flex";



        window.nodeLabels = data.node_labels;

        window.memberLabels = data.member_labels;

        window.analysisResults = data;

        setAutomaticDiagramScales();

        // window.currentDiagram = "structure";

        lastAnalyzedInput = currentInputSnapshot;


        // ---------------------------------------------
        // DISPLACEMENTS
        // ---------------------------------------------

        document.getElementById(
            "displacementCard"
        ).innerHTML =

            formatDisplacements(
                data.displacements
            );



        // ---------------------------------------------
        // REACTIONS
        // ---------------------------------------------

        document.getElementById(
            "reactionCard"
        ).innerHTML =

            formatReactions(
                data.reactions
            );



        // ---------------------------------------------
        // MEMBER FORCES
        // ---------------------------------------------

        document.getElementById(
            "memberForceCard"
        ).innerHTML =

            formatMemberForces(
                data.member_forces,
                getMembers()
            );

        // =================================================
        // DIAGRAM TABLES
        // =================================================

        document.getElementById(
            "afdTable"
        ).innerHTML =

            formatAFDTable(
                data.afd
            );

        // SFD TABLES
        document.getElementById(
            "sfdYTable"
        ).innerHTML =
            formatSFDYTable(
                data.sfd
            );

        document.getElementById(
            "sfdZTable"
        ).innerHTML =
            formatSFDZTable(
                data.sfd
            );

        // BMD TABLES
        document.getElementById(
            "bmdYTable"
        ).innerHTML =
            formatBMDYTable(
                data.bmd
            );

        document.getElementById(
            "bmdZTable"
        ).innerHTML =
            formatBMDZTable(
                data.bmd
            );


        document.getElementById(
            "tmdTable"
        ).innerHTML =

            formatTMDTable(
                data.tmd
            );



        document.getElementById(
            "deflectionTable"
        ).innerHTML =

            formatDeflectionTable(
                data.deflection_shapes
            );

        showPage(4);

        drawStructure();
        
    })



    // -------------------------------------------------
    // SERVER ERROR
    // -------------------------------------------------

    .catch(err => {

        console.log(
            "Error:",
            err
        );

        document.getElementById(
            "loading"
        ).style.display = "none";

        document.getElementById(
            "resultPlaceholder"
        ).style.display = "block";

        document.getElementById(
            "resultPlaceholder"
        ).innerHTML =

            `<p style="color:red;">
                Server error
            </p>`;
    });
}

// #endregion




// #region =====================================================
// ANALYZE + SHOW RESULT PAGE
// =====================================================

function analyzeAndShow(){

    analyzeFrame();
}

// #endregion

function checkAnalysisInputChanges(){

    if(!window.analysisResults){
        return;
    }

    const currentData = {
        nodes: getNodes(),
        members: getMembers(),
        supports: getSupports(),
        loads: getLoads()
    };

    const currentSnapshot = JSON.stringify(currentData);

    const placeholder = document.getElementById( "resultPlaceholder");

    if(currentSnapshot !== lastAnalyzedInput){

        placeholder.style.display = "block";

        placeholder.innerHTML = `
            <p style="
                color:#b26a00;
                margin:0;
                font-size:13px;
            ">
                <strong>⚠ Inputs have been changed.</strong><br>
                Results shown below are from the previous analysis.<br>
                Click <strong>ANALYZE</strong> to see results
                for the changed values.
            </p>
        `;

    }
    else{

        placeholder.style.display = "none";

    }
}


// #region =====================================================
// DISPLACEMENT TABLE
// =====================================================

function formatDisplacements(D){

    let html = `

        <div class="result-card-heading">
            <h3>Nodal Displacements</h3>
            <p>Global translational and rotational displacements</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Node</th>
                <th>Ux</th>
                <th>Uy</th>
                <th>Uz</th>
                <th>θx</th>
                <th>θy</th>
                <th>θz</th>
            </tr>
    `;



    for(let i=0; i<D.length/6; i++){

        html += `

            <tr>
                <td>${window.nodeLabels[i]}</td>

                <td>${D[6 * i + 0].toFixed(5)}</td>
                <td>${D[6 * i + 1].toFixed(5)}</td>
                <td>${D[6 * i + 2].toFixed(5)}</td>

                <td>${D[6 * i + 3].toFixed(5)}</td>
                <td>${D[6 * i + 4].toFixed(5)}</td>
                <td>${D[6 * i + 5].toFixed(5)}</td>
            </tr>
        `;
    }

    return html + "</table>";
}

// #endregion


// #region =====================================================
// REACTION TABLE
// =====================================================

function formatReactions(R){

    let html = `

        <div class="result-card-heading">
            <h3>Support Reactions</h3>
            <p>Global reaction forces and moments at restrained nodes</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Node</th>
                <th>Fx</th>
                <th>Fy</th>
                <th>Fz</th>
                <th>Mx</th>
                <th>My</th>
                <th>Mz</th>
            </tr>
    `;



    for(let i=0; i<R.length/6; i++){

        const fx = R[6 * i + 0];
        const fy = R[6 * i + 1];
        const fz = R[6 * i + 2];

        const mx = R[6 * i + 3];
        const my = R[6 * i + 4];
        const mz = R[6 * i + 5];



        // Skip near-zero rows
        if(
            Math.abs(fx) +
            Math.abs(fy) +
            Math.abs(fz) +
            Math.abs(mx) +
            Math.abs(my) +
            Math.abs(mz)
            < 1e-6
        ){
            continue;
        }



        html += `

            <tr>

                <td>${window.nodeLabels[i]}</td>

                <td>${fx.toFixed(3)}</td>
                <td>${fy.toFixed(3)}</td>
                <td>${fz.toFixed(3)}</td>

                <td>${mx.toFixed(3)}</td>
                <td>${my.toFixed(3)}</td>
                <td>${mz.toFixed(3)}</td>

            </tr>
        `;
    }

    return html + "</table>";
}

// #endregion




// #region =====================================================
// MEMBER FORCE TABLE
// =====================================================

function formatMemberForces(memberForces, members){

    let html = `

        <div class="result-card-heading">
            <h3>Local Member End Forces</h3>
            <p>End forces and moments in the member local coordinate system</p>
        </div>

        <table class="result-table">

            <tr>

                <th>Member</th>
                <th>End</th>
                <th>Node</th>

                <th>N</th>
                <th>Vy</th>
                <th>Vz</th>
                <th>T</th>
                <th>My</th>
                <th>Mz</th>

            </tr>
    `;



    members.forEach((member,i)=>{

        const m = memberForces[i];

        if(!m){
            return;
        }

        html += `

            <tr>

                <td rowspan="2">
                    ${window.memberLabels[i]}
                </td>

                <td> Start </td>

                <td>${member.start}</td>

                <td>${m[0].toFixed(3)}</td>
                <td>${m[1].toFixed(3)}</td>
                <td>${m[2].toFixed(3)}</td>
                <td>${m[3].toFixed(3)}</td>
                <td>${m[4].toFixed(3)}</td>
                <td>${m[5].toFixed(3)}</td>

            </tr>

            <tr>

                <td> End </td>

                <td>${member.end}</td>

                <td>${m[6].toFixed(3)}</td>
                <td>${m[7].toFixed(3)}</td>
                <td>${m[8].toFixed(3)}</td>
                <td>${m[9].toFixed(3)}</td>
                <td>${m[10].toFixed(3)}</td>
                <td>${m[11].toFixed(3)}</td>

            </tr>
        `;
    });

    return html + "</table>";
}

// #endregion

// #region =====================================================
// AFD TABLE
// =====================================================

function formatAFDTable(data){

    let html = `

        <div class="result-card-heading">
            <h3>Axial Force Diagram</h3>
            <p>Local axial force along each member</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Max Axial Force</th>
                <th>x @ Max</th>
                <th>Min Axial Force</th>
                <th>x @ Min</th>
            </tr>

    `;


    data.forEach(d => {

        html += `

            <tr>

                <td>${d.member}</td>

                <td>${Number(d.max_N).toFixed(3)}</td>
                <td>${Number(d.x_max_N).toFixed(3)}</td>

                <td>${Number(d.min_N).toFixed(3)}</td>
                <td>${Number(d.x_min_N).toFixed(3)}</td>

            </tr>

        `;

    });


    return html + "</table>";
}

// #endregion

// #region =====================================================
// SFD TABLE
// =====================================================
function formatSFDTable(data){

    let html = `
        <table class="result-table">
            <tr>
                <th rowspan="2">Member</th>

                <th colspan="4">Vy</th>
                <th colspan="4">Vz</th>
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
    `;

    data.forEach(d=>{

        // const Vy = d.max_V?.y !== undefined ? d.max_V.y : 0;
        // const Vz = d.max_V?.z !== undefined ? d.max_V.z : 0;

        // const xVyMax = d.x_max_V?.y !== undefined ? d.x_max_V.y : 0;
        // const xVyMin = d.x_min_V?.y !== undefined ? d.x_min_V.y : 0;

        // const xVzMax = d.x_max_V?.z !== undefined ? d.x_max_V.z : 0;
        // const xVzMin = d.x_min_V?.z !== undefined ? d.x_min_V.z : 0;

        // const minVy = d.min_V?.y !== undefined ? d.min_V.y : 0;
        // const minVz = d.min_V?.z !== undefined ? d.min_V.z : 0;

        html += `
            <tr>
                <td>${d.member}</td>
                <td>${d.max_V.y.toFixed(3)}</td>
                <td>${d.x_max_V.y.toFixed(3)}</td>
                <td>${d.min_V.y.toFixed(3)}</td>
                <td>${d.x_min_V.y.toFixed(3)}</td>

                <td>${d.max_V.z.toFixed(3)}</td>
                <td>${d.x_max_V.z.toFixed(3)}</td>
                <td>${d.min_V.z.toFixed(3)}</td>
                <td>${d.x_min_V.z.toFixed(3)}</td>

            </tr>
        `;
    });

    html += "</table>";
    return html;
}


function formatSFDYTable(data){

    let html = `
        <div class="result-card-heading">
            <h3>Shear Force Diagram — Vy</h3>
            <p>Local Y-direction shear force</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Maximum Vy</th>
                <th>x @ Maximum</th>
                <th>Minimum Vy</th>
                <th>x @ Minimum</th>
            </tr>
    `;

    data.forEach(d => {

        html += `
            <tr>

                <td>${d.member}</td>

                <td>
                    ${Number(d.max_V.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_max_V.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.min_V.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_min_V.y).toFixed(3)}
                </td>

            </tr>
        `;

    });

    html += "</table>";

    return html;
}

function formatSFDZTable(data){

    let html = `
        <div class="result-card-heading">
            <h3>Shear Force Diagram — Vz</h3>
            <p>Local Z-direction shear force</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Maximum Vz</th>
                <th>x @ Maximum</th>
                <th>Minimum Vz</th>
                <th>x @ Minimum</th>
            </tr>
    `;

    data.forEach(d => {

        html += `
            <tr>

                <td>${d.member}</td>

                <td>
                    ${Number(d.max_V.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_max_V.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.min_V.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_min_V.z).toFixed(3)}
                </td>

            </tr>
        `;

    });

    html += "</table>";

    return html;
}


// #endregion

// #region =====================================================
// BMD TABLE
// =====================================================
function formatBMDTable(data){
    let html = `
        <table class="result-table">
            <tr>
                <th rowspan="2">Member</th>

                <th colspan="4">My</th>
                <th colspan="4">Mz</th>
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
    `;

    data.forEach(d=>{

        // const maxMy = d.max_M?.y !== undefined ? d.max_M.y : 0;
        // const minMy = d.min_M?.y !== undefined ? d.min_M.y : 0;

        // const maxMz = d.max_M?.z !== undefined ? d.max_M.z : 0;
        // const minMz = d.min_M?.z !== undefined ? d.min_M.z : 0;

        // const xMyMax = d.x_max_M?.y !== undefined ? d.x_max_M.y : 0;
        // const xMyMin = d.x_min_M?.y !== undefined ? d.x_min_M.y : 0;

        // const xMzMax = d.x_max_M?.z !== undefined ? d.x_max_M.z : 0;
        // const xMzMin = d.x_min_M?.z !== undefined ? d.x_min_M.z : 0;

        html += `
            <tr>
                <td>${d.member}</td>
                <td>${d.max_M.y.toFixed(3)}</td>
                <td>${d.x_max_M.y.toFixed(3)}</td>
                <td>${d.min_M.y.toFixed(3)}</td>
                <td>${d.x_min_M.y.toFixed(3)}</td>

                <td>${d.max_M.z.toFixed(3)}</td>
                <td>${d.x_max_M.z.toFixed(3)}</td>
                <td>${d.min_M.z.toFixed(3)}</td>
                <td>${d.x_min_M.z.toFixed(3)}</td>
            </tr>
        `;
    });

    html += "</table>";

    return html;
}

function formatBMDYTable(data){

    let html = `
        <div class="result-card-heading">
            <h3>Bending Moment Diagram — My</h3>
            <p>Bending moment about the local Y-axis</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Maximum My</th>
                <th>x @ Maximum</th>
                <th>Minimum My</th>
                <th>x @ Minimum</th>
            </tr>
    `;

    data.forEach(d => {

        html += `
            <tr>

                <td>${d.member}</td>

                <td>
                    ${Number(d.max_M.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_max_M.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.min_M.y).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_min_M.y).toFixed(3)}
                </td>

            </tr>
        `;

    });

    html += "</table>";

    return html;
}

function formatBMDZTable(data){

    let html = `
        <div class="result-card-heading">
            <h3>Bending Moment Diagram — Mz</h3>
            <p>Bending moment about the local Z-axis</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Maximum Mz</th>
                <th>x @ Maximum</th>
                <th>Minimum Mz</th>
                <th>x @ Minimum</th>
            </tr>
    `;

    data.forEach(d => {

        html += `
            <tr>

                <td>${d.member}</td>

                <td>
                    ${Number(d.max_M.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_max_M.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.min_M.z).toFixed(3)}
                </td>

                <td>
                    ${Number(d.x_min_M.z).toFixed(3)}
                </td>

            </tr>
        `;

    });

    html += "</table>";

    return html;
}

// #endregion

// #region =====================================================
// TMD TABLE
// =====================================================

function formatTMDTable(data){

    let html = `

        <div class="result-card-heading">
            <h3>Torsional Moment Diagram — T</h3>
            <p>Torque about the local X-axis</p>
        </div>

        <table class="result-table">

            <tr>
                <th>Member</th>
                <th>Max Torsion</th>
                <th>x @ Max</th>
                <th>Min Torsion</th>
                <th>x @ Min</th>
            </tr>

    `;


    data.forEach(d => {

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


    return html + "</table>";
}

// #endregion

// #region =====================================================
// DEFLECTION TABLE
// =====================================================
function formatDeflectionTable(data){
    let html = `

        <div class="result-card-heading">
            <h3>Member Deflection</h3>
            <p>Local Y and Z transverse deflections</p>
        </div>

        <table class="result-table">
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
    `;

    data.forEach(d=>{

        // const maxY = d.max_deflection?.y ?? 0;
        // const minY = d.min_deflection?.y ?? 0;

        // const maxZ = d.max_deflection?.z ?? 0;
        // const minZ = d.min_deflection?.z ?? 0;

        // const xMaxY = d.x_max_deflection?.y ?? 0;
        // const xMinY = d.x_min_deflection?.y ?? 0;

        // const xMaxZ = d.x_max_deflection?.z ?? 0;
        // const xMinZ = d.x_min_deflection?.z ?? 0;

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

    html += "</table>";

    return html;
}