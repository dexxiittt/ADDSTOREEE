// Fungsi untuk menampilkan Custom Alert
function showAlert(title, message) {
  document.getElementById("alertTitle").innerText = title;
  document.getElementById("alertMessage").innerText = message;
  document.getElementById("customAlert").classList.add("active");
}

// Fungsi untuk menutup Custom Alert
function closeAlert() {
  document.getElementById("customAlert").classList.remove("active");
}

document.addEventListener("DOMContentLoaded", function () {
  const input = document.querySelector(".invoice-input-wrap input");
  const button = document.querySelector(".invoice-input-wrap button");

  button.addEventListener("click", checkPaymentStatus);

  // Memicu pengecekan saat tombol Enter ditekan
  input.addEventListener("keypress", function (e) {
    if (e.key === "Enter") {
      checkPaymentStatus();
    }
  });

  async function checkPaymentStatus() {
    const invoiceValue = input.value.trim();

    if (!invoiceValue) {
      showAlert("Oops", "Masukkan nomor invoice terlebih dahulu.");
      return;
    }

    // Bersihkan prefix "INV" (jika user menuliskan contoh: INV202607212325339)
    const cleanInvoiceID = invoiceValue.replace(/^INV/i, "").trim();

    // Set status tombol ke loading
    button.disabled = true;
    const originalText = button.innerHTML;
    button.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';

    try {
      // Fetch bersamaan dari endpoint status_payment dan payment_id
      const [statusRes, paymentRes] = await Promise.all([
        fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment"),
        fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id")
      ]);

      const statusData = await statusRes.json();
      const paymentData = await paymentRes.json();

      // Cari baris data berdasarkan invoice
      const statusRow = statusData.find(
        x => String(x.invoice).replace(/^INV/i, "").trim() === cleanInvoiceID
      );

      const paymentRow = paymentData.find(
        x => String(x.invoice).replace(/^INV/i, "").trim() === cleanInvoiceID
      );

      // Ambil nilai kolom 'status' dan 'proses'
      const statusVal = (statusRow?.status || paymentRow?.status || "").trim().toLowerCase();
      const prosesVal = (statusRow?.proses || paymentRow?.proses || "").trim().toLowerCase();

      /* 
        SYARAT VALIDASI:
        1. Invoice harus ada di sheet status_payment dan payment_id.
        2. Kolom 'proses' HARUS sudah diisi 'done'.
        3. Kolom 'status' HARUS bernilai 'success'.
      */
      if (paymentRow && statusRow && prosesVal === "done" && statusVal === "success") {
        // Jika semua syarat terpenuhi, arahkan ke status-pembayaran.html
        window.location.href = `status-pembayaran.html?invoice=${cleanInvoiceID}`;
      } else if (!paymentRow && !statusRow) {
        // Jika invoice tidak terdaftar di spreadsheet
        showAlert("Tidak Ditemukan", "Invoice tidak ditemukan dalam sistem.");
      } else {
        // Jika invoice ada, tetapi kolom 'proses' belum diisi 'done' atau status belum 'success'
        showAlert(
          "Tidak Ditemukan",
          "Data invoice tidak ditemukan atau status pembayaran belum selesai diproses (kolom 'proses' belum done)."
        );
      }
    } catch (err) {
      console.error("Gagal memeriksa status pembayaran:", err);
      showAlert("Error", "Terjadi kesalahan saat mengambil data. Silakan coba lagi.");
    } finally {
      // Kembalikan tombol ke kondisi semula
      button.disabled = false;
      button.innerHTML = originalText;
    }
  }
});
