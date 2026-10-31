
// =====================================================
// DESIGN
// =====================================================

window.designResults = null;

async function loadDesignResults() {

    const members = getMembers();
    const inputs = {};
    const memberInfo = {};

    members.forEach((member, index) => {

        const table = document.getElementById(
            memberTableType(member.name) === "column"
                ? "columnsTable"
                : "beamsTable"
        );

        const row = [...table.rows].find(
            r => r.cells[0]?.querySelector("input")?.value === member.name
        );

        const section = sectionDatabase.find(
            s => String(s.id) === String(row?.dataset.sectionId)
        );

        if (!section) return;

        const material = materialDatabase.find(
            m => m.name === section.materialName
        );

        const dimensions = section.dimensions;
        const properties = section.designProperties || {};

        if (
            section.type !== "rectangular" ||
            !material?.concreteGrade ||
            !properties.steelGrade ||
            properties.effectiveCover == null
        ) return;

        const nodes = window.nodeDatabase || [];
        const start = nodes.find(n => String(n.nodeId) === String(member.start));
        const end = nodes.find(n => String(n.nodeId) === String(member.end));

        if (!start || !end) return;

        const length = Math.hypot(
            end.x - start.x,
            end.y - start.y,
            end.z - start.z
        ) * 1000;

        inputs[index] = {
            member_type: memberTableType(member.name),

            b: dimensions.b * 1000,
            D: dimensions.d * 1000,

            fck: Number(material.concreteGrade),
            fy: Number(properties.steelGrade.replace(/[^\d.]/g, "")),
            effective_cover: Number(properties.effectiveCover),

            moment_direction: "z",
            shear_direction: "y",

            Le_x: length,
            Le_y: length
        };

        const concreteGrade = String(material.concreteGrade).trim();
        const steelGrade = String(properties.steelGrade).trim();

        memberInfo[String(index)] = {
            b: dimensions.b * 1000,
            D: dimensions.d * 1000,

            concrete: /^m/i.test(concreteGrade)
                ? concreteGrade
                : `M${concreteGrade}`,

            steel: /^fe/i.test(steelGrade)
                ? steelGrade
                : `Fe${steelGrade}`,

            effectiveCover: Number(properties.effectiveCover)
        };
    });

    const card = document.getElementById("designResultCard");

    if (!Object.keys(inputs).length) {
        card.innerHTML = "Assign valid rectangular sections and design properties first.";
        return;
    }

    card.innerHTML = "Designing members...";

    try {
        const response = await fetch("/design", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify(inputs)
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            throw new Error(data.error || "Design failed.");
        }

        window.designResults = data;
        window.designMemberInfo = memberInfo;

        renderSelectedDesignResult();

    } catch (error) {
        card.innerHTML = `<p class="design-error">${error.message}</p>`;
    }
}


// =====================================================
// MEMBER TYPE
// =====================================================

function memberTableType(memberId) {

    const column = [...document.getElementById("columnsTable").rows]
        .some(row => row.cells[0]?.querySelector("input")?.value === memberId);

    return column ? "column" : "beam";
}


// =====================================================
// DISPLAY SELECTED MEMBER DESIGN
// =====================================================

function renderSelectedDesignResult() {

    const card = document.getElementById("designResultCard");

    if (!card || !window.designResults) return;

    const selected = (window.structuralSelection?.items || [])
        .filter(item => item.type === "member");

    if (selected.length !== 1) {
        card.innerHTML = `
            <div class="result-card-heading">
                <h3>Member Design</h3>
                <p>${
                    selected.length
                        ? "Select only one member to view its design results."
                        : "Select a beam or column in the Plan View."
                }</p>
            </div>
        `;
        return;
    }

    const member = selected[0];
    const members = getMembers();

    const index = members.findIndex(
        m => String(m.name) === String(member.id)
    );

    if (index < 0) {
        card.innerHTML = "Selected member not found.";
        return;
    }

    const resultKey = String(index);
    const data = window.designResults[resultKey];

    if (!data) {
        card.innerHTML = "Design results are not available for this member.";
        return;
    }

    if (data.status !== "DESIGNED") {
        card.innerHTML = `
            <p class="design-error">
                ${data.results?.error || "Design failed."}
            </p>
        `;
        return;
    }

    const result = data.results;

    // BEAM RESULTS
    if (data.member_type === "beam") {
        renderBeamDesignResult(card, member.id, result, window.designMemberInfo?.[resultKey] || {});
        return;
    }

    // COLUMN RESULTS
    renderColumnDesignResult(
        card,
        member.id,
        result,
        window.designMemberInfo?.[resultKey] || {}
    );
}


// =====================================================
// BEAM DESIGN RESULTS
// =====================================================

