// =============================
// AMBIL PARAMETER INVOICE
// =============================
const params = new URLSearchParams(window.location.search);
const invoice = params.get("inv");

if (!invoice) {
  window.location.href = "invoice.html";
}

// =============================
// TAMPILKAN LOADING CARD
// =============================
const wrapper = document.querySelector(".status-wrapper");

const loadingCard =
document.getElementById("loadingCard");

const resultWrapper =
document.getElementById("resultWrapper");

// =============================
// CARD 1 ELEMENT
// =============================

const packageCard =
document.getElementById("packageCard");

const packageImage =
document.getElementById("packageImage");

const packageBadge =
document.getElementById("packageBadge");

const productCategory =
document.getElementById("productCategory");

const productTitle =
document.getElementById("productTitle");

const packageNameText =
document.getElementById("packageName");

// =============================
// CARD 2 ELEMENT
// =============================

const metaCard =
document.getElementById("metaCard");

const metaInvoice =
document.getElementById("metaInvoice");

const metaDuration =
document.getElementById("metaDuration");

const statusText =
document.getElementById("statusText");

const countdownBox =
document.getElementById("countdownBox");

const countdownTimer =
document.getElementById("countdownTimer");

const expiredBadge =
document.getElementById("expiredBadge");

// =============================
// CARD 3 ELEMENT
// =============================

const detailCard =
document.getElementById("detailCard");

const validUntil =
document.getElementById("validUntil");

const priceInfo =
document.getElementById("priceInfo");

const oldPrice =
document.getElementById("oldPrice");

const finalPriceText =
document.getElementById("finalPrice");

const discountBadge =
document.getElementById("discountBadge");

const paymentMethod =
document.getElementById("paymentMethod");

// =============================
// CARD 4 ELEMENT
// =============================

const infoCard =
document.getElementById("infoCard");

const infoIcon =
document.getElementById("infoIcon");

const infoMore =
document.getElementById("infoMore");

const infoContent =
document.getElementById("infoContent");

const infoList =
document.getElementById("infoList");

const infoClose =
document.getElementById("infoClose");

// =============================
// NOT FOUND ELEMENT
// =============================

const notFoundCard =
document.getElementById("notFoundCard");

const notFoundInvoice =
document.getElementById("notFoundInvoice");

const notFoundButton =
document.getElementById("notFoundButton");

resultWrapper.style.display = "none";

const loadingText =
document.getElementById("loadingText");

const loadingTimer =
document.getElementById("loadingTimer");

const loadingInvoice =
document.getElementById("loadingInvoice");

loadingInvoice.textContent = invoice;

// =============================
// SERVER TIME API
// =============================
const timeAPI = "https://script.google.com/macros/s/AKfycbx7vo05kZaGjn1VuI9J7XZjwenytoySEF4AjbhtRvEXrFYzkE9AkFQpuISMco3pAyo2/exec";

async function getServerTime() {
  const res = await fetch(timeAPI);
  const data = await res.json();
  return new Date(data.serverTime);
}
  
// =============================
// KONFIGURASI SHEET WARRANTY_DATA
// =============================
const sheetID = "1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";
const sheetName = "WARRANTY_DATA";
const sheetURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

