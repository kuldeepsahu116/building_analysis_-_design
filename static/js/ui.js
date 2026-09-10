function openInfoPopup(){

    document.getElementById("infoPopupOverlay").style.display="flex";

}

function closeInfoPopup(){

    document.getElementById("infoPopupOverlay").style.display="none";

}


// =====================================================
// INSTRUCTION PANEL
// =====================================================

function toggleInstruction(button){

    const content =
        button.nextElementSibling;

    const arrow =
        button.querySelector(".instruction-arrow");


    const isOpen =
        content.style.display === "block";


    if(isOpen){

        content.style.display = "none";

        arrow.innerText = "▼";

    }

    else{

        content.style.display = "block";

        arrow.innerText = "▲";

    }

}


// #region  NODE INPUT
// =====================================================

function addNode(id="", x="", y="", z=""){

    let table = document.getElementById("nodesTable");

    let rowCount = table.rows.length - 1;

    // Default values
    if(id === "") id = rowCount;

    if(x === "") x = 0;

    if(y === "") y = 0;

    if(z === "") z = 0;

    let row = table.insertRow();

    row.innerHTML = `
        <td>
            <input value="${id}" oninput="refreshView()">
        </td>

        <td>
            <input 
            value="${x}" 
            type="text"
            oninput="refreshView()">
        </td>

        <td>
            <input 
            value="${y}" 
            type="text"
            oninput="refreshView()">
        </td>

         <td>
            <input 
            value="${z}" 
            type="text"
            oninput="refreshView()">
        </td>

        <td>
            <button
                class="delete-btn"
                onclick="deleteRow(this)">
                X
            </button>
        </td>
    `;

    refreshView();
}

// #endregion

// #region MEMBER INPUT
// =====================================================

function addMember(
    id="",
    start="",
    end=""
){

    let table = document.getElementById("membersTable");

    let rowCount = table.rows.length;

    // Default values
    if(id === "") id = rowCount;

    if(start === "") start = 0;

    if(end === "") end = 0;


    let row = table.insertRow();

    row.innerHTML = `
        <td><input value="${id}" oninput="refreshView()"></td>

        <td><input value="${start}" oninput="refreshView()"></td>

        <td><input value="${end}" oninput="refreshView()"></td>


        <td>
            <button
                class="delete-btn"
                onclick="deleteRow(this)">
                X
            </button>
        </td>
    `;

    refreshView();
}

// #endregion

// #region SUPPORT SYSTEM
// =====================================================

let supportDatabase = [];

let editingSupportIndex = -1;

let currentSupportType = "support";


// -----------------------------------------------------
// OPEN POPUP
// -----------------------------------------------------

function openSupportPopup(){

    editingSupportIndex = -1;

    currentSupportType = "support";

    document.getElementById(
        "supportPopup"
    ).style.display = "flex";

    resetSupportPopup();

    switchSupportType("support");
}


// -----------------------------------------------------
// CLOSE POPUP
// -----------------------------------------------------

function closeSupportPopup(){

    document.getElementById(
        "supportPopup"
    ).style.display = "none";

}

function updateSupportValueInputs(){

    const dofs = [
        "Ux",
        "Uy",
        "Uz",
        "Rx",
        "Ry",
        "Rz"
    ];

    dofs.forEach(dof => {

        const checked =
            document.getElementById(
                `support${dof}`
            ).checked;

        document.getElementById(
            `support${dof}Value`
        ).disabled = !checked;

    });
}


// -----------------------------------------------------
// SWITCH SUPPORT TYPE
// -----------------------------------------------------

function switchSupportType(type){

    currentSupportType = type;

    const normalTab =
        document.getElementById("supportTab");

    const deflectionTab =
        document.getElementById("supportDeflectionTab");

    const values =
        document.getElementById(
            "supportDeflectionValues"
        );


    if(type === "support"){

        normalTab.classList.add("active");

        deflectionTab.classList.remove("active");

        values.style.display = "none";

    }

    else{

        normalTab.classList.remove("active");

        deflectionTab.classList.add("active");

        values.style.display = "block";

    }

}


// -----------------------------------------------------
// RESET POPUP
// -----------------------------------------------------

function resetSupportPopup(){

    document.getElementById("supportPopupTitle")
        .innerText = "Add Support";

    const dofs = [
        "Ux",
        "Uy",
        "Uz",
        "Rx",
        "Ry",
        "Rz"
    ];


    dofs.forEach(dof => {

        document.getElementById(
            `support${dof}`
        ).checked = false;

        document.getElementById(
            `support${dof}Value`
        ).value = 0;

    });

    updateSupportValueInputs();
}


// -----------------------------------------------------
// SAVE SUPPORT
// -----------------------------------------------------

function saveSupport(){

    const support = {

        type: currentSupportType,

        ux:
            document.getElementById(
                "supportUx"
            ).checked,

        uy:
            document.getElementById(
                "supportUy"
            ).checked,

        uz:
            document.getElementById(
                "supportUz"
            ).checked,

        rx:
            document.getElementById(
                "supportRx"
            ).checked,

        ry:
            document.getElementById(
                "supportRy"
            ).checked,

        rz:
            document.getElementById(
                "supportRz"
            ).checked,


        uxValue:
            +document.getElementById(
                "supportUxValue"
            ).value,

        uyValue:
            +document.getElementById(
                "supportUyValue"
            ).value,

        uzValue:
            +document.getElementById(
                "supportUzValue"
            ).value,

        rxValue:
            +document.getElementById(
                "supportRxValue"
            ).value,

        ryValue:
            +document.getElementById(
                "supportRyValue"
            ).value,

        rzValue:
            +document.getElementById(
                "supportRzValue"
            ).value,

        assignedNodes:
            editingSupportIndex >= 0
            ?
            [
                ...supportDatabase[
                    editingSupportIndex
                ].assignedNodes
            ]
            :
            []
    };


    if(editingSupportIndex >= 0){

        supportDatabase[
            editingSupportIndex
        ] = support;

        editingSupportIndex = -1;

    }

    else{

        supportDatabase.push(support);

    }


    renderSupportCards();

    closeSupportPopup();

    refreshView();

}


// -----------------------------------------------------
// RENDER SUPPORT CARDS
// -----------------------------------------------------

function renderSupportCards(){

    const container =
        document.getElementById(
            "supportCardContainer"
        );

    container.innerHTML = "";


    supportDatabase.forEach(
        (support,index)=>{

            const template =
                document.getElementById(
                    "supportCardTemplate"
                );

            const card =
                template.firstElementChild
                .cloneNode(true);


            // -----------------------------------------
            // TITLE
            // -----------------------------------------

            card.querySelector(
                ".support-title"
            ).innerText =

                support.type === "support"
                ?
                "SUPPORT"
                :
                "SUPPORT WITH DEFLECTION";


            // -----------------------------------------
            // DESCRIPTION
            // -----------------------------------------

            let dofs = [];

            if(support.ux)
                dofs.push("Ux");

            if(support.uy)
                dofs.push("Uy");

            if(support.uz)
                dofs.push("Uz");

            if(support.rx)
                dofs.push("θx");

            if(support.ry)
                dofs.push("θy");

            if(support.rz)
                dofs.push("θz");


            let description =
                `Restrained: ${dofs.join(", ")}`;


            if(
                support.type ===
                "support_deflection"
            ){

                let values = [];

                if(support.ux)
                    values.push(
                        `Ux = ${support.uxValue}`
                    );

                if(support.uy)
                    values.push(
                        `Uy = ${support.uyValue}`
                    );

                if(support.uz)
                    values.push(
                        `Uz = ${support.uzValue}`
                    );

                if(support.rx)
                    values.push(
                        `θx = ${support.rxValue}`
                    );
                
                if(support.ry)
                    values.push(
                        `θy = ${support.ryValue}`
                    );

                if(support.rz)
                    values.push(
                        `θz = ${support.rzValue}`
                    );


                description +=
                    ` | ${values.join(", ")}`;
            }


            card.querySelector(
                ".support-description"
            ).innerText = description;


            // -----------------------------------------
            // ASSIGNMENT
            // -----------------------------------------

            card.querySelector(
                ".support-assignment"
            ).innerText =

                `Nodes: ${
                    support.assignedNodes.join(", ")
                }`;


            const assignmentInput =
                card.querySelector(
                    ".support-assignment-input"
                );


            assignmentInput.value =
                support.assignedNodes.join(", ");


            const assignButton =
                card.querySelector(
                    ".assign-support-btn"
                );


            assignButton.disabled = true;


            assignmentInput.addEventListener(
                "input",
                ()=>{

                    assignButton.disabled =
                        assignmentInput.value.trim()
                        ===
                        support.assignedNodes
                            .join(", ")
                            .trim();

                }
            );


            assignButton.onclick =
                () => assignSupport(index);


            const assignAllButton =
                card.querySelector(
                    ".assign-all-btn"
                );

            assignAllButton.onclick =
                () => openAssignAllConfirmation(
                    "support",
                    index
                );


            // -----------------------------------------
            // EDIT / DELETE
            // -----------------------------------------

            card.querySelector(
                ".edit-support-btn"
            ).onclick =
                () => editSupport(index);


            card.querySelector(
                ".delete-btn"
            ).onclick =
                () => deleteSupport(index);


            container.appendChild(card);

        }
    );
}


// -----------------------------------------------------
// ASSIGN SUPPORT
// -----------------------------------------------------

function assignSupport(index){

    const card =
        document.getElementById("supportCardContainer").children[index];

    const input =card.querySelector(".support-assignment-input");

    const nodes =
        input.value
            .split(",")
            .map(v => v.trim())
            .filter(v => v !== "");

    // CHECK WHETHER NODES EXIST

    const existingNodes = Object.keys(getNodes()).map(String);

    const invalidNodes =
        nodes.filter(node => !existingNodes.includes(String(node)));

    if(invalidNodes.length > 0){

        const uniqueInvalidNodes = [
            ...new Set(invalidNodes)
        ];

        alert(
            `Node ${uniqueInvalidNodes.join(", ")} ` +
            `does not exist.`
        );
        return;
    }

    // CHECK DUPLICATE SUPPORT ASSIGNMENT

    const duplicateNodes = [];

    nodes.forEach(node => {supportDatabase.forEach(
            (support, supportIndex) => {

                // Ignore the support currently being edited
                if(supportIndex === index){
                    return;
                }
                if(
                    support.assignedNodes
                        .map(String)
                        .includes(String(node))
                ){
                    duplicateNodes.push(node);
                }
            }
        );

    });

    // Stop assignment if duplicate exists
    if(duplicateNodes.length > 0){

        const uniqueDuplicates = [
            ...new Set(duplicateNodes)
        ];
        alert(
            `Node ${uniqueDuplicates.join(", ")} ` +
            `is already assigned to another support.`
        );
        return;
    }


    supportDatabase[index].assignedNodes = nodes;

    renderSupportCards();

    refreshView();

}


// -----------------------------------------------------
// EDIT SUPPORT
// -----------------------------------------------------

