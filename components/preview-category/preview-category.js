function initPreviewCategory() {

    const tabs = document.querySelectorAll(".preview-tabs button");

    tabs.forEach(tab => {

        tab.onclick = () => {

            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            // nanti di sini baru kita tambahkan filter kategori
        };

    });

}
