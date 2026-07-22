// 1. Dapatkan jsPDF CDN secara otomatis jika belum di-import di HTML
(function loadJsPDFSDK() {
  if (!window.jspdf) {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    document.head.appendChild(script);
  }
})();

// Helper untuk konversi gambar ke Base64 (agar tidak error jika URL kosong/CORS)
function loadImageBase64(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
      return;
    }
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => {
      resolve("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=");
    };
    img.src = url;
  });
}

// 2. Fungsi Injeksi Box Card Download PDF ke DOM
function injectPDFCard() {
  if (document.getElementById("pdfDownloadBox")) return;

  const cardHTML = `
    <div id="pdfDownloadBox" class="pdf-download-box">
      <div class="pdf-header">
        <div class="pdf-icon">
          <i class="fa-solid fa-file-pdf"></i>
        </div>
        <div class="pdf-text">
          <h3>Download Bukti Invoice</h3>
          <p>Simpan salinan resmi dokumen pembayaran ini dalam format PDF</p>
        </div>
      </div>
      <button id="downloadBtn" class="pdf-btn" onclick="downloadPDF()">
        <i class="fa-solid fa-file-arrow-down"></i>
        <span>Download Invoice (PDF)</span>
      </button>
    </div>
  `;

  const waBtn = document.getElementById("waButton");
  let targetElement = null;

  if (waBtn) {
    targetElement = waBtn.closest(".support-card") || waBtn.closest(".support-action") || waBtn.closest(".wa-box") || waBtn.parentElement;
  }

  if (targetElement) {
    targetElement.insertAdjacentHTML("afterend", cardHTML);
  } else {
    const container = document.querySelector(".invoice-box") || document.body;
    container.insertAdjacentHTML("beforeend", cardHTML);
  }
}

// 3. Cek apakah tahapan 'Pesanan Diproses' SUDAH DONE (Langkah ke-4 centang/completed)
function checkAndInjectPDF() {
  const stepProcess = document.getElementById("stepProcess");
  const supportTitle = document.getElementById("supportTitle");

  // A. Cek apakah elemen timeline step 4 (Pesanan Diproses) sudah berstatus 'completed'
  const isProcessDone = stepProcess && stepProcess.classList.contains("completed");
  
  // B. Sebagai cadangan, cek apakah judul status support bernilai "Pesanan Selesai"
  const isTitleDone = supportTitle && supportTitle.innerText.toLowerCase().includes("selesai");

  // Box HANYA MUNCUL jika proses sudah DONE (Sudah centang)
  if (isProcessDone || isTitleDone) {
    injectPDFCard();
  } else {
    // Jika masih diproses (kuning/pending), pastikan box PDF dihapus/sembunyi
    const existingBox = document.getElementById("pdfDownloadBox");
    if (existingBox) existingBox.remove();
  }
}

// Pantau perubahan pada elemen timeline secara otomatis
document.addEventListener("DOMContentLoaded", () => {
  checkAndInjectPDF();

  const stepProcess = document.getElementById("stepProcess");
  const supportTitle = document.getElementById("supportTitle");

  // Amati jika ada perubahan class pada step 4 (Pesanan Diproses)
  if (stepProcess) {
    const observer = new MutationObserver(checkAndInjectPDF);
    observer.observe(stepProcess, { attributes: true, attributeFilter: ["class"] });
  }

  // Amati jika teks judul berubah menjadi "Pesanan Selesai"
  if (supportTitle) {
    const observer = new MutationObserver(checkAndInjectPDF);
    observer.observe(supportTitle, { childList: true, characterData: true, subtree: true });
  }
});