function editSupport(index){

    const support =
        supportDatabase[index];

    editingSupportIndex = index;

    currentSupportType =
        support.type;


    document.getElementById(
        "supportPopup"
    ).style.display = "flex";


    document.getElementById(
        "supportPopupTitle"
    ).innerText = "Edit Support";


    const dofs = [
        "Ux",
        "Uy",
        "Uz",
        "Rx",
        "Ry",
        "Rz"
    ];


    dofs.forEach(dof => {

        document.getElementById(
            `support${dof}`
        ).checked =
            support[
                dof.toLowerCase()
            ];

        document.getElementById(
            `support${dof}Value`
        ).value =
            support[
                `${dof.toLowerCase()}Value`
            ];

    });


    switchSupportType(
        support.type
    );

}


// -----------------------------------------------------
// DELETE SUPPORT
// -----------------------------------------------------

function deleteSupport(index){

    supportDatabase.splice(index,1);

    renderSupportCards();

    refreshView();

}


// #endregion

// #endregion

// #region DELETE ROW
// =====================================================

function deleteRow(btn){

    btn.parentElement.parentElement.remove();

    refreshView();
}

// #endregion

// #region LOAD POPUP SYSTEM
// =====================================================

let loadDatabase = [];



// -----------------------------------------------------
// OPEN POPUP
// -----------------------------------------------------

function openLoadPopup(){

    document.getElementById(
        "loadPopup"
    ).style.display = "flex";

    updateLoadPopup();
}

// -----------------------------------------------------
// CLOSE POPUP
// -----------------------------------------------------

function closeLoadPopup(){

    document.getElementById(
        "loadPopup"
    ).style.display = "none";
}

// -----------------------------------------------------
// SAVE LOAD
// -----------------------------------------------------

function saveLoad(){

    let oldLoad = null;

        if(editingLoadIndex >= 0){

            oldLoad = loadDatabase[editingLoadIndex];
        }

    let load = {

        category:
            document.getElementById(
                "loadCategory"
            ).value,

        type:
            document.getElementById(
                "loadType"
            ).value,

        direction:
            document.getElementById(
                "loadDirection"
            ).value,

        value1:
            +document.getElementById(
                "loadValue1"
            ).value,

        value2:
            +document.getElementById(
                "loadValue2"
            ).value,

        a:
            +document.getElementById(
                "loadA"
            ).value,

        b:
            +document.getElementById(
                "loadB"
            ).value,


        // ---------------------------------
        // ASSIGNMENT
        // ---------------------------------

        assignedNodes :
            oldLoad
            ?
            [...oldLoad.assignedNodes]
            :
            [],

        assignedMembers :
            oldLoad
            ?
            [...oldLoad.assignedMembers]
            :
            []
    };



    if(editingLoadIndex >= 0){
        loadDatabase[editingLoadIndex] = load;
        editingLoadIndex = -1;
    }

    else{
        loadDatabase.push(load);
    }

    renderLoadCards();

    closeLoadPopup();

    refreshView();
}

// -----------------------------------------------------
// RENDER LOAD CARDS
// -----------------------------------------------------

function renderLoadCards(){

    let container =
        document.getElementById(
            "loadCardContainer"
        );

    container.innerHTML = "";



    loadDatabase.forEach((load,index)=>{

        // ---------------------------------------------
        // CLONE TEMPLATE
        // ---------------------------------------------

        let template =
            document.getElementById(
                "loadCardTemplate"
            );

        let card =
            template.firstElementChild.cloneNode(true);



        // ---------------------------------------------
        // DESCRIPTION
        // ---------------------------------------------

        let description = "";



        if(load.category === "nodal"){

            if(load.type === "point"){
                description =
                    `Force = ${load.value1} kN
                    | Direction: Global-${load.direction}`;
            }
            else if(load.type === "moment"){
                let axis =
                    load.direction.replace("M", "");

                description =
                    `Moment = ${load.value1} kN-m
                    | About Global-${axis}`;
            }
        }

        else{

            if(load.type === "point"){

                description =
                    `Point Load = ${load.value1} kN
                    | Direction: Local-${load.direction}
                    | a = ${load.a} m`;
            }

            else if(load.type === "moment"){

                description =
                    `Moment =${load.value1} kN-m
                    | About Local-${load.direction}
                    | a = ${load.a} m`;
            }

            else if(load.type === "udl"){

                description =
                    `UDL =${load.value1} kN/m
                    | Direction: Local-${load.direction}`;
            }

            else if(load.type === "partial_udl"){

                description =
                    `Partial UDL = ${load.value1} kN/m
                    | Direction: Local-${load.direction}
                    | from ${load.a} m to ${load.b} m`;
            }

            else if(load.type === "trapezoidal"){

                description =
                    `Trapezoidal = ${load.value1} → ${load.value2} kN/m
                    | Direction: Local-${load.direction}`;
            }
        }



        // ---------------------------------------------
        // ASSIGNMENT
        // ---------------------------------------------

        let assignment = "";

        if(load.category === "nodal"){
            
            assignment =
                `Nodes:
                ${load.assignedNodes.join(", ")}`;
        }

        else{

            assignment =
                `Members:
                ${load.assignedMembers.join(", ")}`;
        }



        // ---------------------------------------------
        // FILL CONTENT
        // ---------------------------------------------

        card.querySelector(".load-title")
            .innerText =

            `${load.category.toUpperCase()}
             - ${load.type.toUpperCase()}`;



        card.querySelector(".load-description")
            .innerText = description;



        card.querySelector(".load-assignment")
            .innerText = assignment;

        let assignmentInput = card.querySelector(".load-assignment-input");

        assignmentInput.value =
            load.category === "nodal"
            ?
            load.assignedNodes.join(", ")
            :
            load.assignedMembers.join(", ");

        let assignBtn = card.querySelector(".assign-load-btn");

        assignBtn.disabled = true;

        assignmentInput.addEventListener(
            "input",
            ()=>{
                let current =
                    load.category === "nodal"
                    ?
                    load.assignedNodes.join(", ")
                    :
                    load.assignedMembers.join(", ");

                assignBtn.disabled =
                    assignmentInput.value.trim()
                    ===
                    current.trim();
            }
        );

        card.querySelector(".assign-load-btn")
        .onclick = () => assignLoad(index);

        card.querySelector(".assign-all-btn")
        .onclick =
            () => openAssignAllConfirmation(
                "load",
                index
            );



        // ---------------------------------------------
        // BUTTONS
        // ---------------------------------------------

        card.querySelector(".edit-load-btn")
            .onclick = () => editLoad(index);



        card.querySelector(".delete-btn")
            .onclick = () => deleteLoad(index);



        // ---------------------------------------------
        // ADD CARD
        // ---------------------------------------------

        container.appendChild(card);
    });
}

// #region =====================================================
// DYNAMIC LOAD POPUP
// =====================================================

function updateLoadPopup(){

    let category =
        document.getElementById(
            "loadCategory"
        ).value;

    let typeSelect =
        document.getElementById(
            "loadType"
        );



    // ---------------------------------------------
    // BUILD TYPE OPTIONS
    // ---------------------------------------------

    if(category === "nodal"){

        typeSelect.innerHTML = `

            <option value="point">
                Force
            </option>

            <option value="moment">
                Moment
            </option>
        `;
    }

    else{

        typeSelect.innerHTML = `

            <option value="point">
                Concentrated Force
            </option>

            <option value="moment">
                Concentrated Moment
            </option>

            <option value="udl">
                UDL
            </option>

            <option value="partial_udl">
                Partial UDL
            </option>

            <option value="trapezoidal">
                Trapezoidal
            </option>
        `;
    }



    // ---------------------------------------------
    // UPDATE VISIBLE FIELDS
    // ---------------------------------------------

    updateLoadFields();
}

function updateLoadFields(){

    let category =
        document.getElementById(
            "loadCategory"
        ).value;

    let typeSelect =
        document.getElementById(
            "loadType"
        );

    // -------------------------------------------------
    // CURRENT TYPE
    // -------------------------------------------------

    let type = typeSelect.value;



    // -------------------------------------------------
    // HIDE EVERYTHING FIRST
    // -------------------------------------------------

    hideGroup("directionGroup");

    hideGroup("value2Group");

    hideGroup("aGroup");

    hideGroup("bGroup");



    // -------------------------------------------------
    // NODAL LOADS
    // -------------------------------------------------

    if(category === "nodal"){

        showGroup("directionGroup");

        let directionSelect =
            document.getElementById(
                "loadDirection"
            );
        // FORCE
        if(type === "point"){
            document.getElementById(
                "value1Label"
            ).innerText = "Force";
            
            directionSelect.innerHTML = `
                <option value="X">
                    Global-X
                </option>
                <option value="Y">
                    Global-Y
                </option>
                <option value="Z">
                    Global-Z
                </option>
            `;
        }

        // MOMENT
        else{
            document.getElementById(
                "value1Label"
            ).innerText = "Moment";

            directionSelect.innerHTML = `
                <option value="MX">
                    Moment about Global-X
                </option>

                <option value="MY">
                    Moment about Global-Y
                </option>

                <option value="MZ">
                    Moment about Global-Z
                </option>
            `;
        }
    }


    // -------------------------------------------------
    // MEMBER LOADS
    // -------------------------------------------------

    else{

        const directionSelect =
            document.getElementById("loadDirection");

        // Show direction for all member loads
        showGroup("directionGroup");


        // POINT LOAD
        if(type === "point"){

            showGroup("aGroup");

            document.getElementById(
                "value1Label"
            ).innerText = "Concentrated Force";

            directionSelect.innerHTML = `
                <option value="x">
                    Local-X
                </option>

                <option value="y">
                    Local-Y
                </option>

                <option value="z">
                    Local-Z
                </option>
            `;
        }



        // MOMENT
        else if(type === "moment"){

            showGroup("aGroup");

            document.getElementById(
                "value1Label"
            ).innerText = "Concentrated Moment";

            directionSelect.innerHTML = `
                <option value="x">
                    Moment about Local-X
                </option>

                <option value="y">
                    Moment about Local-Y
                </option>

                <option value="z">
                    Moment about Local-Z
                </option>
            `;
        }



        // UDL
        else if(type === "udl"){

            document.getElementById(
                "value1Label"
            ).innerText = "UDL";

            directionSelect.innerHTML = `
                <option value="y">
                    Local-Y
                </option>

                <option value="z">
                    Local-Z
                </option>
            `;
        }



        // PARTIAL UDL
        else if(type === "partial_udl"){

            showGroup("aGroup");

            showGroup("bGroup");

            document.getElementById(
                "value1Label"
            ).innerText = "UDL";

            directionSelect.innerHTML = `
                <option value="y">
                    Local-Y
                </option>

                <option value="z">
                    Local-Z
                </option>
            `;
        }



        // TRAPEZOIDAL
        else if(type === "trapezoidal"){

            showGroup("value2Group");

            document.getElementById(
                "value1Label"
            ).innerText = "Start Load";

            document.getElementById(
                "value2Label"
            ).innerText = "End Load";

            directionSelect.innerHTML = `
                <option value="y">
                    Local-Y
                </option>

                <option value="z">
                    Local-Z
                </option>
            `;
        }
    }

    updateLoadInstructions();
}

