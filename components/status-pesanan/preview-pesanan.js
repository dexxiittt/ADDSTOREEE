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
// STEP 1.3
// =============================
