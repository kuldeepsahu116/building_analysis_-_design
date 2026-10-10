// =====================================================
// 2D DRAWING UI CONTROLLERS
// =====================================================


// =====================================================
// GRID SYSTEM POPUP
// =====================================================

function openDrawing2DGridPopup() {

    syncDrawing2DGridPopup();

    const popup =
        document.getElementById(
            "drawing2DGridPopup"
        );

    if (!popup) return;

    popup.style.display = "flex";

    popup.setAttribute(
        "aria-hidden",
        "false"
    );
}


function closeDrawing2DGridPopup() {

    const popup =
        document.getElementById(
            "drawing2DGridPopup"
        );

    if (!popup) return;

    popup.style.display = "none";

    popup.setAttribute(
        "aria-hidden",
        "true"
    );
}


function applyDrawing2DGridSettings() {

    saveDrawing2DGridSettings();

    updateDrawing2DGrid();

    syncDrawing2DFloorOptions();

    closeDrawing2DGridPopup();
}


// =====================================================
// READ SETTINGS FROM POPUP
// =====================================================

function saveDrawing2DGridSettings() {

    const settings =
        window.drawing2D.gridSettings;

    settings.name =
        document.getElementById(
            "gridSystemName"
        )?.value.trim() || "G1";


    settings.originX =
        Number(
            document.getElementById(
                "gridOriginX"
            )?.value
        ) || 0;


    settings.originZ =
        Number(
            document.getElementById(
                "gridOriginZ"
            )?.value
        ) || 0;


    settings.rotation =
        Number(
            document.getElementById(
                "gridRotation"
            )?.value
        ) || 0;


    settings.color =
        document.getElementById(
            "gridColor"
        )?.value ||
        "#B5B6B8";
}


// =====================================================
// WRITE SETTINGS TO POPUP
// =====================================================

function syncDrawing2DGridPopup() {

    const settings =
        window.drawing2D.gridSettings;


    document.getElementById(
        "gridSystemName"
    ).value =
        settings.name;


    document.getElementById(
        "gridOriginX"
    ).value =
        settings.originX;


    document.getElementById(
        "gridOriginZ"
    ).value =
        settings.originZ;


    document.getElementById(
        "gridRotation"
    ).value =
        settings.rotation;


    document.getElementById(
        "gridColor"
    ).value =
        settings.color;


    syncStoryTableUI();

    switchStoryMode(
        window.drawing2D
            .storySettings
            .addMode
    );


    renderCustomGridLineUI();
}


// =====================================================
// GRID DATA TABLES
// =====================================================

function renderCustomGridLineUI() {

    renderGridDataTable(
        "X",
        "gridXLineList"
    );


    renderGridDataTable(
        "Z",
        "gridZLineList"
    );
}


function renderGridDataTable(
    axis,
    containerId
) {

    const container =
        document.getElementById(
            containerId
        );


    if (!container) {
        return;
    }


    const lines =
        axis === "X"
            ? window.drawing2D.grid.xLines
            : window.drawing2D.grid.zLines;


    const ordinateMode =
        window.drawing2D.gridMode ===
        "ordinate";


    container.innerHTML =
        lines.map(
            (line, index) => {

                const coordinate =
                    Number(
                        line.coordinate
                    );


                const spacing =
                    index === 0
                        ? null
                        : coordinate -
                          Number(
                              lines[index - 1]
                                  .coordinate
                          );


                const value =
                    ordinateMode
                        ? coordinate
                        : spacing;


                const firstRow =
                    index === 0;


                const displayValue =
                    value === null
                        ? "—"
                        : value.toFixed(2);


                const input =
                    firstRow &&
                    !ordinateMode

                        ? `
                            <span class="grid-table-origin">
                                —
                            </span>
                        `

                        : `
                            <input
                                type="number"
                                class="grid-table-value"
                                value="${displayValue}"
                                min="0"
                                step="0.01"
                                ${(
                                    ordinateMode &&
                                    firstRow
                                ) ? "disabled" : ""}
                                onchange="
                                    updateGridTableValue(
                                        '${axis}',
                                        ${index},
                                        this.value
                                    )
                                ">
                        `;


                const deleteButton =
                    firstRow
                        ? ""
                        : `
                            <button
                                type="button"
                                class="grid-table-delete"
                                onclick="
                                    removeGridLine(
                                        '${axis}',
                                        ${index}
                                    )
                                ">
                                ×
                            </button>
                        `;


                return `
                    <tr>

                        <td class="grid-table-id">
                            ${line.id}
                        </td>

                        <td>
                            <div class="grid-table-value-wrap">
                                ${input}
                                ${deleteButton}
                            </div>
                        </td>

                    </tr>
                `;
            }
        )
        .join("");
}