function renderBeamDesignResult(
    card,
    memberId,
    result,
    sectionInfo
) {

    const stations = result.stations || {};

    const stationOrder = ["start", "centre", "end"];

    const stationLabels = {
        start: "Start",
        centre: "Centre",
        end: "End"
    };

    const stationData = stationOrder.map(name => ({
        name,
        label: stationLabels[name],
        data: stations[name] || {}
    }));

    const formatValue = (value) => {
        const number = Number(value);

        return Number.isFinite(number)
            ? number.toFixed(2)
            : "—";
    };

    const formatDistance = (value) => {
        const number = Number(value);

        return Number.isFinite(number)
            ? number.toFixed(2)
            : "—";
    };

    // -----------------------------------------------
    // SECTION DETAILS
    // -----------------------------------------------

    const sectionDetails = [
        ["Section", formatSectionSize(sectionInfo)],
        ["Concrete", sectionInfo.concrete || "—"],
        ["Steel", sectionInfo.steel || "—"],
        [
            "Effective Cover",
            Number.isFinite(Number(sectionInfo.effectiveCover))
                ? `${Number(sectionInfo.effectiveCover).toFixed(0)} mm`
                : "—"
        ]
    ];

    // -----------------------------------------------
    // DESIGN RESULT ROWS
    // -----------------------------------------------

    const resultRows = [
        {
            label: "Ast Top (mm²)",
            key: "As_top"
        },
        {
            label: "Ast Bottom (mm²)",
            key: "As_bottom"
        },
        {
            label: "Shear Reinforcement (mm²/m)",
            key: "Asv"
        },
        {
            label: "Moment Mu (kNm)",
            key: "Mu"
        },
        {
            label: "Shear Vu (kN)",
            key: "Vu"
        }
    ];

    // -----------------------------------------------
    // FINAL DISPLAY
    // -----------------------------------------------

    card.innerHTML = `

        <div class="result-card-heading">
            <h3>Beam ${memberId}</h3>
        </div>

        <div class="beam-section-details">

            ${sectionDetails.map(([label, value]) => `
                <div class="design-result-row">
                    <span>${label}</span>
                    <strong>${value}</strong>
                </div>
            `).join("")}

        </div>

        <div class="beam-design-table-wrapper">

            <table class="beam-design-table">

                <thead>
                    <tr>
                        <th>Design Results</th>

                        ${stationData.map(station => `
                            <th>${station.label}</th>
                        `).join("")}
                    </tr>
                </thead>

                <tbody>

                    <tr>
                        <td>Distance (m)</td>

                        ${stationData.map(station => `
                            <td>${formatDistance(station.data.x)}</td>
                        `).join("")}
                    </tr>

                    ${resultRows.map(row => `
                        <tr>
                            <td>${row.label}</td>

                            ${stationData.map(station => `
                                <td>
                                    ${formatValue(station.data[row.key])}
                                </td>
                            `).join("")}

                        </tr>
                    `).join("")}

                </tbody>

            </table>

        </div>
    `;
}

// =====================================================
// COLUMN DESIGN RESULTS
// =====================================================

