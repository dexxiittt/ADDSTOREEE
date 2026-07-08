// =============================
// AMBIL PARAMETER INVOICE
// =============================

const params = new URLSearchParams(window.location.search);

const invoice = params.get("inv");

if (!invoice) {
  window.location.href = "invoice.html";
}

// =============================
// AMBIL ELEMENT UTAMA
// =============================

const wrapper = document.querySelector(".status-wrapper");

// =============================
// TAMPILKAN LOADING CARD
// =============================

wrapper.innerHTML = `
  <div style="
    width: 100%;
    padding: 120px 20px;
    display:flex;
    flex-direction:column;
    align-items:center;
    justify-content:center;
    border-radius: 24px;
    background: rgba(18,18,28,0.75);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.08);
    box-shadow: 0 30px 80px rgba(0,0,0,0.6);
    text-align:center;
    color:white;
    font-family:'Plus Jakarta Sans', sans-serif;
  ">

    <h2 id="loadingText" style="margin-bottom:10px;">
      Memuat Data...
    </h2>

    <div id="loadingTimer" style="
      font-size:22px;
      font-weight:700;
      margin-bottom:10px;
      color:#9f7aea;
    ">
      10:00
    </div>

    <p style="opacity:.8; margin-bottom:6px;">
      Invoice sedang dibuat, mohon tunggu
    </p>

    <p style="opacity:.6;">
      Invoice:
    </p>

    <h3 style="margin-top:5px; color:#9f7aea;">
      ${invoice}
    </h3>

  </div>
`;

// =============================
// SERVER TIME API
// =============================

const timeAPI =
  "https://script.google.com/macros/s/AKfycbx7vo05kZaGjn1VuI9J7XZjwenytoySEF4AjbhtRvEXrFYzkE9AkFQpuISMco3pAyo2/exec";

async function getServerTime() {

  const res = await fetch(timeAPI);

  const data = await res.json();

  return new Date(data.serverTime);

}

// =============================
// KONFIGURASI GOOGLE SHEET
// =============================

const sheetID =
  "1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";

const sheetName = "WARRANTY_DATA";

