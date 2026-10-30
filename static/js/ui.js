// =====================================================
// 1. GLOBAL UI HELPERS
// =====================================================

function openInfoPopup(){

    document.getElementById("infoPopupOverlay").style.display="flex";

}

function closeInfoPopup(){

    document.getElementById("infoPopupOverlay").style.display="none";

}



function openHelpPopup(){

    document.getElementById("helpPopupOverlay").style.display = "flex";

}

function closeHelpPopup(){

    document.getElementById("helpPopupOverlay").style.display = "none";

}



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

function switchModelTab(tabName, clickedButton) {
    const card = clickedButton.closest(".model-data-card");

    if (!card) return;

    const panels = {
        nodes: card.querySelector("#modelNodesPanel"),
        beams: card.querySelector("#modelBeamsPanel"),
        columns: card.querySelector("#modelColumnsPanel")
    };

    const buttons = card.querySelectorAll(".model-tab");

    buttons.forEach(button => {
        const isActive = button === clickedButton;

        button.classList.toggle("active", isActive);
        button.setAttribute(
            "aria-selected",
            String(isActive)
        );
    });

    Object.entries(panels).forEach(([name, panel]) => {
        if (!panel) return;

        const isActive = name === tabName;

        panel.hidden = !isActive;
        panel.classList.toggle("active", isActive);
    });
}


// =====================================================
// 2. SUPPORT SYSTEM
// =====================================================

let supportDatabase = [];

let editingSupportIndex = -1;

let currentSupportType = "support";

let selectedSupportIndex = -1;

let supportAssignmentMode = "none";

let supportMouseSelectedNodes = [];

let supportSelectionBox = null;

let supportRectangleDrag = {
    active: false,
    moved: false,
    startX: 0,
    startY: 0
};



function openSupportPopup(){

    editingSupportIndex = -1;

    currentSupportType = "support";

    document.getElementById(
        "supportPopup"
    ).style.display = "flex";

    resetSupportPopup();

    switchSupportType("support");
}

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

        selectedSupportIndex =
            editingSupportIndex;

        editingSupportIndex = -1;

    }

    else{

        supportDatabase.push(support);

        selectedSupportIndex =
            supportDatabase.length - 1;

    }

    supportAssignmentMode = "none";

    supportMouseSelectedNodes = [];

    renderSupportCards();

    closeSupportPopup();

    refreshView();

}



function renderSupportCards(){

    const container =
        document.getElementById(
            "supportCardContainer"
        );

    if(!container){
        return;
    }

    container.innerHTML = "";


    supportDatabase.forEach(
        (support,index)=>{

            const template =
                document.getElementById(
                    "supportCardTemplate"
                );

            if(!template){
                return;
            }

            const card =
                template
                    .firstElementChild
                    .cloneNode(true);

            card.dataset.supportIndex =
                String(index);


            // -----------------------------------------
            // TITLE
            // -----------------------------------------

            card.querySelector(
                ".support-title"
            ).innerText =
                `Support ${index + 1}`;


            // -----------------------------------------
            // RESTRAINED DOF
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
                `Restrained: ${
                    dofs.length
                    ?
                    dofs.join(", ")
                    :
                    "None"
                }`;


            // -----------------------------------------
            // PRESCRIBED DEFLECTION
            // -----------------------------------------

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


                if(values.length){

                    description +=
                        ` | ${values.join(", ")}`;

                }

            }


            card.querySelector(
                ".support-description"
            ).innerText =
                description;


            // -----------------------------------------
            // SELECT SUPPORT
            // -----------------------------------------

            card.addEventListener(
                "click",
                function(){

                    selectSupportForAssignment(Number(
                            card.dataset.supportIndex));

                }
            );


            // -----------------------------------------
            // SELECTED SUPPORT
            // -----------------------------------------

            if(
                index ===
                selectedSupportIndex
            ){

                card.classList.add(
                    "selected"
                );

            }


            container.appendChild(card);

        }
    );


    updateSupportAssignmentPanel();

    updateSupportActionButtons();

}

function updateSupportActionButtons() {

    const editButton =
        document.getElementById(
            "supportEditBtn"
        );

    const deleteButton =
        document.getElementById(
            "supportDeleteBtn"
        );


    const hasSelection =
        selectedSupportIndex >= 0 &&
        !!supportDatabase[
            selectedSupportIndex
        ];


    if (editButton) {

        editButton.disabled =
            !hasSelection;

    }


    if (deleteButton) {

        deleteButton.disabled =
            !hasSelection;

    }

}

function editSelectedSupport() {

    if (
        selectedSupportIndex < 0
    ) {
        return;
    }


    editSupport(
        selectedSupportIndex
    );

}

function deleteSelectedSupport() {

    if (
        selectedSupportIndex < 0
    ) {
        return;
    }


    deleteSupport(
        selectedSupportIndex
    );

}

function selectSupportForAssignment(index){

    const numericIndex =
        Number(index);

    if (
        !Number.isInteger(numericIndex)
    ) {
        return;
    }

    if (
        !supportDatabase[numericIndex]
    ) {
        return;
    }


    // STORE SELECTED SUPPORT
    selectedSupportIndex =
        numericIndex;

    // RESET ASSIGNMENT MODE
    supportAssignmentMode =
        "none";

    supportMouseSelectedNodes =
        [];


    // REFRESH BOTH UI PANELS
    renderSupportCards();

    // REFRESH 2D
    if (
        typeof renderDrawing2DNodes ===
        "function"
    ) {
        renderDrawing2DNodes();
    }

    refreshStructuralSelection();

    // REFRESH 3D
    if (
        typeof drawStructure ===
        "function"
    ) {
        drawStructure();
    }

}




function updateSupportAssignmentPanel(){

    const placeholder =
        document.getElementById(
            "supportAssignmentPlaceholder"
        );

    const content =
        document.getElementById(
            "supportAssignmentContent"
        );

    const label =
        document.getElementById(
            "selectedSupportLabel"
        );

    const input =
        document.getElementById(
            "supportNodeAssignmentInput"
        );

    const assignAll =
        document.getElementById(
            "supportAssignAllBtn"
        );

    const mouseButton =
        document.getElementById(
            "supportMouseAssignBtn"
        );

    const editButton =
        document.getElementById(
            "supportEditListBtn"
        );

    const assignButton =
        document.getElementById(
            "assignSelectedSupportBtn"
        );


    // NO SUPPORT SELECTED
    if (
        selectedSupportIndex < 0 ||
        !supportDatabase[selectedSupportIndex]
    ){

        if (label) {
            label.innerText =
                "No support selected";
        }

        if (placeholder) {
            placeholder.hidden = false;
        }

        if (content) {
            content.hidden = true;
        }

        if (input) {
            input.disabled = true;
            input.value = "";
        }

        if (assignAll) {
            assignAll.disabled = true;
        }

        if (mouseButton) {
            mouseButton.disabled = true;
        }

        if (editButton) {
            editButton.disabled = true;
        }

        if (assignButton) {
            assignButton.disabled = true;
        }

        const assignedNodes =
            document.getElementById(
                "supportAssignedNodes"
            );

        if (assignedNodes) {
            assignedNodes.innerHTML =
                `<span class="support-no-nodes">
                    No nodes assigned
                 </span>`;
        }

        return;
    }

    // SUPPORT SELECTED
    const support =
        supportDatabase[
            selectedSupportIndex
        ];


    // Update the assignment-card header
    if (label) {
        label.innerText =
            `Support ${
                selectedSupportIndex + 1}`;
    }

    // Show assignment content
    if (placeholder) {
        placeholder.hidden = true;
    }

    if (content) {
        content.hidden = false;
    }

    // INPUT
    if (input) {

        input.disabled =
            supportAssignmentMode !== "edit";

        if (
            supportAssignmentMode ===
            "mouse"
        ){

            input.value =
                supportMouseSelectedNodes
                    .join(", ");

        }
        else {

            input.value =
                (
                    support.assignedNodes ||
                    []
                ).join(", ");

        }
    }


    // BUTTONS
    if (assignAll) {
        assignAll.disabled = false;}

    if (mouseButton) {

        mouseButton.disabled = false;
        mouseButton.classList.toggle("active",
            supportAssignmentMode === "mouse");}

    if (editButton) {

        editButton.disabled = false;
        editButton.classList.toggle("active",
            supportAssignmentMode === "edit");}

    // ASSIGNED NODES
    renderAssignedSupportNodes(
        support
    );

    // FINAL ASSIGN BUTTON
    if (assignButton) {

        if (
            supportAssignmentMode ===
            "mouse"
        ){

            assignButton.disabled =
                supportMouseSelectedNodes.length === 0;

        }
        else if (
            supportAssignmentMode ===
            "edit"
        ){

            assignButton.disabled =
                !input ||
                input.value.trim() === "";

        }
        else {

            // No assignment tool active
            assignButton.disabled = true;

        }

    }

}

function renderAssignedSupportNodes(support){

    const container =
        document.getElementById(
            "supportAssignedNodes"
        );

    if(
        !support.assignedNodes ||
        support.assignedNodes.length === 0
    ){

        container.innerHTML =
            `<span class="support-no-nodes">
                No nodes assigned
             </span>`;

        return;
    }


    container.innerHTML =
        support.assignedNodes
            .map(
                node =>
                    `<span class="support-node-chip">
                        ${node}
                     </span>`
            )
            .join("");

}



function setSupportEditListMode(){

    if (selectedSupportIndex < 0) {
        return;
    }

    // CLICK ACTIVE TOOL AGAIN → DESELECT
    if (
        supportAssignmentMode === "edit"
    ){

        supportAssignmentMode =
            "none";

        supportMouseSelectedNodes =
            [];

        updateSupportAssignmentPanel();
        updateSupportNodeSelectorState();

        if (
            typeof renderDrawing2DNodes ===
            "function"
        ) {
            renderDrawing2DNodes();
        }

        refreshStructuralSelection();

        return;
    }

    // ACTIVATE EDIT LIST
    supportAssignmentMode =
        "edit";

    supportMouseSelectedNodes =
        [];


    updateSupportAssignmentPanel();
    updateSupportNodeSelectorState();

}

function setSupportMouseAssignmentMode(){

    if (selectedSupportIndex < 0) {
        return;
    }

    // CLICK ACTIVE TOOL AGAIN → DESELECT
    if (
        supportAssignmentMode === "mouse"
    ){

        supportAssignmentMode = "none";

        supportMouseSelectedNodes = [];

        supportRectangleDrag.active = false;
        supportRectangleDrag.moved = false;

        updateSupportAssignmentPanel();
        updateSupportNodeSelectorState();

        if (
            typeof renderDrawing2DNodes ===
            "function"
        ) {
            renderDrawing2DNodes();
        }

        refreshStructuralSelection();

        return;
    }

    // ACTIVATE MOUSE MODE
    supportAssignmentMode =
        "mouse";


    // Start with the nodes that are already assigned to this support.
    const support =
        supportDatabase[
            selectedSupportIndex
        ];

    supportMouseSelectedNodes =
        [
            ...new Set(
                (
                    support.assignedNodes ||
                    []
                ).map(String)
            )
        ];


    updateSupportAssignmentPanel();
    updateSupportNodeSelectorState();

    refreshStructuralSelection();

    initSupportMouseSelection();

}

