/* ==========================================================
   PAGE 1 WORKSPACE RESIZING
   Horizontal width resizing
   ========================================================== */

(function () {

    let isResizing = false;

    let resizeBoundary = null;

    let startMouseX = 0;

    let startColumns = [];


    /* ==========================================================
       GET WORKSPACE
       ========================================================== */

    function getWorkspace() {

        return document.querySelector(".page-workspace");

    }


    /* ==========================================================
       GET CURRENT GRID COLUMNS
       ========================================================== */

    function getCurrentColumns() {

        const workspace = getWorkspace();

        if (!workspace) {
            return [1, 1, 1];
        }

        const styles = getComputedStyle(workspace);

        const columns = styles.gridTemplateColumns
            .trim()
            .split(/\s+/)
            .map(value => parseFloat(value));

        if (columns.length !== 3) {
            return [1, 1, 1];
        }

        return columns;

    }


    /* ==========================================================
       POSITION RESIZE HANDLES
       ========================================================== */

    function updateResizeHandles() {

        const workspace = getWorkspace();

        if (!workspace) {
            return;
        }

        const leftPanel =
            workspace.querySelector(".left-panel");

        const drawingPanel =
            workspace.querySelector(".drawing2d-panel");

        const handles =
            workspace.querySelectorAll(
                ".workspace-resize-handle"
            );

        if (
            !leftPanel ||
            !drawingPanel ||
            handles.length < 2
        ) {
            return;
        }


        const workspaceRect =
            workspace.getBoundingClientRect();


        const leftPanelRect =
            leftPanel.getBoundingClientRect();


        const drawingPanelRect =
            drawingPanel.getBoundingClientRect();


        /* Handle between Structure and 2D */

        const boundary0 =
            leftPanelRect.right -
            workspaceRect.left;


        /* Handle between 2D and 3D */

        const boundary1 =
            drawingPanelRect.right -
            workspaceRect.left;


        handles[0].style.left =
            `${boundary0}px`;

        handles[1].style.left =
            `${boundary1}px`;

    }


    /* ==========================================================
       START RESIZE
       ========================================================== */

    function startResize(event) {

        const handle =
            event.currentTarget;

        resizeBoundary =
            Number(
                handle.dataset.resizeBoundary
            );


        if (
            resizeBoundary !== 0 &&
            resizeBoundary !== 1
        ) {
            return;
        }


        const workspace =
            getWorkspace();

        if (!workspace) {
            return;
        }


        isResizing = true;

        startMouseX =
            event.clientX;

        startColumns =
            getCurrentColumns();


        workspace.classList.add(
            "is-resizing"
        );


        handle.classList.add(
            "is-active"
        );


        document.body.style.cursor =
            "col-resize";


        event.preventDefault();

        event.stopPropagation();

    }


    /* ==========================================================
       RESIZE
       ========================================================== */

    function resize(event) {

        if (!isResizing) {
            return;
        }


        const workspace =
            getWorkspace();

        if (!workspace) {
            return;
        }


        const delta =
            event.clientX -
            startMouseX;


        const leftIndex =
            resizeBoundary;

        const rightIndex =
            resizeBoundary + 1;


        if (
            leftIndex < 0 ||
            rightIndex > 2
        ) {
            return;
        }


        let newLeft =
            startColumns[leftIndex] +
            delta;


        let newRight =
            startColumns[rightIndex] -
            delta;


        /* ======================================================
           MINIMUM WIDTH
           ====================================================== */

        const minWidth = 180;


        if (newLeft < minWidth) {

            newLeft = minWidth;

            newRight =
                startColumns[leftIndex] +
                startColumns[rightIndex] -
                newLeft;

        }


        if (newRight < minWidth) {

            newRight = minWidth;

            newLeft =
                startColumns[leftIndex] +
                startColumns[rightIndex] -
                newRight;

        }


        /* ======================================================
           APPLY GRID WIDTH
           ====================================================== */

        const columns =
            [...startColumns];


        columns[leftIndex] =
            newLeft;

        columns[rightIndex] =
            newRight;


        workspace.style.gridTemplateColumns =
            `${columns[0]}px ` +
            `${columns[1]}px ` +
            `${columns[2]}px`;


        /*
         * The grid has changed, therefore
         * update the handle positions.
         */

        updateResizeHandles();

    }


    /* ==========================================================
       STOP RESIZE
       ========================================================== */

    function stopResize() {

        if (!isResizing) {
            return;
        }


        const workspace =
            getWorkspace();


        if (workspace) {

            workspace.classList.remove(
                "is-resizing"
            );

        }


        document.querySelectorAll(
            ".workspace-resize-handle"
        ).forEach(handle => {

            handle.classList.remove(
                "is-active"
            );

        });


        document.body.style.cursor =
            "";


        isResizing = false;

        resizeBoundary = null;

    }


    /* ==========================================================
       INITIALIZE
       ========================================================== */

    function initializeWorkspaceResize() {

        const workspace =
            getWorkspace();

        if (!workspace) {
            return;
        }


        const handles =
            workspace.querySelectorAll(
                ".workspace-resize-handle"
            );


        handles.forEach(handle => {

            handle.addEventListener(
                "mousedown",
                startResize
            );

        });


        document.addEventListener(
            "mousemove",
            resize
        );


        document.addEventListener(
            "mouseup",
            stopResize
        );


        /*
         * Initial handle position
         */

        updateResizeHandles();


        /*
         * Keep handles aligned if the
         * browser window changes size.
         */

        window.addEventListener(
            "resize",
            updateResizeHandles
        );

    }


    /* ==========================================================
       START AFTER DOM LOAD
       ========================================================== */

    if (
        document.readyState ===
        "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeWorkspaceResize
        );

    } else {

        initializeWorkspaceResize();

    }

})();