const sheetURL =
  `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

// =============================
// FETCH WARRANTY DATA
// =============================

async function fetchWarrantyData() {

  try {

// =============================
// AMBIL DATA GOOGLE SHEET
// =============================

const res = await fetch(sheetURL);

const text = await res.text();

const json = JSON.parse(
  text.substr(47).slice(0, -2)
);

const rows = json.table.rows;

// =============================
// CARI INVOICE
// =============================

let matchedData = null;

rows.forEach((row) => {

  if (!row.c) return;

  const invoiceCell = row.c[0]?.v;

  if (String(invoiceCell) === String(invoice)) {
    matchedData = row;
  }

});

// =============================
// VALIDASI DATA
// =============================

if (matchedData) {

  wrapper.style.display = "block";

// =============================
// MAPPING HEADER
// =============================
  
const headers = json.table.cols.map(
  col => col.label.trim()
);

const rowData = {};

headers.forEach((header, index) => {

  rowData[header.trim()] =
    matchedData.c[index]?.v ?? "";

});

// =============================
// AMBIL DATA UTAMA
// =============================

const product_id  = rowData.product_id || "-";

const title = rowData.title || "-";

const packageName = rowData.package || "-";

const notesRaw = rowData.notes || "";

// =============================
// PROSES INFORMASI PENTING
// =============================

let informasiList = [];

if (notesRaw && notesRaw.includes("|")) {

  informasiList = notesRaw
    .split("|")
    .map(item => item.trim())
    .filter(item => item.length > 0);

} else if (notesRaw) {

  informasiList = [
    notesRaw.trim()
  ];

} else {

  informasiList = [
    "Garansi berlaku sesuai durasi dan tanggal aktivasi yang tercatat di sistem.",
    "Timer merupakan indikator masa layanan dari penjual.",
    "Garansi tidak dapat diperpanjang sebelum masa aktif sebelumnya berakhir."
  ];

}


// =============================
// PARSE DISCOUNT
// =============================

function parseDiscount(value) {

  if (!value) return 0;

  // Jika sudah berupa number
  if (typeof value === "number") {
    return value < 1 ? value * 100 : value;
  }

  const clean = String(value)
    .replace("%", "")
    .replace(",", ".")
    .trim();

  const discount = Number(clean) || 0;

  return discount < 1
    ? discount * 100
    : discount;

}

// =============================
// HITUNG HARGA AKHIR
// =============================

const price =
  Number(rowData.price) || 0;

const discount =
  parseDiscount(rowData.discount);

const finalPrice =
  discount > 0
    ? Math.round(
        price - (price * discount / 100)
      )
    : price;

// =============================
// GENERATE HARGA HTML
// =============================

let hargaHTML;

if (discount > 0) {

  hargaHTML = `
    <div style="display:flex; align-items:center; justify-content:center; gap:8px;">

      <span style="
        font-size:14px;
        text-decoration:line-through;
        color:#ffffff;
        opacity:0.6;
      ">
        Rp${price.toLocaleString("id-ID")}
      </span>

      <span style="
        font-weight:900;
        font-size:22px;
        color:#ffffff;
      ">
        Rp${finalPrice.toLocaleString("id-ID")}
      </span>

      <span style="
        padding:4px 10px;
        font-size:12px;
        font-weight:700;
        border-radius:999px;
        background:#22c55e;
        color:#ffffff;
        white-space:nowrap;
      ">
        -${discount.toFixed(2).replace(".", ",")}%
      </span>

    </div>
  `;

} else {

  hargaHTML = `
    <span style="
      font-weight:900;
      font-size:22px;
      color:#ffffff;
    ">
      Rp${price.toLocaleString("id-ID")}
    </span>
  `;

}

// =============================
// AMBIL VALID UNTIL
// =============================

let berlakuSampai = "-";

const validUntilRaw =
  rowData.valid_until;
  

// =============================
// HITUNG TANGGAL BERAKHIR
// =============================

let expiryDate = null;

if (validUntilRaw) {

  // Jika valid_until berisi jumlah hari
  if (!isNaN(parseInt(validUntilRaw))) {

    const serverNow =
      await getServerTime();

    expiryDate = new Date(serverNow);

    expiryDate.setDate(
      expiryDate.getDate() +
      parseInt(validUntilRaw)
    );

  }

  // Jika valid_until berisi tanggal langsung
  else {

    const parsedDate =
      new Date(validUntilRaw);

    if (!isNaN(parsedDate.getTime())) {
      expiryDate = parsedDate;
    }

  }

}

// =============================
// FORMAT TANGGAL INDONESIA
// =============================

if (expiryDate) {

  berlakuSampai =
    expiryDate.toLocaleDateString(
      "id-ID",
      {
        day: "numeric",
        month: "long",
        year: "numeric"
      }
    );

}

// =============================
// AMBIL DURASI
// =============================

const durationDays =
  parseInt(rowData.duration_days) || 0;

// =============================
// HITUNG FORMAT DURASI
// =============================

const months =
  Math.floor(durationDays / 30);

const remainingDays =
  durationDays % 30;


// =============================
// GENERATE TEKS DURASI
// =============================

let durationDisplay = "-";

if (durationDays >= 30) {

  if (remainingDays === 0) {

    durationDisplay =
      `${months} Bulan`;

  } else {

    durationDisplay =
      `${months} Bulan (${remainingDays} Hari)`;

  }

} else if (durationDays > 0) {

  durationDisplay =
    `${durationDays} Hari`;

}

// =============================
// AMBIL DATA STATUS
// =============================

const status =
  rowData.status || "-";

// =============================
// AMBIL DATA GAMBAR
// =============================

const image_url =
  rowData.image_url || "";

// =============================
// AMBIL DATA AKTIVASI
// =============================

const activatedHeader =
  headers.find(header =>
    header.toLowerCase().includes("activated")
  );

const activated_at =
  rowData[activatedHeader] || "";

// =============================
// GENERATE INFORMASI HTML
// =============================

const informasiHTML =
  informasiList
    .map(item => `<li>${item}</li>`)
    .join("");

// =============================
// GENERATE METODE PEMBAYARAN
// =============================

const metodePembayaran = `
  Lynk ID Verified

  <div style="
    opacity:.6;
    font-size:12px;
    margin-top:4px;
  ">
    Checkout diproses oleh Lynk ID
  </div>
