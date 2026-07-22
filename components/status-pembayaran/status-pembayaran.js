/* ============================================================
   GLOBAL VARIABLES & INITIALIZATION
   ============================================================ */
window.rawInvoice = "";

window.onload = async function() {
  // STEP 1: Load data dari LocalStorage
  loadFromLocalStorage();

  // STEP 2: Sinkronisasi data dari OpenSheet
  await loadFromSheet();
};

/* ============================================================
   CORE FUNCTIONS (LOCAL STORAGE & SHEET FETCHING)
   ============================================================ */
function checkIsExpired() {
  const params = new URLSearchParams(window.location.search);
  const invoice = params.get("invoice") || localStorage.getItem("invoiceID");
  
  if (!invoice) return false;

  // Bersihkan teks "INV" jika ada agar tersisa angkanya saja
  const invDigits = invoice.replace("INV", "").trim();

  // Validasi panjang string skema baru (Minimal 12 digit untuk YYYYMMDDHHMM)
  if (invDigits.length < 12) return false; 

  // Ekstrak waktu asli dari susunan 15 digit (Tanpa detik)
  const year = parseInt(invDigits.substring(0, 4));
  const month = parseInt(invDigits.substring(4, 6)) - 1; // Bulan di JS dimulai dari 0
  const date = parseInt(invDigits.substring(6, 8));
  const hour = parseInt(invDigits.substring(8, 10));
  const minute = parseInt(invDigits.substring(10, 12));

  // Konversi menjadi format waktu komputer (milidetik), detik diset ke 0
  const createdAtTime = new Date(year, month, date, hour, minute, 0).getTime();
  const now = new Date().getTime();
  const oneHour = 60 * 60 * 1000; // 1 jam dalam milidetik

  return (now - createdAtTime) > oneHour;
}

function loadFromLocalStorage() {
  const localData = JSON.parse(localStorage.getItem("paymentData"));
  if (!localData) return false;

  // CUSTOMER RENDER
  renderCustomer(localData.nama, localData.telepon, localData.email);

  // PRODUCT RENDER (Ambil harga lama Rp xxx)
  const matches = localData.paketHarga.match(/Rp\s?[\d\.]+/g);
  const hargaLama = matches ? matches[0].replace("Rp ", "") : "0";

  const hargaHtml = `
    <div class="price-old">Rp ${hargaLama}</div>
    <div class="price-final">${localData.total}</div>
  `;
   
  renderProduct(
    localData.image,
    localData.paket,
    localData.paketDetail,
    hargaHtml,
    localData.diskon,
    localData.hemat,
    localData.total
  );
   
  // STATUS RENDER
  renderStatus(localData.status || "pending");

  // INVOICE & TIME RENDER (Utamakan ambil dari URL parameter agar tidak 'null' saat di-clear)
  const params = new URLSearchParams(window.location.search);
  const invoice = params.get("invoice") || localStorage.getItem("invoiceID");
  
  const now = new Date();
  const formattedTime = now.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  })
  .replace(",", "")
  .replace("pukul", "")
  .trim();

  renderInvoice(invoice, formattedTime);
  return true;
}

