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

    // FETCH PAYMENT_ID
    const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id");
    const data = await res.json();

    // CARI INVOICE
    const found = data.find(x => x.invoice == invoiceID);
    if (!found) {
      // Cek apakah invoice ini milik transaksi yang baru saja dibuat di browser ini
      const localInvoice = localStorage.getItem("invoiceID");
      if (localInvoice && String(localInvoice).trim() === String(invoiceID).trim()) {
        showToast("Pesanan sudah dibuat ⚡", "fa-circle-check");
      } else {
        showToast("Invoice tidak terdaftar atau telah kedaluwarsa ❌", "fa-circle-xmark");
      }
      return; // Stop execution tanpa error keras, UI tetap pakai data local (pending)
    }

    // FETCH STATUS_PAYMENT
    const statusRes = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment");
    const statusData = await statusRes.json();

    // CARI STATUS INVOICE
    const statusRow = statusData.find(x => x.invoice == found.invoice);
    const paymentStatus = (statusRow?.status || "").trim().toLowerCase();
    const processStatus = (statusRow?.proses || "").trim().toLowerCase();

    // SPLIT CUSTOMER INFO
    const info = found.informasi_pelanggan.split("|");
    window.rawInvoice = found.invoice;

    // FETCH PACKAGE_DETAIL
    const resProduk = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL");
    const produk = await resProduk.json();

    // CARI DETAIL PRODUK
    const detail = produk.find(p => p.package_id == found.package_id);

    // RENDER DATA TERBARU DARI SHEET
    renderCustomer(info[0], info[1], info[2]);

    function rp(x) {
      return "Rp " + x.toLocaleString("id-ID");
    }

    const harga = parseInt(detail.price);
    const diskon = parseFloat(detail.discount.replace("%", "").replace(",", "."));
    const potongan = (harga * diskon) / 100;
    const total = Math.floor(harga - potongan);
    const hemat = harga - total;

    const hargaHtml = `
      <div class="price-old">${rp(harga)}</div>
      <div class="price-final">${rp(total)}</div>
    `;

    renderProduct(
      detail.image_url,
      detail.title,
      detail.subtitle,
      hargaHtml,
      "-" + detail.discount,
      rp(hemat),
      rp(total)
    );

    renderStatus(paymentStatus, processStatus);

    const waktu = new Date().toLocaleString("id-ID", {
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

function renderStatus(status, proses) {
  // PAKSA JADI EXPIRED JIKA SUDAH LEBIH DARI 1 JAM (Kecuali kalau sudah sukses)
  if (status !== "success" && checkIsExpired()) {
    status = "expired";
  }

  switch (status) {
    case "success":
      setSuccessUI(proses);
      // HAPUS DATA LAMA DARI LOCALSTORAGE AGAR TRANSAKSI BERIKUTNYA MEMBUAT INVOICE BARU
      localStorage.removeItem("invoiceID");
      localStorage.removeItem("invoiceCreatedAt");
      break;
    case "expired":
      setExpiredUI();
      break;
    case "cancel":
      setCancelUI();
      break;
    case "refund":
      setRefundUI();
      break;
    default:
      setPendingUI();
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
function setPendingUI() {
  const ui = getStatusElements();

  ui.invoiceBox.classList.remove("status-success", "status-expired");
  ui.statusBox.classList.remove("status-success", "status-expired");
  ui.invoiceBox.classList.add("status-pending");
  ui.statusBox.classList.add("status-pending");

  updateProgress("pending");

  ui.statusBadgeText.innerText = "Menunggu Pembayaran";
  ui.statusTitle.innerText = "Menunggu Pembayaran";
  ui.statusDescription.innerText = "Silakan lakukan pembayaran sesuai nominal yang tertera pada invoice.";
  ui.statusTipText.innerHTML = "Pastikan nominal pembayaran sesuai agar proses verifikasi oleh admin berjalan lebih cepat.";
  ui.statusBadgeIcon.className = "fa-solid fa-stopwatch";
  ui.statusIconFa.className = "fa-solid fa-hourglass-half";

  document.getElementById("statusSectionIcon").className = "section-icon icon-gold";

  document.getElementById("supportTitle").innerText = "Hubungi Admin";
  document.getElementById("supportDescription").innerHTML = "Sudah melakukan pembayaran tetapi status masih <b>Pending</b>? Kirim bukti pembayaran ke admin agar proses verifikasi dapat segera dilakukan.";
  document.getElementById("waButtonText").innerText = "Chat Admin Sekarang";
  document.getElementById("waButtonIcon").className = "fa-brands fa-whatsapp";
}

function setSuccessUI(proses) {
  const ui = getStatusElements();

  ui.invoiceBox.classList.remove("status-pending", "status-expired");
  ui.statusBox.classList.remove("status-pending", "status-expired");
  ui.invoiceBox.classList.add("status-success");
  ui.statusBox.classList.add("status-success");

  updateProgress("success", proses);

  ui.statusBadgeText.innerText = "Pembayaran Berhasil";
  ui.statusTitle.innerText = "Pembayaran Berhasil";
  ui.statusDescription.innerText = "Pembayaran telah diterima dan berhasil diverifikasi oleh admin.";
  ui.statusTipText.innerHTML = "Pesanan sedang diproses oleh admin. Terima kasih telah melakukan pembayaran.";
  ui.statusBadgeIcon.className = "fa-solid fa-check";
  ui.statusIconFa.className = "fa-solid fa-check";

  document.getElementById("statusSectionIcon").className = "section-icon icon-green";

  document.getElementById("supportTitle").innerText = "Pesanan Sedang Diproses";
  document.getElementById("supportDescription").innerHTML = "Pembayaran telah berhasil diverifikasi. Pesanan kamu sedang diproses oleh admin.";
  document.getElementById("waButtonText").innerText = "Hubungi Admin";
  document.getElementById("waButtonIcon").className = "fa-brands fa-whatsapp";
}

function setExpiredUI() {
  const ui = getStatusElements();[span_3](start_span)[span_3](end_span)

  // Hapus warna lama, ganti ke tema expired (merah)
  ui.invoiceBox.classList.remove("status-pending", "status-success");[span_4](start_span)[span_4](end_span)
  ui.statusBox.classList.remove("status-pending", "status-success");[span_5](start_span)[span_5](end_span)
  ui.invoiceBox.classList.add("status-expired");[span_6](start_span)[span_6](end_span)
  ui.statusBox.classList.add("status-expired");[span_7](start_span)[span_7](end_span)

  ui.statusBadgeText.innerText = "Invoice Kedaluwarsa";[span_8](start_span)[span_8](end_span)
  ui.statusTitle.innerText = "Waktu Pembayaran Habis";[span_9](start_span)[span_9](end_span)
  ui.statusDescription.innerText = "Maaf, batas waktu pembayaran 1 jam telah habis. Invoice ini sudah tidak berlaku lagi.";[span_10](start_span)[span_10](end_span)
  ui.statusTipText.innerHTML = "Silakan melakukan generate ulang invoice melalui tombol di bawah untuk memperbarui pesanan.";[span_11](start_span)[span_11](end_span)
  
  // Mengubah icon dari fa-circle-xmark menjadi fa-xmark
  ui.statusBadgeIcon.className = "fa-solid fa-xmark";[span_12](start_span)[span_12](end_span)
  ui.statusIconFa.className = "fa-solid fa-bell-slash";[span_13](start_span)[span_13](end_span)

  // ==========================================
  // 🔥 KODE BARU 1: OVERRIDE TOAST MENJADI KADALUARSA (MERAH)
  // ==========================================
  if (typeof showToast === "function") {
    showToast("Pesanan sudah kadaluarsa", "fa-circle-xmark");
  }

  // ==========================================
  // 🔥 KODE BARU 2: UBAH IKON & TAMBAH TEKS DI TIMELINE
  // ==========================================
  
  // 1. Mengubah ikon check & hourglass menjadi xmark
  const orderIcon = document.querySelector("#stepOrder i");
  const paymentIcon = document.querySelector("#stepPayment i");
  if (orderIcon) orderIcon.className = "fa-solid fa-xmark";
  if (paymentIcon) paymentIcon.className = "fa-solid fa-xmark";

  // 2. Menambahkan teks merah "sesi kadaluarsa"
  const stepOrder = document.getElementById("stepOrder");[span_14](start_span)[span_14](end_span)
  const stepPayment = document.getElementById("stepPayment");[span_15](start_span)[span_15](end_span)

  // Tambah teks di bawah "Pesanan Dibuat"
  if (stepOrder && !document.getElementById("expiredTextOrder")) {
    const textRedOrder = document.createElement("div");
    textRedOrder.id = "expiredTextOrder";
    textRedOrder.style.color = "#ef4444";
    textRedOrder.style.fontSize = "11px";
    textRedOrder.style.fontWeight = "500";
    textRedOrder.style.marginTop = "2px";
    textRedOrder.innerText = "sesi kadaluarsa";
    stepOrder.appendChild(textRedOrder);
  }

  // Tambah teks di bawah "Menunggu Pembayaran"
  if (stepPayment && !document.getElementById("expiredTextPayment")) {
    const textRedPayment = document.createElement("div");
    textRedPayment.id = "expiredTextPayment";
    textRedPayment.style.color = "#ef4444";
    textRedPayment.style.fontSize = "11px";
    textRedPayment.style.fontWeight = "500";
    textRedPayment.style.marginTop = "2px";
    textRedPayment.innerText = "sesi kadaluarsa";
    stepPayment.appendChild(textRedPayment);
  }
  
  // ==========================================

  // Mengubah icon section menjadi merah
  document.getElementById("statusSectionIcon").className = "section-icon icon-red";[span_16](start_span)[span_16](end_span)

  // INFO PENDUKUNG DIUBAH MENJADI TOMBOL GENERATE ULANG
  document.getElementById("supportTitle").innerText = "Generate Ulang Invoice";[span_17](start_span)[span_17](end_span)
  document.getElementById("supportDescription").innerHTML = "Untuk melanjutkan pembelian paket, silakan klik tombol di bawah ini untuk membuat invoice baru.";[span_18](start_span)[span_18](end_span)
  
  // EDIT TOMBOL WA: Ubah text, matikan fungsi klik, dan beri style disable
  const waBtn = document.getElementById("waButton") || document.querySelector(".support-action a");[span_19](start_span)[span_19](end_span)
  if (waBtn) {[span_20](start_span)[span_20](end_span)
    waBtn.href = "javascript:void(0);"; // Matikan link redirect WA[span_21](start_span)[span_21](end_span)
    waBtn.setAttribute("onclick", "generateUlangInvoice()"); // Alihkan tombol untuk generate ulang[span_22](start_span)[span_22](end_span)
    waBtn.style.backgroundColor = "#ef4444"; // Ubah tombol jadi warna merah tanda expired[span_23](start_span)[span_23](end_span)
    waBtn.style.cursor = "pointer";[span_24](start_span)[span_24](end_span)
    
    document.getElementById("waButtonText").innerText = "Generate Ulang Invoice Baru ⚡";[span_25](start_span)[span_25](end_span)
    document.getElementById("waButtonIcon").className = "fa-solid fa-rotate-right";[span_26](start_span)[span_26](end_span)
  }
}

function generateUlangInvoice() {
  // Bersihkan invoice lama agar sistem memicu pembuatan kode baru
  localStorage.removeItem("invoiceID");
  localStorage.removeItem("invoiceCreatedAt");
  
  // Arahkan kembali ke halaman opsi pembayaran
  window.location.href = "opsi-pembayaran.html"; 
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
    document.getElementById("stepOrder").className = "progress-item completed";
    document.getElementById("stepPayment").className = "progress-item completed";
    document.getElementById("stepVerification").className = "progress-item completed";
    document.getElementById("stepProcess").className = "progress-item current";

    document.querySelector("#stepOrder i").className = "fa-solid fa-check";
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
