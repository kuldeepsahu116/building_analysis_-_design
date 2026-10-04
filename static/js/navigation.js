// #region =====================================================
// SHOW PAGE
// =====================================================

let currentPage = 1;

function showPage(n){
    currentPage=n;

    const mainContainer =
        document.querySelector(".main-container");


    const reportWorkspace =
        document.querySelector(".report-workspace");



    if(n === 6){

        // Hide the entire normal application workspace
        mainContainer.style.display = "none";

        // Show independent report workspace
        reportWorkspace.style.display = "flex";

        changeReportStyle();

        // Update navigation buttons
        updateButtons();

        return;
    }
    

    // Show normal application workspace
    mainContainer.style.display = "grid";

    // Hide report workspace
    reportWorkspace.style.display = "none";

    // Switch between pages 1–5
    document.querySelectorAll(".page").forEach(p=>p.style.display="none");

    document.getElementById("page"+n).style.display="flex";

    

    if(n === 5){
        checkAnalysisInputChanges();
    }



    updateButtons();

    updateSection3DRenderingButton(n);

    updateViewForPage(n);

    }

function nextPage(){
    if(currentPage<6) showPage(currentPage+1);
}

function previousPage(){
    if(currentPage>1) showPage(currentPage-1);
}

function updateButtons(){
    
    const previousBtn = document.getElementById("previousBtn");
    const nextBtn = document.getElementById("nextBtn");

    // Previous button
    previousBtn.disabled = (currentPage === 1);
    previousBtn.style.opacity = (currentPage === 1) ? "0.45" : "1";
    previousBtn.style.cursor = (currentPage === 1) ? "not-allowed" : "pointer";

    // Next button
    nextBtn.disabled = (currentPage === 6);
    nextBtn.style.opacity = (currentPage === 6) ? "0.45" : "1";
    nextBtn.style.cursor = (currentPage === 6) ? "not-allowed" : "pointer";

    // Page navigation buttons
    const navButtons = document.querySelectorAll(".nav-bar button");

    navButtons.forEach((button, index) => {
        button.classList.toggle("active-page", index + 1 === currentPage);
    });
}


// #endregion