async function loadFromSheet() {
  try {
    const params = new URLSearchParams(window.location.search);
    const invoiceID = params.get("invoice");

    if (!invoiceID) {
      showToast("Invoice tidak ditemukan ❌", "fa-circle-xmark");
      return;
    }

    const cleanInvoiceID = String(invoiceID).replace("INV", "").trim();

    // ============================================================
    // STEP 1: FETCH TIPS GLOBAL DI PALING ATAS (Independent / Mandiri)
    // ============================================================
    const tipsRes = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/statustips_payment");
    const tipsData = await tipsRes.json();
    const globalTips = tipsData[0]; // Mengambil baris pertama data tips

    // ============================================================
    // STEP 2: FETCH PAYMENT_ID UNTUK CEK VALIDASI INVOICE
    // ============================================================
    const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id");
    const data = await res.json();
     
    const found = data.find(
      x => String(x.invoice).replace("INV", "").trim() === cleanInvoiceID
    );
     
    // ============================================================
    // STEP 3: LOGIKA JIKA INVOICE TIDAK/BELUM KETEMU DI SPREADSHEET
    // ============================================================
    if (!found) {
      const localInvoice = localStorage.getItem("invoiceID");
      if (localInvoice && String(localInvoice).trim() === String(invoiceID).trim()) {
        showToast("Pesanan sudah dibuat ⚡", "fa-circle-check");
      } else {
        showToast("Invoice tidak terdaftar atau telah kedaluwarsa ❌", "fa-circle-xmark");
      }

      // 💡 FIX: Tetap render status & potong teks tips global dari sheet meskipun invoice belum terdaftar!
      const localData = JSON.parse(localStorage.getItem("paymentData")) || {};
      const currentStatus = localData.status || "pending";
      
      renderStatus(currentStatus, "", globalTips);

      return; // Berhenti di sini agar tidak error membaca info customer dari sheet yang kosong
    }

    // ============================================================
    // STEP 4: JIKA INVOICE KETEMU (Proses normal seperti biasa)
    // ============================================================
    const statusRes = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment");
    const statusData = await statusRes.json();
     
    const statusRow = statusData.find(x => String(x.invoice).replace("INV", "").trim() === cleanInvoiceID);
    const paymentStatus = (statusRow?.status || "").trim().toLowerCase();
    const processStatus = (statusRow?.proses || "").trim().toLowerCase();
     
    alert(
  "STATUS = " + paymentStatus +
  "\nPROSES = " + processStatus
);
     
    // SPLIT CUSTOMER INFO
    const info = found.informasi_pelanggan.split("|");
    window.rawInvoice = found.invoice;

    // FETCH PACKAGE_DETAIL
    const resProduk = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL");
    const produk = await resProduk.json();

    const detail = produk.find(p => String(p.package_id).trim() === String(found.package_id).trim());
    renderCustomer(info[0], info[1], info[2]);

    function rp(x) {
      return "Rp " + x.toLocaleString("id-ID");
    }

    // Pembersih harga & diskon dinamik
    const harga = Number(String(detail.price).replace(/[^\d]/g, "")) || 0;
    const sheetFinalPrice = Number(String(detail.final_price).replace(/[^\d]/g, "")) || 0;
    
    let discountPercent = 0;
    if (detail.discount) {
      const discountStr = String(detail.discount).replace("%", "").replace(",", ".").trim();
      discountPercent = parseFloat(discountStr) || 0;
    }
    
    const total = sheetFinalPrice > 0 
      ? sheetFinalPrice 
      : (discountPercent > 0 ? Math.round(harga - (harga * discountPercent / 100)) : harga);
      
    const hemat = harga - total;
    
    // Hitung nilai mentahnya terlebih dahulu
    const diskonPersenRaw = harga > 0 ? ((harga - total) / harga * 100) : 0;

    // Ambil 2 angka di belakang koma, lalu ubah kembali ke Float 
    // agar jika hasilnya angka bulat (contoh: 50%) tidak dipaksa jadi 50.00%
    const hitungDiskonDinamis = parseFloat(diskonPersenRaw.toFixed(2));

    const diskonTeks = discountPercent > 0 
    ? "-" + String(detail.discount).trim() 
    : (hitungDiskonDinamis > 0 ? "-" + hitungDiskonDinamis + "%" : "0%");

     // Gabungkan subtitle dan duration dari Google Sheet PACKAGE_DETAIL
    const fullSubtitle = (detail.subtitle && detail.duration) 
      ? `${detail.subtitle} • ${detail.duration}` 
      : (detail.subtitle || detail.duration || "");

     alert(
  "IMAGE = " + detail.image_url +
  "\nTITLE = " + detail.title +
  "\nSUBTITLE = " + fullSubtitle +
  "\nDISKON = " + diskonTeks +
  "\nTOTAL = " + rp(total)
);

    renderProduct(detail.image_url, detail.title, fullSubtitle, hargaHtml, diskonTeks, rp(hemat), rp(total));

   alert(
  "STATUS = " + paymentStatus +
  "\nPROSES = " + processStatus
);

    // Render status akhir menggunakan data sinkronisasi penuh dari sheet
    renderStatus(paymentStatus, processStatus, globalTips);
     
    const waktu = new Date().toLocaleString("id-ID", {
      day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
    })
    .replace(",", "").replace("pukul", "").trim();

    renderInvoice(found.invoice, waktu);
  } catch (err) {
    console.warn("Gagal sinkronisasi dengan Google Sheet:", err);
  }
}

