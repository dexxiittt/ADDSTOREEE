window.onload = async function() {

  // ==========================================
  // 0. VALIDASI STATUS INVOICE (JIKA SUDAH SUCCESS -> BUAT BARU)
  // ==========================================
  async function validateAndPrepareInvoice() {
    let invoice = localStorage.getItem("invoiceID");
    if (invoice) {
      try {
        // Tarik data status pembayaran dari Google Sheet
        const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment");
        const data = await res.json();
        
        // Cari apakah invoice lama ini sudah berstatus "success"
        const statusRow = data.find(x => String(x.invoice).trim() === String(invoice).trim());
        const status = (statusRow?.status || "").trim().toLowerCase();

        if (status === "success") {
          // Jika sudah sukses, paksa generate invoice baru agar tidak duplikat
          const newInvoice = generateInvoice();
          localStorage.setItem("invoiceID", newInvoice);
          console.log(`[System] Invoice lama ${invoice} sudah SUCCESS. Berhasil membuat invoice baru: ${newInvoice}`);
        }
      } catch (err) {
        console.error("Gagal memverifikasi status invoice lama:", err);
      }
    } else {
      // Jika belum ada invoice di localStorage, langsung buat baru
      const newInvoice = generateInvoice();
      localStorage.setItem("invoiceID", newInvoice);
    }
  }

  // Jalankan validasi invoice terlebih dahulu sebelum merender data
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

function getInvoice() {
  let invoice = localStorage.getItem("invoiceID");

  if (!invoice) {
    invoice = generateInvoice();
    localStorage.setItem("invoiceID", invoice);
  }
  return invoice;
}

function generateInvoice() {
  const now = new Date();
  const year = now.getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  const jam = String(now.getHours()).padStart(2, "0");
  const menit = String(now.getMinutes()).padStart(2, "0");
  const detik = String(now.getSeconds()).padStart(2, "0");

  return `${year}${random}${jam}${menit}${detik}`;
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
