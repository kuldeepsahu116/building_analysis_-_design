// #region =====================================================
// GET NODES
// =====================================================

// function getNodes(){

//     let nodes = {};

//     let rows = document.getElementById("nodesTable").rows;

//     for(let i=1; i<rows.length; i++){

//         let c = rows[i].cells;

//         nodes[
//             c[0].children[0].value
//         ] = [

//             +c[1].children[0].value,

//             +c[2].children[0].value,

//             +c[3].children[0].value
//         ];
//     }

//     return nodes;
// }

function getNodes(){

    const nodes = {};

    if (
        !window.nodeDatabase ||
        !Array.isArray(window.nodeDatabase)
    ) {
        return nodes;
    }


    window.nodeDatabase.forEach(
        node => {

            nodes[
                String(node.nodeId)
            ] = [

                Number(node.x),

                Number(node.y),

                Number(node.z)

            ];
        }
    );


    return nodes;
}

// #endregion



// #region =====================================================
// GET MEMBERS
// =====================================================

function getMembers(){

    let members = [];

    const tables = [
        document.getElementById("beamsTable"),
        document.getElementById("columnsTable")
    ];


    tables.forEach(table => {
        if (!table) {
            return;
        }
        let rows = table.rows;

        for(let i=1; i<rows.length; i++){

            let c = rows[i].cells;

            if (!c || c.length < 3) {
                continue;
            }

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


            // FIND THE SECTION STORED ON THIS MEMBER ROW
            const sectionId =
                rows[i].dataset.sectionId || null;

            let section = sectionId
                ? sectionDatabase.find(
                    s => String(s.id) === String(sectionId)
                )
                : null;


            // Backward compatibility for members created
            // before the new section-ID system.
            if (!section) {
                section = sectionDatabase.find(
                    s =>
                        Array.isArray(s.assignedMembers) &&
                        s.assignedMembers
                            .map(String)
                            .includes(String(name))
                ) || null;
            }

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

                // Section identity stored on this member.
                sectionId: section ? String(section.id) : null,

                // MATERIAL — existing assignment workflow
                E: material ? material.E : null,
                G: material ? material.G : null,

                // SECTION — resolved from this member's section ID
                A: section ? section.A : null,
                Iyy: section ? section.Iyy : null,
                Izz: section ? section.Izz : null,
                J: section ? section.J : null,

                // Keep existing beta behavior
                beta: betaProperty
                    ? Number(betaProperty.beta)
                    : 0
            });

        }
    });

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