// #region =====================================================
// LOAD INSTRUCTION PANEL
// =====================================================

function updateLoadInstructions(){

    let category = document.getElementById("loadCategory").value;

    let type = document.getElementById("loadType").value;

    let html = "";

    // NODAL LOADS

    if(category === "nodal"){

        // FORCE
        if(type === "point"){
            html = `
                <b>Sign Convention</b><br>
                Positive → Along the selected global axis<br>
                Negative → Opposite to the selected global axis

                <br><br>
                <b>Force</b><br>
                Magnitude of force in kN.
                <br><br>
                <b>Direction</b><br>
                Global-X → Force along global X-axis<br>
                Global-Y → Force along global Y-axis<br>
                Global-Z → Force along global Z-axis

            `;
        }

        // MOMENT
        else{
            html = `
                Positive → Positive rotation about selected
                global axis<br>
                Negative → Opposite rotation
                <br><br>
                <b>Moment</b><br>
                Applied nodal moment in kN-m.
                <br><br>
                <b>Direction</b><br>
                Global-X → Moment about global X-axis<br>
                Global-Y → Moment about global Y-axis<br>
                Global-Z → Moment about global Z-axis
            `;
        }
    }

    // MEMBER LOADS

    else{

        // POINT LOAD
        if(type === "point"){
            html = `
                <b>Sign Convention</b><br>
                Positive → Along the selected local axis<br>
                Negative → Opposite to the selected local axis
                <br><br>
                <b>Concentrated Force</b><br>
                Magnitude of Concentrated Force in kN.
                <br><br>
                <b>Direction</b><br>
                Local-X → Axial force along the member<br>
                Local-Y → Transverse force in local Y<br>
                Local-Z → Transverse force in local Z
                <br><br>
                <b>a</b><br>
                Distance of Load from member start node.
            `;
        }

        // MOMENT
        else if(type === "moment"){

            html = `
                <b>Sign Convention</b><br>
                Positive → Positive rotation about the
                selected local axis<br>
                Negative → Opposite rotation
                <br><br>
                <b>Concentrated Moment</b><br>
                Applied Concentrated Moment on member in kN-m.
                <br><br>
                <b>Direction</b><br>
                Local-X → Moment about local X-axis<br>
                Local-Y → Moment about local Y-axis<br>
                Local-Z → Moment about local Z-axis
                <br><br>
                <b>a</b><br>
                Distance of Load from member start node.
            `;
        }



        // UDL
        else if(type === "udl"){

            html = `
                <b>Sign Convention</b><br>
                Positive → Along the selected local axis<br>
                Negative → Opposite to the selected local axis
                <br><br>
                <b>UDL</b><br>
                Uniformly distributed load intensity in kN/m.
                <b>Direction</b><br>
                Local-Y → Distributed load along local Y<br>
                Local-Z → Distributed load along local Z
            `;
        }



        // PARTIAL UDL
        else if(type === "partial_udl"){

            html = `
                <b>Sign Convention</b><br>
                Positive → Along the selected local axis<br>
                Negative → Opposite to the selected local axis
                <br><br>
                <b>UDL</b><br>
                Uniformly distributed load intensity in kN/m.
                <br><br>
                <b>Direction</b><br>
                Local-Y → Distributed load along local Y<br>
                Local-Z → Distributed load along local Z
                <br><br>
                <b>a</b><br>
                Start distance of UDL from member start node.
                <br><br>
                <b>b</b><br>
                End distance of UDL from member start node.
            `;
        }



        // TRAPEZOIDAL
        else if(type === "trapezoidal"){

            html = `
                <b>Sign Convention</b><br>
                Positive → Along the selected local axis<br>
                Negative → Opposite to the selected local axis
                <br><br>
                <b>Start Load</b><br>
                Load intensity at start node in kN/m.
                <br><br>
                <b>End Load</b><br>
                Load intensity at end node in kN/m.
                <br><br>
                <b>Direction</b><br>
                Local-Y → Distributed load along local Y<br>
                Local-Z → Distributed load along local Z
            `;
        }
    }



    document.getElementById("loadInstructionContent").innerHTML = html;
}

// #endregion

// -----------------------------------------------------
// SHOW GROUP
// -----------------------------------------------------

function showGroup(id){

    document.getElementById(
        id
    ).style.display = "block";
}



// -----------------------------------------------------
// HIDE GROUP
// -----------------------------------------------------

function hideGroup(id){

    document.getElementById(
        id
    ).style.display = "none";
}

// #endregion


// //#region -----------------------------------------------------
// DELETE LOAD
// -----------------------------------------------------

function deleteLoad(index){

    loadDatabase.splice(index,1);

    renderLoadCards();

    refreshView();
}

// #endregion

// #region EDIT LOAD
// -----------------------------------------------------
let editingLoadIndex = -1;

function editLoad(index){

    let load = loadDatabase[index];
    editingLoadIndex = index;

    // OPEN POPUP
    openLoadPopup();

    // CATEGORY
    document.getElementById(
        "loadCategory"
    ).value = load.category;

    // UPDATE TYPES
    updateLoadPopup();

    // TYPE
    document.getElementById(
        "loadType"
    ).value = load.type;

    // UPDATE FIELDS
    updateLoadFields();

    // DIRECTION
    document.getElementById(
        "loadDirection"
    ).value = load.direction;

    // VALUES
    document.getElementById(
        "loadValue1"
    ).value = load.value1;

    document.getElementById(
        "loadValue2"
    ).value = load.value2;

    document.getElementById(
        "loadA"
    ).value = load.a;

    document.getElementById(
        "loadB"
    ).value = load.b;

}

// #endregion

// #region  ASSIGN LOAD
// -----------------------------------------------------

function assignLoad(index){

    let card = document.querySelectorAll(".load-item")[index];

    let input = card.querySelector(".load-assignment-input");

    let values = input.value
        .split(",")
        .map(x => x.trim())
        .filter(x => x !== "");

    let load = loadDatabase[index];

    // NODAL LOAD

    if(load.category === "nodal"){

        const existingNodes = Object.keys(getNodes()).map(String);

        const invalidNodes =
            values.filter(node =>!existingNodes.includes(String(node)));

        if(invalidNodes.length > 0){

            const uniqueInvalidNodes = [
                ...new Set(invalidNodes)
            ];

            alert(
                `Node ${uniqueInvalidNodes.join(", ")} ` +
                `does not exist.`
            );

            return;
        }
        // SAVE NODE ASSIGNMENT
        load.assignedNodes = values;
    }


    // MEMBER LOAD
    else{

        const existingMembers = getMembers().map(member =>String(member.name));

        const invalidMembers =
            values.filter(member =>!existingMembers.includes(String(member)));

        if(invalidMembers.length > 0){

            const uniqueInvalidMembers = [
                ...new Set(invalidMembers)
            ];

            alert(
                `Member ${uniqueInvalidMembers.join(", ")} ` +
                `does not exist.`
            );
            return;
        }
        load.assignedMembers = values;
    }

    renderLoadCards();

    refreshView();
}

// #endregion


// #region =====================================================
// ASSIGN ALL CONFIRMATION
// =====================================================

let pendingAssignAllType = null;
let pendingAssignAllIndex = -1;


// -----------------------------------------------------
// OPEN CONFIRMATION POPUP
// -----------------------------------------------------

function openAssignAllConfirmation(type,index){

    pendingAssignAllType = type;
    pendingAssignAllIndex = index;

    let title = "";
    let message = "";

    if(type === "material"){

        title = "Assign Material to All Members?";

        message =
            "Do you really want to assign this material " +
            "to all members?";

    }

    else if(type === "section"){

        title = "Assign Section to All Members?";

        message =
            "Do you really want to assign this section " +
            "to all members?";

    }

    else if(type === "support"){

        title = "Assign Support to All Nodes?";

        message =
            "Do you really want to assign this support " +
            "to all nodes?";

    }

    else if(type === "load"){

        const load = loadDatabase[index];

        if(load.category === "nodal"){

            title = "Assign Load to All Nodes?";

            message =
                "Do you really want to assign this load " +
                "to all nodes?";

        }

        else{

            title = "Assign Load to All Members?";

            message =
                "Do you really want to assign this load " +
                "to all members?";
        }
    }

    else if(type === "beta"){

        title = "Assign Beta Angle to All Members?";

        message =
            "Do you really want to assign this beta angle " +
            "to all members?";
    }

    
    document.getElementById(
        "assignAllConfirmTitle"
    ).innerText = title;


    document.getElementById(
        "assignAllConfirmMessage"
    ).innerText = message;


    document.getElementById(
        "assignAllConfirmPopup"
    ).style.display = "flex";


    document.getElementById(
        "confirmAssignAllBtn"
    ).onclick = confirmAssignAll;

}


// -----------------------------------------------------
// CLOSE CONFIRMATION POPUP
// -----------------------------------------------------

function closeAssignAllConfirmation(){

    document.getElementById(
        "assignAllConfirmPopup"
    ).style.display = "none";


    pendingAssignAllType = null;
    pendingAssignAllIndex = -1;

}


// -----------------------------------------------------
// CONFIRM ASSIGN ALL
// -----------------------------------------------------