function updateGridTableHeaders() {

    const ordinateMode =
        window.drawing2D.gridMode ===
        "ordinate";


    const xHeader =
        document.getElementById(
            "gridXValueHeader"
        );


    const zHeader =
        document.getElementById(
            "gridZValueHeader"
        );


    if (xHeader) {

        xHeader.textContent =
            ordinateMode
                ? "X Ordinate (m)"
                : "X Spacing (m)";
    }


    if (zHeader) {

        zHeader.textContent =
            ordinateMode
                ? "Z Ordinate (m)"
                : "Z Spacing (m)";
    }
}


// =====================================================
// GRID MODE
// =====================================================

function switchGridMode(mode) {

    const validMode =
        mode === "ordinate"
            ? "ordinate"
            : "spacing";


    window.drawing2D.gridMode =
        validMode;


    document
        .getElementById(
            "btnUniformMode"
        )
        ?.classList.toggle(
            "active",
            validMode === "spacing"
        );


    document
        .getElementById(
            "btnCustomMode"
        )
        ?.classList.toggle(
            "active",
            validMode === "ordinate"
        );


    const spacingSection =
        document.getElementById(
            "gridUniformSection"
        );


    const ordinateSection =
        document.getElementById(
            "gridCustomSection"
        );


    if (spacingSection) {

        spacingSection.style.display =
            validMode === "spacing"
                ? "block"
                : "none";
    }


    if (ordinateSection) {

        ordinateSection.style.display =
            validMode === "ordinate"
                ? "block"
                : "none";
    }


    updateGridTableHeaders();

    renderCustomGridLineUI();
}


// =====================================================
// GRID BY SPACING
// =====================================================

function addGridBySpacing(axis) {

    const spacingInput =
        document.getElementById(
            axis === "X"
                ? "gridXSpacing"
                : "gridZSpacing"
        );


    const countInput =
        document.getElementById(
            axis === "X"
                ? "gridXCount"
                : "gridZCount"
        );


    const spacing =
        Number(
            spacingInput?.value
        );


    const count =
        Math.floor(
            Number(
                countInput?.value
            )
        );


    if (
        !Number.isFinite(spacing) ||
        spacing <= 0 ||
        !Number.isFinite(count) ||
        count < 1
    ) {
        return;
    }


    const lines =
        axis === "X"
            ? window.drawing2D.grid.xLines
            : window.drawing2D.grid.zLines;


    // Make sure an origin line exists
    if (!lines.length) {

        lines.push({
            uid:
                generateDrawing2DGridUID(axis),
                
            coordinate: 0
        });
    }


    const lastCoordinate =
        Number(
            lines[lines.length - 1]
                .coordinate
        );


    // ---------------------------------------------
    // Add ONLY at the end
    // ---------------------------------------------

    for (
        let i = 1;
        i <= count;
        i++
    ) {

        lines.push({
            uid:
                generateDrawing2DGridUID(axis),
                
            coordinate:
                lastCoordinate +
                spacing * i
        });
    }


    if (axis === "X") {

        window.drawing2D.grid.xSpacing =
            spacing;

        window.drawing2D.grid.xCount =
            count;

    } else {

        window.drawing2D.grid.zSpacing =
            spacing;

        window.drawing2D.grid.zCount =
            count;
    }


    refreshGridData();
}


// =====================================================
// CUSTOM GRID COORDINATE
// =====================================================