/* ============================================================
   UI RENDERING FUNCTIONS
   ============================================================ */
function renderCustomer(nama, wa, email) {
  document.getElementById("nama").innerText = nama;
  document.getElementById("wa").innerText = wa;
  document.getElementById("email").innerText = email;
}

function renderProduct(image, title, subtitle, hargaHtml, diskon, hemat, total) {
  const img = document.getElementById("productImage");
  if (img) {
    if (image) {
      img.src = image;
    } else {
      document.getElementById("productImageBox").style.display = "none";
    }
  }

  document.getElementById("paket").innerText = title;
  document.getElementById("paketDetail").innerText = subtitle;
  document.getElementById("harga").innerHTML = hargaHtml;
  document.getElementById("diskon").innerText = diskon;
  document.getElementById("hemat").innerText = hemat;
  document.getElementById("total").innerText = total;
  document.getElementById("total2").innerText = total;
  document.getElementById("total3").innerText = total;
}

function renderStatus(status, proses, tipsObj) {

    alert(
  "renderStatus()\n" +
  "status = " + status +
  "\nproses = " + proses
);
   
  // PAKSA JADI EXPIRED JIKA SUDAH LEBIH DARI 1 JAM (Kecuali kalau sudah sukses)
  if (status !== "success" && checkIsExpired()) {
    status = "expired";
  }

  switch (status) {
    case "success":
      // LOGIKA BARU: Tentukan tips berdasarkan status proses
      const selectedTips = (proses === "done") ? tipsObj?.tips_proses : tipsObj?.tips_success;
      
      setSuccessUI(proses, selectedTips);
      localStorage.removeItem("invoiceID");
      localStorage.removeItem("invoiceCreatedAt");
      break;
      
    case "expired":
      setExpiredUI(tipsObj?.tips_expired);
      break;
      
    case "pending":
      setPendingUI(tipsObj?.tips_pending);
      break;
      
    case "cancel":
      setCancelUI();
      break;
      
    case "refund":
      setRefundUI();
      break;
      
    default:
      setPendingUI(tipsObj?.tips_pending);
      break;
  }
}

function renderInvoice(invoice, time) {
  window.rawInvoice = invoice;
  document.getElementById("invoice").innerText = "INV" + invoice;
  document.getElementById("time").innerText = time;
}

function getStatusElements() {
  return {
    invoiceBox: document.getElementById("invoiceBox"),
    statusBox: document.getElementById("statusBox"),
    statusBadgeIcon: document.getElementById("statusBadgeIcon"),
    statusBadgeText: document.getElementById("statusBadgeText"),
    statusTitle: document.getElementById("statusTitle"),
    statusDescription: document.getElementById("statusDescription"),
    statusTipText: document.getElementById("statusTipText"),
    statusIconFa: document.getElementById("statusIconFa"),
  };
}

/* ============================================================
   STATUS UI THEMES (PENDING, SUCCESS, & EXPIRED)
   ============================================================ */