// 4. Fungsi Utama Download PDF
async function downloadPDF() {
  const btn = document.getElementById("downloadBtn");
  const originalText = btn.innerHTML;

  // Loading ON
  btn.innerHTML = `<div class="btn-loading">
    <div class="btn-spinner"></div>
    <span>Memproses<span class="dots"></span></span>
  </div>`;
  btn.disabled = true;

  try {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const invoice = document.getElementById("invoice")?.innerText || "";
    const nama = document.getElementById("nama")?.innerText || "";
    const wa = document.getElementById("wa")?.innerText || "";
    const email = document.getElementById("email")?.innerText || "";
    const paket = document.getElementById("paket")?.innerText || "";
    // 🔥 FIX: Ambil detail paket secara dinamis dari DOM
    const paketDetail = document.getElementById("paketDetail")?.innerText || ""; 
    const total = document.getElementById("total2")?.innerText || document.getElementById("total")?.innerText || "";
    const waktu = document.getElementById("time")?.innerText || "";
    const harga = document.getElementById("harga")?.innerText || "";
    const diskon = document.getElementById("diskon")?.innerText || "";
    const hemat = document.getElementById("hemat")?.innerText || "";

    const logoBase64 = await loadImageBase64(window.logoURL);
    const qrBase64 = await loadImageBase64(window.qrURL);

    // ================= HEADER =================
    doc.setFillColor(124, 58, 237);
    doc.rect(0, 0, 210, 30, "F");

    doc.addImage(logoBase64, "PNG", 180, 6, 20, 20);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text("INVOICE PEMBAYARAN", 20, 18);

    doc.setTextColor(0, 0, 0);

    // ================= INFO INVOICE =================
    doc.setFontSize(11);
    doc.text("Invoice: " + invoice, 20, 40);
    doc.text("Tanggal: " + waktu, 20, 47);

    doc.setDrawColor(220);
    doc.line(20, 52, 190, 52);

    // ================= CUSTOMER =================
    doc.setFontSize(12);
    doc.text("Customer", 20, 65);

    doc.setFontSize(11);
    doc.text("Nama: " + nama, 20, 72);
    doc.text("WhatsApp: " + wa, 20, 79);
    doc.text("Email: " + email, 20, 86);

    // ================= DETAIL BOX =================
    doc.setDrawColor(230);
    doc.setFillColor(249, 250, 251);

    doc.roundedRect(20, 95, 170, 85, 3, 3, "FD");

    let y = 105;

    doc.setFontSize(12);
    doc.setFont(undefined, "bold");
    doc.text("Detail Pesanan", 25, y);

    y += 10;

    doc.setFontSize(12);
    doc.setFont(undefined, "normal");
    doc.text(paket, 25, y);

    y += 6;

    doc.setFontSize(10);
    doc.setTextColor(120);
    // 🔥 FIX: Cetak teks dinamis dari DOM, bukan "Private • 1 Bulan"
    doc.text(paketDetail, 25, y); 

    y += 10;

    doc.setTextColor(0);

    // Subtotal
    doc.setFontSize(11);
    doc.text("Subtotal", 25, y);
    doc.text(harga, 160, y, { align: "right" });

    const textWidth = doc.getTextWidth(harga);
    const xRight = 169;
    const padding = Math.min(6, textWidth * 0.1);
    const xStart = xRight - textWidth + padding;
    const xEnd = xRight - padding;

    doc.setDrawColor(239, 68, 68);
    doc.setLineWidth(0.6);
    doc.line(xStart, y - 1.4, xEnd, y - 1.4);

    y += 6;

    doc.setDrawColor(220);
    doc.line(25, y, 185, y);

    y += 8;

    // Diskon
    doc.text("Diskon", 25, y);
    doc.setTextColor(220, 38, 38);
    doc.text(diskon, 160, y, { align: "right" });

    y += 6;
    doc.setDrawColor(220);
    doc.line(25, y, 185, y);

    y += 8;

    // Hemat
    doc.setTextColor(0);
    doc.text("Hemat", 25, y);
    doc.setTextColor(22, 163, 74);
    doc.text(hemat, 160, y, { align: "right" });

    y += 6;
    doc.setDrawColor(220);
    doc.line(25, y, 185, y);

    y += 10;

    // Total
    doc.setTextColor(0);
    doc.setFont(undefined, "bold");
    doc.text("Total Bayar", 25, y);
    doc.text(total, 160, y, { align: "right" });

    // ================= QR =================
    doc.setDrawColor(230);
    doc.setFillColor(255, 255, 255);

    doc.roundedRect(135, 195, 55, 65, 4, 4, "FD");

    doc.addImage(qrBase64, "PNG", 142, 202, 40, 40);

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Scan untuk verifikasi", 162, 255, { align: "center" });

    doc.setTextColor(0, 0, 0);

    // ================= STATUS BADGE =================
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(20, 195, 80, 12, 3, 3, "F");

    doc.setTextColor(22, 193, 74);
    doc.setFontSize(11);
    doc.text("LUNAS", 25, 203);

    doc.setTextColor(0, 0, 0);

    // ================= FOOTER =================
    doc.setFontSize(10);
    doc.setTextColor(120);
    doc.text("Terima kasih telah melakukan pembayaran", 20, 220);
    doc.text("Invoice ini sah dan tidak memerlukan tanda tangan", 20, 226);

    doc.save("Invoice_" + invoice + ".pdf");
  } catch (err) {
    console.error(err);
    alert("Gagal generate PDF ❌");
  }

  btn.innerHTML = originalText;
  btn.disabled = false;
}





    
    