function addCustomGridCoord(axis) {

    const input =
        document.getElementById(
            axis === "X"
                ? "customXPos"
                : "customZPos"
        );


    const coordinate =
        Number(
            input?.value
        );


    if (
        !Number.isFinite(coordinate) ||
        coordinate < 0
    ) {
        return;
    }


    const lines =
        axis === "X"
            ? window.drawing2D.grid.xLines
            : window.drawing2D.grid.zLines;


    const duplicate =
        lines.some(
            line =>
                Math.abs(
                    Number(line.coordinate) -
                    coordinate
                ) < 1e-9
        );


    if (duplicate) {
        return;
    }


    lines.push({

        uid:
            generateDrawing2DGridUID(axis),

        coordinate
    });


    input.value = "";


    refreshGridData();
}


function generateGridDataPreview() {

    generateDrawing2DGridLines();

    renderCustomGridLineUI();
}


function removeCustomGridCoord(
    axis,
    coordinate
) {

    if (axis === "X") {

        window.drawing2D.customXCoords =
            window.drawing2D.customXCoords.filter(
                value =>
                    Number(value) !==
                    Number(coordinate)
            );

    } else {

        window.drawing2D.customZCoords =
            window.drawing2D.customZCoords.filter(
                value =>
                    Number(value) !==
                    Number(coordinate)
            );
    }


    generateGridDataPreview();
}


function renderCustomGridLineUI() {

    renderGridDataTable(
        "X",
        "gridXLineList"
    );


    renderGridDataTable(
        "Z",
        "gridZLineList"
    );
}


function refreshGridData(
    fit = false
) {

    generateDrawing2DGridLines();

    renderCustomGridLineUI();

    drawDrawing2DGrid();

    updateDrawing2DGridStatus();

    if (typeof refreshThreeDGrid === "function") {
        refreshThreeDGrid();
    }

    if (
        typeof refreshDrawing2DNodes === "function") {
        refreshDrawing2DNodes();
    }


    if (
        typeof refreshDrawing2DMembers ==="function") {
        refreshDrawing2DMembers();
    }

    if (fit) {
        fitDrawing2DView();
    }
}


function updateGridTableValue(
    axis,
    index,
    rawValue
) {

    const value =
        Number(rawValue);


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {
        renderCustomGridLineUI();
        return;
    }


    const lines =
        axis === "X"
            ? window.drawing2D.grid.xLines
            : window.drawing2D.grid.zLines;


    if (
        !lines[index]
    ) {
        return;
    }


    // ---------------------------------------------
    // ORDINATE MODE
    // ---------------------------------------------

    if (
        window.drawing2D.gridMode ===
        "ordinate"
    ) {

        // Origin must remain 0
        if (
            index === 0 &&
            Math.abs(value) > 1e-9
        ) {
            renderCustomGridLineUI();
            return;
        }


        // No duplicates
        const duplicate =
            lines.some(
                (line, i) =>
                    i !== index &&
                    Math.abs(
                        Number(line.coordinate) -
                        value
                    ) < 1e-9
            );


        if (duplicate) {
            renderCustomGridLineUI();
            return;
        }


        lines[index].coordinate =
            value;


        // Automatically sort
        lines.sort(
            (a, b) =>
                a.coordinate -
                b.coordinate
        );
    }


    // ---------------------------------------------
    // SPACING MODE
    // ---------------------------------------------

    else {

        // First row represents origin
        if (index === 0) {
            renderCustomGridLineUI();
            return;
        }


        if (value <= 0) {
            renderCustomGridLineUI();
            return;
        }


        const previous =
            Number(
                lines[index - 1]
                    .coordinate
            );


        const oldCoordinate =
            Number(
                lines[index]
                    .coordinate
            );


        const newCoordinate =
            previous + value;


        const delta =
            newCoordinate -
            oldCoordinate;


        // Move this and every following grid
        for (
            let i = index;
            i < lines.length;
            i++
        ) {

            lines[i].coordinate +=
                delta;
        }


        if (axis === "X") {
            window.drawing2D.grid.xSpacing =
                value;
        } else {
            window.drawing2D.grid.zSpacing =
                value;
        }
    }


    refreshGridData();
}


function removeGridLine(
    axis,
    index
) {

    const lines =
        axis === "X"
            ? window.drawing2D.grid.xLines
            : window.drawing2D.grid.zLines;


    // Never remove the origin grid
    if (
        index <= 0 ||
        index >= lines.length
    ) {
        return;
    }


    lines.splice(
        index,
        1
    );


    refreshGridData();
}