function confirmAssignAll(){

    if(
        pendingAssignAllType === null ||
        pendingAssignAllIndex < 0
    ){

        closeAssignAllConfirmation();

        return;
    }


    const type = pendingAssignAllType;
    const index = pendingAssignAllIndex;


    // =================================================
    // MATERIAL
    // =================================================

    if(type === "material"){

        const members =
            getMembers().map(
                member => String(member.name)
            );


        if(members.length === 0){

            alert("No members are available.");

            closeAssignAllConfirmation();

            return;
        }


        // Remove these members from every other material

        materialDatabase.forEach(
            (material,materialIndex)=>{

                if(materialIndex === index){
                    return;
                }

                material.assignedMembers =
                    material.assignedMembers.filter(
                        member =>
                            !members.includes(
                                String(member)
                            )
                    );

            }
        );


        materialDatabase[index].assignedMembers =
            [...members];


        renderMaterialCards();

        refreshView();

    }


    // =================================================
    // SECTION
    // =================================================

    else if(type === "section"){

        const members =
            getMembers().map(
                member => String(member.name)
            );


        if(members.length === 0){

            alert("No members are available.");

            closeAssignAllConfirmation();

            return;
        }


        // Remove these members from every other section

        sectionDatabase.forEach(
            (section,sectionIndex)=>{

                if(sectionIndex === index){
                    return;
                }

                section.assignedMembers =
                    section.assignedMembers.filter(
                        member =>
                            !members.includes(
                                String(member)
                            )
                    );

            }
        );


        sectionDatabase[index].assignedMembers =
            [...members];


        renderSectionCards();

        refreshView();

    }


    // =================================================
    // SUPPORT
    // =================================================

    else if(type === "support"){

        const nodes =
            Object.keys(getNodes())
                .map(node => String(node));


        if(nodes.length === 0){

            alert("No nodes are available.");

            closeAssignAllConfirmation();

            return;
        }


        // A node can have only one support.
        // Remove all nodes from other supports.

        supportDatabase.forEach(
            (support,supportIndex)=>{

                if(supportIndex === index){
                    return;
                }

                support.assignedNodes =
                    support.assignedNodes.filter(
                        node =>
                            !nodes.includes(
                                String(node)
                            )
                    );

            }
        );


        supportDatabase[index].assignedNodes =
            [...nodes];


        renderSupportCards();

        refreshView();

    }


    // =================================================
    // LOAD
    // =================================================

    else if(type === "load"){

        const load =
            loadDatabase[index];


        if(load.category === "nodal"){

            const nodes =
                Object.keys(getNodes())
                    .map(node => String(node));


            if(nodes.length === 0){

                alert("No nodes are available.");

                closeAssignAllConfirmation();

                return;
            }


            load.assignedNodes =
                [...nodes];

        }


        else{

            const members =
                getMembers().map(
                    member => String(member.name)
                );


            if(members.length === 0){

                alert("No members are available.");

                closeAssignAllConfirmation();

                return;
            }


            load.assignedMembers =
                [...members];

        }


        renderLoadCards();

        refreshView();

    }

    // =================================================
    // BETA ANGLE
    // =================================================
    else if(type === "beta"){

        const members =
            getMembers().map(
                member => String(member.name)
            );


        if(members.length === 0){

            alert("No members are available.");

            closeAssignAllConfirmation();

            return;
        }


        // -----------------------------------------
        // A MEMBER CAN HAVE ONLY ONE BETA ANGLE
        // -----------------------------------------

        betaDatabase.forEach(
            (betaProperty,betaIndex)=>{

                if(betaIndex === index){
                    return;
                }


                betaProperty.assignedMembers =
                    betaProperty.assignedMembers.filter(
                        member =>
                            !members.includes(
                                String(member)
                            )
                    );

            }
        );


        // -----------------------------------------
        // ASSIGN ALL MEMBERS TO SELECTED BETA
        // -----------------------------------------

        betaDatabase[index].assignedMembers =
            [...members];


        renderBetaCards();

        refreshView();

    }


    closeAssignAllConfirmation();

}


// #endregion

// #region =====================================================
// MATERIAL PROPERTY SYSTEM
// =====================================================

let materialDatabase = [];

let editingMaterialIndex = -1;


// -----------------------------------------------------
// OPEN POPUP
// -----------------------------------------------------

function openMaterialPopup(){

    editingMaterialIndex = -1;

    document.getElementById(
        "materialPopup"
    ).style.display = "flex";

    resetMaterialPopup();
}


// -----------------------------------------------------
// CLOSE POPUP
// -----------------------------------------------------

function closeMaterialPopup(){

    document.getElementById(
        "materialPopup"
    ).style.display = "none";

}


// -----------------------------------------------------
// RESET POPUP
// -----------------------------------------------------

function resetMaterialPopup(){

    document.getElementById(
        "materialPopupTitle"
    ).innerText = "Add Material";

    document.getElementById(
        "materialName"
    ).value = "";

    document.getElementById(
        "materialE"
    ).value = "";

    document.getElementById(
        "materialG"
    ).value = "";

}


// -----------------------------------------------------
// SAVE MATERIAL
// -----------------------------------------------------

function saveMaterial(){

    const name =
        document.getElementById(
            "materialName"
        ).value.trim();

    const E =
        +document.getElementById(
            "materialE"
        ).value;

    const G =
        +document.getElementById(
            "materialG"
        ).value;


    if(name === ""){

        alert("Please enter a material name.");

        return;
    }


    if(!Number.isFinite(E) || E <= 0){

        alert("Please enter a valid E value.");

        return;
    }


    if(!Number.isFinite(G) || G <= 0){

        alert("Please enter a valid G value.");

        return;
    }


    // CHECK DUPLICATE NAME
    const duplicate =
        materialDatabase.some(
            (material,index) =>
                index !== editingMaterialIndex &&
                material.name.toLowerCase() ===
                name.toLowerCase()
        );


    if(duplicate){

        alert(
            `Material "${name}" already exists.`
        );

        return;
    }


    const material = {

        name: name,

        E: E,

        G: G,

        assignedMembers:
            editingMaterialIndex >= 0
            ?
            [
                ...materialDatabase[
                    editingMaterialIndex
                ].assignedMembers
            ]
            :
            []

    };


    if(editingMaterialIndex >= 0){

        materialDatabase[
            editingMaterialIndex
        ] = material;

        editingMaterialIndex = -1;

    }

    else{

        materialDatabase.push(material);

    }


    renderMaterialCards();

    closeMaterialPopup();

    refreshView();

}


// -----------------------------------------------------
// RENDER MATERIAL CARDS
// -----------------------------------------------------

function renderMaterialCards(){

    const container =
        document.getElementById(
            "materialCardContainer"
        );

    container.innerHTML = "";


    materialDatabase.forEach(
        (material,index)=>{

            const template =
                document.getElementById(
                    "materialCardTemplate"
                );


            const card =
                template.firstElementChild
                .cloneNode(true);


            // -----------------------------------------
            // TITLE
            // -----------------------------------------

            card.querySelector(
                ".material-title"
            ).innerText =
                material.name;


            // -----------------------------------------
            // DESCRIPTION
            // -----------------------------------------

            card.querySelector(
                ".material-description"
            ).innerText =

                `E = ${material.E} kN/m²` +
                ` | G = ${material.G} kN/m²`;


            // -----------------------------------------
            // ASSIGNMENT
            // -----------------------------------------

            card.querySelector(
                ".material-assignment"
            ).innerText =

                `Members: ${
                    material.assignedMembers.join(", ")
                }`;


            const assignmentInput =
                card.querySelector(
                    ".material-assignment-input"
                );


            assignmentInput.value =
                material.assignedMembers.join(", ");


            const assignButton =
                card.querySelector(
                    ".assign-material-btn"
                );


            assignButton.disabled = true;


            assignmentInput.addEventListener(
                "input",
                ()=>{

                    assignButton.disabled =
                        assignmentInput.value.trim()
                        ===
                        material.assignedMembers
                            .join(", ")
                            .trim();

                }
            );


            assignButton.onclick =
                () => assignMaterial(index);

            const assignAllButton =
                card.querySelector(
                    ".assign-all-btn"
                );

            assignAllButton.onclick =
                () => openAssignAllConfirmation(
                    "material",
                    index
                );


            // -----------------------------------------
            // EDIT / DELETE
            // -----------------------------------------

            card.querySelector(
                ".edit-material-btn"
            ).onclick =
                () => editMaterial(index);


            card.querySelector(
                ".delete-btn"
            ).onclick =
                () => deleteMaterial(index);


            container.appendChild(card);

        }
    );

}


// -----------------------------------------------------
// ASSIGN MATERIAL
// -----------------------------------------------------

function assignMaterial(index){

    const card =
        document.getElementById(
            "materialCardContainer"
        ).children[index];


    const input =
        card.querySelector(
            ".material-assignment-input"
        );


    const members =
        input.value
            .split(",")
            .map(v => v.trim())
            .filter(v => v !== "");


    const existingMembers =
        getMembers()
            .map(member => String(member.name));


    // CHECK INVALID MEMBERS

    const invalidMembers =
        members.filter(
            member =>
                !existingMembers.includes(
                    String(member)
                )
        );


    if(invalidMembers.length > 0){

        alert(
            `Member ${
                [...new Set(invalidMembers)].join(", ")
            } does not exist.`
        );

        return;
    }


    // CHECK DUPLICATE MATERIAL ASSIGNMENT

    const duplicateMembers = [];


    members.forEach(member => {

        materialDatabase.forEach(
            (material,materialIndex)=>{

                if(materialIndex === index){
                    return;
                }


                if(
                    material.assignedMembers
                        .map(String)
                        .includes(String(member))
                ){

                    duplicateMembers.push(member);

                }

            }
        );

    });


    if(duplicateMembers.length > 0){

        alert(
            `Member ${
                [...new Set(duplicateMembers)].join(", ")
            } is already assigned to another material.`
        );

        return;
    }


    materialDatabase[index].assignedMembers =
        members;


    renderMaterialCards();

    refreshView();

}


// -----------------------------------------------------
// EDIT MATERIAL
// -----------------------------------------------------

function editMaterial(index){

    const material =
        materialDatabase[index];


    editingMaterialIndex = index;


    document.getElementById(
        "materialPopup"
    ).style.display = "flex";


    document.getElementById(
        "materialPopupTitle"
    ).innerText = "Edit Material";


    document.getElementById(
        "materialName"
    ).value = material.name;


    document.getElementById(
        "materialE"
    ).value = material.E;


    document.getElementById(
        "materialG"
    ).value = material.G;

}


// -----------------------------------------------------
// DELETE MATERIAL
// -----------------------------------------------------

function deleteMaterial(index){

    materialDatabase.splice(index,1);

    renderMaterialCards();

    refreshView();

}


// #endregion


// #region =====================================================
// SECTION PROPERTY SYSTEM
// =====================================================

let sectionDatabase = [];

let editingSectionIndex = -1;

let betaDatabase = [];
let editingBetaIndex = -1;


switchPropertyCardType("section");


// -----------------------------------------------------
// SWITCH PROPERTY CARD TYPE
// -----------------------------------------------------

function switchPropertyCardType(type){

    const sectionTab =
        document.getElementById(
            "sectionPropertyTab"
        );

    const betaTab =
        document.getElementById(
            "betaPropertyTab"
        );

    const sectionContent =
        document.getElementById(
            "sectionPropertyContent"
        );

    const betaContent =
        document.getElementById(
            "betaPropertyContent"
        );


    if(type === "section"){

        sectionTab.classList.add("active");
        betaTab.classList.remove("active");

        sectionContent.style.display = "flex";
        betaContent.style.display = "none";

        renderSectionCards();

    }

    else{

        sectionTab.classList.remove("active");
        betaTab.classList.add("active");

        sectionContent.style.display = "none";
        betaContent.style.display = "flex";

        renderBetaCards();

    }

}


// -----------------------------------------------------
// OPEN POPUP
// -----------------------------------------------------

function openSectionPopup(){

    editingSectionIndex = -1;

    document.getElementById(
        "sectionPopup"
    ).style.display = "flex";

    resetSectionPopup();
}


// -----------------------------------------------------
// CLOSE POPUP
// -----------------------------------------------------

function closeSectionPopup(){

    document.getElementById(
        "sectionPopup"
    ).style.display = "none";

}


// -----------------------------------------------------
// RESET POPUP
// -----------------------------------------------------

function resetSectionPopup(){

    document.getElementById(
        "sectionPopupTitle"
    ).innerText = "Add Section";


    document.getElementById(
        "sectionName"
    ).value = "";


    document.getElementById(
        "sectionType"
    ).value = "rectangular";


    document.getElementById(
        "sectionGeometryFields"
    ).innerHTML = "";


    document.getElementById(
        "sectionA"
    ).value = "";

    document.getElementById(
        "sectionIyy"
    ).value = "";

    document.getElementById(
        "sectionIzz"
    ).value = "";

    document.getElementById(
        "sectionJ"
    ).value = "";


    updateSectionShape();
}

