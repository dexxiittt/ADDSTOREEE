window.onload = async function() {

  // Jalankan validasi invoice terlebih dahulu sebelum merender data
  await validateAndPrepareInvoice();

  // ==========================================
  // 1. CUSTOMER DATA & RENDERING
  // ==========================================
  const customer = getCustomerData();
  if (customer) {
    renderCustomer(customer);
  }

  // ==========================================
  // 2. FETCH & LOAD QR CODE
  // ==========================================
  async function loadQRCode() {
    const qrSheet = "https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/qr_id";

    fetch(qrSheet)
      .then(res => res.json())
      .then(data => {
        const qr = data[0]?.qr_code;

        if (qr) {
          document.getElementById("qr-img").src = qr;
        } else {
          document.getElementById("qr-img").src = "https://via.placeholder.com/220?text=QR+Not+Found";
        }
      })
      .catch(() => {
        document.getElementById("qr-img").src = "https://via.placeholder.com/220?text=Error";
      });
  }

  await loadQRCode();
};

// ==========================================
// HELPER CUSTOMER DATA (GLOBAL SCOPE)
// ==========================================
function getCustomerData() {
  const customer = JSON.parse(localStorage.getItem("paymentData"));

  if (!customer) {
    alert("Data tidak ditemukan, kembali ke halaman sebelumnya");
    window.location.href = "opsi-pembayaran.html";
    return null;
  }
  return customer;
}

function renderCustomer(customer) {
  document.getElementById("nama").innerText = customer.nama || "-";
  document.getElementById("telepon").innerText = customer.telepon || "-";
  document.getElementById("email").innerText = customer.email || "-";
  document.getElementById("paket").innerText = customer.paket || "-";
  document.getElementById("paketDetail").innerText = customer.paketDetail || "-";
  document.getElementById("total").innerText = customer.total || "-";
  document.getElementById("paket-harga").innerHTML = customer.paketHarga || "-";
  document.getElementById("paket-diskon").innerText = customer.diskon || "-";
  document.getElementById("paket-hemat").innerText = customer.hemat || "-";
  document.getElementById("paket-img").src = customer.image || "";
}

// ==========================================
// 3. FUNGSI UTAMA MIDTRANS PEMBAYARAN
// ==========================================
async function bayarSekarang() {
  const invoiceID = getInvoice();
  const customer = getCustomerData();

  if (!customer) return;

  // Mengubah format string total (contoh: "Rp 1.000" -> 1000)
  const amountStr = String(customer.total || "").replace(/[^0-9]/g, '');
  const amount = parseInt(amountStr, 10) || 1000;

  try {
 
    // KODE BARU (Diberi akhiran timestamp unik)
const uniqueOrderId = `${invoiceID}-${Date.now().toString().slice(-4)}`;

const response = await fetch('https://midtrans-backend-xi.vercel.app/api', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: uniqueOrderId, // <--- Dijamin selalu unik di mata Midtrans
    amount: amount
  })
});
    
    const data = await response.json();

    // Jika token berhasil didapat dari Vercel, buka Pop-up Snap Midtrans
    if (data.token) {
      window.snap.pay(data.token, {
        onSuccess: function(result) {
          alert("Pembayaran Berhasil!");
          window.location.href = "status-pembayaran.html?invoice=" + invoiceID;
        },
        onPending: function(result) {
          alert("Menunggu pembayaran... Silakan selesaikan transaksi Anda.");
          window.location.href = "status-pembayaran.html?invoice=" + invoiceID;
        },
        onError: function(result) {
          alert("Pembayaran gagal! Silakan coba beberapa saat lagi.");
        },
        onClose: function() {
          console.log("User menutup halaman pembayaran tanpa menyelesaikan transaksi.");
        }
      });
    } else {
      alert("Gagal mendapatkan token pembayaran dari server.");
      console.error("Response error dari Vercel:", data);
    }
  } catch (error) {
    console.error("Error panggil Vercel:", error);
    alert("Gagal terhubung ke server pembayaran Vercel.");
  }
}

// ==========================================
// 4. INVOICE & STATUS CHECK
// ==========================================
function cekStatus() {
  const invoice = getInvoice();
  redirectStatus(invoice);
}

function getInvoice() {
  let invoice = localStorage.getItem("invoiceID");

  if (!invoice) {
    invoice = generateInvoice();
    localStorage.setItem("invoiceID", invoice);
    localStorage.setItem("invoiceCreatedAt", new Date().getTime());
  }
  return invoice;
}

async function validateAndPrepareInvoice() {
  let invoice = localStorage.getItem("invoiceID");
  if (invoice) {
    try {
      const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment");
      const data = await res.json();
      
      const statusRow = data.find(x => String(x.invoice).trim() === String(invoice).trim());
      const status = (statusRow?.status || "").trim().toLowerCase();

      if (status === "success") {
        const newInvoice = generateInvoice();
        localStorage.setItem("invoiceID", newInvoice);
        localStorage.setItem("invoiceCreatedAt", new Date().getTime());
        console.log(`[System] Invoice lama ${invoice} sudah SUCCESS. Berhasil membuat invoice baru: ${newInvoice}`);
      }
    } catch (err) {
      console.error("Gagal memverifikasi status invoice lama:", err);
    }
  } else {
    const newInvoice = generateInvoice();
    localStorage.setItem("invoiceID", newInvoice);
    localStorage.setItem("invoiceCreatedAt", new Date().getTime()); 
  }
}

function generateInvoice() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const date = String(now.getDate()).padStart(2, "0");
  const jam = String(now.getHours()).padStart(2, "0");
  const menit = String(now.getMinutes()).padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);

  return `${year}${month}${date}${jam}${menit}${random}`;
}

function redirectStatus(invoice) {
  window.location.href = "status-pembayaran.html?invoice=" + invoice;
}

// ==========================================
// 5. NAVIGATION
// ==========================================
function kembaliProduk() {
  window.location.href = "preview-index.html";
}

// ==========================================
// 6. QR MODAL INTERACTION
// ==========================================
function openQR(el) {
  const modal = document.getElementById("qrModal");
  const img = document.getElementById("qrModalImg");

  img.src = el.src;
  modal.classList.add("active");
}

function closeQR() {
  document.getElementById("qrModal").classList.remove("active");
}