// =====================================================
// FLOOR / STORY OPTIONS
// =====================================================

function getStoryName(index) {

    const names = [
        "Base",
        "Ground Floor",
        "First Floor",
        "Second Floor",
        "Third Floor",
        "Fourth Floor",
        "Fifth Floor",
        "Sixth Floor",
        "Seventh Floor",
        "Eighth Floor",
        "Ninth Floor",
        "Tenth Floor"
    ];


    return (
        names[index] ||
        `Floor ${index-1}`
    );
}


function syncDrawing2DFloorOptions() {

    const select =
        document.getElementById(
            "drawing2DFloor"
        );


    if (!select) {
        return;
    }


    const stories =
        window.drawing2D
            .storySettings
            .stories;


    const current =
        window.drawing2D.floor;


    sortStories();


    select.innerHTML = "";


    stories.forEach(
        story => {

            const option =
                document.createElement(
                    "option"
                );


            option.value =
                story.id;


            option.textContent =
                story.name;


            select.appendChild(
                option
            );
        }
    );


    const exists =
        stories.some(
            story =>
                story.id === current
        );


    select.value =
        exists
            ? current
            : "F0";


    // Update the 3D grid.
    if (
        typeof refreshThreeDGrid ===
        "function"
    ) {
        refreshThreeDGrid();
    }
}


function switchStoryRangeMode(
    mode
) {

    const userMode =
        mode === "user";


    const top =
        document.getElementById(
            "gridTopStory"
        );


    const bottom =
        document.getElementById(
            "gridBottomStory"
        );


    if (top) {
        top.disabled =
            !userMode;
    }


    if (bottom) {
        bottom.disabled =
            !userMode;
    }


    window.drawing2D.storySettings.rangeMode =
        mode;
}


function syncStoryRangeOptions() {

    const top =
        document.getElementById(
            "gridTopStory"
        );


    const bottom =
        document.getElementById(
            "gridBottomStory"
        );


    if (!top || !bottom) {
        return;
    }


    const stories =
        window.drawing2D.storySettings;


    const options = [];


    for (
        let i = 0;
        i <= stories.storyCount;
        i++
    ) {

        options.push({
            id: `F${i}`,
            name: getStoryName(i)
        });
    }


    const build =
        select => {

            const current =
                select.value;


            select.innerHTML = "";


            options.forEach(
                story => {

                    const option =
                        document.createElement(
                            "option"
                        );


                    option.value =
                        story.id;

                    option.textContent =
                        story.name;

                    select.appendChild(
                        option
                    );
                }
            );


            if (
                options.some(
                    item =>
                        item.id === current
                )
            ) {
                select.value =
                    current;
            }
        };


    build(top);
    build(bottom);


    top.value =
        stories.topStory ||
        `F${stories.storyCount}`;


    bottom.value =
        stories.bottomStory ||
        "F0";
}


function switchStoryMode(mode) {

    const validMode =
        mode === "ordinate"
            ? "ordinate"
            : "spacing";


    const d2d =
        window.drawing2D;


    d2d.storySettings.addMode =
        validMode;


    document.getElementById(
        "storySpacingModeBtn"
    )?.classList.toggle(
        "active",
        validMode === "spacing"
    );


    document.getElementById(
        "storyOrdinateModeBtn"
    )?.classList.toggle(
        "active",
        validMode === "ordinate"
    );


    document.getElementById(
        "storySpacingSection"
    ).style.display =
        validMode === "spacing"
            ? "block"
            : "none";


    document.getElementById(
        "storyOrdinateSection"
    ).style.display =
        validMode === "ordinate"
            ? "block"
            : "none";


    prepareStoryAddInputs(validMode);

    syncStoryTableHeader();
}


function getStorySpacing(
    index
) {

    const stories =
        window.drawing2D
            .storySettings
            .stories;


    if (
        index <= 0 ||
        index >= stories.length
    ) {
        return null;
    }


    return (
        getStoryElevation(stories[index]) -
        getStoryElevation(stories[index - 1])
    );
}