// =====================================================
// SECTION SHAPE SYSTEM
// =====================================================

function updateSectionShape(){

    const type =
        document.getElementById(
            "sectionType"
        ).value;

    const geometry =
        document.getElementById(
            "sectionGeometryFields"
        );

    const figure =
        document.getElementById(
            "sectionShapeFigure"
        );

    const instructions =
        document.getElementById(
            "sectionShapeInstructions"
        );

    // -------------------------------------------------
    // PROPERTY FIELD STATE
    // -------------------------------------------------

    const propertyFields = [
        "sectionA",
        "sectionIyy",
        "sectionIzz",
        "sectionJ"
    ];

    propertyFields.forEach(id => {

        const field =
            document.getElementById(id);

        field.readOnly =
            type !== "custom";

    });


    // -------------------------------------------------
    // RECTANGULAR
    // -------------------------------------------------

    if(type === "rectangular"){

        geometry.innerHTML = `

            <label>
                b
                <input
                    type="text"
                    id="section_b"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                d
                <input
                    type="text"
                    id="section_d"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

        `;


        figure.innerHTML = `

            <svg
                viewBox="0 0 240 180"
                class="section-svg">

                <rect
                    x="70"
                    y="35"
                    width="100"
                    height="110"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <line
                    x1="70"
                    y1="25"
                    x2="170"
                    y2="25"
                    stroke="#222"/>

                <text
                    x="120"
                    y="18"
                    text-anchor="middle">
                    b
                </text>

                <line
                    x1="180"
                    y1="35"
                    x2="180"
                    y2="145"
                    stroke="#222"/>

                <text
                    x="195"
                    y="95"
                    text-anchor="middle">
                    d
                </text>

            </svg>
        `;


        instructions.innerHTML = `
            <b>Rectangular Section</b><br><br>

            <b>b</b> = Width<br>
            <b>d</b> = Depth<br><br>

            Enter dimensions in <b>m</b>.
        `;
    }


    // -------------------------------------------------
    // SOLID CIRCULAR
    // -------------------------------------------------

    else if(type === "circular"){

        geometry.innerHTML = `

            <label>
                r
                <input
                    type="text"
                    id="section_r"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

        `;


        figure.innerHTML = `

            <svg
                viewBox="0 0 240 180"
                class="section-svg">

                <circle
                    cx="120"
                    cy="90"
                    r="55"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <line
                    x1="120"
                    y1="90"
                    x2="165"
                    y2="50"
                    stroke="#222"
                    marker-end="url(#arrow)"/>

                <text
                    x="145"
                    y="62">
                    r
                </text>

            </svg>
        `;


        instructions.innerHTML = `
            <b>Solid Circular Section</b><br><br>

            <b>r</b> = Radius<br><br>

            Enter radius in <b>m</b>.
        `;
    }


    // -------------------------------------------------
    // HOLLOW CIRCULAR
    // -------------------------------------------------

    else if(type === "hollow_circular"){

        geometry.innerHTML = `

            <label>
                r
                <input
                    type="text"
                    id="section_r_outer"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                t
                <input
                    type="text"
                    id="section_t"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

        `;


        figure.innerHTML = `

            <svg
                viewBox="0 0 240 180"
                class="section-svg">

                <circle
                    cx="120"
                    cy="90"
                    r="60"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <circle
                    cx="120"
                    cy="90"
                    r="42"
                    fill="white"
                    stroke="#222"
                    stroke-width="2"/>

                <line
                    x1="120"
                    y1="90"
                    x2="165"
                    y2="52"
                    stroke="#222"/>

                <text
                    x="145"
                    y="63">
                    r
                </text>

                <line
                    x1="160"
                    y1="48"
                    x2="174"
                    y2="38"
                    stroke="#222"/>

                <text
                    x="177"
                    y="35">
                    t
                </text>

            </svg>
        `;


        instructions.innerHTML = `
            <b>Hollow Circular Section</b><br><br>

            <b>r</b> = Outer radius<br>
            <b>t</b> = Wall thickness<br><br>

            Inner radius = r − t<br><br>

            Enter dimensions in <b>m</b>.
        `;
    }


    // -------------------------------------------------
    // I SECTION
    // -------------------------------------------------

    else if(type === "i_section"){

        geometry.innerHTML = `

            <label>
                bf
                <input
                    type="text"
                    id="section_bf"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                h
                <input
                    type="text"
                    id="section_h"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                tw
                <input
                    type="text"
                    id="section_tw"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                tf
                <input
                    type="text"
                    id="section_tf"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

        `;


        figure.innerHTML = `

            <svg
                viewBox="0 0 280 240"
                class="section-svg">

                <!-- I SECTION -->

                <!-- TOP FLANGE -->
                <rect
                    x="75"
                    y="50"
                    width="130"
                    height="18"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <!-- WEB -->
                <rect
                    x="125"
                    y="68"
                    width="30"
                    height="104"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <!-- BOTTOM FLANGE -->
                <rect
                    x="75"
                    y="172"
                    width="130"
                    height="18"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>


                <!-- bf DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="75"
                    y1="50"
                    x2="75"
                    y2="30"
                    stroke="#222"/>

                <line
                    x1="205"
                    y1="50"
                    x2="205"
                    y2="30"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="75"
                    y1="30"
                    x2="205"
                    y2="30"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="72"
                    y1="27"
                    x2="78"
                    y2="33"
                    stroke="#222"/>

                <line
                    x1="202"
                    y1="27"
                    x2="208"
                    y2="33"
                    stroke="#222"/>

                <text
                    x="140"
                    y="23"
                    text-anchor="middle"
                    fill="#222">
                    bf
                </text>


                <!-- h DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="205"
                    y1="50"
                    x2="225"
                    y2="50"
                    stroke="#222"/>

                <line
                    x1="205"
                    y1="190"
                    x2="225"
                    y2="190"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="225"
                    y1="50"
                    x2="225"
                    y2="190"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="222"
                    y1="53"
                    x2="228"
                    y2="47"
                    stroke="#222"/>

                <line
                    x1="222"
                    y1="187"
                    x2="228"
                    y2="193"
                    stroke="#222"/>

                <text
                    x="238"
                    y="123"
                    text-anchor="middle"
                    fill="#222">
                    h
                </text>


                <!-- tf DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="75"
                    y1="50"
                    x2="50"
                    y2="50"
                    stroke="#222"/>

                <line
                    x1="125"
                    y1="68"
                    x2="50"
                    y2="68"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="68"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="47"
                    y1="53"
                    x2="53"
                    y2="47"
                    stroke="#222"/>

                <line
                    x1="47"
                    y1="71"
                    x2="53"
                    y2="65"
                    stroke="#222"/>

                <text
                    x="38"
                    y="62"
                    text-anchor="middle"
                    fill="#222">
                    tf
                </text>


                <!-- tw DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="125"
                    y1="172"
                    x2="125"
                    y2="215"
                    stroke="#222"/>

                <line
                    x1="155"
                    y1="172"
                    x2="155"
                    y2="215"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="125"
                    y1="215"
                    x2="155"
                    y2="215"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="122"
                    y1="212"
                    x2="128"
                    y2="218"
                    stroke="#222"/>

                <line
                    x1="152"
                    y1="212"
                    x2="158"
                    y2="218"
                    stroke="#222"/>

                <text
                    x="140"
                    y="232"
                    text-anchor="middle"
                    fill="#222">
                    tw
                </text>

            </svg>
        `;


        instructions.innerHTML = `
            <b>I-Section</b><br><br>

            <b>bf</b> = Flange width<br>
            <b>h</b> = Overall depth<br>
            <b>tw</b> = Web thickness<br>
            <b>tf</b> = Flange thickness<br><br>

            Enter dimensions in <b>m</b>.
        `;
    }


    // -------------------------------------------------
    // BOX SECTION
    // -------------------------------------------------

    else if(type === "box"){

        geometry.innerHTML = `

            <label>
                b
                <input
                    type="text"
                    id="section_box_b"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                h
                <input
                    type="text"
                    id="section_box_h"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                tw
                <input
                    type="text"
                    id="section_box_tw"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

            <label>
                tf
                <input
                    type="text"
                    id="section_box_tf"
                    step="any"
                    min="0"
                    oninput="calculateSectionProperties()">
            </label>

        `;


        figure.innerHTML = `

            <svg
                viewBox="0 0 280 240"
                class="section-svg">

                <!-- OUTER BOX -->

                <rect
                    x="75"
                    y="50"
                    width="130"
                    height="140"
                    fill="#d9d9d9"
                    stroke="#222"
                    stroke-width="2"/>

                <!-- INNER VOID -->

                <rect
                    x="90"
                    y="65"
                    width="100"
                    height="110"
                    fill="white"
                    stroke="#222"
                    stroke-width="2"/>


                <!-- b DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="75"
                    y1="50"
                    x2="75"
                    y2="30"
                    stroke="#222"/>

                <line
                    x1="205"
                    y1="50"
                    x2="205"
                    y2="30"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="75"
                    y1="30"
                    x2="205"
                    y2="30"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="72"
                    y1="27"
                    x2="78"
                    y2="33"
                    stroke="#222"/>

                <line
                    x1="202"
                    y1="27"
                    x2="208"
                    y2="33"
                    stroke="#222"/>

                <text
                    x="140"
                    y="23"
                    text-anchor="middle"
                    fill="#222">
                    b
                </text>


                <!-- h DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="205"
                    y1="50"
                    x2="225"
                    y2="50"
                    stroke="#222"/>

                <line
                    x1="205"
                    y1="190"
                    x2="225"
                    y2="190"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="225"
                    y1="50"
                    x2="225"
                    y2="190"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="222"
                    y1="53"
                    x2="228"
                    y2="47"
                    stroke="#222"/>

                <line
                    x1="222"
                    y1="187"
                    x2="228"
                    y2="193"
                    stroke="#222"/>

                <text
                    x="238"
                    y="123"
                    text-anchor="middle"
                    fill="#222">
                    h
                </text>


                <!-- tf DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="75"
                    y1="50"
                    x2="50"
                    y2="50"
                    stroke="#222"/>

                <line
                    x1="90"
                    y1="65"
                    x2="50"
                    y2="65"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="50"
                    y1="50"
                    x2="50"
                    y2="65"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="47"
                    y1="53"
                    x2="53"
                    y2="47"
                    stroke="#222"/>

                <line
                    x1="47"
                    y1="68"
                    x2="53"
                    y2="62"
                    stroke="#222"/>

                <text
                    x="38"
                    y="61"
                    text-anchor="middle"
                    fill="#222">
                    tf
                </text>


                <!-- tw DIMENSION -->

                <!-- Extension lines -->
                <line
                    x1="75"
                    y1="190"
                    x2="75"
                    y2="215"
                    stroke="#222"/>

                <line
                    x1="90"
                    y1="175"
                    x2="90"
                    y2="215"
                    stroke="#222"/>

                <!-- Dimension line -->
                <line
                    x1="75"
                    y1="215"
                    x2="90"
                    y2="215"
                    stroke="#222"/>

                <!-- End ticks -->
                <line
                    x1="72"
                    y1="212"
                    x2="78"
                    y2="218"
                    stroke="#222"/>

                <line
                    x1="87"
                    y1="212"
                    x2="93"
                    y2="218"
                    stroke="#222"/>

                <text
                    x="82.5"
                    y="232"
                    text-anchor="middle"
                    fill="#222">
                    tw
                </text>

            </svg>
        `;


        instructions.innerHTML = `
            <b>Box / Rectangular Hollow Section</b><br><br>

            <b>b</b> = Overall width<br>
            <b>h</b> = Overall depth<br>
            <b>tw</b> = Wall thickness<br>
            <b>tf</b> = Flange thickness<br><br>

            Enter dimensions in <b>m</b>.
        `;
    }

    // -------------------------------------------------
    // CUSTOM
    // -------------------------------------------------

    else if(type === "custom"){

        geometry.innerHTML = `

            <div class="custom-section-note">

                Enter the section properties directly.

            </div>

        `;


        figure.innerHTML = `

            <div class="custom-section-figure">

                <div class="custom-section-symbol">
                    CUSTOM
                </div>

                <div>
                    Enter A, Iyy, Izz and J
                    manually.
                </div>

            </div>

        `;


        instructions.innerHTML = `
            <b>Custom Section</b><br><br>

            Enter the section properties directly:<br><br>

            <b>A</b> = Cross-sectional area<br>
            <b>Iyy</b> = Moment of inertia about y-y axis<br>
            <b>Izz</b> = Moment of inertia about z-z axis<br>
            <b>J</b> = Torsional constant<br><br>

            Units:<br>
            A → m²<br>
            Iyy, Izz, J → m⁴
        `;


        // Make property fields editable
        document.getElementById(
            "sectionA"
        ).readOnly = false;

        document.getElementById(
            "sectionIyy"
        ).readOnly = false;

        document.getElementById(
            "sectionIzz"
        ).readOnly = false;

        document.getElementById(
            "sectionJ"
        ).readOnly = false;


        return;
    }


    calculateSectionProperties();
}

