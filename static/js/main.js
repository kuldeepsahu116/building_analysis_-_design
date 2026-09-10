// #region =====================================================
// APPLICATION STARTUP
// =====================================================

window.onload = function(){

    showPage(1);

    addNode(0,0,0,0);
    addNode(1,0,1,0);
    addNode(2,0,2,0);
    addNode(3,5,2,0);
    addNode(4,5,0,0);
    addNode(5,0,2,5);
    addNode(6,5,2,5);
    addNode(7,0,0,5);
    addNode(8,5,0,5);

    addMember("A",0,1);
    addMember("B",1,2);
    addMember("C",2,3);
    addMember("D",3,4);
    addMember("E",2,5);
    addMember("F",3,6);
    addMember("G",5,6);
    addMember("H",5,7);
    addMember("I",6,8);

    materialDatabase.push({
        name : "Steel",
        E : 200000,
        G : 77000,
        assignedMembers:["A","B","C","D","E","F","G","H","I"]
    });

    sectionDatabase.push({
        name : "Section 0.3*0.5",
        type : "rectangular",
        dimensions : {
            b : 0.3,
            d : 0.5},
        A : 0.15,
        Iyy : 0.001125,
        Izz : 0.003125,
        J : 0.00281737,
        assignedMembers:["A","B","C","D","E","F","G","H","I"]
    });

    supportDatabase.push({
        type: "support",
        ux: true,
        uy: true,
        uz: true,
        rx: true,
        ry: true,
        rz: true,
        uxValue: 0,
        uyValue: 0,
        uzValue: 0,
        rxValue: 0,
        ryValue: 0,
        rzValue: 0,
        assignedNodes: ["0","4"]
    });

    supportDatabase.push({
        type: "support",
        ux: true,
        uy: true,
        uz: true,
        rx: false,
        ry: false,
        rz: false,
        uxValue: 0,
        uyValue: 0,
        uzValue: 0,
        rxValue: 0,
        ryValue: 0,
        rzValue: 0,
        assignedNodes: ["7","8"]
    });

    renderMaterialCards();
    renderSectionCards();

    renderSupportCards();

    // -------------------------------------------------
    // STARTUP LOADS
    // -------------------------------------------------

    loadDatabase.push({

        category : "member",
        type : "udl",
        direction : "y",
        value1 : -6,
        value2 : 0,
        a : 0,
        b : 0,
        assignedNodes : [],
        assignedMembers : ["D"]
    });

    loadDatabase.push({

        category : "member",
        type : "trapezoidal",
        direction : "y",
        value1 : -6,
        value2 : -12,
        a : 0,
        b : 0,
        assignedNodes : [],
        assignedMembers : ["B"]
    });

    loadDatabase.push({

        category : "nodal",
        type : "point",
        direction : "X",
        value1 : 6,
        value2 : 0,
        a : 0,
        b : 0,
        assignedNodes : ["3"],
        assignedMembers : []
    });

    loadDatabase.push({

        category : "nodal",
        type : "point",
        direction : "Y",
        value1 : 6,
        value2 : 0,
        a : 0,
        b : 0,
        assignedNodes : ["3"],
        assignedMembers : []
    });

    loadDatabase.push({

        category : "nodal",
        type : "point",
        direction : "Z",
        value1 : 6,
        value2 : 0,
        a : 0,
        b : 0,
        assignedNodes : ["3"],
        assignedMembers : []
    });

    loadDatabase.push({

        category : "nodal",
        type : "moment",
        direction : "MY",
        value1 : 10,
        value2 : 0,
        a : 0,
        b : 0,
        assignedNodes : ["5"],
        assignedMembers : []
    });

    loadDatabase.push({

        category : "member",
        type : "partial_udl",
        direction : "z",
        value1 : 10,
        value2 : 0,
        a : 1,
        b : 1.5,
        assignedNodes : [],
        assignedMembers : ["I", "F"]
    });

    loadDatabase.push({

        category : "member",
        type : "trapezoidal",
        direction : "z",
        value1 : 5,
        value2 : 15,
        a : 0,
        b : 0,
        assignedNodes : [],
        assignedMembers : ["E"]
    });

    renderLoadCards();

    drawStructure();

    setTimeout(resetView,20);
};

// #endregion