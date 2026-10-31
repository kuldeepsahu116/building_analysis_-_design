// =====================================================
// PAGE NAVIGATION REGISTRY
// =====================================================

const PAGES = Object.freeze({

    MODEL: "model",
    SUPPORT: "support",
    LOAD: "load",
    RESULTS: "results",
    DESIGN: "design",
    REPORT: "report"

});


const PAGE_ORDER = Object.freeze([

    PAGES.MODEL,
    PAGES.SUPPORT,
    PAGES.LOAD,
    PAGES.RESULTS,
    PAGES.DESIGN,
    PAGES.REPORT

]);


const PAGE_NUMBERS = Object.freeze({

    [PAGES.MODEL]: 1,
    [PAGES.SUPPORT]: 2,
    [PAGES.LOAD]: 3,
    [PAGES.RESULTS]: 4,
    [PAGES.DESIGN]: 5,
    [PAGES.REPORT]: 6

});


function getPageNumber(page){

    return PAGE_NUMBERS[page];

}


function getPageElement(page){

    return document.querySelector(
        `.page[data-page="${page}"]`
    );

}


// =====================================================
// SHOW PAGE
// =====================================================

let currentPage = PAGES.MODEL;

let modelPagePreviousTool = "select";

let supportPagePreviousTool = "select";
let supportPagePreviousWorkspaceColumns = "";

function showPage(page){

    const previousPage = currentPage;

    const wasSupportPage = previousPage === PAGES.SUPPORT;

    const isSupportPage = page === PAGES.SUPPORT;

    // Remember the active tool before leaving Model.
    if (
        previousPage === PAGES.MODEL &&
        page !== PAGES.MODEL &&
        window.drawing2D
    ) {
        const tool = window.drawing2D.activeTool;

        modelPagePreviousTool =
            tool && tool !== "none" && tool !== "supportAssign"
                ? tool
                : "select";
    }

    if(
        isSupportPage &&
        !wasSupportPage
    ){

        enterSupportPageMode();

    }


    if(
        !isSupportPage &&
        wasSupportPage
    ){

        leaveSupportPageMode();

    }


    currentPage = page;

    const pageNumber = getPageNumber(page);


    // Show only the tool set belonging to the current page.
    document.querySelectorAll(".page-tool-set[data-tool-page]")
        .forEach(toolSet => {
            const toolPage = Number(toolSet.dataset.toolPage);

            toolSet.style.display =
                toolPage === pageNumber ? "flex" : "none";
        });

    if (page === PAGES.MODEL) {
        // Restore the last tool used on Model.
        if (typeof setDrawing2DTool === "function") {
            setDrawing2DTool(modelPagePreviousTool || "select");
        }

    }else if (page === PAGES.DESIGN) {

        // Keep the drawing selection tool active on Design.
        setDrawing2DTool("select");

        document
            .querySelectorAll(".page-tool-btn")
            .forEach(button => button.classList.remove("active"));

        document
            .getElementById("pageToolDesignSelect")
            ?.classList.add("active");
            
    } else {
        // Deactivate drawing tools on every other page.
        if (window.drawing2D) {
            window.drawing2D.activeTool = "none";
        }

        document
            .querySelectorAll(".drawing2d-tool, .page-tool-btn")
            .forEach(button => button.classList.remove("active"));

        const toolStatus = document.getElementById("drawing2DToolStatus");

        if (toolStatus) {
            toolStatus.innerText = "";
        }
    }


    setDrawing2DSupportVisibility(
        isSupportPage
    );


    const mainContainer =
        document.querySelector(
            ".main-container"
        );


    const reportWorkspace =
        document.querySelector(
            "#reportWorkspace"
        );


    if(page === PAGES.REPORT){

        mainContainer.style.display =
            "none";

        reportWorkspace.style.display =
            "flex";

        changeReportStyle();

        updateButtons();

        return;

    }


    mainContainer.style.display =
        "grid";

    reportWorkspace.style.display =
        "none";


    document
        .querySelectorAll(".page")
        .forEach(
            p => p.style.display = "none"
        );


    const pageElement =
        getPageElement(page);


    if(pageElement){

        pageElement.style.display =
            "flex";

    }


    if(page === PAGES.RESULTS){
        checkAnalysisInputChanges();
    }

    if (page === PAGES.DESIGN) {
        renderSelectedDesignResult();
    }


    updateButtons();

    updateSection3DRenderingButton(
        pageNumber
    );

    updateViewForPage(
        pageNumber
    );

}

