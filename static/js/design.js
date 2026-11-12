
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

    window.currentColumnDesignDetails = null;

    window.currentBeamDesignDetails = {
        memberId,
        result,
        sectionInfo
    };

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

        <div class="result-card-heading design-card-title">
            <h3>Beam ${memberId}</h3>
            <button type="button" class="see-details-btn"
                onclick="openDesignDetailsPopup()">
                See Details
            </button>
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

    window.currentBeamDesignDetails = null;

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
            `Moment M${direction} Capacity`,
            capacity.Mu_capacity,
            "kNm"
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

    window.currentColumnDesignDetails = {
        memberId,
        result,
        sectionInfo,
        rows
    };


    // =================================================
    // FINAL DISPLAY
    // =================================================

    card.innerHTML = `

        <div class="result-card-heading design-card-title">
            <h3>Column ${memberId}</h3>
            <button type="button" class="see-details-btn"
                onclick="openDesignDetailsPopup()">
                See Details
            </button>
        </div>

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



function renderColumnDesignDetails({ memberId, result, sectionInfo, rows }) {
    const content = document.getElementById("designDetailsContent");

    const values = Object.fromEntries(rows);
    const get = label => values[label] ?? "—";

    const table = (title, entries) => `
        <div class="column-details-section">
            <h4>${title}</h4>
            <table class="design-details-table">
                <tbody>
                    ${entries.map(([label, value]) => `
                        <tr>
                            <td>${label}</td>
                            <td><strong>${value ?? "—"}</strong></td>
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;

    const common = [
        ["Design Type", get("Design Type")],
        ["Section", get("Section")],
        ["Concrete", get("Concrete")],
        ["Steel", get("Steel")]
    ];

    let layout = "";

    if (result.design_type === "biaxial") {

        const biaxialDiagram = createBiaxialInteractionDiagram({
            MuxCapacity: result.capacity?.Mux_capacity,
            MuyCapacity: result.capacity?.Muy_capacity,
            MuxRequired: result.loads?.Mux_design,
            MuyRequired: result.loads?.Muy_design,
            alphaN: result.capacity?.alpha_n,
            Pu: result.loads?.Pu
        });

        layout = `
            <div class="column-biaxial-layout">

                <div class="column-interaction-placeholder">
                    <canvas id="biaxial3DCanvas"
                        width="650" height="930">
                    </canvas>
                    <small>Drag to rotate the interaction surface</small>
                </div>

                <div class="column-biaxial-middle">
                    <div class="column-interaction-placeholder">
                        ${biaxialDiagram
                            ? `<img src="${biaxialDiagram}" alt="Biaxial Interaction Diagram">`
                            : "Biaxial interaction data unavailable"}
                    </div>

                    ${table("Capacity Details", [
                        ["Pure Axial Load Capacity", formatDesignNumber(
                            result.capacity?.Puz, 2
                        ) + " kN"],
                        ["Uniaxial Mux Capacity at Pu =" + formatDesignNumber(
                            result.loads?.Pu, 2
                        ) + " kN", formatDesignNumber(
                            result.capacity?.Mux_capacity, 2
                        ) + " kNm"],
                        ["Uniaxial Muy Capacity at Pu =" + formatDesignNumber(
                            result.loads?.Pu, 2
                        ) + " kN", formatDesignNumber(
                            result.capacity?.Muy_capacity, 2
                        ) + " kNm"],
                        ["Interaction Value", formatDesignNumber(
                            result.capacity?.interaction, 4
                        )]
                    ])}
                </div>

                <div class="column-biaxial-right">
                    ${table("Member Properties", common)}

                    ${table("Reinforcement Details", [
                        ["Ast Percentage", get("Ast Percentage")],
                        ["Total Ast", get("Total Ast")]
                    ])}

                    ${table("Design Loads", [
                        ["Required Axial Load", formatDesignNumber(
                            result.loads?.Pu, 2
                        ) + " kN"],
                        ["Required Moment Mux", formatDesignNumber(
                            result.loads?.Mux_design, 2
                        ) + " kNm"],
                        ["Required Moment Muy", formatDesignNumber(
                            result.loads?.Muy_design, 2
                        ) + " kNm"]
                    ])}

                    ${table("Design Status", [
                        ["Status", get("Design Status")]
                    ])}
                </div>

            </div>
        `;
    }

    else if (result.design_type === "uniaxial") {
        const direction = String(result.bending_direction || "X").toUpperCase();

        const curve = result.interaction_curve || {};

        const pmDiagram = createPMInteractionDiagram({
            Pu: curve.Pu,
            Mu: curve.Mu,
            requiredPu: result.loads?.Pu,
            requiredMu: result.capacity?.Mu_required,
            capacityMu: result.capacity?.Mu_capacity
        });

        layout = `
            <div class="column-uniaxial-layout">

                <div class="column-interaction-placeholder">
                    ${pmDiagram
                        ? `<img src="${pmDiagram}" alt="PM Interaction Curve">`
                        : "PM interaction curve data unavailable"}
                </div>

                <div class="column-uniaxial-details">
                    ${table("Member Properties", common)}

                    ${table("Reinforcement Details", [
                        ["Ast Percentage", get("Ast Percentage")],
                        ["Total Ast", get("Total Ast")]
                    ])}

                    ${table("Loads and Capacities", [
                        ["Required Axial Load", get("Required Axial Load")],
                        [`Required Moment M${direction}`, get(`Required Moment M${direction}`)],
                        [`Moment M${direction} Capacity at Pu =`+ get("Required Axial Load"), get(`Moment M${direction} Capacity`)]
                    ])}

                    ${table("Design Status", [
                        ["Status", get("Design Status")]
                    ])}
                </div>

            </div>
        `;
    }

    else {
        // Axial: show exactly the details already present on the card
        layout = table("Design Details", rows);
    }

    content.innerHTML = `
        <div class="design-details-member-title">
            <h3>Column ${memberId}</h3>
        </div>
        ${layout}
    `;

    if (result.design_type === "biaxial") {
        drawBiaxial3DInteraction(
            "biaxial3DCanvas",
            result.interaction_surface,
            {
                Mux: result.loads?.Mux_design,
                Muy: result.loads?.Muy_design,
                Pu: result.loads?.Pu
            }
        );
    }
}

function openDesignDetailsPopup() {

    if (window.currentColumnDesignDetails) {
        renderColumnDesignDetails(window.currentColumnDesignDetails);
        document.getElementById("designDetailsOverlay").style.display = "flex";
        return;
    }


    const content = document.getElementById("designDetailsContent");
    const details = window.currentBeamDesignDetails;

    if (!details) return;

    const { memberId, result, sectionInfo } = details;

    // Keep the existing popup behavior for columns
    if (!window.designResults) return;

    const selected = (window.structuralSelection?.items || [])
        .filter(item => item.type === "member");

    const members = getMembers();
    const member = members.find(m => String(m.name) === String(memberId));

    if (!member) return;

    const sfd = window.analysisResults?.sfd?.find(
        d => String(d.member) === String(memberId)
    );

    const bmd = window.analysisResults?.bmd?.find(
        d => String(d.member) === String(memberId)
    );

    const sfdDiagram = createMemberDiagramImage({
        title: "SFD — Vy",
        x: sfd?.x,
        values: sfd?.V?.y,
        unit: "kN",
        color: "#2453b8"
    });

    const bmdDiagram = createMemberDiagramImage({
        title: "BMD — Mz",
        x: bmd?.x,
        values: bmd?.M?.z,
        unit: "kNm",
        color: "#16834a"
    });

    const format = value =>
        Number.isFinite(Number(value)) ? Number(value).toFixed(3) : "—";

    const stations = ["start", "centre", "end"];
    const stationLabels = ["Start", "Centre", "End"];

    const resultRows = [
        ["Distance (m)", "x"],
        ["Ast Top (mm²)", "As_top"],
        ["Ast Bottom (mm²)", "As_bottom"],
        ["Shear Reinforcement (mm²/m)", "Asv"],
        ["Moment Mu (kNm)", "Mu"],
        ["Shear Vu (kN)", "Vu"]
    ];

    const designTable = `
        <table class="design-details-table">
            <thead>
                <tr>
                    <th>Design Results</th>
                    ${stationLabels.map(label => `<th>${label}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${resultRows.map(([label, key]) => `
                    <tr>
                        <td>${label}</td>
                        ${stations.map(station =>
                            `<td>${format(result.stations?.[station]?.[key])}</td>`
                        ).join("")}
                    </tr>
                `).join("")}
            </tbody>
        </table>
    `;

    const maximumTable = `
        <div class="design-details-max-table">
            <h4>Maximum Values</h4>

            <table class="design-details-table">
                <thead>
                    <tr>
                        <th>Property</th>
                        <th>Maximum</th>
                        <th>x @ Maximum (m)</th>
                        <th>Minimum</th>
                        <th>x @ Minimum (m)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Vy (kN)</td>
                        <td>${format(sfd?.max_V?.y)}</td>
                        <td>${format(sfd?.x_max_V?.y)}</td>
                        <td>${format(sfd?.min_V?.y)}</td>
                        <td>${format(sfd?.x_min_V?.y)}</td>
                    </tr>
                    <tr>
                        <td>Mz (kNm)</td>
                        <td>${format(bmd?.max_M?.z)}</td>
                        <td>${format(bmd?.x_max_M?.z)}</td>
                        <td>${format(bmd?.min_M?.z)}</td>
                        <td>${format(bmd?.x_min_M?.z)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    `;

    content.innerHTML = `
        <div class="design-details-member-title">
            <h3>Beam ${memberId}</h3>
        </div>

        <div class="beam-details-layout">

            <div class="beam-details-left">

                <div class="beam-diagram-placeholder">
                    ${bmdDiagram
                        ? `<img src="${bmdDiagram}" alt="BMD Mz diagram">`
                        : "BMD data unavailable"}
                </div>

                <div class="beam-diagram-placeholder">
                    ${sfdDiagram
                        ? `<img src="${sfdDiagram}" alt="SFD Vy diagram">`
                        : "SFD data unavailable"}
                </div>

                ${maximumTable}

            </div>

            <div class="beam-details-right">

                <div class="beam-details-section">
                    <h4>Section Properties</h4>

                    <table class="design-details-table">
                        <tbody>
                            ${[
                                ["Section", formatSectionSize(sectionInfo)],
                                ["Concrete", sectionInfo.concrete],
                                ["Steel", sectionInfo.steel],
                                ["Effective Cover", `${sectionInfo.effectiveCover ?? "—"} mm`]
                            ].map(([label, value]) => `
                                <tr>
                                    <td>${label}</td>
                                    <td><strong>${value || "—"}</strong></td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                </div>

                <div class="beam-details-section">
                    <h4>Design Results</h4>
                    ${designTable}
                </div>

            </div>

        </div>
    `;

    document.getElementById("designDetailsOverlay").style.display = "flex";
}

function closeDesignDetailsPopup() {
    document.getElementById("designDetailsOverlay").style.display = "none";
}