function updateSupportNodeSelectorState(){

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;

    const status =
        document.getElementById(
            "drawing2DToolStatus"
        );

    if (!canvas) {
        return;
    }


    /*
       Mouse assignment mode:
       normal mouse pointer over nodes.
    */
    if (
        supportAssignmentMode ===
        "mouse"
    ) {

        canvas.style.cursor =
            "pointer";

        if (status) {
            status.innerText =
                "Node Selection";
        }

        return;
    }


    /*
       Edit-list mode:
       normal mouse, no active tool.
    */
    canvas.style.cursor =
        "default";

    if (status) {
        status.innerText = "";
    }
}

function updateSupportSelectionBox(startX, startY, endX, endY) {
    const canvas =
        window.drawing2D?.renderer?.domElement;

    if (!canvas) return;

    if (!supportSelectionBox) {
        supportSelectionBox =
            document.createElement("div");

        supportSelectionBox.style.position = "fixed";
        supportSelectionBox.style.pointerEvents = "none";
        supportSelectionBox.style.border = "1px dashed #2196f3";
        supportSelectionBox.style.background = "rgba(33,150,243,0.10)";
        supportSelectionBox.style.zIndex = "9999";

        document.body.appendChild(
            supportSelectionBox
        );
    }

    supportSelectionBox.style.left =
        Math.min(startX, endX) + "px";

    supportSelectionBox.style.top =
        Math.min(startY, endY) + "px";

    supportSelectionBox.style.width =
        Math.abs(endX - startX) + "px";

    supportSelectionBox.style.height =
        Math.abs(endY - startY) + "px";
}

function removeSupportSelectionBox() {
    if (supportSelectionBox) {
        supportSelectionBox.remove();
        supportSelectionBox = null;
    }
}

function initSupportMouseSelection(){

    const canvas =
        window.drawing2D
            ?.renderer
            ?.domElement;

    if(!canvas || canvas.dataset.supportSelectionReady){
        return;
    }

    canvas.dataset.supportSelectionReady = "true";


    canvas.addEventListener(
        "pointerdown",
        event => {

            if(
                supportAssignmentMode !== "mouse" ||
                event.button !== 0
            ){
                return;
            }

            supportRectangleDrag = {
                active: true,
                moved: false,
                startX: event.clientX,
                startY: event.clientY
            };

        }
    );


    canvas.addEventListener(
        "pointermove",
        event => {

            if(
                !supportRectangleDrag.active ||
                supportAssignmentMode !== "mouse"
            ){
                return;
            }

            updateSupportSelectionBox(
                supportRectangleDrag.startX,
                supportRectangleDrag.startY,
                event.clientX,
                event.clientY
            );

            const dx =
                event.clientX -
                supportRectangleDrag.startX;

            const dy =
                event.clientY -
                supportRectangleDrag.startY;

            if(
                Math.hypot(dx, dy) > 5
            ){
                supportRectangleDrag.moved = true;
            }

        }
    );


    canvas.addEventListener(
        "pointerup",
        event => {

            if(
                !supportRectangleDrag.active ||
                supportAssignmentMode !== "mouse"
            ){
                return;
            }

            const drag =
                supportRectangleDrag;

            removeSupportSelectionBox();

            supportRectangleDrag = {
                active: false,
                moved: false,
                startX: 0,
                startY: 0
            };


            // Single click → keep existing node-click logic
            if(!drag.moved){
                return;
            }


            selectSupportNodesInRectangle(
                canvas,
                drag.startX,
                drag.startY,
                event.clientX,
                event.clientY
            );

        }
    );

}

function selectSupportNodesInRectangle(
    canvas,
    startX,
    startY,
    endX,
    endY
){

    const drawing =
        window.drawing2D;

    if(
        !drawing?.camera ||
        typeof THREE === "undefined"
    ){
        return;
    }


    const rect =
        canvas.getBoundingClientRect();


    function screenToWorld(
        x,
        y
    ){

        const mouse =
            new THREE.Vector2(
                ((x - rect.left) / rect.width) * 2 - 1,
                -((y - rect.top) / rect.height) * 2 + 1
            );


        const raycaster =
            new THREE.Raycaster();

        raycaster.setFromCamera(
            mouse,
            drawing.camera
        );


        const plane =
            new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                0
            );

        const point =
            new THREE.Vector3();

        raycaster.ray.intersectPlane(
            plane,
            point
        );

        return point;
    }


    const a =
        screenToWorld(
            startX,
            startY
        );

    const b =
        screenToWorld(
            endX,
            endY
        );


    if(!a || !b){
        return;
    }


    const minX =
        Math.min(a.x, b.x);

    const maxX =
        Math.max(a.x, b.x);

    const minZ =
        Math.min(a.z, b.z);

    const maxZ =
        Math.max(a.z, b.z);


    const nodes =
        getSupportNodesInScope();


    const selected =
        nodes
            .filter(node =>
                Number(node.x) >= minX &&
                Number(node.x) <= maxX &&
                Number(node.z) >= minZ &&
                Number(node.z) <= maxZ
            )
            .map(node =>
                String(node.nodeId)
            );


    const selectedSet =
        new Set(
            supportMouseSelectedNodes
                .map(String)
        );


    selected.forEach(
        nodeId => {

            if(
                selectedSet.has(nodeId)
            ){

                // Rectangle over an already-selected node
                // removes it, same as clicking it again.
                selectedSet.delete(nodeId);

            }
            else{

                selectedSet.add(nodeId);

            }

        }
    );


    supportMouseSelectedNodes =
        [...selectedSet];


    updateSupportAssignmentPanel();
    updateSupportNodeSelectorState();

    refreshStructuralSelection();

}




function assignAllSupportNodes(){

    if(
        selectedSupportIndex < 0
    ){
        return;
    }


    const support =
        supportDatabase[
            selectedSupportIndex
        ];


    const nodes =
        getSupportNodesInScope()
            .map(
                node =>
                    String(node.nodeId)
            );


    if(!nodes.length){

        alert(
            "No nodes are available in the selected scope."
        );

        return;

    }


    const conflictingNodes = [];


    nodes.forEach(
        node => {

            supportDatabase.forEach(
                (otherSupport,index) => {

                    if(
                        index ===
                        selectedSupportIndex
                    ){
                        return;
                    }


                    if(
                        (
                            otherSupport.assignedNodes ||
                            []
                        )
                        .map(String)
                        .includes(
                            String(node)
                        )
                    ){

                        conflictingNodes.push(
                            node
                        );

                    }

                }
            );

        }
    );


    if(
        conflictingNodes.length
    ){

        alert(
            `Some nodes are already assigned to another support:\n\n` +
            `${[
                ...new Set(
                    conflictingNodes
                )
            ].join(", ")}`
        );

        return;

    }


    if(
        !confirm(
            `Assign all ${nodes.length} nodes in the selected scope to this support?`
        )
    ){

        return;

    }


    support.assignedNodes =
        nodes;


    supportMouseSelectedNodes =
        [];

    supportAssignmentMode =
        "edit";


    renderSupportCards();

    updateSupportAssignmentPanel();

    refreshView();

}

function getSupportAssignmentScope(){

    return window.drawing2DStoryScope === "all"
        ? "all"
        : "one";

}

function getSupportNodesInScope(){

    const nodes =
        Array.isArray(window.nodeDatabase)
        ?
        window.nodeDatabase
        :
        [];


    if(
        getSupportAssignmentScope() ===
        "all"
    ){

        return nodes;

    }


    const story =
        typeof getCurrentDrawing2DStory ===
        "function"
        ?
        getCurrentDrawing2DStory()
        :
        null;


    if(!story){
        return [];
    }


    return nodes.filter(
        node =>
            String(node.storyUid) ===
            String(story.id)
    );

}

function expandSupportNodesByScope(nodeIds){

    const ids =
        [...new Set(
            nodeIds.map(String)
        )];


    const nodes =
        Array.isArray(window.nodeDatabase)
        ?
        window.nodeDatabase
        :
        [];


    // =====================================================
    // ONE STORY
    // =====================================================

    if(
        getSupportAssignmentScope() ===
        "one"
    ){

        const story =
            typeof getCurrentDrawing2DStory ===
            "function"
            ?
            getCurrentDrawing2DStory()
            :
            null;


        if(!story){
            return [];
        }


        return ids
            .map(
                id =>
                    nodes.find(
                        node =>
                            String(node.nodeId) ===
                                String(id) &&
                            String(node.storyUid) ===
                                String(story.id)
                    )
            )
            .filter(Boolean)
            .map(
                node =>
                    String(node.nodeId)
            );

    }


    // =====================================================
    // ALL STORIES
    //
    // Same grid intersection on every story
    // =====================================================

    const result = [];


    ids.forEach(
        id => {

            const referenceNode =
                nodes.find(
                    node =>
                        String(node.nodeId) ===
                        String(id)
                );


            if(!referenceNode){
                return;
            }


            nodes.forEach(
                node => {

                    if(
                        String(node.xGridUid) ===
                            String(
                                referenceNode.xGridUid
                            ) &&

                        String(node.zGridUid) ===
                            String(
                                referenceNode.zGridUid
                            )
                    ){

                        result.push(
                            String(node.nodeId)
                        );

                    }

                }
            );

        }
    );


    return [
        ...new Set(result)
    ];

}