// =====================================================
// CALCULATE SECTION PROPERTIES
// =====================================================

function calculateSectionProperties(){

    const type =
        document.getElementById(
            "sectionType"
        ).value;


    let A = 0;
    let Iyy = 0;
    let Izz = 0;
    let J = 0;

    // =================================================
    // CUSTOM
    // =================================================

    if(type === "custom"){
        return;
    }


    // =================================================
    // RECTANGULAR
    // =================================================

    if(type === "rectangular"){

        const b =
            Number(
                document.getElementById(
                    "section_b"
                )?.value
            );

        const d =
            Number(
                document.getElementById(
                    "section_d"
                )?.value
            );


        if(b > 0 && d > 0){

            A = b * d;

            Izz =
                b * Math.pow(d,3) / 12;

            Iyy =
                d * Math.pow(b,3) / 12;


            // Approximate Saint-Venant torsional constant
            const a = Math.max(b,d);
            const c = Math.min(b,d);

            J =
                a * Math.pow(c,3) *
                (
                    1/3
                    -
                    0.21 * (c/a) *
                    (
                        1 -
                        Math.pow(c,4) /
                        (12 * Math.pow(a,4))
                    )
                );
        }
    }


    // =================================================
    // SOLID CIRCULAR
    // =================================================

    else if(type === "circular"){

        const r =
            Number(
                document.getElementById(
                    "section_r"
                )?.value
            );


        if(r > 0){

            A =
                Math.PI * Math.pow(r,2);

            Iyy =
                Math.PI *
                Math.pow(r,4) / 4;

            Izz =
                Iyy;

            J =
                Math.PI *
                Math.pow(r,4) / 2;
        }
    }


    // =================================================
    // HOLLOW CIRCULAR
    // =================================================

    else if(type === "hollow_circular"){

        const r =
            Number(
                document.getElementById(
                    "section_r_outer"
                )?.value
            );

        const t =
            Number(
                document.getElementById(
                    "section_t"
                )?.value
            );


        const ri = r - t;


        if(
            r > 0 &&
            t > 0 &&
            ri > 0
        ){

            A =
                Math.PI *
                (
                    Math.pow(r,2) -
                    Math.pow(ri,2)
                );

            Iyy =
                Math.PI *
                (
                    Math.pow(r,4) -
                    Math.pow(ri,4)
                ) / 4;

            Izz =
                Iyy;

            J =
                Math.PI *
                (
                    Math.pow(r,4) -
                    Math.pow(ri,4)
                ) / 2;
        }
    }


    // =================================================
    // I SECTION
    // =================================================

    else if(type === "i_section"){

        const bf =
            Number(
                document.getElementById(
                    "section_bf"
                )?.value
            );

        const h =
            Number(
                document.getElementById(
                    "section_h"
                )?.value
            );

        const tw =
            Number(
                document.getElementById(
                    "section_tw"
                )?.value
            );

        const tf =
            Number(
                document.getElementById(
                    "section_tf"
                )?.value
            );


        const hw =
            h - 2 * tf;


        if(
            bf > 0 &&
            h > 0 &&
            tw > 0 &&
            tf > 0 &&
            hw > 0 &&
            tw < bf
        ){

            A =
                2 * bf * tf +
                hw * tw;


            // About horizontal centroidal axis
            Iyy =
                2 *
                (
                    bf * Math.pow(tf,3) / 12
                    +
                    bf * tf *
                    Math.pow(
                        h/2 - tf/2,
                        2
                    )
                )
                +
                tw * Math.pow(hw,3) / 12;


            // About vertical centroidal axis
            Izz =
                2 *
                (
                    tf * Math.pow(bf,3) / 12
                )
                +
                hw * Math.pow(tw,3) / 12;


            // Thin-walled approximation
            J =
                (
                    2 * bf * Math.pow(tf,3)
                    +
                    hw * Math.pow(tw,3)
                ) / 3;
        }
    }


    // =================================================
    // BOX SECTION
    // =================================================

    else if(type === "box"){

        const b =
            Number(
                document.getElementById(
                    "section_box_b"
                )?.value
            );

        const h =
            Number(
                document.getElementById(
                    "section_box_h"
                )?.value
            );

        const tw =
            Number(
                document.getElementById(
                    "section_box_tw"
                )?.value
            );

        const tf =
            Number(
                document.getElementById(
                    "section_box_tf"
                )?.value
            );


        const bi =
            b - 2 * tw;

        const hi =
            h - 2 * tf;


        if(
            b > 0 &&
            h > 0 &&
            tw > 0 &&
            tf > 0 &&
            bi > 0 &&
            hi > 0
        ){

            A =
                b * h -
                bi * hi;


            Iyy =
                (
                    b * Math.pow(h,3)
                    -
                    bi * Math.pow(hi,3)
                ) / 12;


            Izz =
                (
                    h * Math.pow(b,3)
                    -
                    hi * Math.pow(bi,3)
                ) / 12;


            // Thin-walled closed-section approximation
            const bm = b - tw;
            const hm = h - tf;

            const Am = bm * hm;

            J =
                4 * Math.pow(Am,2) /
                (
                    2 * bm / tf +
                    2 * hm / tw
                );
        }
    }


    // =================================================
    // DISPLAY
    // =================================================

    document.getElementById(
        "sectionA"
    ).value =
        A > 0 ? A.toPrecision(6) : "";

    document.getElementById(
        "sectionIyy"
    ).value =
        Iyy > 0 ? Iyy.toPrecision(6) : "";

    document.getElementById(
        "sectionIzz"
    ).value =
        Izz > 0 ? Izz.toPrecision(6) : "";

    document.getElementById(
        "sectionJ"
    ).value =
        J > 0 ? J.toPrecision(6) : "";
}


// =====================================================
// GET SECTION DIMENSIONS
// =====================================================

function getSectionDimensions(){

    const type =
        document.getElementById(
            "sectionType"
        ).value;


    if(type === "rectangular"){

        return {
            b: Number(
                document.getElementById(
                    "section_b"
                ).value
            ),

            d: Number(
                document.getElementById(
                    "section_d"
                ).value
            )
        };
    }


    if(type === "circular"){

        return {
            r: Number(
                document.getElementById(
                    "section_r"
                ).value
            )
        };
    }


    if(type === "hollow_circular"){

        return {
            r: Number(
                document.getElementById(
                    "section_r_outer"
                ).value
            ),

            t: Number(
                document.getElementById(
                    "section_t"
                ).value
            )
        };
    }


    if(type === "i_section"){

        return {

            bf: Number(
                document.getElementById(
                    "section_bf"
                ).value
            ),

            h: Number(
                document.getElementById(
                    "section_h"
                ).value
            ),

            tw: Number(
                document.getElementById(
                    "section_tw"
                ).value
            ),

            tf: Number(
                document.getElementById(
                    "section_tf"
                ).value
            )
        };
    }


    if(type === "box"){

        return {

            b: Number(
                document.getElementById(
                    "section_box_b"
                ).value
            ),

            h: Number(
                document.getElementById(
                    "section_box_h"
                ).value
            ),

            tw: Number(
                document.getElementById(
                    "section_box_tw"
                ).value
            ),

            tf: Number(
                document.getElementById(
                    "section_box_tf"
                ).value
            )
        };
    }

    if(type === "custom"){

        return {

            A: Number(
                document.getElementById(
                    "sectionA"
                ).value
            ),

            Iyy: Number(
                document.getElementById(
                    "sectionIyy"
                ).value
            ),

            Izz: Number(
                document.getElementById(
                    "sectionIzz"
                ).value
            ),

            J: Number(
                document.getElementById(
                    "sectionJ"
                ).value
            )

        };

    }


    return {};
}


// -----------------------------------------------------
// SAVE SECTION
// -----------------------------------------------------

function saveSection(){

    calculateSectionProperties();

    const name =
        document.getElementById(
            "sectionName"
        ).value.trim();

    const type =
        document.getElementById(
            "sectionType"
        ).value;

    const A =
        +document.getElementById(
            "sectionA"
        ).value;


    const Iyy =
        +document.getElementById(
            "sectionIyy"
        ).value;


    const Izz =
        +document.getElementById(
            "sectionIzz"
        ).value;


    const J =
        +document.getElementById(
            "sectionJ"
        ).value;


    if(name === ""){

        alert("Please enter a section name.");

        return;
    }


    if(!Number.isFinite(A) || A <= 0){

        alert("Please enter a valid A value.");

        return;
    }


    if(!Number.isFinite(Iyy) || Iyy <= 0){

        alert("Please enter a valid Iyy value.");

        return;
    }


    if(!Number.isFinite(Izz) || Izz <= 0){

        alert("Please enter a valid Izz value.");

        return;
    }


    if(!Number.isFinite(J) || J <= 0){

        alert("Please enter a valid J value.");

        return;
    }


    // CHECK DUPLICATE NAME

    const duplicate =
        sectionDatabase.some(
            (section,index) =>
                index !== editingSectionIndex &&
                section.name.toLowerCase() ===
                name.toLowerCase()
        );


    if(duplicate){

        alert(
            `Section "${name}" already exists.`
        );

        return;
    }


    const section = {

        name: name,

        type: type,

        dimensions: getSectionDimensions(),

        A: A,

        Iyy: Iyy,

        Izz: Izz,

        J: J,

        assignedMembers:
            editingSectionIndex >= 0
            ?
            [
                ...sectionDatabase[
                    editingSectionIndex
                ].assignedMembers
            ]
            :
            []

    };


    if(editingSectionIndex >= 0){

        sectionDatabase[
            editingSectionIndex
        ] = section;

        editingSectionIndex = -1;

    }

    else{

        sectionDatabase.push(section);

    }


    renderSectionCards();

    closeSectionPopup();

    refreshView();

}