`;

// =============================
// RENDER PACKAGE CARD
// =============================

const packageCard = `
  <!-- CARD 1 -->
  <div class="package-preview fade-up">

    <img
      src="${image_url || 'https://dummyimage.com/800x400/111827/ffffff&text=Package'}"
      alt="${title}"
      onerror="this.src='https://dummyimage.com/800x400/111827/ffffff&text=Package';">

    <h2 style="
      font-family:'Cormorant Garamond', serif;
      font-size:30px;
      margin:20px 0 10px;
      text-align:center;
    ">
      Detail Pesanan
    </h2>

    <h3>${title}</h3>

    <p style="margin-bottom:20px;">
      ${packageName}
    </p>

  </div>
`;

// =============================
// RENDER META CARD
// =============================

const metaCard = `
  <!-- CARD 2 (GLASS META) -->
  <div class="status-meta-card fade-up">

    <div class="status-meta-grid">

      <div>
        <span>Invoice</span>
        <b>${invoice}</b>
      </div>

      <div>
        <span>Durasi</span>
        <b>${durationDisplay}</b>
      </div>

      <div>

        <span>Status</span>

        <b id="statusText">
          ${status}
        </b>

        <div
          id="countdownBox"
          style="
            margin-top:6px;
            font-size:13px;
            opacity:.8;
          ">

          Garansi Tersisa

          <div
            id="countdownTimer"
            style="
              font-weight:600;
              margin-top:3px;
            ">
          </div>

        </div>

      </div>

    </div>

  </div>
`;


// =============================
// RENDER DETAIL CARD
// =============================

const detailCard = `
  <!-- CARD 3 (GLASS DETAIL TAMBAHAN) -->
  <div class="status-meta-card fade-up">

    <div class="status-meta-grid">

      <div>

        <span>Berlaku Sampai</span>

        <b>${berlakuSampai}</b>

      </div>

      <div>

        <span>Harga</span>

        <b>${hargaHTML}</b>

      </div>

      <div>

        <span>Pembayaran</span>

        <b style="
          font-size:16px;
          line-height:1.4;
        ">
          ${metodePembayaran}
        </b>

      </div>

    </div>

  </div>
`;


// =============================
// RENDER INFORMASI CARD
// =============================

const informasiCard = `
  <!-- CARD 4 (INFORMASI PENTING) -->
  <div class="status-meta-card fade-up">

    <div class="info-header" style="margin-bottom:6px;">

      <span
        id="infoIcon"
        class="info-icon">
        ⓘ
      </span>

      <span>
        Informasi Penting
      </span>

    </div>

    <div
      id="infoMore"
      class="info-more">

      Selengkapnya...

    </div>

    <div
      id="infoContent"
      class="info-content">

      <ul>
        ${informasiHTML}
      </ul>

      <div
        id="infoClose"
        class="info-close"
        style="display:none;">

        Tutup

      </div>

    </div>

  </div>
`;

// =============================
// INJECT KE WRAPPER
// =============================

wrapper.innerHTML = `
  ${packageCard}
  ${metaCard}
  ${detailCard}
  ${informasiCard}
