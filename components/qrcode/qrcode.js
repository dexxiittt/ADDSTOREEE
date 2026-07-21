(function () {
  // Fungsi utama pembuat QR Code Verifikasi
  function generateVerificationQR() {
    // 1. Ambil teks invoice dari elemen DOM #invoice atau dari URL parameter
    const invoiceEl = document.getElementById("invoice");
    const invoiceText = invoiceEl ? invoiceEl.innerText.trim() : "";
    
    const urlParams = new URLSearchParams(window.location.search);
    const invoiceParam = urlParams.get("invoice") || urlParams.get("inv") || "";

    // Bersihkan awalan "INV" jika ada
    const rawInvoice = (invoiceText || invoiceParam).replace(/^INV/i, "").trim();

    // Jika invoice belum ada (misal masih proses loading sheet), batalkan dulu
    if (!rawInvoice) return;

    // 2. Bikin Base URL yang Presisi (Aman untuk GitHub Pages / Sub-folder)
    const currentUrl = window.location.href.split('?')[0].split('#')[0];
    const baseUrl = currentUrl.substring(0, currentUrl.lastIndexOf('/') + 1);
    
    // Hasil gabungan alamat halaman target status-pesanan
    const targetUrl = `${baseUrl}status-pesanan.html?inv=${rawInvoice}`;

    // 3. Generate QR Code via API
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(targetUrl)}`;

    // 4. Simpan ke variabel global agar otomatis dibaca oleh pdf-download.js
    window.qrURL = qrApiUrl;
  }

  // Jalankan saat halaman selesai dimuat
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", generateVerificationQR);
  } else {
    generateVerificationQR();
  }

  // Pantau perubahan pada elemen #invoice jika diisi via Fetch API
  document.addEventListener("DOMContentLoaded", () => {
    const invoiceEl = document.getElementById("invoice");
    if (invoiceEl) {
      const observer = new MutationObserver(() => {
        generateVerificationQR();
      });
      observer.observe(invoiceEl, { childList: true, characterData: true, subtree: true });
    }
  });
})();