// -----------------------------------------------------
// RENDER SECTION CARDS
// -----------------------------------------------------

function renderSectionCards(){

    const container =
        document.getElementById(
            "sectionCardContainer"
        );


    container.innerHTML = "";


    sectionDatabase.forEach(
        (section,index)=>{

            const template =
                document.getElementById(
                    "sectionCardTemplate"
                );


            const card =
                template.firstElementChild
                .cloneNode(true);


            // -----------------------------------------
            // TITLE
            // -----------------------------------------

            card.querySelector(
                ".section-title"
            ).innerText =
                section.name;


            // -----------------------------------------
            // DESCRIPTION
            // -----------------------------------------

            const sectionTypeNames = {

                rectangular:
                    "Rectangular",

                circular:
                    "Solid Circular",

                hollow_circular:
                    "Hollow Circular",

                i_section:
                    "I-Section",

                box:
                    "Rectangular Hollow",

                custom:
                    "Custom"

            };


            card.querySelector(
                ".section-description"
            ).innerText =

                `${sectionTypeNames[section.type] || "Custom"}` +

                ` | A = ${section.A} m²` +

                ` | Iyy = ${section.Iyy} m⁴` +

                ` | Izz = ${section.Izz} m⁴` +

                ` | J = ${section.J} m⁴`;

            // -----------------------------------------
            // ASSIGNMENT
            // -----------------------------------------

            card.querySelector(
                ".section-assignment"
            ).innerText =

                `Members: ${
                    section.assignedMembers.join(", ")
                }`;


            const assignmentInput =
                card.querySelector(
                    ".section-assignment-input"
                );


            assignmentInput.value =
                section.assignedMembers.join(", ");


            const assignButton =
                card.querySelector(
                    ".assign-section-btn"
                );


            assignButton.disabled = true;


            assignmentInput.addEventListener(
                "input",
                ()=>{

                    assignButton.disabled =
                        assignmentInput.value.trim()
                        ===
                        section.assignedMembers
                            .join(", ")
                            .trim();

                }
            );


            assignButton.onclick =
                () => assignSection(index);

            const assignAllButton =
                card.querySelector(
                    ".assign-all-btn"
                );

            assignAllButton.onclick =
                () => openAssignAllConfirmation(
                    "section",
                    index
                );


            // -----------------------------------------
            // EDIT / DELETE
            // -----------------------------------------

            card.querySelector(
                ".edit-section-btn"
            ).onclick =
                () => editSection(index);


            card.querySelector(
                ".delete-btn"
            ).onclick =
                () => deleteSection(index);


            container.appendChild(card);

        }
    );

}


// -----------------------------------------------------
// ASSIGN SECTION
// -----------------------------------------------------

function assignSection(index){

    const card =
        document.getElementById(
            "sectionCardContainer"
        ).children[index];


    const input =
        card.querySelector(
            ".section-assignment-input"
        );


    const members =
        input.value
            .split(",")
            .map(v => v.trim())
            .filter(v => v !== "");


    const existingMembers =
        getMembers()
            .map(member => String(member.name));


    // CHECK INVALID MEMBERS

    const invalidMembers =
        members.filter(
            member =>
                !existingMembers.includes(
                    String(member)
                )
        );


    if(invalidMembers.length > 0){

        alert(
            `Member ${
                [...new Set(invalidMembers)].join(", ")
            } does not exist.`
        );

        return;
    }


    // CHECK DUPLICATE SECTION ASSIGNMENT

    const duplicateMembers = [];


    members.forEach(member => {

        sectionDatabase.forEach(
            (section,sectionIndex)=>{

                if(sectionIndex === index){
                    return;
                }


                if(
                    section.assignedMembers
                        .map(String)
                        .includes(String(member))
                ){

                    duplicateMembers.push(member);

                }

            }
        );

    });


    if(duplicateMembers.length > 0){

        alert(
            `Member ${
                [...new Set(duplicateMembers)].join(", ")
            } is already assigned to another section.`
        );

        return;
    }


    sectionDatabase[index].assignedMembers =
        members;


    renderSectionCards();

    refreshView();

}


// -----------------------------------------------------
// EDIT SECTION
// -----------------------------------------------------

function editSection(index){

    const section =
        sectionDatabase[index];

    editingSectionIndex = index;


    document.getElementById(
        "sectionPopup"
    ).style.display = "flex";


    document.getElementById(
        "sectionPopupTitle"
    ).innerText = "Edit Section";


    document.getElementById(
        "sectionName"
    ).value =
        section.name;


    // -------------------------------------------------
    // SECTION TYPE
    // -------------------------------------------------

    const type =
        section.type || "custom";

    document.getElementById(
        "sectionType"
    ).value = type;


    // -------------------------------------------------
    // GENERATE INPUTS / FIGURE
    // -------------------------------------------------

    updateSectionShape();


    // -------------------------------------------------
    // RESTORE DIMENSIONS
    // -------------------------------------------------

    const dimensions =
        section.dimensions || {};


    if(type === "rectangular"){

        document.getElementById(
            "section_b"
        ).value =
            dimensions.b ?? "";

        document.getElementById(
            "section_d"
        ).value =
            dimensions.d ?? "";
    }


    else if(type === "circular"){

        document.getElementById(
            "section_r"
        ).value =
            dimensions.r ?? "";
    }


    else if(type === "hollow_circular"){

        document.getElementById(
            "section_r_outer"
        ).value =
            dimensions.r ?? "";

        document.getElementById(
            "section_t"
        ).value =
            dimensions.t ?? "";
    }


    else if(type === "i_section"){

        document.getElementById(
            "section_bf"
        ).value =
            dimensions.bf ?? "";

        document.getElementById(
            "section_h"
        ).value =
            dimensions.h ?? "";

        document.getElementById(
            "section_tw"
        ).value =
            dimensions.tw ?? "";

        document.getElementById(
            "section_tf"
        ).value =
            dimensions.tf ?? "";
    }


    else if(type === "box"){

        document.getElementById(
            "section_box_b"
        ).value =
            dimensions.b ?? "";

        document.getElementById(
            "section_box_h"
        ).value =
            dimensions.h ?? "";

        document.getElementById(
            "section_box_tw"
        ).value =
            dimensions.tw ?? "";

        document.getElementById(
            "section_box_tf"
        ).value =
            dimensions.tf ?? "";
    }


    // -------------------------------------------------
    // CUSTOM
    // -------------------------------------------------

    if(type === "custom"){

        document.getElementById(
            "sectionA"
        ).value =
            section.A ?? "";

        document.getElementById(
            "sectionIyy"
        ).value =
            section.Iyy ?? "";

        document.getElementById(
            "sectionIzz"
        ).value =
            section.Izz ?? "";

        document.getElementById(
            "sectionJ"
        ).value =
            section.J ?? "";
    }


    else{

        calculateSectionProperties();

    }

}


// -----------------------------------------------------
// DELETE SECTION
// -----------------------------------------------------

function deleteSection(index){

    sectionDatabase.splice(index,1);

    renderSectionCards();

    refreshView();

}


// -----------------------------------------------------
// OPEN BETA POPUP
// -----------------------------------------------------

function openBetaPopup(){

    editingBetaIndex = -1;

    document.getElementById(
        "betaPopup"
    ).style.display = "flex";

    resetBetaPopup();
}


// -----------------------------------------------------
// CLOSE BETA POPUP
// -----------------------------------------------------

function closeBetaPopup(){

    document.getElementById(
        "betaPopup"
    ).style.display = "none";

}


// -----------------------------------------------------
// RESET BETA POPUP
// -----------------------------------------------------

function resetBetaPopup(){

    document.getElementById(
        "betaPopupTitle"
    ).innerText = "Add Beta Angle";

    document.getElementById(
        "betaName"
    ).value = "";

    document.getElementById(
        "betaAngle"
    ).value = "";

}

//-----------------------------------------------------
// SAVE BETA ANGLE
//-----------------------------------------------------
function saveBeta(){

    const name =
        document.getElementById(
            "betaName"
        ).value.trim();

    const beta =
        Number(
            document.getElementById(
                "betaAngle"
            ).value
        );


    // -----------------------------------------
    // VALIDATION
    // -----------------------------------------

    if(name === ""){
        alert("Please enter a beta angle name.");
        return;
    }

    if(!Number.isFinite(beta)){
        alert("Please enter a valid beta angle.");
        return;
    }


    // -----------------------------------------
    // CHECK DUPLICATE NAME
    // -----------------------------------------

    const duplicate =
        betaDatabase.some(
            (item,index) =>
                index !== editingBetaIndex &&
                item.name.toLowerCase() ===
                name.toLowerCase()
        );

    if(duplicate){
        alert(
            `Beta angle "${name}" already exists.`
        );
        return;
    }


    // -----------------------------------------
    // CREATE BETA OBJECT
    // -----------------------------------------

    const betaProperty = {

        name: name,

        beta: beta,

        assignedMembers:
            editingBetaIndex >= 0
            ?
            [
                ...betaDatabase[
                    editingBetaIndex
                ].assignedMembers
            ]
            :
            []
    };


    // -----------------------------------------
    // SAVE
    // -----------------------------------------

    if(editingBetaIndex >= 0){

        betaDatabase[
            editingBetaIndex
        ] = betaProperty;

        editingBetaIndex = -1;

    }
    else{

        betaDatabase.push(
            betaProperty
        );

    }


    renderBetaCards();

    closeBetaPopup();

    refreshView();
}

// -----------------------------------------------------
// ASSIGN BETA ANGLE
// -----------------------------------------------------
function assignBeta(index){

    const card =
        document.getElementById(
            "betaCardContainer"
        ).children[index];

    const input =
        card.querySelector(
            ".beta-assignment-input"
        );

    const members =
        input.value
            .split(",")
            .map(v => v.trim())
            .filter(v => v !== "");


    // -----------------------------------------
    // EXISTING MEMBERS
    // -----------------------------------------

    const existingMembers =
        getMembers()
            .map(
                member =>
                    String(member.name)
            );


    // -----------------------------------------
    // INVALID MEMBERS
    // -----------------------------------------

    const invalidMembers =
        members.filter(
            member =>
                !existingMembers.includes(
                    String(member)
                )
        );

    if(invalidMembers.length > 0){

        alert(
            `Member ${
                [...new Set(invalidMembers)]
                    .join(", ")
            } does not exist.`
        );

        return;
    }


    // -----------------------------------------
    // DUPLICATE BETA ASSIGNMENT
    // -----------------------------------------

    const duplicateMembers = [];

    members.forEach(member => {

        betaDatabase.forEach(
            (betaProperty,betaIndex) => {

                if(betaIndex === index){
                    return;
                }

                if(
                    betaProperty.assignedMembers
                        .map(String)
                        .includes(String(member))
                ){
                    duplicateMembers.push(member);
                }

            }
        );

    });


    if(duplicateMembers.length > 0){

        alert(
            `Member ${
                [...new Set(duplicateMembers)]
                    .join(", ")
            } is already assigned to another beta angle.`
        );

        return;
    }


    // -----------------------------------------
    // ASSIGN
    // -----------------------------------------

    betaDatabase[index].assignedMembers =
        members;

    renderBetaCards();

    refreshView();
}