// =============================
// FETCH WARRANTY_DATA
// =============================
async function fetchWarrantyData() {
  alert("STEP B - Masuk fetchWarrantyData");
  try {
    const res = await fetch(sheetURL);
    const text = await res.text();
    const json = JSON.parse(text.substr(47).slice(0, -2));
    const rows = json.table.rows;

    let matchedData = null;

    rows.forEach(row => {
      if (!row.c) return;

      const invoiceCell = row.c[0]?.v;
      if (String(invoiceCell) === String(invoice)) {
        matchedData = row;
      }
    });

    
// =============================
// KALAU DATA DITEMUKAN
// =============================
    
if (matchedData) {

  alert("STEP C - Data ditemukan");

wrapper.style.display = "block";
loadingCard.style.display = "none";

const headers = json.table.cols.map(col => col.label.trim());

const rowData = {};
headers.forEach((header, index) => {
  rowData[header.trim()] = matchedData.c[index]?.v ?? "";
});

metaInvoice.textContent = invoice;

const product_id  = rowData.product_id || "-";
const title       = rowData.title || "-";

productTitle.textContent = title;
      
const packageName = rowData.package || "-";

packageNameText.textContent = packageName;

const image_url = rowData.image_url || "";

packageImage.src =
image_url ||
"https://dummyimage.com/800x400/111827/ffffff&text=Package";

packageImage.alt = title;
      
let badge = "Produk Premium";
const id = product_id.toLowerCase();

if (id.includes("apk")) {
  badge = "APK Premium";
} else if (id.includes("sosmed")) {
  badge = "Layanan Sosial Media";
} else if (id.includes("topup")) {
  badge = "Top Up Game";
}     

packageBadge.textContent = badge;
      
const notesRaw = rowData.notes || "";

const status = rowData.status || "-";

statusText.textContent = status;

let informasiList = [];

if (notesRaw && notesRaw.includes("|")) {
  informasiList = notesRaw
    .split("|")
    .map(item => item.trim())
    .filter(item => item.length > 0);
} else if (notesRaw) {
  informasiList = [notesRaw.trim()];
} else {
  informasiList = [
    "Garansi berlaku sesuai durasi dan tanggal aktivasi yang tercatat di sistem.",
    "Timer merupakan indikator masa layanan dari penjual.",
    "Garansi tidak dapat diperpanjang sebelum masa aktif sebelumnya berakhir."
  ];
}
      
// =============================
// FORMAT HARGA (SAMA SEPERTI PACKAGE)
// =============================

function parseDiscount(val) {
  if (!val) return 0;

  // kalau sudah angka kecil (misal 0.2223)
  if (typeof val === "number") {
    return val < 1 ? val * 100 : val;
  }

  const clean = String(val)
    .replace('%', '')
    .replace(',', '.')
    .trim();

  const num = Number(clean) || 0;

  return num < 1 ? num * 100 : num;
}

const price = Number(rowData.price) || 0;
const discount = parseDiscount(rowData.discount);

const finalPrice = discount > 0
  ? Math.round(price - (price * discount / 100))
  : price;
  
oldPrice.textContent =
`Rp${price.toLocaleString("id-ID")}`;
  
finalPriceText.textContent =
`Rp${finalPrice.toLocaleString("id-ID")}`;

if (discount > 0) {

  discountBadge.textContent =
  `-${discount.toFixed(2).replace(".", ",")}%`;

} else {

  discountBadge.style.display = "none";

}
  
const durationDays = parseInt(rowData.duration_days) || 0;

// =============================
// GENERATE INFORMASI HTML
// =============================

const informasiHTML = informasiList
  .map(item => `<li>${item}</li>`)
  .join("");

infoList.innerHTML = informasiHTML;

// =============================
// VALID UNTIL SYSTEM (PREMIUM VERSION)
// =============================

let berlakuSampai = "-";

const validUntilRaw = rowData.valid_until;

if (validUntilRaw) {

  const serverNow = await getServerTime();

  // Jika isinya angka (misal 30)
  if (!isNaN(parseInt(validUntilRaw))) {

    const daysToAdd = parseInt(validUntilRaw);
    const expDate = new Date(serverNow);
    expDate.setDate(expDate.getDate() + daysToAdd);

    berlakuSampai = expDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  }

  // Jika isinya tanggal langsung
  else {

    const parsedDate = new Date(validUntilRaw);

    if (!isNaN(parsedDate.getTime())) {
      berlakuSampai = parsedDate.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    }

  }
}

validUntil.textContent = berlakuSampai;

const activated_at = rowData[headers.find(h =>
  h.toLowerCase().includes("activated")
)] || "";

const metodePembayaran = `
  Lynk ID Verified
  <div style="opacity:.6; font-size:12px; margin-top:4px;">
    Checkout diproses oleh Lynk ID
  </div>
`;

paymentMethod.innerHTML = metodePembayaran;

if (durationDays >= 30) {

  const months = Math.floor(durationDays / 30);
  const remainingDays = durationDays % 30;

  if (remainingDays === 0) {
    durationDisplay = `${months} Bulan`;
  } else {
    durationDisplay = `${months} Bulan (${remainingDays} Hari)`;
  }

    } else if (durationDays > 0) {

  durationDisplay = `${durationDays} Hari`;

}
alert("STEP C.1 - Sebelum metaDuration");
metaDuration.textContent = durationDisplay;
alert("STEP C.2 - Sesudah metaDuration");
// =============================
// CLEAN COLLAPSIBLE SYSTEM
// =============================

if (infoMore) {
  infoMore.addEventListener("click", () => {

    infoContent.classList.add("open");
    infoIcon.classList.add("active");

    infoMore.style.display = "none";
    infoClose.style.display = "block";

    // =============================
    // STAGGER NOTE ANIMATION
    // =============================
    const notes = infoContent.querySelectorAll("li");

    notes.forEach((note, index) => {
      note.classList.remove("show");
      setTimeout(() => {
        note.classList.add("show");
      }, index * 120); // delay ringan per item
    });

  });
}

if (infoClose) {
  infoClose.addEventListener("click", () => {

    infoContent.classList.remove("open");
    infoIcon.classList.remove("active");

    infoClose.style.display = "none";
    infoMore.style.display = "block";

  });
}

      initFadeUp();
 
if (durationDays > 0) {

  // ==========================
  // JIKA BELUM ACTIVE
  // ==========================
if (status.toLowerCase() !== "active") {
  statusText.style.color = "#9ca3af";
    countdownTimer.innerHTML =
      `${durationDays} Hari 00:00:00`;
    return;
}

  // ==========================
  // JIKA SUDAH ACTIVE
  // ==========================

  let activatedDate;

  // HANDLE FORMAT Date(2026,1,26,21,0,0)
  if (typeof activated_at === "string" && activated_at.startsWith("Date(")) {
    const parts = activated_at
      .replace("Date(", "")
      .replace(")", "")
      .split(",")
      .map(Number);

    activatedDate = new Date(
      parts[0],
      parts[1],
      parts[2],
      parts[3] || 0,
      parts[4] || 0,
      parts[5] || 0
    );
  }

  // HANDLE OBJECT DATE (gviz)
  else if (typeof activated_at === "object") {
    activatedDate = new Date(activated_at);
  }

  // HANDLE STRING BIASA
  else {
    activatedDate = new Date(activated_at);

    if (isNaN(activatedDate.getTime())) {
      const [datePart, timePart] = activated_at.split(" ");
      const [day, month, year] = datePart.split("/");

      activatedDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        ...timePart.split(":").map(Number)
      );
    }
  }

  if (!activatedDate || isNaN(activatedDate.getTime())) {
    console.log("Gagal parse tanggal:", activated_at);
    return;
  }

// Total detik = durationDays * 24 jam
const expiryDate = new Date(activatedDate);
expiryDate.setDate(expiryDate.getDate() + durationDays);

  async function startCountdown() {

  const serverNow = await getServerTime();
  const clientStartTime = Date.now();

  function updateCountdown() {

    const now = new Date(
      serverNow.getTime() + (Date.now() - clientStartTime)
    );

const fullDurationMs = durationDays * 24 * 60 * 60 * 1000;
const elapsed = now - activatedDate;
const diff = fullDurationMs - elapsed;

countdownBox.style.display = "block";
expiredBadge.style.display = "none";

    if (diff <= 0) {

  countdownTimer.innerHTML = "";
  statusText.innerHTML = "Expired";
  statusText.style.color = "#ef4444";

  countdownBox.style.display = "none";
  expiredBadge.style.display = "block";

  /* if (!document.querySelector(".status-badge-expired")) {
    const badge = document.createElement("div");
    badge.className = "status-badge-expired";
    badge.innerText = "EXPIRED";
    statusText.parentNode.appendChild(badge);
  }
*/

  return;
}

    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    countdownTimer.innerHTML = `

<div class="countdown-days">
${days} Hari
</div>

<div class="countdown-time">
${hours.toString().padStart(2,"0")}:
${minutes.toString().padStart(2,"0")}:
${seconds.toString().padStart(2,"0")}
</div>
`;

    // PREMIUM BEHAVIOUR COLOR SYSTEM
if (days > 7) {
  statusText.style.color = "#22c55e"; // Hijau
} 
else if (days >= 3) {
  statusText.style.color = "#f97316"; // Orange
} 
else {
  statusText.style.color = "#ef4444"; // Merah (0–2 hari)
}

// ==========================
// MICRO PULSE
// ==========================

countdownTimer.classList.remove("pulse-soft", "pulse-strong");

if (seconds !== 0) {
  countdownTimer.classList.add("pulse-soft");
}

if (seconds === 0) {
  countdownTimer.classList.add("pulse-strong");
}

if (minutes === 0 && seconds === 0) {
  countdownTimer.classList.add("pulse-strong");
}
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);
}

startCountdown();

}

      } else {

  alert("STEP D - Data tidak ditemukan");

notFoundInvoice.textContent = invoice;

loadingCard.style.display = "none";

resultWrapper.style.display = "block";

resultWrapper.style.display = "none";

notFoundCard.style.display = "block";
  
}

  } catch (err) {
    console.error("Error ambil warranty_data:", err);
  }
}

