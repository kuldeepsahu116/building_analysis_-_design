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

        category: "member",
        type: "udl",
        coordinate_system: "local",

        Fx: 0,
        Fy: 0,
        Fz: 0,

        Mx: 0,
        My: 0,
        Mz: 0,

        wx: 0,
        wy: -6,
        wz: 0,

        wx1: 0,
        wy1: 0,
        wz1: 0,

        wx2: 0,
        wy2: 0,
        wz2: 0,

        a: 0,
        b: 0,

        assignedNodes: [],
        assignedMembers: ["D"]

    });


    loadDatabase.push({

        category: "nodal",
        type: "point",
        coordinate_system: "global",

        Fx: 6,
        Fy: 6,
        Fz: 6,

        Mx: 0,
        My: 0,
        Mz: 0,

        wx: 0,
        wy: 0,
        wz: 0,

        wx1: 0,
        wy1: 0,
        wz1: 0,

        wx2: 0,
        wy2: 0,
        wz2: 0,

        a: 0,
        b: 0,

        assignedNodes: ["3"],
        assignedMembers: []

    });

    loadDatabase.push({

        category: "nodal",
        type: "point",
        coordinate_system: "global",

        Fx: 0,
        Fy: 0,
        Fz: 0,

        Mx: 0,
        My: 10,
        Mz: 0,

        wx: 0,
        wy: 0,
        wz: 0,

        wx1: 0,
        wy1: 0,
        wz1: 0,

        wx2: 0,
        wy2: 0,
        wz2: 0,

        a: 0,
        b: 0,

        assignedNodes: ["5"],
        assignedMembers: []

    });

    loadDatabase.push({

        category: "member",
        type: "partial_udl",
        coordinate_system: "local",

        Fx: 0,
        Fy: 0,
        Fz: 0,

        Mx: 0,
        My: 0,
        Mz: 0,

        wx: 0,
        wy: 0,
        wz: 10,

        wx1: 0,
        wy1: 0,
        wz1: 0,

        wx2: 0,
        wy2: 0,
        wz2: 0,

        a: 1,
        b: 1.5,

        assignedNodes: [],
        assignedMembers: ["I", "F"]

    });

    loadDatabase.push({

        category: "member",
        type: "trapezoidal",
        coordinate_system: "local",

        Fx: 0,
        Fy: 0,
        Fz: 0,

        Mx: 0,
        My: 0,
        Mz: 0,

        wx: 0,
        wy: 0,
        wz: 0,

        wx1: 0,
        wy1: 0,
        wz1: 5,

        wx2: 0,
        wy2: 0,
        wz2: 15,

        a: 0,
        b: 0,

        assignedNodes: [],
        assignedMembers: ["E"]

    });

    loadDatabase.push({

        category: "member",
        type: "udl",
        coordinate_system: "global",

        Fx: 0,
        Fy: 0,
        Fz: 0,

        Mx: 0,
        My: 0,
        Mz: 0,

        wx: 0,
        wy: -10,
        wz: 0,

        wx1: 0,
        wy1: 0,
        wz1: 0,

        wx2: 0,
        wy2: 0,
        wz2: 0,

        a: 0,
        b: 0,

        assignedNodes: [],
        assignedMembers: ["C", "E", "F", "G"]

    });

    renderLoadCards();

    drawStructure();

    setTimeout(resetView,1);
};

// #endregion