function getLastStorySpacing() {

    const stories =
        window.drawing2D
            .storySettings
            .stories;


    if (stories.length < 2) {
        return 3;
    }


    return (
        getStoryElevation(
            stories[stories.length - 1]
        ) -
        getStoryElevation(
            stories[stories.length - 2]
        )
    );
}


// =====================================================
// STORY ELEVATION
//
// Y = GLOBAL VERTICAL / HEIGHT AXIS
// =====================================================

function getStoryElevation(story) {

    if (!story) {
        return 0;
    }

    // New coordinate convention:
    // story.y = global Y elevation.
    //
    // The fallback to story.z keeps old projects
    // readable until their story data is migrated.

    if (
        Number.isFinite(
            Number(story.y)
        )
    ) {
        return Number(story.y);
    }

    if (
        Number.isFinite(
            Number(story.z)
        )
    ) {
        return Number(story.z);
    }

    return 0;
}


function setStoryElevation(
    story,
    elevation
) {

    if (!story) {
        return;
    }

    story.y =
        Number(
            Number(elevation).toFixed(6)
        );

    // Do not continue using Z as story elevation.
    if (
        Object.prototype.hasOwnProperty.call(
            story,
            "z"
        )
    ) {
        delete story.z;
    }
}


function prepareStoryAddInputs(mode) {

    const stories =
        window.drawing2D
            .storySettings
            .stories;


    const lastY =
        stories.length
            ? getStoryElevation(
                stories[stories.length - 1]
            )
            : 0;


    const lastSpacing =
        getLastStorySpacing();


    const spacingInput =
        document.getElementById(
            "storySpacing"
        );


    const yInput =
        document.getElementById(
            "storyYInput"
        );


    const nameInput =
        document.getElementById(
            "storyNameInput"
        );


    if (mode === "spacing") {

        if (spacingInput) {
            spacingInput.value =
                lastSpacing.toFixed(2);
        }

    } else {

        if (yInput) {
            yInput.value =
                (
                    lastY +
                    lastSpacing
                ).toFixed(2);
        }


        if (nameInput) {

            nameInput.value =
                getStoryName(
                    stories.length
                );
        }
    }
}


function addStoriesBySpacing() {

    const spacing =
        Number(
            document.getElementById(
                "storySpacing"
            )?.value
        );


    const count =
        Math.floor(
            Number(
                document.getElementById(
                    "storySpacingCount"
                )?.value
            )
        );


    if (
        !Number.isFinite(spacing) ||
        spacing <= 0 ||
        !Number.isFinite(count) ||
        count < 1
    ) {
        return;
    }


    const d2d =
        window.drawing2D;


    const stories =
        d2d.storySettings.stories;


    let lastY =
        stories.length
            ? Math.max(
                ...stories.map(
                    story =>
                        getStoryElevation(story)
                )
            )
            : 0;


    for (
        let i = 0;
        i < count;
        i++
    ) {

        lastY += spacing;


        const story = {
            id:
                `F${d2d.storySettings.nextId++}`,

            name:
                getStoryName(
                    stories.length
                ),

            y:
                Number(
                    lastY.toFixed(6)
                )
        };

        stories.push(story);
    }


    sortStories();

    syncStoryTableUI();

    syncDrawing2DFloorOptions();

    prepareStoryAddInputs(
        "spacing"
    );
}


function addStoryByOrdinate() {

    const y =
        Number(
            document.getElementById(
                "storyYInput"
            )?.value
        );


    let name =
        document.getElementById(
            "storyNameInput"
        )?.value.trim();


    if (
        !Number.isFinite(y) ||
        y <= 0
    ) {
        return;
    }


    const d2d =
        window.drawing2D;


    const stories =
        d2d.storySettings.stories;


    const duplicate =
        stories.some(
            story =>
                Math.abs(
                    getStoryElevation(story) -
                    y
                ) < 1e-9
        );


    if (duplicate) {
        return;
    }


    if (!name) {

        name =
            getStoryName(
                stories.length
            );
    }


    stories.push({

        id:
            `F${d2d.storySettings.nextId++}`,

        name,

        y:
            Number(
                y.toFixed(6)
            )
    });


    sortStories();

    syncStoryTableUI();

    syncDrawing2DFloorOptions();


    document.getElementById(
        "storyNameInput"
    ).value = "";


    prepareStoryAddInputs(
        "ordinate"
    );
}