function renderColumnDesignResult(
    card,
    memberId,
    result,
    sectionInfo
) {

    const rows = [];

    const addRow = (label, value) => {
        if (value === undefined || value === null || value === "") return;

        rows.push([label, value]);
    };

    const addNumber = (label, value, unit = "", digits = 2) => {

        if (value === undefined || value === null) return;

        const number = Number(value);

        if (!Number.isFinite(number)) return;

        addRow(
            label,
            `${number.toFixed(digits)}${unit ? " " + unit : ""}`
        );
    };

    const loads = result.loads || {};
    const capacity = result.capacity || {};
    const eccentricity = result.eccentricity || {};

    // COMMON SECTION INFORMATION

    addRow("Design Type", getColumnDesignType(result));

    addRow(
        "Section",
        formatSectionSize(sectionInfo)
    );

    addRow("Concrete", sectionInfo.concrete || "—");
    addRow("Steel", sectionInfo.steel || "—");


    // =================================================
    // BIAXIAL COLUMN
    // =================================================

    if (result.design_type === "biaxial") {

        addNumber("Required Axial Load", loads.Pu, "kN");

        addNumber(
            "Required Moment Mux",
            loads.Mux_design,
            "kNm"
        );

        addNumber(
            "Required Moment Muy",
            loads.Muy_design,
            "kNm"
        );

        addNumber(
            "Ast Percentage",
            result.Ast_percent,
            "%",
            3
        );

        addNumber(
            "Total Ast",
            result.Ast,
            "mm²"
        );

        addNumber(
            "Axial Load Capacity",
            capacity.Puz,
            "kN"
        );

        addNumber(
            "Moment Mux Capacity",
            capacity.Mux_capacity,
            "kNm"
        );

        addNumber(
            "Moment Muy Capacity",
            capacity.Muy_capacity,
            "kNm"
        );

        addNumber(
            "Interaction Value",
            capacity.interaction,
            "",
            4
        );

        addRow(
            "Design Status",
            getColumnDesignStatus(result, capacity.interaction)
        );
    }


    // =================================================
    // UNIAXIAL COLUMN
    // =================================================

    else if (result.design_type === "uniaxial") {

        const direction = String(
            result.bending_direction || "X"
        ).toUpperCase();

        const isX = direction === "X";

        const requiredMoment = isX
            ? loads.Mux_design
            : loads.Muy_design;

        addNumber(
            "Required Axial Load",
            loads.Pu,
            "kN"
        );

        addNumber(
            `Required Moment M${direction}`,
            requiredMoment,
            "kNm"
        );

        addNumber(
            "Ast Percentage",
            result.Ast_percent,
            "%",
            3
        );

        addNumber(
            "Total Ast",
            result.Ast,
            "mm²"
        );

        addNumber(
            `Moment M${direction} Capacity`,
            capacity.Mu_capacity,
            "kNm"
        );

        addNumber(
            "Minimum Eccentricity X",
            eccentricity.emin_x,
            "mm"
        );

        addNumber(
            "Minimum Eccentricity Y",
            eccentricity.emin_y,
            "mm"
        );

        addNumber(
            "Design Eccentricity X",
            eccentricity.design_ex,
            "mm"
        );

        addNumber(
            "Design Eccentricity Y",
            eccentricity.design_ey,
            "mm"
        );

        const utilization = requiredMoment && capacity.Mu_capacity
            ? requiredMoment / capacity.Mu_capacity
            : null;

        addRow(
            "Design Status",
            getColumnDesignStatus(result, utilization)
        );
    }


    // =================================================
    // AXIAL COLUMN
    // =================================================

    else if (result.design_type === "axial") {

        addNumber(
            "Required Axial Load",
            loads.Pu,
            "kN"
        );

        addNumber(
            "Ast Percentage",
            result.Ast_percent,
            "%",
            3
        );

        addNumber(
            "Total Ast",
            result.Ast,
            "mm²"
        );

        addNumber(
            "Axial Load Capacity",
            result.Pu_capacity,
            "kN"
        );

        addNumber(
            "Minimum Eccentricity X",
            eccentricity.emin_x,
            "mm"
        );

        addNumber(
            "Minimum Eccentricity Y",
            eccentricity.emin_y,
            "mm"
        );

        const utilization = loads.Pu && result.Pu_capacity
            ? loads.Pu / result.Pu_capacity
            : null;

        addRow(
            "Design Status",
            getColumnDesignStatus(result, utilization)
        );
    }


    // UNKNOWN DESIGN TYPE

    else {

        card.innerHTML = `
            <p class="design-error">
                Unknown column design type.
            </p>
        `;

        return;
    }


    // =================================================
    // FINAL DISPLAY
    // =================================================

    card.innerHTML = `
        <h3>Column ${memberId}</h3>

        <div class="column-design-results">

            ${rows.map(([label, value]) => `
                <div class="design-result-row">
                    <span>${label}</span>
                    <strong>${value}</strong>
                </div>
            `).join("")}

        </div>
    `;
}


// =====================================================
// COLUMN DESIGN HELPERS
// =====================================================

function getColumnDesignType(result) {

    if (result.design_type === "biaxial") {
        return "Biaxial";
    }

    if (result.design_type === "uniaxial") {
        return `Uniaxial (${result.bending_direction}-direction)`;
    }

    if (result.design_type === "axial") {
        return "Axial Compression";
    }

    return result.design_type || "—";
}


// =====================================================
// DESIGN STATUS
// =====================================================

function getColumnDesignStatus(result, utilization) {

    if (result.status !== "SAFE") {
        return "NOT SAFE";
    }

    const ratio = Number(utilization);

    if (
        Number.isFinite(ratio) &&
        ratio >= 0.99 &&
        ratio <= 1.0
    ) {
        return "SAFE AND ECONOMICAL";
    }

    return "SAFE";
}


// =====================================================
// SECTION SIZE
// =====================================================

function formatSectionSize(sectionInfo) {

    const b = Number(sectionInfo.b);
    const D = Number(sectionInfo.D);

    if (!Number.isFinite(b) || !Number.isFinite(D)) {
        return "—";
    }

    return `${b.toFixed(0)} × ${D.toFixed(0)} mm`;
}


// =====================================================
// NUMBER FORMATTING
// =====================================================

function formatDesignNumber(value, digits = 2) {

    const number = Number(value);

    return Number.isFinite(number)
        ? number.toFixed(digits)
        : "—";
}
