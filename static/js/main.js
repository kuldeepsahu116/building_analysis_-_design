// #region =====================================================
// APPLICATION STARTUP
// =====================================================


/* =====================================================
   DEFAULT PROJECT DATA
   Loaded on every page refresh
   ===================================================== */

function initializeDefaultProjectData() {

    // -------------------------------------------------
    // 1. DEFAULT MATERIAL PROPERTY
    // -------------------------------------------------

    materialDatabase.length = 0;

    materialDatabase.push({
        name: "Concrete",
        concreteGrade: 25,
        E: 25000,
        G: 10416.67,
        assignedMembers: []
    });


    // -------------------------------------------------
    // 2. DEFAULT SECTION PROPERTY
    // -------------------------------------------------

    sectionDatabase.length = 0;

    const defaultSectionId =
        typeof generateSectionId === "function"
            ? generateSectionId()
            : "SEC_DEFAULT";

    sectionDatabase.push({
        id: defaultSectionId,
        name: "RCC 300x500",
        materialName: "Concrete",
        designProperties: {
            steelGrade: "Fe500",
            effectiveCover: 30
        },
        type: "rectangular",

        dimensions: {
            b: 0.30,
            d: 0.50
        },

        A: 0.15,
        Iyy: 0.001125,
        Izz: 0.003125,
        J: 0.00281737,

        assignedMembers: []
    });

    // Use the default section for newly created members.
    window.activeMemberSectionId = defaultSectionId;


    // -------------------------------------------------
    // 3. DEFAULT GRID SETTINGS
    // -------------------------------------------------

    window.drawing2D.gridMode = "spacing";

    window.drawing2D.grid = {
        initialized: false,
        xSpacing: 5,
        zSpacing: 4,
        xCount: 4,
        zCount: 5,
        xLines: [],
        zLines: []
    };

    window.drawing2D.gridSettings = {
        name: "G1",
        originX: 0,
        originZ: 0,
        rotation: 0,
        bubbleSize: 1250,
        color: "#C2C0C0"
    };


    // -------------------------------------------------
    // 4. DEFAULT STORIES / FLOORS
    // -------------------------------------------------

    window.drawing2D.floor = "F0";

    window.drawing2D.storySettings = {
        addMode: "spacing",
        nextId: 5,

        stories: [
            { id: "F0", name: "Base",          y: 0  },
            { id: "F1", name: "Ground Floor",  y: 3  },
            { id: "F2", name: "First Floor",   y: 6  },
            { id: "F3", name: "Second Floor",  y: 9  },
            { id: "F4", name: "Third Floor",   y: 12 }
        ]
    };


    // -------------------------------------------------
    // 5. SYNCHRONIZE GRID INPUTS WITH DEFAULTS
    // -------------------------------------------------

    const gridInputs = {
        gridXSpacing: 5,
        gridZSpacing: 4,
        gridXCount: 4,
        gridZCount: 5
    };

    Object.entries(gridInputs).forEach(([id, value]) => {
        const input = document.getElementById(id);

        if (input) {
            input.value = value;
        }
    });
}


window.onload = function(){

    initializeDefaultProjectData();

    applyDrawing2DGridSettings();

    renderMemberSectionDropdown();

    showPage(PAGES.MODEL);

    //     type: "support",
    //     ux: true,
    //     uy: true,
    //     uz: true,
    //     rx: true,
    //     ry: true,
    //     rz: true,
    //     uxValue: 0,
    //     uyValue: 0,
    //     uzValue: 0,
    //     rxValue: 0,
    //     ryValue: 0,
    //     rzValue: 0,
    //     assignedNodes: ["0","4"]
    // });

    // supportDatabase.push({
    //     type: "support",
    //     ux: true,
    //     uy: true,
    //     uz: true,
    //     rx: false,
    //     ry: false,
    //     rz: false,
    //     uxValue: 0,
    //     uyValue: 0,
    //     uzValue: 0,
    //     rxValue: 0,
    //     ryValue: 0,
    //     rzValue: 0,
    //     assignedNodes: ["7","8"]
    // });

    renderSupportCards();

    // // -------------------------------------------------
    // // STARTUP LOADS
    // // -------------------------------------------------

    // loadDatabase.push({

    //     category: "member",
    //     type: "udl",
    //     coordinate_system: "local",

    //     Fx: 0,
    //     Fy: 0,
    //     Fz: 0,

    //     Mx: 0,
    //     My: 0,
    //     Mz: 0,

    //     wx: 0,
    //     wy: -6,
    //     wz: 0,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 0,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 0,

    //     a: 0,
    //     b: 0,

    //     assignedNodes: [],
    //     assignedMembers: ["D"]

    // });


    // loadDatabase.push({

    //     category: "nodal",
    //     type: "point",
    //     coordinate_system: "global",

    //     Fx: 6,
    //     Fy: 6,
    //     Fz: 6,

    //     Mx: 0,
    //     My: 0,
    //     Mz: 0,

    //     wx: 0,
    //     wy: 0,
    //     wz: 0,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 0,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 0,

    //     a: 0,
    //     b: 0,

    //     assignedNodes: ["3"],
    //     assignedMembers: []

    // });

    // loadDatabase.push({

    //     category: "nodal",
    //     type: "point",
    //     coordinate_system: "global",

    //     Fx: 0,
    //     Fy: 0,
    //     Fz: 0,

    //     Mx: 0,
    //     My: 10,
    //     Mz: 0,

    //     wx: 0,
    //     wy: 0,
    //     wz: 0,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 0,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 0,

    //     a: 0,
    //     b: 0,

    //     assignedNodes: ["5"],
    //     assignedMembers: []

    // });

    // loadDatabase.push({

    //     category: "member",
    //     type: "partial_udl",
    //     coordinate_system: "local",

    //     Fx: 0,
    //     Fy: 0,
    //     Fz: 0,

    //     Mx: 0,
    //     My: 0,
    //     Mz: 0,

    //     wx: 0,
    //     wy: 0,
    //     wz: 10,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 0,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 0,

    //     a: 1,
    //     b: 1.5,

    //     assignedNodes: [],
    //     assignedMembers: ["I", "F"]

    // });

    // loadDatabase.push({

    //     category: "member",
    //     type: "trapezoidal",
    //     coordinate_system: "local",

    //     Fx: 0,
    //     Fy: 0,
    //     Fz: 0,

    //     Mx: 0,
    //     My: 0,
    //     Mz: 0,

    //     wx: 0,
    //     wy: 0,
    //     wz: 0,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 5,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 15,

    //     a: 0,
    //     b: 0,

    //     assignedNodes: [],
    //     assignedMembers: ["E"]

    // });

    // loadDatabase.push({

    //     category: "member",
    //     type: "udl",
    //     coordinate_system: "global",

    //     Fx: 0,
    //     Fy: 0,
    //     Fz: 0,

    //     Mx: 0,
    //     My: 0,
    //     Mz: 0,

    //     wx: 0,
    //     wy: -10,
    //     wz: 0,

    //     wx1: 0,
    //     wy1: 0,
    //     wz1: 0,

    //     wx2: 0,
    //     wy2: 0,
    //     wz2: 0,

    //     a: 0,
    //     b: 0,

    //     assignedNodes: [],
    //     assignedMembers: ["C", "E", "F", "G"]

    // });

    renderLoadCards();

     if (
        typeof renderDrawing2DNodeTable ===
        "function"
    ) {

        renderDrawing2DNodeTable();
    }


    drawStructure();

    setTimeout(resetView,1);
};

// #endregion