function sortStories() {

    window.drawing2D
        .storySettings
        .stories
        .sort(
            (a, b) =>
                getStoryElevation(a) -
                getStoryElevation(b)
        );
}


function syncStoryTableHeader() {

    const mode =
        window.drawing2D
            .storySettings
            .addMode;


    const yInput =
        document.getElementById(
            "storyYInput"
        );


    if (!yInput) {
        return;
    }


    yInput.placeholder =
        mode === "ordinate"
            ? "e.g. 6.00"
            : "";
}


function syncStoryTableUI() {

    const tbody =
        document.getElementById(
            "storyLineList"
        );


    if (!tbody) {
        return;
    }


    const stories =
        window.drawing2D
            .storySettings
            .stories;


    sortStories();


    tbody.innerHTML =
        stories.map(
            (story, index) => {

                const isGround =
                    story.id === "F0";

                const y =
                    getStoryElevation(story);

                return `
                    <tr>
                        <td>
                            <input
                                type="text"
                                class="story-table-name"
                                value="${(story.name)}"
                                onchange="
                                    updateStoryTableValue(
                                        ${index},
                                        'name',
                                        this.value
                                    )
                                ">
                        </td>

                        <td>
                            <input
                                type="number"
                                class="story-table-y"
                                value="${y.toFixed(2)}"
                                min="0"
                                step="0.01"
                                ${isGround ? "disabled" : ""}
                                onchange="
                                    updateStoryTableValue(
                                        ${index},
                                        'y',
                                        this.value
                                    )
                                ">
                        </td>

                        <td>
                            ${
                                isGround
                                    ? ""
                                    : `
                                        <button
                                            type="button"
                                            class="story-table-delete"
                                            onclick="
                                                removeStory(
                                                    ${index}
                                                )
                                            ">
                                            ×
                                        </button>
                                    `
                            }
                        </td>

                    </tr>
                `;
            }
        ).join("");
}


function updateStoryTableValue(
    index,
    field,
    rawValue
) {

    const stories =
        window.drawing2D
            .storySettings
            .stories;


    const story =
        stories[index];


    if (!story) {
        return;
    }


    // ---------------------------------------------
    // NAME
    // ---------------------------------------------

    if (field === "name") {

        const name =
            String(rawValue)
                .trim();


        story.name =
            name ||
            getStoryName(index);
    }


    // ---------------------------------------------
    // Y ORDINATE
    // ---------------------------------------------

    if (field === "y") {

        const y =
            Number(rawValue);


        // Ground floor remains at origin
        if (
            story.id === "F0"
        ) {
            syncStoryTableUI();
            return;
        }


        if (
            !Number.isFinite(y) ||
            y <= 0
        ) {
            syncStoryTableUI();
            return;
        }


        const duplicate =
            stories.some(
                (other, i) =>
                    i !== index &&
                    Math.abs(
                        getStoryElevation(other) -
                        y
                    ) < 1e-9
            );


        if (duplicate) {
            syncStoryTableUI();
            return;
        }


        setStoryElevation(
            story,
            y
        );


        sortStories();
    }


    syncStoryTableUI();

    syncDrawing2DFloorOptions();
}


function removeStory(index) {

    const stories =
        window.drawing2D
            .storySettings
            .stories;


    if (
        index < 0 ||
        index >= stories.length
    ) {
        return;
    }


    if (
        stories[index].id === "F0"
    ) {
        return;
    }


    const removedId =
        stories[index].id;


    stories.splice(
        index,
        1
    );


    if (
        window.drawing2D.floor ===
        removedId
    ) {
        window.drawing2D.floor =
            "F0";
    }


    syncStoryTableUI();

    syncDrawing2DFloorOptions();
}


// =====================================================
// GRID VISIBILITY
// =====================================================

function toggleDrawing2DGrid() {

    window.drawing2D.gridVisible =
        !window.drawing2D.gridVisible;


    if (window.drawing2D.gridGroup) {

        window.drawing2D.gridGroup.visible =
            window.drawing2D.gridVisible;
    }


    document
        .getElementById(
            "drawing2DGridBtn"
        )
        ?.classList.toggle(
            "active",
            window.drawing2D.gridVisible
        );
}