function setPendingUI(tipsText) {
  const ui = getStatusElements();

  ui.invoiceBox.classList.remove("status-success", "status-expired");
  ui.statusBox.classList.remove("status-success", "status-expired");
  ui.invoiceBox.classList.add("status-pending");
  ui.statusBox.classList.add("status-pending");

  updateProgress("pending");

  ui.statusBadgeText.innerText = "Menunggu Pembayaran";
  ui.statusTitle.innerText = "Menunggu Pembayaran";
  ui.statusDescription.innerText = "Silakan lakukan pembayaran sesuai nominal yang tertera pada invoice.";
  ui.statusTipText.innerHTML = generateTipsHtml(tipsText, "Pastikan nominal pembayaran sesuai agar proses verifikasi oleh admin berjalan lebih cepat.");
  ui.statusBadgeIcon.className = "fa-solid fa-stopwatch";
  ui.statusIconFa.className = "fa-solid fa-hourglass-half";

  document.getElementById("statusSectionIcon").className = "section-icon icon-gold";

  document.getElementById("supportTitle").innerText = "Hubungi Admin";
  document.getElementById("supportDescription").innerHTML = "Sudah melakukan pembayaran tetapi status masih <b>Pending</b>? Kirim bukti pembayaran ke admin agar proses verifikasi dapat segera dilakukan.";
  document.getElementById("waButtonText").innerText = "Chat Admin Sekarang";
  document.getElementById("waButtonIcon").className = "fa-brands fa-whatsapp";
}

function setSuccessUI(proses, tipsText) {

 alert("MASUK CASE SUCCESS");
   
  const ui = getStatusElements();

  ui.invoiceBox.classList.remove("status-pending", "status-expired");
  ui.statusBox.classList.remove("status-pending", "status-expired");
  ui.invoiceBox.classList.add("status-success");
  ui.statusBox.classList.add("status-success");

  updateProgress("success", proses);

  ui.statusBadgeText.innerText = "Pembayaran Berhasil";
  ui.statusTitle.innerText = "Pembayaran Berhasil";
  ui.statusDescription.innerText = "Pembayaran telah diterima dan berhasil diverifikasi oleh admin.";
  
  // LOGIKA BARU: Sesuaikan konten teks tips & support berdasarkan status proses
  if (proses === "done") {
    ui.statusTipText.innerHTML = generateTipsHtml(tipsText, "Pesanan telah selesai diproses. Terima kasih telah berbelanja!");
    document.getElementById("supportTitle").innerText = "Pesanan Selesai ✨";
    document.getElementById("supportDescription").innerHTML = "Pesanan kamu telah selesai diproses sepenuhnya oleh admin. Terima kasih telah berbelanja di <b>Addstoreapp</b>.";
  } else {
    ui.statusTipText.innerHTML = generateTipsHtml(tipsText, "Pesanan sedang diproses oleh admin. Terima kasih telah melakukan pembayaran.");
    document.getElementById("supportTitle").innerText = "Pesanan Sedang Diproses";
    document.getElementById("supportDescription").innerHTML = "Pembayaran telah berhasil diverifikasi. Pesanan kamu sedang diproses oleh admin.";
  }

  ui.statusBadgeIcon.className = "fa-solid fa-check";
  ui.statusIconFa.className = "fa-solid fa-check";

  document.getElementById("statusSectionIcon").className = "section-icon icon-green";
  document.getElementById("waButtonText").innerText = "Hubungi Admin";
  document.getElementById("waButtonIcon").className = "fa-brands fa-whatsapp";
}


