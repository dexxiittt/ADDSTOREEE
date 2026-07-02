function initPreviewCategory(){

    const tabs=document.querySelectorAll(".preview-tabs button");

    tabs.forEach(tab=>{

        tab.onclick=()=>{

            tabs.forEach(t=>t.classList.remove("active"));

            tab.classList.add("active");

            loadPreview(tab.dataset.category);

        };

    });

    loadPreview("premium");

}
