// tampilkan alert
function showAlert(title, message){
  document.getElementById("alertTitle").innerText = title;
  document.getElementById("alertMessage").innerText = message;
  document.getElementById("customAlert").classList.add("active");
}

// tutup alert
function closeAlert(){
  document.getElementById("customAlert").classList.remove("active");
}
  
document.addEventListener("DOMContentLoaded", function(){

  const sheetID = "1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";
  const sheetName = "invoice_id";
  const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

  const input = document.querySelector(".invoice-input-wrap input");
  const button = document.querySelector(".invoice-input-wrap button");

  button.addEventListener("click", checkInvoice);

  // ENTER langsung cek
  input.addEventListener("keypress", function(e){
    if(e.key === "Enter"){
      checkInvoice();
    }
  });

  async function checkInvoice() {
    const invoiceValue = input.value.trim();

    if (!invoiceValue) {
      showAlert("Oops", "Masukkan nomor invoice dulu.");
      return;
    }

    // disable tombol biar gak double klik
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = "Loading...";

    try {
      const res = await fetch(url);
      const text = await res.text();
      const json = JSON.parse(text.substr(47).slice(0, -2));
      const rows = json.table.rows;

      const invoiceList = rows.map(row => String(row.c[0]?.v));

      if (invoiceList.includes(String(invoiceValue))) {
        window.location.href = `status-pesanan.html?inv=${invoiceValue}`;
      } else {
        showAlert("Tidak ditemukan", "Invoice tidak ditemukan");
      }

    } catch (err) {
      console.error(err);
      showAlert("Error", "Terjadi kesalahan mengambil data.");
    }

    // balikin tombol
    button.disabled = false;
    button.innerHTML = originalText;
  }

});