// -----------------------------------------------------
// RENDER BETA CARDS
// -----------------------------------------------------
function renderBetaCards(){

    const container =
        document.getElementById(
            "betaCardContainer"
        );

    container.innerHTML = "";


    betaDatabase.forEach(
        (betaProperty,index) => {

            const template =
                document.getElementById(
                    "betaCardTemplate"
                );

            const card =
                template
                    .firstElementChild
                    .cloneNode(true);


            // TITLE
            card.querySelector(
                ".beta-title"
            ).innerText =
                betaProperty.name;


            // DESCRIPTION
            card.querySelector(
                ".beta-description"
            ).innerText =
                `Beta = ${betaProperty.beta}°`;


            // ASSIGNMENT
            card.querySelector(
                ".beta-assignment"
            ).innerText =
                `Members: ${
                    betaProperty.assignedMembers.join(", ")
                }`;


            const input =
                card.querySelector(
                    ".beta-assignment-input"
                );

            input.value =
                betaProperty.assignedMembers.join(", ");


            const assignButton =
                card.querySelector(
                    ".assign-beta-btn"
                );

            assignButton.disabled = true;


            input.addEventListener(
                "input",
                () => {

                    assignButton.disabled =
                        input.value.trim()
                        ===
                        betaProperty.assignedMembers
                            .join(", ")
                            .trim();

                }
            );


            assignButton.onclick =
                () => assignBeta(index);

            const assignAllButton =
                card.querySelector(
                    ".assign-all-btn"
                );

            assignAllButton.onclick =
                () => openAssignAllConfirmation(
                    "beta",
                    index
                );


            card.querySelector(
                ".edit-beta-btn"
            ).onclick =
                () => editBeta(index);


            card.querySelector(
                ".delete-btn"
            ).onclick =
                () => deleteBeta(index);


            container.appendChild(card);

        }
    );
}


// -----------------------------------------------------
// EDIT BETA ANGLE
// -----------------------------------------------------

function editBeta(index){

    const betaProperty =
        betaDatabase[index];

    editingBetaIndex = index;


    document.getElementById(
        "betaPopup"
    ).style.display = "flex";


    document.getElementById(
        "betaPopupTitle"
    ).innerText =
        "Edit Beta Angle";


    document.getElementById(
        "betaName"
    ).value =
        betaProperty.name;


    document.getElementById(
        "betaAngle"
    ).value =
        betaProperty.beta;

}

// -----------------------------------------------------
// DELETE BETA ANGLE
// -----------------------------------------------------
function deleteBeta(index){

    betaDatabase.splice(index,1);

    renderBetaCards();

    refreshView();
}

// #endregion




// #region RESULT TAB SWITCHING
// =====================================================

function showResultTab(tabName,btn){

    // -------------------------------------------------
    // REMOVE ACTIVE BUTTON
    // -------------------------------------------------

    document
        .querySelectorAll(".results-nav-btn")
        .forEach(b=>{

            b.classList.remove(
                "active-result-tab"
            );
        });



    // -------------------------------------------------
    // REMOVE ACTIVE TAB
    // -------------------------------------------------

    document
        .querySelectorAll(".result-tab")
        .forEach(tab=>{

            tab.classList.remove(
                "active-result-tab-content"
            );
        });



    // -------------------------------------------------
    // ACTIVATE BUTTON
    // -------------------------------------------------

    btn.classList.add(
        "active-result-tab"
    );



    // -------------------------------------------------
    // ACTIVATE TAB
    // -------------------------------------------------

    document
        .getElementById(tabName)
        .classList.add(
            "active-result-tab-content"
        );
}

// #endregion



// #region EXPRESSION CALCULATOR
// =====================================================

// UNIT CONVERSION
function convertLengthUnit(value, unit){

    unit = unit.toLowerCase();

    if(unit === "mm"){
        return value / 1000;
    }

    if(unit === "cm"){
        return value / 100;
    }

    if(unit === "m"){
        return value;
    }

    if(unit === "in" || unit === '"'){
        return value * 0.0254;
    }

    if(unit === "ft" || unit === "'"){
        return value * 0.3048;
    }

    return null;
}


// CONVERT FEET + INCHES
function convertFeetInches(expression){

    let text = expression
        .trim()
        .replace(/\s+/g, "");

    // ---------------------------------------------
    // Feet + inches
    // Example: 2'11"
    // ---------------------------------------------

    let match = text.match(
        /^([+-]?\d+(?:\.\d+)?)'([+-]?\d+(?:\.\d+)?)"$/
    );

    if(match){

        const feet = Number(match[1]);
        const inches = Number(match[2]);

        return (
            feet * 0.3048 +
            inches * 0.0254
        );
    }


    // ---------------------------------------------
    // Feet only
    // Example: 2'
    // ---------------------------------------------

    match = text.match(
        /^([+-]?\d+(?:\.\d+)?)'$/
    );

    if(match){

        return Number(match[1]) * 0.3048;

    }


    // ---------------------------------------------
    // Inches only
    // Example: 11"
    // ---------------------------------------------

    match = text.match(
        /^([+-]?\d+(?:\.\d+)?)"$/
    );

    if(match){

        return Number(match[1]) * 0.0254;

    }


    return null;
}


// REPLACE UNITS WITH METRE VALUES
function replaceUnits(expression){

    let text = expression;

    // ---------------------------------------------
    // Feet + inches
    // 2'11"
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)'\s*([+-]?\d+(?:\.\d+)?)"/g,
        function(match, feet, inches){

            const value =
                Number(feet) * 0.3048 +
                Number(inches) * 0.0254;

            return value.toString();

        }
    );


    // ---------------------------------------------
    // Feet
    // 2'
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)'/g,
        function(match, feet){

            return (
                Number(feet) * 0.3048
            ).toString();

        }
    );


    // ---------------------------------------------
    // Inches
    // 11"
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)"/g,
        function(match, inches){

            return (
                Number(inches) * 0.0254
            ).toString();

        }
    );


    // ---------------------------------------------
    // Millimetres
    // 300mm
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)mm\b/gi,
        function(match, value){

            return (
                Number(value) / 1000
            ).toString();

        }
    );


    // ---------------------------------------------
    // Centimetres
    // 30cm
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)cm\b/gi,
        function(match, value){

            return (
                Number(value) / 100
            ).toString();

        }
    );


    // ---------------------------------------------
    // Metres
    // 2m
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)m\b/gi,
        function(match, value){

            return Number(value).toString();

        }
    );


    // ---------------------------------------------
    // Inches written as "in"
    // 12in
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)in\b/gi,
        function(match, value){

            return (
                Number(value) * 0.0254
            ).toString();

        }
    );


    // ---------------------------------------------
    // Feet written as "ft"
    // 2ft
    // ---------------------------------------------

    text = text.replace(
        /([+-]?\d+(?:\.\d+)?)ft\b/gi,
        function(match, value){

            return (
                Number(value) * 0.3048
            ).toString();

        }
    );


    return text;
}


// TOKENIZER
function tokenizeExpression(expression){

    const tokens = [];

    const regex =
        /\s*(\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|[+\-*/()])\s*/g;

    let position = 0;
    let match;


    while((match = regex.exec(expression)) !== null){

        // Something invalid exists between tokens
        if(match.index !== position){

            throw new Error("Invalid expression");

        }

        tokens.push(match[1]);

        position = regex.lastIndex;

    }


    if(position !== expression.length){

        throw new Error("Invalid expression");

    }


    return tokens;
}


// ARITHMETIC PARSER
function calculateExpression(expression){

    expression =
        replaceUnits(expression);

    const tokens =
        tokenizeExpression(expression);

    let position = 0;


    function parseExpression(){

        let value = parseTerm();


        while(
            tokens[position] === "+" ||
            tokens[position] === "-"
        ){

            const operator =
                tokens[position++];

            const right =
                parseTerm();


            if(operator === "+"){

                value += right;

            }
            else{

                value -= right;

            }

        }


        return value;

    }


    function parseTerm(){

        let value = parseFactor();


        while(
            tokens[position] === "*" ||
            tokens[position] === "/"
        ){

            const operator =
                tokens[position++];

            const right =
                parseFactor();


            if(operator === "*"){

                value *= right;

            }
            else{

                if(right === 0){

                    throw new Error(
                        "Division by zero"
                    );

                }

                value /= right;

            }

        }


        return value;

    }


    function parseFactor(){

        const token =
            tokens[position];


        // Unary +
        if(token === "+"){

            position++;

            return parseFactor();

        }


        // Unary -
        if(token === "-"){

            position++;

            return -parseFactor();

        }


        // Parentheses
        if(token === "("){

            position++;

            const value =
                parseExpression();


            if(tokens[position] !== ")"){

                throw new Error(
                    "Missing closing parenthesis"
                );

            }

            position++;

            return value;

        }


        // Number
        if(
            token !== undefined &&
            !isNaN(Number(token))
        ){

            position++;

            return Number(token);

        }


        throw new Error(
            "Invalid expression"
        );

    }


    const result =
        parseExpression();


    if(position !== tokens.length){

        throw new Error(
            "Invalid expression"
        );

    }


    if(!Number.isFinite(result)){

        throw new Error(
            "Invalid result"
        );

    }


    return result;
}

// MAIN CALCULATOR

// Evaluate expression and notify the existing UI logic
function evaluateInput(input){

    if(!input) return;

    const expression = input.value.trim();

    if(!expression){
        return;
    }

    try{

        const result = calculateExpression(expression);

        if(Number.isFinite(result)){

            input.value = result;

            // IMPORTANT:
            // Tell existing oninput handlers that the value changed
            input.dispatchEvent(
                new Event("input", {
                    bubbles: true
                })
            );

            // Also notify change-based handlers if any
            input.dispatchEvent(
                new Event("change", {
                    bubbles: true
                })
            );
        }

    }
    catch(error){

        // Keep original value if expression is invalid

    }
}


// Evaluate when leaving an input
document.addEventListener(
    "blur",
    function(event){

        if(
            event.target.matches(
                'input[type="text"]'
            )
        ){

            evaluateInput(event.target);

        }

    },
    true
);


// Evaluate when pressing Enter
document.addEventListener(
    "keydown",
    function(event){

        if(
            event.key === "Enter" &&
            event.target.matches(
                'input[type="text"]'
            )
        ){

            event.preventDefault();

            evaluateInput(event.target);

            event.target.blur();

        }

    }
);


// #endregion