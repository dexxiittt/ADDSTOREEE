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
