function showAlert(title, message){
  document.getElementById("alertTitle").innerText = title;
  document.getElementById("alertMessage").innerText = message;
  document.getElementById("customAlert").classList.add("active");
}

function closeAlert(){
  document.getElementById("customAlert").classList.remove("active");
}
    
document.addEventListener("DOMContentLoaded", function(){

const sheetID = "1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";
const warrantySheet = "WARRANTY_DATA";
const warrantyURL = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${warrantySheet}`;

const input = document.querySelector(".invoice-input-wrap input");
const button = document.querySelector(".invoice-input-wrap button");

function normalizeNumber(num) {
  num = num.replace(/\D/g, "");

  if (num.startsWith("62")) {
    num = num.substring(2);
  }

  if (num.startsWith("0")) {
    num = num.substring(1);
  }

  return num;
}

async function checkTransaction() {
  const buyerInputRaw = input.value.trim();

  if (!buyerInputRaw) {
    showAlert("Oops", "Masukkan nomor HP dulu.");
    return;
  }

  const buyerInput = normalizeNumber(buyerInputRaw);

  // disable tombol biar gak double klik
  button.disabled = true;
  const originalText = button.innerHTML;
  button.innerHTML = "Loading...";

  try {

    const resWarranty = await fetch(warrantyURL);
    const textWarranty = await resWarranty.text();
    const jsonWarranty = JSON.parse(textWarranty.substr(47).slice(0, -2));
    const rowsWarranty = jsonWarranty.table.rows;

    // KODE BARU (SUDAH DIPERBAIKI)
  const transactions = rowsWarranty.filter(row => {
  // Mengubah indeks ke 9 untuk membaca Kolom J (buyer_contact)
  const sheetNumber = normalizeNumber(String(row.c[9]?.v || ""));
  return sheetNumber === buyerInput;
});


    if (transactions.length === 0) {
      showAlert("Tidak ditemukan", "Belum ada transaksi untuk nomor ini.");
      return;
    }

    window.location.href = `semua-transaksi.html?buyer=${buyerInput}`;

  } catch (err) {
    console.error(err);
    showAlert("Error", "Terjadi kesalahan mengambil data.");
  }

    // balikin tombol
  button.disabled = false;
  button.innerHTML = originalText;
}

button.addEventListener("click", checkTransaction);

// ENTER langsung cek
input.addEventListener("keypress", function(e){
  if(e.key === "Enter"){
    checkTransaction();
  }
});

});
