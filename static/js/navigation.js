// #region =====================================================
// SHOW PAGE
// =====================================================

let currentPage = 1;

function showPage(n){
    currentPage=n;

    let structureCard =
        document.querySelector(".structure-card");

    let reportCard =
        document.getElementById(
            "reportPreviewCard"
        );

    let actionArea =
        document.getElementById(
            "actionButtonArea"
        );

    if(n === 4){
        checkAnalysisInputChanges();
    }


    if(n === 5){

        structureCard.style.display = "none";

        reportCard.style.display = "block";

        changeReportStyle();
    }
    else{

        reportCard.style.display = "none";

        structureCard.style.display = "flex";
    }

    document.querySelectorAll(".page").forEach(p=>p.style.display="none");

    document.getElementById("page"+n).style.display="flex";
    updateButtons();

    updateSection3DRenderingButton(n);

    updateViewForPage(n);

    }

function nextPage(){
    if(currentPage<5) showPage(currentPage+1);
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
    nextBtn.disabled = (currentPage === 5);
    nextBtn.style.opacity = (currentPage === 5) ? "0.45" : "1";
    nextBtn.style.cursor = (currentPage === 5) ? "not-allowed" : "pointer";

    // Page navigation buttons
    const navButtons = document.querySelectorAll(".nav-bar button");

    navButtons.forEach((button, index) => {
        button.classList.toggle("active-page", index + 1 === currentPage);
    });
}


// #endregion