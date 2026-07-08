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
// STEP 1.3 DITUNDA
// =============================

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

} else {

  // TODO:
  // Render Data Tidak Ditemukan
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
