/* ============================================================
   CONFIG & CORE HELPERS (KONFIGURASI UTAMA)
   ============================================================ */
const ADMIN_NUMBER = "6285881500868";

/**
 * Fungsi pembantu untuk membuka WhatsApp
 * - Buka aplikasi WhatsApp langsung jika di HP
 * - Buka WhatsApp Web di tab baru jika di PC / Laptop
 * @param {string} message - Teks pesan yang akan dikirim
 */
function openWhatsApp(message) {
  const encodedMessage = encodeURIComponent(message);
  
  // Deteksi apakah user membuka dari HP (Mobile)
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  if (isMobile) {
    // Gunakan protokol whatsapp:// agar HP langsung membuka APLIKASI WhatsApp
    window.location.href = `whatsapp://send?phone=${ADMIN_NUMBER}&text=${encodedMessage}`;
  } else {
    // Jika di Laptop/Desktop, buka WhatsApp Web di tab baru
    window.open(`https://wa.me/${ADMIN_NUMBER}?text=${encodedMessage}`, "_blank");
  }
}

/* ============================================================
   FUNGSI 1: CHAT KENDALA / TRANSAKSI UMUM (BERDASARKAN DATA OBJECT)
   ============================================================ */
function chatAdminTransaksi(data) {
  const packageStatus = data.packageActive ? "Aktif ✅" : "Tidak Aktif ❌";
  const warrantyStatus = data.warrantyActive ? "Aktif ✅" : "Tidak Aktif ❌";

  let messageText = "";

  if (data.packageActive && data.warrantyActive) {
    messageText = "Halo admin, paket saya sedang mengalami kendala, bisa tolong bantu saya?";
  } else if (data.packageActive && !data.warrantyActive) {
    messageText = "Halo admin, paket saya sedang mengalami kendala, apakah masih dalam cakupan garansi?";
  } else {
    messageText = "Halo admin, Saya ingin memesan paket yang sama, bisa tolong bantu saya?";
  }

  const message = `🙌 Halo admin, saya ingin meminta bantuan.

👤 Data Pembeli

✨ Nama : ${data.buyerName}
📱 Nomor : ${data.buyerPhone}

📝 Detail Pesanan

📌 INV : ${data.invoice}
📌 Produk : ${data.product}
📌 Paket : ${data.package}
📌 Aktivasi : ${data.activatedDate}
📌 Paket Berakhir : ${data.packageExpired}
📌 Garansi Berakhir : ${data.warrantyExpired}

📊 Status

Paket : ${packageStatus}
Garansi : ${warrantyStatus}

💬 Pesan

${messageText}`;

  console.log(message);
  openWhatsApp(message);
}

/* ============================================================
   FUNGSI 2: CHAT KONFIRMASI PEMBAYARAN QRIS
   ============================================================ */
function chatAdmin() {
  // Ambil data langsung dari LocalStorage (Bisa untuk status Pending)
  const localData = JSON.parse(localStorage.getItem("paymentData")) || {};
  const packageId = window.rawPackageId || localData.packageId || localData.package_id || "-";

  // Ambil data dari DOM (dengan proteksi null safe)
  const invoice = window.rawInvoice || (document.getElementById("invoice") ? document.getElementById("invoice").innerText.replace("INV", "") : "");
  const nama = document.getElementById("nama") ? document.getElementById("nama").innerText : "";
  const wa = document.getElementById("wa") ? document.getElementById("wa").innerText : "";
  const email = document.getElementById("email") ? document.getElementById("email").innerText : "";
  const paket = document.getElementById("paket") ? document.getElementById("paket").innerText : "";
  const detail = document.getElementById("paketDetail") ? document.getElementById("paketDetail").innerText : "";
  const total = document.getElementById("total") ? document.getElementById("total").innerText : "";

  // Format Pesan Pembayaran
  const pesan = `Halo Admin, saya sudah melakukan pembayaran.

📌 Detail Pembayaran:
Invoice: ${invoice}
Nama: ${nama}
No WA: ${wa}
Email: ${email}

📦 Paket: ${paket}
🗃️ ID Paket: ${packageId}
📝 Detail: ${detail}
💰 Total: ${total}

📸 Bukti pembayaran: (saya lampirkan screenshot)

Mohon dicek ya 🙏`;

  openWhatsApp(pesan);
}

/* ============================================================
   FUNGSI 3: CHAT GENERAL / FOOTER
   ============================================================ */
function chatAdminGeneral() {
  const message = "Halo admin, saya ingin melihat semua produk aplikasi premium";
  openWhatsApp(message);
}

/* ============================================================
   EXPORT GLOBAL (Agar bisa dipanggil dari HTML / Footer)
   ============================================================ */
window.chatAdminGeneral = chatAdminGeneral;
window.chatAdmin = chatAdmin;
window.chatAdminTransaksi = chatAdminTransaksi;