function assignSelectedSupportNodes(){

    if(
        selectedSupportIndex < 0
    ){
        return;
    }


    const support =
        supportDatabase[
            selectedSupportIndex
        ];


    let nodes = [];


    // =====================================================
    // MOUSE MODE
    // =====================================================

    if(
        supportAssignmentMode ===
        "mouse"
    ){

        nodes =
            [
                ...supportMouseSelectedNodes
            ];

    }


    // =====================================================
    // EDIT LIST MODE
    // =====================================================

    else{

        const input =
            document.getElementById(
                "supportNodeAssignmentInput"
            );


        if(!input){
            return;
        }


        const enteredNodes =
            input.value
                .split(",")
                .map(
                    value =>
                        value.trim()
                )
                .filter(
                    value =>
                        value !== ""
                );


        nodes =
            expandSupportNodesByScope(
                enteredNodes
            );


        // -----------------------------------------
        // CHECK INVALID NODES
        // -----------------------------------------

        const existingNodes =
            Array.isArray(
                window.nodeDatabase
            )
            ?
            window.nodeDatabase
                .map(
                    node =>
                        String(
                            node.nodeId
                        )
                )
            :
            [];


        const invalidNodes =
            enteredNodes.filter(
                id =>
                    !existingNodes.includes(
                        String(id)
                    )
            );


        if(
            invalidNodes.length
        ){

            alert(
                `Node ${
                    [
                        ...new Set(
                            invalidNodes
                        )
                    ].join(", ")
                } does not exist.`
            );

            return;

        }


        // -----------------------------------------
        // ONE STORY VALIDATION
        // -----------------------------------------

        if(
            getSupportAssignmentScope() ===
            "one"
        ){

            const story =
                getCurrentDrawing2DStory();


            const wrongStoryNodes =
                enteredNodes.filter(
                    id => {

                        const node =
                            window.nodeDatabase.find(
                                item =>
                                    String(
                                        item.nodeId
                                    ) ===
                                    String(id)
                            );


                        return (
                            node &&
                            String(
                                node.storyUid
                            ) !==
                            String(
                                story?.id
                            )
                        );

                    }
                );


            if(
                wrongStoryNodes.length
            ){

                alert(
                    `These nodes are not on the selected story:\n\n` +
                    `${wrongStoryNodes.join(", ")}`
                );

                return;

            }

        }

    }


    nodes =
        [
            ...new Set(
                nodes.map(String)
            )
        ];


    if(!nodes.length){

        alert(
            "Please select or enter at least one node."
        );

        return;

    }


    // =====================================================
    // DUPLICATE SUPPORT CHECK
    // =====================================================

    const duplicateNodes = [];


    nodes.forEach(
        node => {

            supportDatabase.forEach(
                (otherSupport,index) => {

                    if(
                        index ===
                        selectedSupportIndex
                    ){
                        return;
                    }


                    if(
                        (
                            otherSupport.assignedNodes ||
                            []
                        )
                        .map(String)
                        .includes(
                            String(node)
                        )
                    ){

                        duplicateNodes.push(
                            node
                        );

                    }

                }
            );

        }
    );


    if(
        duplicateNodes.length
    ){

        alert(
            `Node ${
                [
                    ...new Set(
                        duplicateNodes
                    )
                ].join(", ")
            } is already assigned to another support.`
        );

        return;

    }


    // =====================================================
    // APPLY
    // =====================================================

    support.assignedNodes =
        [...new Set(nodes.map(String))];

    // Clear temporary mouse selection
    supportMouseSelectedNodes =
        [];

    // Return to neutral state
    supportAssignmentMode = "none";

    renderSupportCards();

    updateSupportAssignmentPanel();

    renderDrawing2DSupports();

    refreshView();

    refreshStructuralSelection();

}



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

function deleteSupport(index){

    supportDatabase.splice(
        index,
        1
    );


    if(
        selectedSupportIndex ===
        index
    ){

        selectedSupportIndex =
            -1;

        supportMouseSelectedNodes =
            [];

        supportAssignmentMode =
            "edit";

    }
    else if(
        selectedSupportIndex >
        index
    ){

        selectedSupportIndex--;

    }


    renderSupportCards();

    updateSupportAssignmentPanel();

    renderDrawing2DSupports();

    refreshView();

}


// =====================================================
// 3. LOAD SYSTEM
// =====================================================


let loadDatabase = [];

let editingLoadIndex = -1;
let selectedLoadIndex = -1;

let loadAssignmentMode = "none";

let loadMouseSelectedNodes = [];
let loadMouseSelectedMembers = [];

let loadSelectionBox = null;

let loadRectangleDrag = {
    active: false,
    moved: false,
    startX: 0,
    startY: 0
};

let loadSuppressClickAt = null;


function openLoadPopup(){

    document.getElementById(
        "loadPopup"
    ).style.display = "flex";

    updateLoadPopup();
}

function closeLoadPopup(){

    document.getElementById(
        "loadPopup"
    ).style.display = "none";
}



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

        coordinate_system:
            document.getElementById(
                "loadCoordinateSystem"
            ).value,

        // FORCE COMPONENTS
        Fx:
            +document.getElementById(
                "loadFx"
            ).value || 0,

        Fy:
            +document.getElementById(
                "loadFy"
            ).value || 0,

        Fz:
            +document.getElementById(
                "loadFz"
            ).value || 0,

        // MOMENT COMPONENTS
        Mx:
            +document.getElementById(
                "loadMx"
            ).value || 0,

        My:
            +document.getElementById(
                "loadMy"
            ).value || 0,

        Mz:
            +document.getElementById(
                "loadMz"
            ).value || 0,

        // DISTRIBUTED LOAD
        wx:
            +document.getElementById(
                "loadWx"
            ).value || 0,

        wy:
            +document.getElementById(
                "loadWy"
            ).value || 0,

        wz:
            +document.getElementById(
                "loadWz"
            ).value || 0,

        // TRAPEZOIDAL START
        wx1:
            +document.getElementById(
                "loadWx1"
            ).value || 0,

        wy1:
            +document.getElementById(
                "loadWy1"
            ).value || 0,

        wz1:
            +document.getElementById(
                "loadWz1"
            ).value || 0,

        // TRAPEZOIDAL END
        wx2:
            +document.getElementById(
                "loadWx2"
            ).value || 0,

        wy2:
            +document.getElementById(
                "loadWy2"
            ).value || 0,

        wz2:
            +document.getElementById(
                "loadWz2"
            ).value || 0,

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

        assignedNodes: oldLoad
            ? [...(oldLoad.assignedNodes || [])]
            : [],

        assignedMembers: oldLoad
            ? [...(oldLoad.assignedMembers || [])]
            : []
    };



    if(editingLoadIndex >= 0){
        loadDatabase[editingLoadIndex] = load;
        editingLoadIndex = -1;
    }

    else{
        loadDatabase.push(load);
    }

    selectedLoadIndex = -1;

    resetLoadAssignmentInteraction("none");

    renderLoadCards();
    updateLoadAssignmentPanel();

    closeLoadPopup();

    refreshStructuralSelection();
    refreshView();
}



function renderLoadCards(){

    const container =
        document.getElementById(
            "loadCardContainer"
        );

    container.innerHTML = "";


    loadDatabase.forEach(
        (load, index) => {

            const template =
                document.getElementById(
                    "loadCardTemplate"
                );

            const card =
                template.firstElementChild
                    .cloneNode(true);


            // -----------------------------
            // LOAD DESCRIPTION
            // -----------------------------

            let values = {};
            let units = {};


            if(load.category === "nodal"){

                values = {
                    Fx: load.Fx,
                    Fy: load.Fy,
                    Fz: load.Fz,
                    Mx: load.Mx,
                    My: load.My,
                    Mz: load.Mz
                };

                units = {
                    Fx: " kN",
                    Fy: " kN",
                    Fz: " kN",
                    Mx: " kN·m",
                    My: " kN·m",
                    Mz: " kN·m"
                };

            }

            else if(
                load.type === "point"
            ){

                values = {
                    Fx: load.Fx,
                    Fy: load.Fy,
                    Fz: load.Fz,
                    Mx: load.Mx,
                    My: load.My,
                    Mz: load.Mz,
                    a: load.a
                };

                units = {
                    Fx: " kN",
                    Fy: " kN",
                    Fz: " kN",
                    Mx: " kN·m",
                    My: " kN·m",
                    Mz: " kN·m",
                    a: " m"
                };

            }

            else if(
                load.type === "udl" ||
                load.type === "partial_udl"
            ){

                values = {
                    wx: load.wx,
                    wy: load.wy,
                    wz: load.wz
                };

                units = {
                    wx: " kN/m",
                    wy: " kN/m",
                    wz: " kN/m"
                };

                if(
                    load.type ===
                    "partial_udl"
                ){

                    values.a = load.a;
                    values.b = load.b;

                    units.a = " m";
                    units.b = " m";

                }

            }

            else if(
                load.type ===
                "trapezoidal"
            ){

                values = {
                    wx1: load.wx1,
                    wy1: load.wy1,
                    wz1: load.wz1,
                    wx2: load.wx2,
                    wy2: load.wy2,
                    wz2: load.wz2
                };

                units = {
                    wx1: " kN/m",
                    wy1: " kN/m",
                    wz1: " kN/m",
                    wx2: " kN/m",
                    wy2: " kN/m",
                    wz2: " kN/m"
                };

            }


            let description =
                Object.entries(values)
                    .filter(
                        ([key, value]) =>
                            key === "a" ||
                            key === "b" ||
                            Number(value) !== 0
                    )
                    .map(
                        ([key, value]) =>
                            `${key}: ${value}${units[key] || ""}`
                    )
                    .join(", ");


            if(
                load.category !== "nodal"
            ){

                description =
                    `Coordinate: ${load.coordinate_system} | ` +
                    description;

            }


            card.querySelector(
                ".load-title"
            ).innerText =
                `Load ${index + 1}`;


            card.querySelector(
                ".load-description"
            ).innerText =
                description;


            card.dataset.loadIndex =
                index;


            if(
                index === selectedLoadIndex
            ){

                card.classList.add(
                    "selected"
                );

            }


            card.addEventListener("click", () => {
                const changedLoad = selectedLoadIndex !== index;

                selectedLoadIndex = index;

                if (changedLoad) {
                    resetLoadAssignmentInteraction("none");
                }

                renderLoadCards();
                updateLoadAssignmentPanel();
                refreshStructuralSelection();
            });

            container.appendChild(card);

        }
    );


    updateLoadActionButtons();
}



function isLoadAssignmentPageActive() {
    return typeof currentPage !== "undefined" &&
        typeof PAGES !== "undefined" &&
        currentPage === PAGES.LOAD;
}

function getLoadAssignmentScope() {
    return window.drawing2DStoryScope === "all" ? "all" : "one";
}

function getLoadNodesInScope() {
    const nodes = Array.isArray(window.nodeDatabase)
        ? window.nodeDatabase
        : [];

    if (getLoadAssignmentScope() === "all") {
        return nodes;
    }

    const story = getCurrentDrawing2DStory();

    if (!story) return [];

    return nodes.filter(node =>
        String(node.storyUid) === String(story.id)
    );
}

function getLoadMembersInScope() {
    const members = getDrawing2DMembersFromTable();

    if (getLoadAssignmentScope() === "all") {
        return members;
    }

    const story = getCurrentDrawing2DStory();

    if (!story) return [];

    const nodeById = new Map(
        (window.nodeDatabase || []).map(node => [
            String(node.nodeId),
            node
        ])
    );

    return members.filter(member => {
        const start = nodeById.get(String(member.start));
        const end = nodeById.get(String(member.end));

        if (!start || !end) return false;

        // Include columns that are connected to this story.
        return (
            String(start.storyUid) === String(story.id) ||
            String(end.storyUid) === String(story.id)
        );
    });
}

