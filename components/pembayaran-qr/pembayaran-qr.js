window.onload = async function() {

  // Jalankan validasi invoice terlebih dahulu sebelum merender data
  // (Memanggil fungsi validateAndPrepareInvoice yang ada di bawah)
  await validateAndPrepareInvoice();

  // ==========================================
  // 1. CUSTOMER DATA & RENDERING
  // ==========================================
  const customer = getCustomerData();
  renderCustomer(customer);

  function getCustomerData() {
    const customer = JSON.parse(localStorage.getItem("paymentData"));

    if (!customer) {
      alert("Data tidak ditemukan, kembali ke halaman sebelumnya");
      window.location.href = "opsi-pembayaran.html";
    }
    return customer;
  }

  function renderCustomer(customer) {
    document.getElementById("nama").innerText = customer.nama;
    document.getElementById("telepon").innerText = customer.telepon;
    document.getElementById("email").innerText = customer.email;
    document.getElementById("paket").innerText = customer.paket;
    document.getElementById("paketDetail").innerText = customer.paketDetail;
    document.getElementById("total").innerText = customer.total;
    document.getElementById("paket-harga").innerHTML = customer.paketHarga;
    document.getElementById("paket-diskon").innerText = customer.diskon;
    document.getElementById("paket-hemat").innerText = customer.hemat;
    document.getElementById("paket-img").src = customer.image;
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
// 3. INVOICE & STATUS CHECK
// ==========================================
function cekStatus() {
  const invoice = getInvoice();
  redirectStatus(invoice);
}

// 1. UPDATE DI FUNGSI GET INVOICE
function getInvoice() {
  let invoice = localStorage.getItem("invoiceID");

  if (!invoice) {
    invoice = generateInvoice();
    localStorage.setItem("invoiceID", invoice);
    // SIMPAN WAKTU PEMBUATAN (Timestamp Milidetik)
    localStorage.setItem("invoiceCreatedAt", new Date().getTime());
  }
  return invoice;
}

// 2. UPDATE DI FUNGSI VALIDASI (JIKA SUDAH SUCCESS -> BUAT BARU)
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
        // UPDATE WAKTU PEMBUATAN UNTUK INVOICE BARU
        localStorage.setItem("invoiceCreatedAt", new Date().getTime());
        console.log(`[System] Invoice lama ${invoice} sudah SUCCESS. Berhasil membuat invoice baru: ${newInvoice}`);
      }
    } catch (err) {
      console.error("Gagal memverifikasi status invoice lama:", err);
    }
  } else {
    // Jika belum ada invoice sama sekali, buat baru dan pasang timestamp awal
    const newInvoice = generateInvoice();
    localStorage.setItem("invoiceID", newInvoice);
    localStorage.setItem("invoiceCreatedAt", new Date().getTime()); 
  }
}

function generateInvoice() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0"); // Bulan (01-12)
  const date = String(now.getDate()).padStart(2, "0");      // Tanggal (01-31)
  const jam = String(now.getHours()).padStart(2, "0");
  const menit = String(now.getMinutes()).padStart(2, "0");
  const random = Math.floor(100 + Math.random() * 900);     // 3 digit acak

  // Hasil susunan: YYYYMMDDHHMMRND (Pas 15 Digit. Contoh: 202607170921123)
  return `${year}${month}${date}${jam}${menit}${random}`;
}

function redirectStatus(invoice) {
  window.location.href = "status-pembayaran.html?invoice=" + invoice;
}

// ==========================================
// 4. NAVIGATION
// ==========================================
function kembaliProduk() {
  window.location.href = "preview-index.html";
}

// ==========================================
// 5. QR MODAL INTERACTION
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