`;

// =============================
// AMBIL ELEMENT COLLAPSIBLE
// =============================

const infoIcon =
  document.getElementById("infoIcon");

const infoContent =
  document.getElementById("infoContent");

const infoMore =
  document.getElementById("infoMore");

const infoClose =
  document.getElementById("infoClose");

// =============================
// EVENT BUKA INFORMASI
// =============================

if (infoMore) {

  infoMore.addEventListener("click", () => {

    infoContent.classList.add("open");
    infoIcon.classList.add("active");

    infoMore.style.display = "none";
    infoClose.style.display = "block";

    const notes =
      infoContent.querySelectorAll("li");

    notes.forEach((note, index) => {

      note.classList.remove("show");

      setTimeout(() => {

        note.classList.add("show");

      }, index * 120);

    });

  });

}

// =============================
// EVENT TUTUP INFORMASI
// =============================

if (infoClose) {

  infoClose.addEventListener("click", () => {

    infoContent.classList.remove("open");
    infoIcon.classList.remove("active");

    infoClose.style.display = "none";
    infoMore.style.display = "block";

  });

}

// =============================
// JALANKAN INIT FADE-UP
// =============================

initFadeUp();

// =============================
// BUAT FADE OBSERVER
// =============================

const fadeObserver =
  new IntersectionObserver(

    (entries) => {

      entries.forEach((entry) => {

        if (entry.isIntersecting) {

          entry.target.classList.add("show");

          fadeObserver.unobserve(entry.target);

        }

      });

    },

    {
      threshold: 0.15
    }

  );

// =============================
// OBSERVE SEMUA ELEMENT
// =============================

function initFadeUp() {

  const elements =
    document.querySelectorAll(".fade-up");

  elements.forEach((element, index) => {

    element.style.transitionDelay =
      `${index * 100}ms`;

    fadeObserver.observe(element);

  });

}

// =============================
// AMBIL ELEMENT COUNTDOWN
// =============================

const countdownTimer =
  document.getElementById("countdownTimer");

const statusText =
  document.getElementById("statusText");

// =============================
// VALIDASI STATUS ACTIVE
// =============================

if (durationDays <= 0) {
  return;
}

if (status.toLowerCase() !== "active") {

  statusText.style.color = "#9ca3af";

  countdownTimer.innerHTML =
    `${durationDays} Hari 00:00:00`;

  return;

}

// =============================
// PARSE TANGGAL AKTIVASI
// =============================

const activatedDate =
  new Date(activated_at);

// =============================
// HITUNG EXPIRY DATE
// =============================

const expiryDate =
  new Date(
    activatedDate.getTime() +
    durationDays * 24 * 60 * 60 * 1000
  );

// =============================
// JALANKAN COUNTDOWN
// =============================

const timer = setInterval(() => {

  const now = new Date();

  const diff =
    expiryDate.getTime() - now.getTime();

  if (diff <= 0) {

    clearInterval(timer);

    countdownTimer.innerHTML =
      "Garansi Berakhir";

    statusText.textContent =
      "Expired";

    statusText.style.color =
      "#ef4444";

    return;

  }

  const days =
    Math.floor(diff / (1000 * 60 * 60 * 24));

  const hours =
    Math.floor(
      (diff % (1000 * 60 * 60 * 24)) /
      (1000 * 60 * 60)
    );

  const minutes =
    Math.floor(
      (diff % (1000 * 60 * 60)) /
      (1000 * 60)
    );

  const seconds =
    Math.floor(
      (diff % (1000 * 60)) /
      1000
    );

  countdownTimer.innerHTML =
    `${days} Hari ${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;

}, 1000);

// =============================
// COLLAPSIBLE INFORMASI
// =============================

const infoIcon =
  document.getElementById("infoIcon");

const infoContent =
  document.getElementById("infoContent");

const infoMore =
  document.getElementById("infoMore");

const infoClose =
  document.getElementById("infoClose");