function getLoadNodeIdsForScope(nodeId) {
    const nodes = window.nodeDatabase || [];

    const clickedNode = nodes.find(node =>
        String(node.nodeId) === String(nodeId)
    );

    if (!clickedNode) return [];

    if (getLoadAssignmentScope() === "one") {
        const story = getCurrentDrawing2DStory();

        return story &&
            String(clickedNode.storyUid) === String(story.id)
            ? [String(clickedNode.nodeId)]
            : [];
    }

    // All stories: select the same grid intersection on every story.
    return nodes
        .filter(node =>
            String(node.xGridUid) === String(clickedNode.xGridUid) &&
            String(node.zGridUid) === String(clickedNode.zGridUid)
        )
        .map(node => String(node.nodeId));
}

function getLoadMemberIdsForScope(
    type,
    id,
    startId,
    endId
) {
    const members = getDrawing2DMembersFromTable();

    if (getLoadAssignmentScope() === "one") {
        return [String(id)];
    }

    const clickedMember = members.find(member =>
        member.type === type &&
        String(member.id) === String(id)
    ) || {
        type,
        id,
        start: startId,
        end: endId
    };

    const nodeById = new Map(
        (window.nodeDatabase || []).map(node => [
            String(node.nodeId),
            node
        ])
    );

    const referenceStart =
        nodeById.get(String(clickedMember.start));

    const referenceEnd =
        nodeById.get(String(clickedMember.end));

    if (!referenceStart || !referenceEnd) {
        return [String(id)];
    }

    function samePlanPoint(a, b) {
        return Boolean(a && b) &&
            Math.abs(Number(a.x) - Number(b.x)) < 1e-6 &&
            Math.abs(Number(a.z) - Number(b.z)) < 1e-6;
    }

    function sameBeamSegment(a, b, c, d) {
        return (
            samePlanPoint(a, c) &&
            samePlanPoint(b, d)
        ) || (
            samePlanPoint(a, d) &&
            samePlanPoint(b, c)
        );
    }

    return members
        .filter(member => {
            if (member.type !== type) return false;

            const start =
                nodeById.get(String(member.start));

            const end =
                nodeById.get(String(member.end));

            if (!start || !end) return false;

            if (type === "column") {
                return (
                    samePlanPoint(referenceStart, start) ||
                    samePlanPoint(referenceStart, end)
                );
            }

            return sameBeamSegment(
                referenceStart,
                referenceEnd,
                start,
                end
            );
        })
        .map(member => String(member.id));
}



function toggleLoadSelectionIds(
    ids,
    kind,
    groupToggle = false
) {
    const current = kind === "nodes"
        ? loadMouseSelectedNodes
        : loadMouseSelectedMembers;

    const targets = [
        ...new Set((ids || []).map(String))
    ];

    if (!targets.length) return;

    const selected = new Set(current.map(String));

    if (groupToggle) {
        // Click: toggle the group together.
        const allSelected = targets.every(id =>
            selected.has(id)
        );

        targets.forEach(id => {
            if (allSelected) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
        });
    } else {
        // Rectangle: toggle each item individually.
        targets.forEach(id => {
            if (selected.has(id)) {
                selected.delete(id);
            } else {
                selected.add(id);
            }
        });
    }

    if (kind === "nodes") {
        loadMouseSelectedNodes = [...selected];
    } else {
        loadMouseSelectedMembers = [...selected];
    }

    updateLoadAssignmentPanel();
    refreshStructuralSelection();
}

function resetLoadAssignmentInteraction(nextMode = "none") {
    loadAssignmentMode = nextMode;

    loadMouseSelectedNodes = [];
    loadMouseSelectedMembers = [];

    loadRectangleDrag = {
        active: false,
        moved: false,
        startX: 0,
        startY: 0
    };

    loadSuppressClickAt = null;

    removeLoadSelectionBox();
    updateLoadSelectorState();
}

function setLoadEditListMode() {
    if (selectedLoadIndex < 0) return;

    const nextMode =
        loadAssignmentMode === "edit"
            ? "none"
            : "edit";

    resetLoadAssignmentInteraction(nextMode);

    updateLoadAssignmentPanel();
    refreshStructuralSelection();
}

function setLoadMouseAssignmentMode() {
    if (selectedLoadIndex < 0) return;

    // Clicking the active mode again turns it off.
    if (loadAssignmentMode === "mouse") {
        resetLoadAssignmentInteraction("none");

        updateLoadAssignmentPanel();
        refreshStructuralSelection();

        return;
    }

    const load = loadDatabase[selectedLoadIndex];

    if (!load) return;

    loadAssignmentMode = "mouse";

    // Start with the IDs currently assigned to this load.
    loadMouseSelectedNodes = load.category === "nodal"
        ? [
            ...new Set(
                (load.assignedNodes || []).map(String)
            )
        ]
        : [];

    loadMouseSelectedMembers = load.category === "nodal"
        ? []
        : [
            ...new Set(
                (load.assignedMembers || []).map(String)
            )
        ];

    loadRectangleDrag = {
        active: false,
        moved: false,
        startX: 0,
        startY: 0
    };

    loadSuppressClickAt = null;

    removeLoadSelectionBox();

    initLoadMouseSelection();
    updateLoadSelectorState();
    updateLoadAssignmentPanel();
    refreshStructuralSelection();
}



function updateLoadSelectorState() {
    const canvas =
        window.drawing2D?.renderer?.domElement;

    const status =
        document.getElementById("drawing2DToolStatus");

    if (!canvas) return;

    if (
        loadAssignmentMode === "mouse" &&
        isLoadAssignmentPageActive()
    ) {
        canvas.style.cursor = "pointer";

        if (status) {
            status.innerText =
                loadDatabase[selectedLoadIndex]?.category === "nodal"
                    ? "Node Selection"
                    : "Member Selection";
        }
    } else {
        canvas.style.cursor = "default";

        if (status) {
            status.innerText = "";
        }
    }
}

function updateLoadAssignmentPanel() {
    const load = loadDatabase[selectedLoadIndex];

    const label =
        document.getElementById("selectedLoadLabel");

    const items =
        document.getElementById("loadAssignedItems");

    const input =
        document.getElementById("loadAssignmentInput");

    const itemLabel =
        document.getElementById("loadAssignedLabel");

    const inputLabel =
        document.getElementById("loadAssignmentInputLabel");

    const assignAll =
        document.getElementById("loadAssignAllBtn");

    const mouseBtn =
        document.getElementById("loadMouseAssignBtn");

    const editBtn =
        document.getElementById("loadEditListBtn");

    const assignBtn =
        document.getElementById("loadAssignBtn");

    if (!load) {
        if (label) label.innerText = "No load selected";

        if (items) {
            items.innerHTML =
                '<span class="load-no-items">No items assigned</span>';
        }

        if (input) {
            input.value = "";
            input.disabled = true;
        }

        [
            assignAll,
            mouseBtn,
            editBtn,
            assignBtn
        ].filter(Boolean).forEach(button => {
            button.disabled = true;
        });

        return;
    }

    const isNodeLoad = load.category === "nodal";

    const assigned = isNodeLoad
        ? (load.assignedNodes || [])
        : (load.assignedMembers || []);

    const temporary = isNodeLoad
        ? loadMouseSelectedNodes
        : loadMouseSelectedMembers;

    if (label) {
        label.innerText = `Load ${selectedLoadIndex + 1}`;
    }

    if (itemLabel) {
        itemLabel.innerText = isNodeLoad
            ? "Assigned Nodes"
            : "Assigned Members";
    }

    if (inputLabel) {
        inputLabel.innerText = isNodeLoad
            ? "Selected Nodes"
            : "Selected Members";
    }

    if (input) {
        input.placeholder = isNodeLoad
            ? "No node selected"
            : "No members selected";

        input.value = loadAssignmentMode === "mouse"
            ? temporary.join(", ")
            : assigned.join(", ");

        input.disabled = loadAssignmentMode !== "edit";
    }

    if (items) {
        items.innerHTML = assigned.length
            ? assigned.map(id =>
                `<span class="load-item-chip">${id}</span>`
              ).join("")
            : '<span class="load-no-items">No items assigned</span>';
    }

    if (assignAll) assignAll.disabled = false;

    if (mouseBtn) {
        mouseBtn.disabled = false;
        mouseBtn.classList.toggle(
            "active",
            loadAssignmentMode === "mouse"
        );
    }

    if (editBtn) {
        editBtn.disabled = false;
        editBtn.classList.toggle(
            "active",
            loadAssignmentMode === "edit"
        );
    }

    if (assignBtn) {
        // Mouse mode may intentionally have an empty selection,
        // so pressing Assign can remove all previous assignments.
        assignBtn.disabled =
            loadAssignmentMode === "none" ||
            (
                loadAssignmentMode === "edit" &&
                !(input?.value || "").trim()
            );
    }
}

function updateLoadActionButtons() {
    const edit =
        document.getElementById("loadEditBtn");

    const del =
        document.getElementById("loadDeleteBtn");

    const selected =
        selectedLoadIndex >= 0 &&
        !!loadDatabase[selectedLoadIndex];

    if (edit) edit.disabled = !selected;
    if (del) del.disabled = !selected;
}

function updateLoadSelectionBox(
    x1,
    y1,
    x2,
    y2
) {
    if (!loadSelectionBox) {
        loadSelectionBox = document.createElement("div");

        Object.assign(loadSelectionBox.style, {
            position: "fixed",
            pointerEvents: "none",
            border: "1px dashed #2196f3",
            background: "rgba(33,150,243,0.10)",
            zIndex: "9999"
        });

        document.body.appendChild(loadSelectionBox);
    }

    Object.assign(loadSelectionBox.style, {
        left: Math.min(x1, x2) + "px",
        top: Math.min(y1, y2) + "px",
        width: Math.abs(x2 - x1) + "px",
        height: Math.abs(y2 - y1) + "px"
    });
}

function removeLoadSelectionBox() {
    loadSelectionBox?.remove();
    loadSelectionBox = null;
}

