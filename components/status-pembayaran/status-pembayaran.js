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

  // INVOICE & TIME RENDER
  const invoice = localStorage.getItem("invoiceID");
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
      alert("Invoice tidak ditemukan ❌");
      return;
    }

    // FETCH PAYMENT_ID
    const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id");
    const data = await res.json();

    // CARI INVOICE
    const found = data.find(x => x.invoice == invoiceID);
    if (!found) {
      alert("Invoice tidak ditemukan ❌");
      return;
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
    alert(err.message);
    console.error(err);
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
  switch (status) {
    case "success":
      setSuccessUI(proses);
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
   STATUS UI THEMES (PENDING & SUCCESS)
   ============================================================ */
function setPendingUI() {
  const ui = getStatusElements();

  ui.invoiceBox.classList.remove("status-success");
  ui.statusBox.classList.remove("status-success");
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

  ui.invoiceBox.classList.remove("status-pending");
  ui.statusBox.classList.remove("status-pending");
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

function setExpiredUI() { /* TODO */ }
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