// =====================================================
// FIT VIEW
// =====================================================


function getDrawing2DBounds() {

    const group =
        window.drawing2D.gridGroup;


    if (!group) {
        return null;
    }


    group.updateMatrixWorld(true);


    const bounds =
        new THREE.Box2();


    let found = false;


    const addPoint =
        (x, z) => {

            bounds.expandByPoint(
                new THREE.Vector2(
                    x,
                    z
                )
            );


            found = true;
        };


    group.traverse(
        object => {

            if (!object.visible) {
                return;
            }


            // -----------------------------------------
            // Line geometry
            // -----------------------------------------

            const position =
                object.geometry
                    ?.attributes
                    ?.position;


            if (position) {

                const point =
                    new THREE.Vector3();


                for (
                    let i = 0;
                    i < position.count;
                    i++
                ) {

                    point.set(
                        position.getX(i),
                        position.getY(i),
                        position.getZ(i)
                    );


                    point.applyMatrix4(
                        object.matrixWorld
                    );


                    addPoint(
                        point.x,
                        point.z
                    );
                }
            }


            // -----------------------------------------
            // Sprite
            //
            // Camera is aligned with world X/Z,
            // so sprite width/height are its
            // visible plan extents.
            // -----------------------------------------

            if (
                object.isSprite &&
                object.position
            ) {

                const halfWidth =
                    Math.abs(
                        object.scale.x
                    ) / 2;

                const halfHeight =
                    Math.abs(
                        object.scale.y
                    ) / 2;


                addPoint(
                    object.position.x -
                    halfWidth,

                    object.position.z -
                    halfHeight
                );


                addPoint(
                    object.position.x +
                    halfWidth,

                    object.position.z +
                    halfHeight
                );
            }
        }
    );


    return found
        ? bounds
        : null;
}


function fitDrawing2DView() {

    const {
        camera,
        renderer,
        controls
    } = window.drawing2D;


    if (
        !camera ||
        !renderer ||
        !window.drawing2D.gridGroup
    ) {
        return;
    }


    const bounds =
        getDrawing2DBounds();


    if (!bounds) {
        return;
    }


    // -------------------------------------------------
    // Canvas
    // -------------------------------------------------

    const canvas =
        renderer.domElement;

    const width =
        Math.max(
            canvas.clientWidth,
            1
        );


    const height =
        Math.max(
            canvas.clientHeight,
            1
        );


    const aspect =
        width / height;


    // -------------------------------------------------
    // Actual rendered content size
    // -------------------------------------------------

    const contentWidth =
        Math.max(
            bounds.max.y -
            bounds.min.y,
            0.001
        );


    const contentHeight =
        Math.max(
            bounds.max.x -
            bounds.min.x,
            0.001
        );


    // -------------------------------------------------
    // Padding
    //
    // 8% around the complete drawing.
    // -------------------------------------------------

    const padding = 0.08;


    const targetWidth =
        contentWidth *
        (1 + padding * 2);

    const targetHeight =
        contentHeight *
        (1 + padding * 2);


    // -------------------------------------------------
    // Base orthographic frustum
    //
    // zoom will control the actual scale.
    // -------------------------------------------------

    const baseHeight =
        DRAWING2D_CONFIG.camera
            .defaultViewHeight;

    const baseWidth =
        baseHeight * aspect;


    camera.left =
        -baseWidth / 2;

    camera.right =
        baseWidth / 2;

    camera.top =
        baseHeight / 2;

    camera.bottom =
        -baseHeight / 2;


    // -------------------------------------------------
    // Calculate exact fit zoom
    // -------------------------------------------------

    const zoomX =
        baseWidth /
        targetWidth;

    const zoomY =
        baseHeight /
        targetHeight;


    const fitZoom =
        Math.min(
            zoomX,
            zoomY
        );


    camera.zoom =
        Number.isFinite(fitZoom) &&
        fitZoom > 0
            ? fitZoom
            : 1;


    // -------------------------------------------------
    // Content center
    // -------------------------------------------------

    const centerX =
        (
            bounds.min.x +
            bounds.max.x
        ) / 2;


    const centerZ =
        (
            bounds.min.y +
            bounds.max.y
        ) / 2;


    // -------------------------------------------------
    // Center camera
    // -------------------------------------------------

    camera.position.set(
        centerX,
        DRAWING2D_CONFIG.camera.distance,
        centerZ
    );


    camera.up.set(
        1,
        0,
        0
    );


    camera.lookAt(
        centerX,
        0,
        centerZ
    );


    camera.updateProjectionMatrix();


    // -------------------------------------------------
    // Reset controls around fitted center
    // -------------------------------------------------

    if (controls) {

        controls.target.set(
            centerX,
            0,
            centerZ
        );

        controls.update();
    }
}