function initLoadMouseSelection() {
    const canvas =
        window.drawing2D?.renderer?.domElement;

    if (
        !canvas ||
        canvas.dataset.loadAssignmentEventsBound === "true"
    ) {
        return;
    }

    canvas.dataset.loadAssignmentEventsBound = "true";

    // -------------------------------------------------
    // POINTER DOWN
    // -------------------------------------------------

    canvas.addEventListener("pointerdown", event => {
        if (
            !isLoadAssignmentPageActive() ||
            loadAssignmentMode !== "mouse" ||
            selectedLoadIndex < 0 ||
            event.button !== 0
        ) {
            return;
        }

        loadSuppressClickAt = null;

        loadRectangleDrag = {
            active: true,
            moved: false,
            startX: event.clientX,
            startY: event.clientY
        };

        try {
            canvas.setPointerCapture(event.pointerId);
        } catch (_) {
            // Pointer capture may not be available in every browser.
        }
    });

    // -------------------------------------------------
    // POINTER MOVE
    // -------------------------------------------------

    canvas.addEventListener("pointermove", event => {
        if (
            !loadRectangleDrag.active ||
            !isLoadAssignmentPageActive() ||
            loadAssignmentMode !== "mouse"
        ) {
            return;
        }

        const drag = loadRectangleDrag;

        if (
            Math.hypot(
                event.clientX - drag.startX,
                event.clientY - drag.startY
            ) > 5
        ) {
            drag.moved = true;
        }

        if (drag.moved) {
            updateLoadSelectionBox(
                drag.startX,
                drag.startY,
                event.clientX,
                event.clientY
            );
        }
    });

    // -------------------------------------------------
    // POINTER UP — RECTANGLE ONLY
    //
    // A simple click is handled by the separate click
    // listener below, just like support assignment.
    // -------------------------------------------------

    canvas.addEventListener("pointerup", event => {
        if (!loadRectangleDrag.active) return;

        const drag = { ...loadRectangleDrag };

        loadRectangleDrag = {
            active: false,
            moved: false,
            startX: 0,
            startY: 0
        };

        removeLoadSelectionBox();

        if (
            !isLoadAssignmentPageActive() ||
            loadAssignmentMode !== "mouse" ||
            selectedLoadIndex < 0
        ) {
            return;
        }

        if (drag.moved) {
            // Suppress a possible synthetic click at the drag endpoint.
            loadSuppressClickAt = {
                x: event.clientX,
                y: event.clientY
            };

            selectLoadItemsInRectangle(
                canvas,
                drag.startX,
                drag.startY,
                event.clientX,
                event.clientY
            );
        }
    });

    // -------------------------------------------------
    // CANCEL INTERRUPTED POINTER GESTURE
    // -------------------------------------------------

    canvas.addEventListener("pointercancel", () => {
        loadRectangleDrag = {
            active: false,
            moved: false,
            startX: 0,
            startY: 0
        };

        removeLoadSelectionBox();
    });

    // Separate click handler, analogous to support assignment.
    canvas.addEventListener(
        "click",
        handleDrawing2DLoadAssignmentClick
    );
}

function handleDrawing2DLoadAssignmentClick(event) {
    if (
        !isLoadAssignmentPageActive() ||
        loadAssignmentMode !== "mouse" ||
        selectedLoadIndex < 0 ||
        event.button !== 0
    ) {
        return;
    }

    // A rectangle drag may generate a click at its endpoint.
    if (loadSuppressClickAt) {
        const end = loadSuppressClickAt;
        loadSuppressClickAt = null;

        if (
            Math.hypot(
                event.clientX - end.x,
                event.clientY - end.y
            ) <= 8
        ) {
            return;
        }
    }

    const load = loadDatabase[selectedLoadIndex];

    if (!load) return;

    const isNodeLoad = load.category === "nodal";

    const canvas =
        window.drawing2D?.renderer?.domElement;

    const camera =
        window.drawing2D?.camera;

    const group = isNodeLoad
        ? window.drawing2DNodeState?.group
        : window.drawing2DMemberState?.group;

    if (
        !canvas ||
        !camera ||
        !group ||
        typeof THREE === "undefined"
    ) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    const mouse = new THREE.Vector2(
        ((event.clientX - rect.left) / rect.width) * 2 - 1,
        -((event.clientY - rect.top) / rect.height) * 2 + 1
    );

    const raycaster = new THREE.Raycaster();
    raycaster.params.Line.threshold = 0.35;
    raycaster.setFromCamera(mouse, camera);

    const hits = raycaster.intersectObjects(
        group.children,
        true
    );

    let hitData = null;

    for (const hit of hits) {
        let object = hit.object;

        while (object && object !== group) {
            const data = object.userData || {};

            const valid = isNodeLoad
                ? data.type === "node"
                : (
                    data.type === "member" ||
                    data.type === "column"
                );

            if (valid) {
                hitData = data;
                break;
            }

            object = object.parent;
        }

        if (hitData) break;
    }

    if (!hitData) return;

    if (isNodeLoad) {
        const ids = getLoadNodeIdsForScope(
            hitData.nodeId
        );

        toggleLoadSelectionIds(
            ids,
            "nodes",
            true
        );

        return;
    }

    const type =
        hitData.type === "column"
            ? "column"
            : "beam";

    const id = type === "column"
        ? hitData.columnId
        : hitData.memberId;

    if (id === undefined || id === null) return;

    const ids = getLoadMemberIdsForScope(
        type,
        id,
        hitData.start,
        hitData.end
    );

    toggleLoadSelectionIds(
        ids,
        "members",
        true
    );
}


function selectLoadItemsInRectangle(
    canvas,
    startX,
    startY,
    endX,
    endY
) {
    const load = loadDatabase[selectedLoadIndex];
    const camera = window.drawing2D?.camera;

    if (
        !load ||
        !canvas ||
        !camera ||
        typeof THREE === "undefined"
    ) {
        return;
    }

    const rect = canvas.getBoundingClientRect();

    if (!rect.width || !rect.height) return;

    function screenToWorld(x, y) {
        const mouse = new THREE.Vector2(
            ((x - rect.left) / rect.width) * 2 - 1,
            -((y - rect.top) / rect.height) * 2 + 1
        );

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(mouse, camera);

        const point = new THREE.Vector3();

        return raycaster.ray.intersectPlane(
            new THREE.Plane(
                new THREE.Vector3(0, 1, 0),
                0
            ),
            point
        ) ? point : null;
    }

    const a = screenToWorld(startX, startY);
    const b = screenToWorld(endX, endY);

    if (!a || !b) return;

    const bounds = {
        minX: Math.min(a.x, b.x),
        maxX: Math.max(a.x, b.x),
        minZ: Math.min(a.z, b.z),
        maxZ: Math.max(a.z, b.z)
    };

    // Keep IDs outside conditional blocks so both branches are valid.
    let ids = [];

    // NODAL LOADS
    if (load.category === "nodal") {
        ids = getLoadNodesInScope()
            .filter(node =>
                Number(node.x) >= bounds.minX &&
                Number(node.x) <= bounds.maxX &&
                Number(node.z) >= bounds.minZ &&
                Number(node.z) <= bounds.maxZ
            )
            .map(node => String(node.nodeId));

        toggleLoadSelectionIds(ids, "nodes", false);
        return;
    }

    // MEMBER LOADS
    const nodeById = new Map(
        (window.nodeDatabase || []).map(node => [
            String(node.nodeId),
            node
        ])
    );

    ids = getLoadMembersInScope()
        .filter(member => {
            const start =
                nodeById.get(String(member.start));

            const end =
                nodeById.get(String(member.end));

            if (!start || !end) return false;

            const startInside =
                Number(start.x) >= bounds.minX &&
                Number(start.x) <= bounds.maxX &&
                Number(start.z) >= bounds.minZ &&
                Number(start.z) <= bounds.maxZ;

            const endInside =
                Number(end.x) >= bounds.minX &&
                Number(end.x) <= bounds.maxX &&
                Number(end.z) >= bounds.minZ &&
                Number(end.z) <= bounds.maxZ;

            // Select a member only when both endpoints are inside.
            return startInside && endInside;
        })
        .map(member => String(member.id));

    toggleLoadSelectionIds(ids, "members", false);
}



function editSelectedLoad(){

    if(
        selectedLoadIndex < 0
    ){
        return;
    }

    editLoad(
        selectedLoadIndex
    );

}

function deleteSelectedLoad(){

    if(
        selectedLoadIndex < 0
    ){
        return;
    }

    deleteLoad(
        selectedLoadIndex
    );

}



function editLoad(index){

    resetLoadAssignmentInteraction("none");
    refreshStructuralSelection();

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

    // COORDINATE SYSTEM
    document.getElementById(
        "loadCoordinateSystem"
    ).value =
        load.coordinate_system || "local";

    // FORCE
    document.getElementById(
        "loadFx"
    ).value =
        load.Fx ?? 0;

    document.getElementById(
        "loadFy"
    ).value =
        load.Fy ?? 0;

    document.getElementById(
        "loadFz"
    ).value =
        load.Fz ?? 0;

    // MOMENT
    document.getElementById(
        "loadMx"
    ).value =
        load.Mx ?? 0;

    document.getElementById(
        "loadMy"
    ).value =
        load.My ?? 0;

    document.getElementById(
        "loadMz"
    ).value =
        load.Mz ?? 0;

    // DISTRIBUTED
    document.getElementById(
        "loadWx"
    ).value =
        load.wx ?? 0;

    document.getElementById(
        "loadWy"
    ).value =
        load.wy ?? 0;

    document.getElementById(
        "loadWz"
    ).value =
        load.wz ?? 0;

    // TRAPEZOIDAL START
    document.getElementById(
        "loadWx1"
    ).value =
        load.wx1 ?? 0;

    document.getElementById(
        "loadWy1"
    ).value =
        load.wy1 ?? 0;

    document.getElementById(
        "loadWz1"
    ).value =
        load.wz1 ?? 0;

    // TRAPEZOIDAL END
    document.getElementById(
        "loadWx2"
    ).value =
        load.wx2 ?? 0;

    document.getElementById(
        "loadWy2"
    ).value =
        load.wy2 ?? 0;

    document.getElementById(
        "loadWz2"
    ).value =
        load.wz2 ?? 0;

    // POSITIONS 
    document.getElementById(
        "loadA"
    ).value = load.a ?? 0;

    document.getElementById(
        "loadB"
    ).value = load.b ?? 0;

}

function deleteLoad(index) {
    loadDatabase.splice(index, 1);

    selectedLoadIndex = -1;

    resetLoadAssignmentInteraction("none");

    renderLoadCards();
    updateLoadAssignmentPanel();

    refreshStructuralSelection();
    refreshView();
}