if (infoMore) {

  infoMore.addEventListener("click", () => {

    infoContent.classList.add("open");
    infoIcon.classList.add("active");

    infoMore.style.display = "none";
    infoClose.style.display = "block";

    const notes =
      infoContent.querySelectorAll("li");

    notes.forEach((note, index) => {

      note.classList.remove("show");

      setTimeout(() => {

        note.classList.add("show");

      }, index * 120);

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
  
} else {

// =============================
// GENERATE NOT FOUND HTML
// =============================

const notFoundHTML = `
<div style="
  width:85%;
  max-width:750px;
  padding:60px;
  border-radius:28px;
  background:linear-gradient(
    145deg,
    rgba(18,18,28,.9),
    rgba(10,10,18,.85)
  );
  backdrop-filter:blur(25px);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 40px 120px rgba(0,0,0,.7);
  text-align:center;
  color:white;
  font-family:'Plus Jakarta Sans',sans-serif;
">

<h2 style="
  font-family:'Playfair Display',serif;
  font-size:30px;
  margin-bottom:20px;
">
  Data Tidak Ditemukan
</h2>

<p style="
  opacity:.75;
  margin-bottom:30px;
">
  Invoice
  <strong>${invoice}</strong>
  tidak ditemukan di sistem kami.
</p>

<button
onclick="window.location.href='invoice.html'"
style="
padding:12px 26px;
border-radius:20px;
border:none;
cursor:pointer;
font-weight:600;
background:linear-gradient(
135deg,
#9f7aea,
#6d28d9
);
box-shadow:0 12px 30px rgba(139,92,246,.5);
color:white;
">

Kembali ke Cek Invoice

</button>

</div>
`;

// =============================
// RENDER NOT FOUND
// =============================

wrapper.innerHTML = notFoundHTML;

  
  return;

}

  } catch (err) {

    console.error(
      "Error ambil warranty_data:",
      err
    );

  }

}

// =============================
// AMBIL STORAGE KEY
// =============================

const WAIT_DURATION =
  1 * 60 * 1000;

const storageKey =
  "invoice_wait_" + invoice;

const storedValue =
  localStorage.getItem(storageKey);

// =============================
// CEK STATUS WAITING
// =============================

if (storedValue === "DONE") {

  fetchWarrantyData();

  return;

}

// =============================
// MULAI WAITING
// =============================

const startTime =
  storedValue
    ? Number(storedValue)
    : Date.now();

if (!storedValue) {

  localStorage.setItem(
    storageKey,
    startTime
  );

}

// =============================
// SELESAI WAITING
// =============================

startWaitingTimer(startTime);

function startWaitingTimer(startTime) {

  const timerEl =
    document.getElementById("loadingTimer");

  const waitText =
    timerEl?.nextElementSibling;

  function update() {

    const elapsed =
      Date.now() - startTime;

    const remaining =
      WAIT_DURATION - elapsed;

    if (remaining <= 0) {

      localStorage.setItem(
        storageKey,
        "DONE"
      );

      if (timerEl)
        timerEl.style.display = "none";

      if (waitText)
        waitText.style.display = "none";

      fetchWarrantyData();

      return;

    }

    const minutes =
      Math.floor(remaining / 60000);

    const seconds =
      Math.floor(
        (remaining % 60000) / 1000
      );

    if (timerEl) {

      timerEl.innerHTML =
        `${minutes.toString().padStart(2,"0")}:${seconds.toString().padStart(2,"0")}`;

    }

  }

  update();

  setInterval(update, 1000);

}

// =============================
// AMBIL ELEMENT LOADING
// =============================

const loadingText =
  document.getElementById("loadingText");

// =============================
// JALANKAN LOADING DOT
// =============================

if (loadingText) {

  let dotCount = 0;

  setInterval(() => {

    dotCount = (dotCount + 1) % 4;

    loadingText.innerHTML =
      "Memuat Data" + ".".repeat(dotCount);

  }, 500);

}