function nextPage(){

    const index =
        PAGE_ORDER.indexOf(
            currentPage
        );

    if(
        index <
        PAGE_ORDER.length - 1
    ){

        showPage(
            PAGE_ORDER[index + 1]
        );

    }

}

function previousPage(){

    const index =
        PAGE_ORDER.indexOf(
            currentPage
        );

    if(index > 0){

        showPage(
            PAGE_ORDER[index - 1]
        );

    }

}

function updateButtons(){

    const previousBtn =
        document.getElementById(
            "previousBtn"
        );

    const nextBtn =
        document.getElementById(
            "nextBtn"
        );


    const pageIndex =
        PAGE_ORDER.indexOf(
            currentPage
        );


    const isFirstPage =
        pageIndex === 0;

    const isLastPage =
        pageIndex ===
        PAGE_ORDER.length - 1;


    previousBtn.disabled =
        isFirstPage;

    previousBtn.style.opacity =
        isFirstPage ? "0.45" : "1";

    previousBtn.style.cursor =
        isFirstPage
            ? "not-allowed"
            : "pointer";


    nextBtn.disabled =
        isLastPage;

    nextBtn.style.opacity =
        isLastPage ? "0.45" : "1";

    nextBtn.style.cursor =
        isLastPage
            ? "not-allowed"
            : "pointer";


    document
        .querySelectorAll(
            ".nav-bar button[data-page]"
        )
        .forEach(button => {

            button.classList.toggle(
                "active-page",
                button.dataset.page ===
                    currentPage
            );

        });

}


function enterSupportPageMode() {

    const mainContainer =
        document.querySelector(".main-container");

    const workspace =
        document.querySelector(".page-workspace");

    if (!mainContainer || !workspace) {
        return;
    }

    /* -----------------------------------------
       SAVE MODEL PAGE STATE
       ----------------------------------------- */

    if (window.drawing2D) {

        const currentTool =
            window.drawing2D.activeTool;

        supportPagePreviousTool =
            currentTool &&
            currentTool !== "none" &&
            currentTool !== "supportAssign"
                ? currentTool
                : "select";
    }

    supportPagePreviousWorkspaceColumns =
        workspace.style.gridTemplateColumns || "";


    /* -----------------------------------------
       SUPPORT PAGE LAYOUT
       ----------------------------------------- */

    mainContainer.classList.add(
        "support-page-active"
    );

    /*
       Give the support page a little more
       width than the normal 20% model panel.

       30% Support
       35% 2D
       35% 3D
    */
    workspace.style.gridTemplateColumns =
        "20fr 40fr 40fr";


    /* -----------------------------------------
       NO MODEL TOOL ON SUPPORT PAGE
       ----------------------------------------- */

    if (window.drawing2D) {

        window.drawing2D.activeTool =
            "none";

        const canvas =
            window.drawing2D
                ?.renderer
                ?.domElement;

        if (canvas) {
            canvas.style.cursor =
                "default";
        }
    }


    /* Remove any first-page tool highlight */
    document
        .querySelectorAll(
            ".drawing2d-tool, .page-tool-btn"
        )
        .forEach(button => {
            button.classList.remove("active");
        });


    /* No "Tool: Select" on support page */
    const toolStatus =
        document.getElementById(
            "drawing2DToolStatus"
        );

    if (toolStatus) {
        toolStatus.innerText = "";
    }


    /*
       Reposition the two existing workspace
       resize handles after changing widths.
    */
    window.dispatchEvent(
        new Event("resize")
    );
}


function leaveSupportPageMode() {

    const mainContainer =
        document.querySelector(".main-container");

    const workspace =
        document.querySelector(".page-workspace");

    if (!mainContainer || !workspace) {
        return;
    }


    /* -----------------------------------------
       RESTORE NORMAL MODEL LAYOUT
       ----------------------------------------- */

    mainContainer.classList.remove(
        "support-page-active"
    );

    workspace.style.gridTemplateColumns =
        supportPagePreviousWorkspaceColumns;


    /* -----------------------------------------
       RESTORE PREVIOUS MODEL TOOL
       ----------------------------------------- */

    if (
        window.drawing2D &&
        typeof setDrawing2DTool ===
            "function"
    ) {
        setDrawing2DTool(
            supportPagePreviousTool ||
            "select"
        );
    }


    window.dispatchEvent(
        new Event("resize")
    );
}