function assignLoad(index, card){

    const input =
        card
        ?
        card.querySelector(
            ".load-assignment-input"
        )
        :
        document.getElementById(
            "loadAssignmentInput"
        );

    if(!input){
        return;
    }

    if(!card){
        console.error(
            "assignLoad(): card not provided"
        );
        return;
    }

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

function assignSelectedLoad() {
    if (selectedLoadIndex < 0) return;

    const load = loadDatabase[selectedLoadIndex];
    if (!load) return;

    if (loadAssignmentMode === "none") return;

    const isNodeLoad = load.category === "nodal";
    const input = document.getElementById("loadAssignmentInput");

    let ids;

    if (loadAssignmentMode === "mouse") {
        ids = isNodeLoad
            ? [...loadMouseSelectedNodes]
            : [...loadMouseSelectedMembers];
    } else {
        if (!input) return;

        ids = input.value
            .split(",")
            .map(id => id.trim())
            .filter(Boolean);
    }

    const validIds = isNodeLoad
        ? new Set(
            (window.nodeDatabase || [])
                .map(node => String(node.nodeId))
        )
        : new Set(
            getMembers().map(member => String(member.name))
        );

    const invalid = ids.filter(id =>
        !validIds.has(String(id))
    );

    if (invalid.length) {
        alert(
            `Invalid ${isNodeLoad ? "node" : "member"} ID(s): ` +
            invalid.join(", ")
        );
        return;
    }

    ids = [...new Set(ids.map(String))];

    if (isNodeLoad) {
        load.assignedNodes = ids;
    } else {
        load.assignedMembers = ids;
    }

    resetLoadAssignmentInteraction("none");

    renderLoadCards();
    updateLoadAssignmentPanel();

    refreshStructuralSelection();
    refreshView();
}

function assignAllSelectedLoad() {
    if (selectedLoadIndex < 0) return;

    openAssignAllConfirmation(
        "load",
        selectedLoadIndex
    );

    resetLoadAssignmentInteraction("none");

    updateLoadAssignmentPanel();
    refreshStructuralSelection();
}



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
                Nodal Load
            </option>
        `;
    }

    else{

        typeSelect.innerHTML = `

            <option value="point">
                Point Load
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

    hideGroup("coordinateSystemGroup");

    hideGroup("forceComponentsGroup");

    hideGroup("momentComponentsGroup");

    hideGroup("distributedLoadComponentsGroup");

    hideGroup("trapezoidalComponentsGroup");

    hideGroup("aGroup");

    hideGroup("bGroup");



    // -------------------------------------------------
    // NODAL LOADS
    // -------------------------------------------------

    if(category === "nodal"){

        hideGroup("coordinateSystemGroup");

        showGroup("forceComponentsGroup");
        showGroup("momentComponentsGroup");
    }


    // -------------------------------------------------
    // MEMBER LOADS
    // -------------------------------------------------

    else{

        // COORDINATE SYSTEM
        showGroup(
            "coordinateSystemGroup"
        );

        // POINT LOAD
        if(type === "point"){

            showGroup(
                "forceComponentsGroup"
            );

            showGroup(
                "momentComponentsGroup"
            );

            hideGroup(
                "distributedLoadComponentsGroup"
            );

            hideGroup(
                "trapezoidalComponentsGroup"
            );

            showGroup("aGroup");

            hideGroup("bGroup");
        }

        // UDL
        else if(type === "udl"){

            hideGroup(
                "forceComponentsGroup"
            );

            hideGroup(
                "momentComponentsGroup"
            );

            showGroup(
                "distributedLoadComponentsGroup"
            );

            hideGroup(
                "trapezoidalComponentsGroup"
            );

            hideGroup("aGroup");

            hideGroup("bGroup");
        }

        // PARTIAL UDL
        else if(type === "partial_udl"){

            hideGroup(
                "forceComponentsGroup"
            );

            hideGroup(
                "momentComponentsGroup"
            );

            showGroup(
                "distributedLoadComponentsGroup"
            );

            hideGroup(
                "trapezoidalComponentsGroup"
            );

            showGroup("aGroup");

            showGroup("bGroup");
        }

        // TRAPEZOIDAL
        else if(type === "trapezoidal"){

            hideGroup(
                "forceComponentsGroup"
            );

            hideGroup(
                "momentComponentsGroup"
            );

            hideGroup(
                "distributedLoadComponentsGroup"
            );

            showGroup(
                "trapezoidalComponentsGroup"
            );

            hideGroup("aGroup");

            hideGroup("bGroup");
        }
    }

    updateLoadInstructions();
}

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
                <b>Coordinate System</b><br>
                Select whether the load is defined in
                Local or Global coordinates.

                <br><br>

                <b>Force</b><br>
                Enter Fx, Fy and Fz simultaneously.

                <br><br>

                <b>Moment</b><br>
                Enter Mx, My and Mz simultaneously.

                <br><br>

                <b>a</b><br>
                Distance of the point load from the
                member start node.
            `;
        }

        // UDL
        else if(type === "udl"){

            html = `
                <b>Coordinate System</b><br>
                Select Local or Global coordinates.

                <br><br>

                <b>UDL</b><br>
                Enter distributed load intensity
                wx, wy and wz in kN/m.

                <br><br>

                Positive values act along the selected
                coordinate directions.
            `;
        }



        // PARTIAL UDL
        else if(type === "partial_udl"){

            html = `
                <b>Coordinate System</b><br>
                Select Local or Global coordinates.

                <br><br>

                <b>Partial UDL</b><br>
                Enter wx, wy and wz in kN/m.

                <br><br>

                <b>a</b><br>
                Start position of the UDL.

                <br><br>

                <b>b</b><br>
                End position of the UDL.
            `;
        }



        // TRAPEZOIDAL
        else if(type === "trapezoidal"){

            html = `
                <b>Coordinate System</b><br>
                Select Local or Global coordinates.

                <br><br>

                <b>Start Load</b><br>
                Enter wx₁, wy₁ and wz₁.

                <br><br>

                <b>End Load</b><br>
                Enter wx₂, wy₂ and wz₂.

                <br><br>

                Units: kN/m.
            `;
        }
    }



    document.getElementById("loadInstructionContent").innerHTML = html;
}



function showGroup(id){

    document.getElementById(
        id
    ).style.display = "block";
}

function hideGroup(id){

    document.getElementById(
        id
    ).style.display = "none";
}


// =====================================================
// 4. ASSIGN-ALL CONFIRMATION
// =====================================================

let pendingAssignAllType = null;
let pendingAssignAllIndex = -1;




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

function closeAssignAllConfirmation(){

    document.getElementById(
        "assignAllConfirmPopup"
    ).style.display = "none";


    pendingAssignAllType = null;
    pendingAssignAllIndex = -1;

}

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


// =====================================================
// 5. MATERIAL SYSTEM
// =====================================================

let materialDatabase = [];

let editingMaterialIndex = -1;



function updateConcreteMaterialModuli() {
    const gradeSelect = document.getElementById("materialConcreteGrade");
    const eInput = document.getElementById("materialE");
    const gInput = document.getElementById("materialG");

    const fck = Number(gradeSelect.value);

    if (!gradeSelect.value || !Number.isFinite(fck) || fck <= 0) {
        return;
    }

    const mu = 0.2;
    const E = 5000 * Math.sqrt(fck);
    const G = E / (2 * (1 + mu));

    eInput.value = E.toFixed(2);
    gInput.value = G.toFixed(2);
}

function openMaterialPopup() {
    resetMaterialPopup();

    renderMaterialTable();

    document.getElementById("materialPopup").style.display = "flex";
}

function closeMaterialPopup(){

    document.getElementById(
        "materialPopup"
    ).style.display = "none";

}

function resetMaterialPopup() {

    editingMaterialIndex = -1;

    document.getElementById("materialPopupTitle").innerText =
        "Add Material";

    document.getElementById("saveMaterialButton").innerText =
        "Add Material";

    document.getElementById("materialName").value = "";
    document.getElementById("materialConcreteGrade").value = "";
    document.getElementById("materialE").value = "";
    document.getElementById("materialG").value = "";
}

function saveMaterial(){

    const name = document.getElementById("materialName").value.trim();
    const gradeValue = document.getElementById("materialConcreteGrade").value;
    const E = Number(document.getElementById("materialE").value);
    const G = Number(document.getElementById("materialG").value);


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
        alert(`Material "${name}" already exists.`);
        return;
    }


    const material = {

        name: name,
        concreteGrade: gradeValue,
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

    renderMaterialTable();
    renderSectionMaterialDropdown();
    refreshView();
    resetMaterialPopup();

}



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

            card.querySelector(".material-description").innerText =
                `Grade = ${material.concreteGrade ? "M" + material.concreteGrade : "Custom"}
            E = ${material.E} MPa
            G = ${material.G} MPa`;


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

function renderMaterialTable() {
    const tbody = document.getElementById("materialTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    materialDatabase.forEach((material, index) => {
        const row = document.createElement("tr");

        const nameCell = document.createElement("td");
        nameCell.textContent = material.name;

        const gradeCell = document.createElement("td");
        gradeCell.textContent = material.concreteGrade
            ? `M${material.concreteGrade}`
            : "Custom";

        const eCell = document.createElement("td");
        eCell.textContent = material.E;

        const gCell = document.createElement("td");
        gCell.textContent = material.G;

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editMaterial(index);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => {
            deleteMaterial(index);
        });

        actionsCell.append(editButton, deleteButton);
        row.append(nameCell, gradeCell, eCell, gCell, actionsCell);
        tbody.appendChild(row);
    });
}

function renderSectionMaterialDropdown(selectedMaterialName = "") {
    const select = document.getElementById("sectionMaterial");
    if (!select) return;

    select.innerHTML = "";

    const placeholder = document.createElement("option");
    placeholder.value = "";
    placeholder.textContent = "Select material";
    select.appendChild(placeholder);

    materialDatabase.forEach(material => {
        const option = document.createElement("option");
        option.value = material.name;
        option.textContent = material.name;
        select.appendChild(option);
    });

    select.value = selectedMaterialName;
}



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

    refreshView();

}

function editMaterial(index) {
    const material = materialDatabase[index];
    if (!material) return;

    editingMaterialIndex = index;

    document.getElementById("materialPopupTitle").innerText =
        "Edit Material";

    document.getElementById("saveMaterialButton").innerText =
        "Edit Material";

    document.getElementById("materialName").value =
        material.name ?? "";

    document.getElementById("materialConcreteGrade").value =
    material.concreteGrade == null
        ? ""
        : String(material.concreteGrade);

    document.getElementById("materialE").value =
        material.E ?? "";

    document.getElementById("materialG").value =
        material.G ?? "";

    renderMaterialTable();

    document.getElementById("materialPopup").style.display = "flex";
}

function deleteMaterial(index){

    materialDatabase.splice(index,1);

    renderMaterialTable();
    renderSectionMaterialDropdown();

    refreshView();

}


// =====================================================
// 6. MEMBER SECTION SELECTION
// =====================================================

function generateSectionId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return "SEC_" + crypto.randomUUID();
    }

    return "SEC_" + Date.now().toString(36) +
        "_" + Math.random().toString(36).slice(2, 9);
}

function ensureSectionIds() {
    if (!Array.isArray(sectionDatabase)) {
        return;
    }

    sectionDatabase.forEach(section => {
        if (!section.id) {
            section.id = generateSectionId();
        }

        if (!Array.isArray(section.assignedMembers)) {
            section.assignedMembers = [];
        }
    });
}



function renderMemberSectionDropdown() {
    const select =
        document.getElementById("memberSectionSelect");

    if (!select) return;

    ensureSectionIds();

    const previousSelection =
        window.activeMemberSectionId;

    select.innerHTML = "";

    if (!sectionDatabase.length) {
        const option = document.createElement("option");

        option.value = "";
        option.textContent = "No section defined";

        select.appendChild(option);

        window.activeMemberSectionId = null;
        select.value = "";

        return;
    }

    sectionDatabase.forEach(section => {
        const option = document.createElement("option");

        option.value = String(section.id);
        option.textContent = section.name;

        select.appendChild(option);
    });

    // Keep the current choice if it still exists.
    const selectionStillExists = sectionDatabase.some(
        section => String(section.id) === String(previousSelection)
    );

    // Otherwise select the first section.
    window.activeMemberSectionId = selectionStillExists
        ? String(previousSelection)
        : String(sectionDatabase[0].id);

    select.value = window.activeMemberSectionId;
}

function setActiveMemberSection(sectionId) {
    const exists = sectionDatabase.some(
        section => String(section.id) === String(sectionId)
    );

    window.activeMemberSectionId = exists
        ? String(sectionId)
        : null;
}

function getActiveMemberSectionId() {
    const select =
        document.getElementById("memberSectionSelect");

    const selectedId = select
        ? select.value
        : window.activeMemberSectionId;

    const section = sectionDatabase.find(
        item => String(item.id) === String(selectedId)
    );

    return section ? String(section.id) : null;
}


// =====================================================
// 7. SECTION SYSTEM
// =====================================================

let sectionDatabase = [];

let editingSectionIndex = -1;

let betaDatabase = [];
let editingBetaIndex = -1;

let editingSelectedMembers = [];

window.activeMemberSectionId = null;

let sectionDesignDraft = {
    steelGrade: "Fe500",
    effectiveCover: 30
};




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



function openSectionDesignPropertiesPopup() {
    document.getElementById("sectionDesignSteelGrade").value =
        sectionDesignDraft.steelGrade || "Fe500";

    document.getElementById("sectionDesignEffectiveCover").value =
        sectionDesignDraft.effectiveCover ?? 30;

    document.getElementById("sectionDesignPropertiesPopup").style.display =
        "flex";
}

function closeSectionDesignPropertiesPopup() {
    document.getElementById("sectionDesignPropertiesPopup").style.display =
        "none";
}

function saveSectionDesignProperties() {
    const steelGrade =
        document.getElementById("sectionDesignSteelGrade").value;

    const effectiveCover =
        Number(document.getElementById("sectionDesignEffectiveCover").value);

    const validGrades = ["Fe250", "Fe415", "Fe500", "Fe550"];

    if (!validGrades.includes(steelGrade)) {
        alert("Please select a valid reinforcement steel grade.");
        return;
    }

    if (!Number.isFinite(effectiveCover) || effectiveCover < 0) {
        alert("Please enter a valid effective cover.");
        return;
    }

    sectionDesignDraft = {
        steelGrade,
        effectiveCover
    };

    closeSectionDesignPropertiesPopup();
}



function openSectionPopup(){

    editingSectionIndex = -1;

    renderSectionMaterialDropdown();

    renderSectionTable();

    document.getElementById("sectionPopup").style.display = "flex";

    resetSectionPopup();
}

function closeSectionPopup(){

    document.getElementById(
        "sectionPopup"
    ).style.display = "none";

}

function resetSectionPopup() {
    editingSectionIndex = -1;

    document.getElementById("sectionPopupTitle").innerText =
        "Add Section";

    document.getElementById("saveSectionButton").innerText =
        "Add Section";

    document.getElementById("sectionName").value = "";

    // Reset material selection.
    renderSectionMaterialDropdown("");

    // Reset the section type to its initial default.
    document.getElementById("sectionType").value =
        "rectangular";

    // Rebuild the geometry inputs in their initial, empty state.
    document.getElementById("sectionGeometryFields").innerHTML = "";

    document.getElementById("sectionA").value = "";
    document.getElementById("sectionIyy").value = "";
    document.getElementById("sectionIzz").value = "";
    document.getElementById("sectionJ").value = "";

    updateSectionShape();

    sectionDesignDraft = {
        steelGrade: "Fe500",
        effectiveCover: 30
    };

    closeSectionDesignPropertiesPopup();
}



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



function saveSection(){

    calculateSectionProperties();

    const name =
        document.getElementById(
            "sectionName"
        ).value.trim();
    
    const materialName =
        document.getElementById("sectionMaterial").value;

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

    if (!materialName ||
        !materialDatabase.some(material => material.name === materialName)) {
        alert("Please select a valid material for this section.");
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

        id: editingSectionIndex >= 0
            ? (
                sectionDatabase[editingSectionIndex].id ||
                generateSectionId()
            )
            : generateSectionId(),

        name: name,

        materialName: materialName,

        designProperties: {
            ...sectionDesignDraft
        },

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

    renderSectionTable();

    renderMemberSectionDropdown();

    syncMemberPropertyAssignments();

    refreshView();

    // Return the form to Add mode after a successful save.
    resetSectionPopup();

}



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

function renderSectionTable() {
    const tbody = document.getElementById("sectionTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    sectionDatabase.forEach((section, index) => {
        const row = document.createElement("tr");

        [
            section.name,
            section.type,
            section.A,
            section.Iyy,
            section.Izz,
            section.J
        ].forEach(value => {
            const cell = document.createElement("td");
            cell.textContent = value ?? "";
            row.appendChild(cell);
        });

        const actionsCell = document.createElement("td");

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => {
            editSection(index);
        });

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";
        deleteButton.addEventListener("click", () => {
            deleteSection(index);
        });

        actionsCell.append(editButton, deleteButton);
        row.appendChild(actionsCell);
        tbody.appendChild(row);
    });
}



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

function editSection(index){

    const section =
        sectionDatabase[index];

    sectionDesignDraft = {
        steelGrade: section.designProperties?.steelGrade || "Fe500",
        effectiveCover: section.designProperties?.effectiveCover ?? 30
    };

    editingSectionIndex = index;


    document.getElementById(
        "sectionPopup"
    ).style.display = "flex";


    document.getElementById(
        "sectionPopupTitle"
    ).innerText = "Edit Section";

    document.getElementById(
        "saveSectionButton"
    ).innerText = "Edit Section";

    document.getElementById(
        "sectionName"
    ).value =
        section.name;

    renderSectionMaterialDropdown(section.materialName || "");


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

function deleteSection(index){

    sectionDatabase.splice(index,1);

    renderSectionTable();

    renderMemberSectionDropdown();

    refreshView();

}


// =====================================================
// 8. BETA ANGLE SYSTEM
// =====================================================

function openBetaPopup(){

    editingBetaIndex = -1;

    document.getElementById(
        "betaPopup"
    ).style.display = "flex";

    resetBetaPopup();
}

function closeBetaPopup(){

    document.getElementById(
        "betaPopup"
    ).style.display = "none";

}

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

function deleteBeta(index){

    betaDatabase.splice(index,1);

    renderBetaCards();

    refreshView();
}


// =====================================================
// 9. MEMBER PROPERTY PANEL
// =====================================================

function updateMemberPropertyPanel(tool = window.drawing2D?.activeTool) {
    const creationView = document.getElementById(
        "memberPropertyCreationView"
    );

    const selectionView = document.getElementById(
        "memberPropertySelectionView"
    );

    const content = document.getElementById(
        "memberPropertySelectionContent"
    );

    if (!creationView || !selectionView || !content) return;

    const isSelectTool = tool === "select";

    creationView.hidden = isSelectTool;
    selectionView.hidden = !isSelectTool;

    if (!isSelectTool) return;

    renderSelectedMemberProperties();
}



function getMemberPropertyRow(member) {
    const tableId = member.memberType === "column"
        ? "columnsTable"
        : "beamsTable";

    const table = document.getElementById(tableId);

    if (!table) return null;

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        const id = row.cells[0]
            ?.querySelector("input")
            ?.value;

        if (String(id) === String(member.id)) {
            return row;
        }
    }

    return null;
}

function syncMemberPropertyAssignments() {
    // Resolve member sections before clearing old assignments.
    const members = getMembers();

    sectionDatabase.forEach(section => {
        section.assignedMembers = [];
    });

    materialDatabase.forEach(material => {
        material.assignedMembers = [];
    });

    members.forEach(member => {
        if (!member.sectionId) return;

        const section = sectionDatabase.find(
            s => String(s.id) === String(member.sectionId)
        );

        if (!section) return;

        const memberId = String(member.name);
        section.assignedMembers.push(memberId);

        const material = materialDatabase.find(
            m =>
                String(m.name).trim().toLowerCase() ===
                String(section.materialName ?? "").trim().toLowerCase()
        );

        if (material) {
            material.assignedMembers.push(memberId);
        }
    });
}

function getSelectedMemberPropertyData(member) {
    const row = getMemberPropertyRow(member);

    if (!row) return null;

    const memberId = String(member.id);

    // Section assignment is stored on the member's table row.
    const sectionId = row.dataset.sectionId || "";

    const section = sectionId
        ? sectionDatabase.find(
            item => String(item.id) === String(sectionId)
        )
        : null;

    // Material assigned directly to this member.
    const assignedMaterial = materialDatabase.find(
        item =>
            Array.isArray(item.assignedMembers) &&
            item.assignedMembers
                .map(String)
                .includes(memberId)
    );

    // Sections also store their associated material name.
    const sectionMaterial = section
        ? materialDatabase.find(
            item => item.name === section.materialName
        )
        : null;

    const materialName =
        assignedMaterial?.name ??
        sectionMaterial?.name ??
        section?.materialName ??
        "";

    const betaProperty = betaDatabase.find(
        item =>
            Array.isArray(item.assignedMembers) &&
            item.assignedMembers
                .map(String)
                .includes(memberId)
    );

    return {
        id: memberId,
        sectionName: section?.name ?? "",
        materialName,
        beta: betaProperty
            ? Number(betaProperty.beta)
            : 0
    };
}

function getCommonMemberProperty(values) {
    if (!values.length) return "";

    const first = String(values[0] ?? "");

    if (!first) return "";

    return values.every(
        value => String(value ?? "") === first
    ) ? first : "";
}



function renderSelectedMemberProperties() {
    const content = document.getElementById(
        "memberPropertySelectionContent"
    );

    if (!content) return;

    const selectedItems =
        window.structuralSelection?.items || [];

    // This panel displays member properties, not node properties.
    const selectedMembers = selectedItems.filter(
        item => item.type === "member"
    );

    if (!selectedMembers.length) {
        content.innerHTML = `
            <p class="member-property-empty">
                Select a beam or column to view its properties.
            </p>
        `;
        return;
    }

    const properties = selectedMembers
        .map(getSelectedMemberPropertyData)
        .filter(Boolean);

    if (!properties.length) {
        content.innerHTML = `
            <p class="member-property-empty">
                No member properties available.
            </p>
        `;
        return;
    }

    // Multiple members: show count and common property values.
    if (properties.length > 1) {
        const sectionName = getCommonMemberProperty(
            properties.map(item => item.sectionName)
        );

        const materialName = getCommonMemberProperty(
            properties.map(item => item.materialName)
        );

        const beta = getCommonMemberProperty(
            properties.map(item => item.beta)
        );

        content.innerHTML = `
            <div class="member-property-selection-count">
                ${properties.length} members selected
            </div>

            <div class="member-property-detail">
                <span>Section</span>
                <strong>${sectionName || "—"}</strong>
            </div>

            <div class="member-property-detail">
                <span>Material</span>
                <strong>${materialName || "—"}</strong>
            </div>

            <div class="member-property-detail">
                <span>Beta Angle</span>
                <strong>${beta !== "" ? `${beta}°` : "—"}</strong>
            </div>
        `;

        return;
    }

    // Single member: show its name and assigned properties.
    const property = properties[0];

    const member = selectedMembers.find(
        item => String(item.id) === property.id
    );

    const memberType =
        member?.memberType === "column" ? "Column" : "Beam";

    content.innerHTML = `
        <div class="member-property-selected-name">
            <span>${memberType}</span>
            <strong>${property.id}</strong>
        </div>

        <div class="member-property-detail">
            <span>Section</span>
            <strong>${property.sectionName || "—"}</strong>
        </div>

        <div class="member-property-detail">
            <span>Material</span>
            <strong>${property.materialName || "—"}</strong>
        </div>

        <div class="member-property-detail">
            <span>Beta Angle</span>
            <strong>${property.beta}°</strong>
        </div>
    `;
}


// =====================================================
// 10. MEMBER PROPERTY EDITING
// =====================================================

function getMemberEditRow(member) {
    const tableId =
        member.memberType === "column"
            ? "columnsTable"
            : "beamsTable";

    const table = document.getElementById(tableId);

    if (!table) return null;

    for (let i = 1; i < table.rows.length; i++) {
        const row = table.rows[i];

        const id = row.cells[0]
            ?.querySelector("input")?.value;

        if (String(id) === String(member.id)) {
            return row;
        }
    }

    return null;
}

function getMemberEditNode(nodeId) {
    return (window.nodeDatabase || []).find(
        node => String(node.nodeId) === String(nodeId)
    ) || null;
}

function getMemberEditSection(member) {
    const row = getMemberEditRow(member);

    if (!row) return null;

    const sectionId = row.dataset.sectionId;

    return sectionDatabase.find(
        section => String(section.id) === String(sectionId)
    ) || null;
}

function getMemberEditBeta(memberId) {
    const assigned = betaDatabase.find(
        item =>
            (item.assignedMembers || [])
                .map(String)
                .includes(String(memberId))
    );

    return assigned ? Number(assigned.beta) : 0;
}



function populateMemberEditSectionDropdown() {
    const select = document.getElementById("editMemberSection");

    if (!select) return;

    select.innerHTML = "";

    sectionDatabase.forEach(section => {
        const option = document.createElement("option");

        option.value = String(section.id);
        option.textContent = section.name;

        select.appendChild(option);
    });
}

function updateMemberEditSectionDetails() {
    const sectionId =
        document.getElementById("editMemberSection")?.value;

    const section = sectionDatabase.find(
        item => String(item.id) === String(sectionId)
    );

    const material = section
        ? materialDatabase.find(
            item => item.name === section.materialName
        )
        : null;

    document.getElementById("editMemberMaterial").value =
        material?.name || section?.materialName || "—";

    document.getElementById("editMemberB").value =
        section?.b ?? section?.width ?? "—";

    document.getElementById("editMemberD").value =
        section?.D ?? section?.d ?? section?.depth ?? "—";

    document.getElementById("editMemberA").value =
        section?.A ?? "—";

    document.getElementById("editMemberIyy").value =
        section?.Iyy ?? "—";

    document.getElementById("editMemberIzz").value =
        section?.Izz ?? "—";

    document.getElementById("editMemberJ").value =
        section?.J ?? "—";
}



function openMemberPropertiesEditPopup() {
    const selectedItems =
        window.structuralSelection?.items || [];

    editingSelectedMembers = selectedItems.filter(
        item => item.type === "member"
    );

    if (!editingSelectedMembers.length) {
        alert("Select at least one beam or column first.");
        return;
    }

    populateMemberEditSectionDropdown();

    const firstMember = editingSelectedMembers[0];
    const row = getMemberEditRow(firstMember);

    if (!row) {
        alert("Could not find the selected member in the table.");
        return;
    }

    const startNode = getMemberEditNode(firstMember.start);
    const endNode = getMemberEditNode(firstMember.end);

    const section = getMemberEditSection(firstMember);

    document.getElementById("memberPropertiesEditMemberInfo")
        .textContent =
            editingSelectedMembers.length === 1
                ? `${firstMember.memberType === "column" ? "Column" : "Beam"} ${firstMember.id}`
                : `${editingSelectedMembers.length} members selected`;

    document.getElementById("editMemberStartNode").value =
        firstMember.start || "—";

    document.getElementById("editMemberEndNode").value =
        firstMember.end || "—";

    document.getElementById("editMemberStartCoordinates").value =
        startNode
            ? `(${startNode.x}, ${startNode.y}, ${startNode.z})`
            : "—";

    document.getElementById("editMemberEndCoordinates").value =
        endNode
            ? `(${endNode.x}, ${endNode.y}, ${endNode.z})`
            : "—";

    // A single section is shown for the initial member.
    // For a mixed multi-selection, leave the dropdown blank.
    const sectionIds = editingSelectedMembers.map(member => {
        return getMemberEditRow(member)?.dataset.sectionId || "";
    });

    const commonSectionId =
        sectionIds.every(id => id && id === sectionIds[0])
            ? sectionIds[0]
            : "";

    document.getElementById("editMemberSection").value =
        commonSectionId || "";

    if (!commonSectionId) {
        const select = document.getElementById("editMemberSection");

        if (select && !select.querySelector('option[value=""]')) {
            const option = document.createElement("option");
            option.value = "";
            option.textContent = "Mixed / No common section";
            select.insertBefore(option, select.firstChild);
        }

        select.value = "";
    }

    updateMemberEditSectionDetails();

    const betaValues = editingSelectedMembers.map(
        member => getMemberEditBeta(member.name)
    );

    document.getElementById("editMemberBeta").value =
        betaValues.every(value => value === betaValues[0])
            ? betaValues[0]
            : "";

    // Node coordinates are only shown for a single member.
    // For multiple members, the popup identifies the selection count.
    if (editingSelectedMembers.length > 1) {
        [
            "editMemberStartNode",
            "editMemberEndNode",
            "editMemberStartCoordinates",
            "editMemberEndCoordinates"
        ].forEach(id => {
            document.getElementById(id).value = "Multiple";
        });
    }

    document.getElementById("memberPropertiesEditPopup").style.display =
        "flex";
}

function closeMemberPropertiesEditPopup() {
    document.getElementById("memberPropertiesEditPopup").style.display =
        "none";

    editingSelectedMembers = [];
}

function saveMemberPropertiesEdit() {
    if (!editingSelectedMembers.length) return;

    const newSectionId =
        document.getElementById("editMemberSection").value;

    const betaInput =
        document.getElementById("editMemberBeta").value.trim();

    const newBeta = Number(betaInput);

    if (betaInput === "" || !Number.isFinite(newBeta)) {
        alert("Enter a valid beta angle.");
        return;
    }

    const newSection = sectionDatabase.find(
        section => String(section.id) === String(newSectionId)
    );

    if (newSectionId && !newSection) {
        alert("Please select a valid section.");
        return;
    }

    // Check whether a section change is actually requested.
    const sectionChanges = editingSelectedMembers.filter(member => {
        const row = getMemberEditRow(member);

        return row &&
            String(row.dataset.sectionId || "") !==
            String(newSectionId || "");
    });

    if (sectionChanges.length) {
        const confirmed = confirm(
            `Change the section for ${sectionChanges.length} selected member(s)` +
            ` to "${newSection?.name || "No section"}"?\n\n` +
            "This will change the section assigned to those members."
        );

        if (!confirmed) return;
    }

    // Apply section changes to the member rows.
    sectionChanges.forEach(member => {
        const row = getMemberEditRow(member);

        if (!row) return;

        if (newSectionId) {
            row.dataset.sectionId = String(newSectionId);
        } else {
            delete row.dataset.sectionId;
        }
    });

    syncMemberPropertyAssignments();

    // Apply beta assignments using the existing beta database.
    const selectedIds = editingSelectedMembers.map(
        member => String(member.id)
    );

    // Remove selected members from all previous beta assignments.
    betaDatabase.forEach(betaProperty => {
        betaProperty.assignedMembers =
            (betaProperty.assignedMembers || [])
                .filter(id => !selectedIds.includes(String(id)));
    });

    // Reuse an existing beta property with the same angle.
    let targetBeta = betaDatabase.find(
        betaProperty =>
            Math.abs(Number(betaProperty.beta) - newBeta) < 1e-9
    );

    // Create a beta entry if this angle does not exist yet.
    if (!targetBeta) {
        let name = `Beta ${newBeta}°`;
        let suffix = 2;

        while (betaDatabase.some(
            item => item.name.toLowerCase() === name.toLowerCase()
        )) {
            name = `Beta ${newBeta}° (${suffix++})`;
        }

        targetBeta = {
            name,
            beta: newBeta,
            assignedMembers: []
        };

        betaDatabase.push(targetBeta);
    }

    targetBeta.assignedMembers = [
        ...new Set([
            ...(targetBeta.assignedMembers || []).map(String),
            ...selectedIds
        ])
    ];

    // Remove unused beta entries created by earlier assignments.
    betaDatabase = betaDatabase.filter(
        item => (item.assignedMembers || []).length > 0
    );


    // Update any visuals and data displays.
    if (typeof renderDrawing2DMembers === "function") {
        renderDrawing2DMembers();
    }

    if (typeof refreshView === "function") {
        refreshView();
    }

    if (typeof renderSelectedMemberProperties === "function") {
        renderSelectedMemberProperties();
    }

    closeMemberPropertiesEditPopup();
}


// =====================================================
// 11. RESULT TAB SYSTEM
// =====================================================

function showResultTab(tabName, btn) {
    const selectedTab = document.getElementById(tabName);

    if (!selectedTab || !btn) return;

    // Clear active result button.
    document.querySelectorAll(
        ".results-nav-btn, .results-tool-btn"
    ).forEach(button => {
        button.classList.remove("active-result-tab");
    });

    // Hide all result content tabs.
    document.querySelectorAll(".result-tab").forEach(tab => {
        tab.classList.remove("active-result-tab-content");
    });

    // Activate the selected icon and result content.
    btn.classList.add("active-result-tab");
    selectedTab.classList.add("active-result-tab-content");
}


// =====================================================
// 12. EXPRESSION CALCULATOR
// =====================================================

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



// parseExpression
// parseTerm
// parseFactor



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


// =====================================================
// 13. GENERIC TABLE HELPERS
// =====================================================

function deleteRow(btn){

    btn.parentElement.parentElement.remove();

    refreshView();
}


// =====================================================
// 14. GLOBAL EVENT LISTENERS
// =====================================================

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

// Initialize the member section selector.
if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        renderMemberSectionDropdown
    );
} else {
    renderMemberSectionDropdown();
}