// =============================
// 10 MENIT WAIT SYSTEM (FINAL FIX)
// =============================

const WAIT_DURATION = 1 * 60 * 1000;
const storageKey = "invoice_wait_" + invoice;

const storedValue = localStorage.getItem(storageKey);

if (storedValue === "DONE") {

  // Sembunyikan timer & teks loading
  const timerEl = document.getElementById("loadingTimer");
  const waitText = timerEl?.nextElementSibling;

  if (timerEl) timerEl.style.display = "none";
  if (waitText) waitText.style.display = "none";

  // Langsung ambil status
  fetchWarrantyData();

} else {

  let startTime;

  if (!storedValue) {
    startTime = Date.now();
    localStorage.setItem(storageKey, startTime);
  } else {
    startTime = parseInt(storedValue);
  }

  startWaitingTimer(startTime);
}

function startWaitingTimer(startTime) {

  const timerEl = document.getElementById("loadingTimer");
  const waitText = timerEl?.nextElementSibling;

  function update() {

    const elapsed = Date.now() - startTime;
    const remaining = WAIT_DURATION - elapsed;

    if (remaining <= 0) {

      // Tandai selesai permanen
      localStorage.setItem(storageKey, "DONE");

      // Sembunyikan timer & teks
      if (timerEl) timerEl.style.display = "none";
      if (waitText) waitText.style.display = "none";

      alert("STEP A - Timer selesai, fetchWarrantyData akan dijalankan");
      // Ambil status pesanan
      fetchWarrantyData();
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    if (timerEl) {
      timerEl.innerHTML =
        `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;
    }
  }

  update();
  setInterval(update, 1000);
}

// =============================
// LOADING DOT ANIMATION
// =============================

if (loadingText) {

  let dotCount = 0;

  setInterval(() => {
    dotCount = (dotCount + 1) % 4; // 0–3

    let dots = ".".repeat(dotCount);

    loadingText.innerHTML = "Memuat Data" + dots;

  }, 500);

}

// =============================
// GLOBAL FADE-UP OBSERVER
// =============================

const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add("show");
      fadeObserver.unobserve(entry.target);
    }
  });
}, {
  threshold: 0.15
});

function initFadeUp() {
  const elements = document.querySelectorAll(".fade-up");

  elements.forEach((el, index) => {
    el.style.transitionDelay = `${index * 100}ms`; // stagger ringan
    fadeObserver.observe(el);
  });
}

if (notFoundButton) {

  notFoundButton.addEventListener("click", () => {

    window.location.href = "invoice.html";

  });

}