// =====================================================
// UI / TOOL INTERACTION
// =====================================================

function setDrawing2DTool(tool) {

    window.drawing2D.activeTool =
        tool;


    if (
        tool !== "beamBetweenPoints" &&
        typeof clearDrawing2DBeamBetweenPointsPreview ===
            "function"
    ) {

        clearDrawing2DBeamBetweenPointsPreview();

    }


    document
        .querySelectorAll(
            ".drawing2d-tool, .page-tool-btn"
        )
        .forEach(
            button =>
                button.classList.remove(
                    "active"
                )
        );


    const buttonMap = {

        select:
            "pageToolSelect",

        beam:
            "pageToolBeam",

        beamBetweenPoints:
            "pageToolBeamPoint",

        column:
            "pageToolColumn",

        deleteBeam:
            "pageToolDeleteBeam",

        deleteColumn:
            "pageToolDeleteColumn"
    };


    document
        .getElementById(
            buttonMap[tool]
        )
        ?.classList.add(
            "active"
        );


    const status =
        document.getElementById(
            "drawing2DToolStatus"
        );


    if (status) {

        status.innerText =
            `Tool: ${
                tool.charAt(0)
                    .toUpperCase() +
                tool.slice(1)
            }`;
    }

    if (
        typeof updateDrawing2DNodeToolState ==="function") {

        updateDrawing2DNodeToolState(tool);
    }

    if (
        typeof updateDrawing2DMemberToolState ==="function") {

        updateDrawing2DMemberToolState(tool);
    }
}



// =====================================================
// STATUS
// =====================================================

function updateDrawing2DGridStatus() {

    const status =
        document.getElementById(
            "drawing2DGridStatus"
        );


    const grid =
        window.drawing2D.grid;


    if (status) {

        status.innerText =
            `Grid: ` +
            `${grid.xSpacing.toFixed(2)} × ` +
            `${grid.zSpacing.toFixed(2)} m`;
    }
}


// =====================================================
// FLOOR
// =====================================================

function changeDrawing2DFloor() {

    const select =
        document.getElementById(
            "drawing2DFloor"
        );


    if (select) {

        window.drawing2D.floor =
            select.value;
    }

    if (
        typeof refreshDrawing2DNodes ===
        "function"
    ) {

        refreshDrawing2DNodes();
    }

    if (
        typeof refreshDrawing2DMembers ===
        "function"
    ) {

        refreshDrawing2DMembers();
    }
}


// =====================================================
// STARTUP
// =====================================================


document.addEventListener(
    "DOMContentLoaded",
    () => {
        document
            .getElementById("drawing2DFloor")
            ?.addEventListener(
                "change",
                changeDrawing2DFloor
            );

        // Create the Three.js canvas/renderer first.
        initDrawing2D();

        // Initialize nodes before member visuals and events.
        if (
            typeof initializeDrawing2DNodeSystem === "function"
        ) {
            initializeDrawing2DNodeSystem();
        }

        if (
            typeof updateDrawing2DNodeToolState === "function"
        ) {
            updateDrawing2DNodeToolState(
                window.drawing2D.activeTool
            );
        }

        // Explicitly initialize the member events.
        if (
            typeof window.initializeDrawing2DMemberEvents ===
            "function"
        ) {
            window.initializeDrawing2DMemberEvents();
        } else {
            console.error(
                "[2D Members] Initializer is missing. " +
                "Check that drawing2D_members.js loaded successfully."
            );
        }
    }
);
