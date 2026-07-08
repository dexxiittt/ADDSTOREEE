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