function setExpiredUI(tipsText) {
  const ui = getStatusElements();
   
  // Hapus warna lama, ganti ke tema expired (merah)
  ui.invoiceBox.classList.remove("status-pending", "status-success");
  ui.statusBox.classList.remove("status-pending", "status-success"); 
  ui.invoiceBox.classList.add("status-expired");
  ui.statusBox.classList.add("status-expired"); 

  ui.statusBadgeText.innerText = "Invoice Kedaluwarsa"; 
  ui.statusTitle.innerText = "Waktu Pembayaran Habis"; 
  ui.statusDescription.innerText = "Maaf, batas waktu pembayaran 1 jam telah habis. Invoice ini sudah tidak berlaku lagi."; 
  ui.statusTipText.innerHTML = generateTipsHtml(tipsText, "Silakan melakukan generate ulang invoice melalui tombol di bawah untuk memperbarui pesanan."); 
  ui.statusBadgeIcon.className = "fa-solid fa-xmark";
  ui.statusIconFa.className = "fa-solid fa-bell-slash"; 

    // ==========================================
  // KODE BARU: UBAH IKON & TAMBAH TEKS DI TIMELINE
  // ==========================================
  
  // 1. Mengubah ikon check & hourglass menjadi xmark
  const orderIcon = document.querySelector("#stepOrder i");
  const paymentIcon = document.querySelector("#stepPayment i");
  if (orderIcon) orderIcon.className = "fa-solid fa-xmark";
  if (paymentIcon) paymentIcon.className = "fa-solid fa-xmark";

  // Ubah bulatan menjadi MERAH SOLID & IKON PUTIH
  const orderBg = document.querySelector("#stepOrder .floating-icon");
  const paymentBg = document.querySelector("#stepPayment .floating-icon");
  if (orderBg) orderBg.className = "floating-icon icon-solid-red";
  if (paymentBg) paymentBg.className = "floating-icon icon-solid-red";

  // 2. Menambahkan teks merah "sesi kadaluarsa"
  const stepOrder = document.getElementById("stepOrder"); 
  const stepPayment = document.getElementById("stepPayment");

  // Tambah teks di bawah "Pesanan Dibuat"
  if (stepOrder && !document.getElementById("expiredTextOrder")) {
  const textRedOrder = document.createElement("div");
  textRedOrder.id = "expiredTextOrder";
  textRedOrder.classList.add("expired-text-timeline");
  textRedOrder.innerText = "sesi kadaluarsa";
  stepOrder.appendChild(textRedOrder);
}

// Tambah teks di bawah "Menunggu Pembayaran"
if (stepPayment && !document.getElementById("expiredTextPayment")) {
  const textRedPayment = document.createElement("div");
  textRedPayment.id = "expiredTextPayment";
  textRedPayment.classList.add("expired-text-timeline"); 
  textRedPayment.innerText = "sesi kadaluarsa";
  stepPayment.appendChild(textRedPayment);
}
  
  // ==========================================

  // Mengubah icon section menjadi merah
  document.getElementById("statusSectionIcon").className = "section-icon icon-red";

  // INFO PENDUKUNG DIUBAH MENJADI TOMBOL GENERATE ULANG
  document.getElementById("supportTitle").innerText = "Generate Ulang Invoice"; 
  document.getElementById("supportDescription").innerHTML = "Untuk melanjutkan pembelian paket, silakan klik tombol di bawah ini untuk membuat invoice baru."; 
  
  // EDIT TOMBOL WA: Ubah text, matikan fungsi klik, dan beri style disable
  const waBtn = document.getElementById("waButton") || document.querySelector(".support-action a"); 
  if (waBtn) { 
    waBtn.href = "javascript:void(0);"; // Matikan link redirect WA
    waBtn.setAttribute("onclick", "generateUlangInvoice()"); // Alihkan tombol untuk generate ulang
    waBtn.style.backgroundColor = "#ef4444"; 
    waBtn.style.cursor = "pointer"; 
    
    document.getElementById("waButtonText").innerText = "Generate Ulang Invoice Baru ⚡";
    document.getElementById("waButtonIcon").className = "fa-solid fa-rotate-right"; 
  }
}

function generateUlangInvoice() {
  // Bersihkan invoice lama agar sistem memicu pembuatan kode baru
  localStorage.removeItem("invoiceID");
  localStorage.removeItem("invoiceCreatedAt");
  
  // Arahkan kembali ke halaman opsi pembayaran
  window.location.href = "pembayaran-qr.html"; 
}

function setCancelUI() { /* TODO */ }
function setRefundUI() { /* TODO */ }

/* ============================================================
   PROGRESS TIMELINE TRACKER
   ============================================================ */
