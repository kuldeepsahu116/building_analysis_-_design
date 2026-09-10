// #region =====================================================
// GET NODES
// =====================================================

function getNodes(){

    let nodes = {};

    let rows = document.getElementById("nodesTable").rows;

    for(let i=1; i<rows.length; i++){

        let c = rows[i].cells;

        nodes[
            c[0].children[0].value
        ] = [

            +c[1].children[0].value,

            +c[2].children[0].value,

            +c[3].children[0].value
        ];
    }

    return nodes;
}

// #endregion



// #region =====================================================
// GET MEMBERS
// =====================================================

function getMembers(){

    let members = [];

    let rows =
        document.getElementById(
            "membersTable"
        ).rows;


    for(let i=1; i<rows.length; i++){

        let c = rows[i].cells;


        const name =
            c[0].children[0].value;


        const start =
            c[1].children[0].value;


        const end =
            c[2].children[0].value;


        // FIND ASSIGNED MATERIAL
        const material =
            materialDatabase.find(
                m =>
                    m.assignedMembers
                        .map(String)
                        .includes(String(name))
            );


        // FIND ASSIGNED SECTION
        const section =
            sectionDatabase.find(
                s =>
                    s.assignedMembers
                        .map(String)
                        .includes(String(name))
            );

        // FIND ASSIGNED BETA ANGLE
        const betaProperty =
            betaDatabase.find(
                b =>
                    b.assignedMembers
                        .map(String)
                        .includes(String(name))
            );


        members.push({

            name: name,

            start: start,

            end: end,


            // MATERIAL

            E:
                material
                ?
                material.E
                :
                null,

            G:
                material
                ?
                material.G
                :
                null,


            // SECTION

            A:
                section
                ?
                section.A
                :
                null,

            Iyy:
                section
                ?
                section.Iyy
                :
                null,

            Izz:
                section
                ?
                section.Izz
                :
                null,

            J:
                section
                ?
                section.J
                :
                null,

            // BETA ANGLE
            beta:
                betaProperty
                ?
                Number(betaProperty.beta)
                :
                0


        });

    }


    return members;

}

// #endregion



// #region =====================================================
// GET SUPPORTS
// =====================================================

function getSupports(){

    return supportDatabase.map(
        support => ({

            type: support.type,

            ux: support.ux,
            uy: support.uy,
            uz: support.uz,
            rx: support.rx,
            ry: support.ry,
            rz: support.rz,

            uxValue: support.uxValue,
            uyValue: support.uyValue,
            uzValue: support.uzValue,
            rxValue: support.rxValue,
            ryValue: support.ryValue,
            rzValue: support.rzValue,

            assignedNodes:
                [...support.assignedNodes]

        })
    );

}

// #endregion



// #region =====================================================
// GET LOADS
// =====================================================

function getLoads(){

    return loadDatabase;
}

// #endregion
