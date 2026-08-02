fetch("./footer.html")
  .then(res => res.text())
  .then(data => {
    const container = document.getElementById("footer-container");
    if (container) {
      container.innerHTML = data;

      // Event delegation / listener otomatis untuk tombol WhatsApp
      const waButton = container.querySelector('a[title="WhatsApp"]');
      if (waButton) {
        waButton.addEventListener("click", (e) => {
          e.preventDefault();
          if (typeof chatAdminGeneral === "function") {
            chatAdminGeneral();
          } else {
            console.error("Fungsi chatAdminGeneral tidak ditemukan. Pastikan components/utils/chat-admin.js sudah di-import.");
          }
        });
      }
    }
  })
  .catch(err => console.error("Footer gagal load:", err));