function updateProgress(status, proses) {
  if (status === "pending") {
    document.getElementById("stepOrder").className = "progress-item completed";
    document.getElementById("stepPayment").className = "progress-item current";
    document.getElementById("stepVerification").className = "progress-item";
    document.getElementById("stepProcess").className = "progress-item";
  } else if (status === "success") {
    
    // 1. HAPUS TEKS "SESI KADALUARSA" JIKA TERLANJUR ADA
    const expiredTextOrder = document.getElementById("expiredTextOrder");
    const expiredTextPayment = document.getElementById("expiredTextPayment");
    if (expiredTextOrder) expiredTextOrder.remove();
    if (expiredTextPayment) expiredTextPayment.remove();

    document.getElementById("stepOrder").className = "progress-item completed";
    document.getElementById("stepPayment").className = "progress-item completed";
    document.getElementById("stepVerification").className = "progress-item completed";
    document.getElementById("stepProcess").className = "progress-item current";

    // 2. PASTI KAN IKON & BG WARNA MERAH DIKEMBALIKAN KE UNGU/HIJAU SUKSES
    document.querySelector("#stepOrder i").className = "fa-solid fa-check";
    document.querySelector("#stepOrder .floating-icon").className = "floating-icon icon-purple"; // <-- Reset lingkaran 1 jadi ungu
    
    document.querySelector("#stepPayment i").className = "fa-solid fa-check";
    document.querySelector("#stepPayment .floating-icon").className = "floating-icon icon-purple";
    
    document.querySelector("#stepVerification i").className = "fa-solid fa-check";
    document.querySelector("#stepVerification .floating-icon").className = "floating-icon icon-purple";
    
    document.querySelector("#stepProcess i").className = "fa-solid fa-box-open";
    document.querySelector("#stepProcess .floating-icon").className = "floating-icon icon-green";

    if (proses === "done") {
      document.getElementById("stepProcess").className = "progress-item completed";
      document.querySelector("#stepProcess i").className = "fa-solid fa-check";
      document.querySelector("#stepProcess .floating-icon").className = "floating-icon icon-purple";
    }
  }
}

/* ============================================================
   UTILITIES (CLIPBOARD COPY & TOAST)
   ============================================================ */
function copyInvoice() {
  navigator.clipboard.writeText(window.rawInvoice);
  showCopyToast();
}

function showCopyToast() {
  const toast = document.getElementById("copyToast");
  toast.classList.add("show");
  setTimeout(() => {
    toast.classList.remove("show");
  }, 2000);
}

// FUNGSI TOAST CUSTOM UNTUK NOTIFIKASI ELEGAN
function showToast(message, iconClass = "fa-circle-check") {
  const toast = document.getElementById("customDynamicToast");
  const msgEl = document.getElementById("toastMessage");
  const iconEl = document.getElementById("toastIcon");

  if (!toast || !msgEl || !iconEl) return;

  // Update teks dan ikon secara dinamis
  msgEl.innerText = message;
  iconEl.className = `fa-solid ${iconClass}`;

  // Atur warna ikon (Hijau untuk sukses, Merah untuk gagal/warning)
  iconEl.style.color = iconClass.includes("check") ? "#4ade80" : "#f87171";

  // Munculkan toast dengan menambahkan class "show"
  toast.classList.add("show");

  // Sembunyikan otomatis setelah 3.5 detik
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// Tambahkan fungsi baru ini di file JS kamu
function generateTipsHtml(tipsText, defaultText) {
  // Jika kolom di spreadsheet kosong/tidak ditemukan, pakai teks bawaan (fallback)
  if (!tipsText) {
    return `
      <div class="status-tip-item">
        <i class="fa-solid fa-circle"></i>
        <span>${defaultText}</span>
      </div>`;
  }
  
  // Pecah teks berdasarkan "|" lalu map menjadi elemen HTML
  return tipsText.split("|").map(tip => `
    <div class="status-tip-item">
      <i class="fa-solid fa-circle"></i>
      <span>${tip.trim()}</span>
    </div>
  `).join("");
}
