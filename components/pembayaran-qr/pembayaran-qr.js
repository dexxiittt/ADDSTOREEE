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

};

// ==========================================
// HELPER CUSTOMER DATA (GLOBAL SCOPE)
// ==========================================
function getCustomerData() {
  const customer = JSON.parse(localStorage.getItem("paymentData"));

  if (!customer) {
    showAlert("Data tidak ditemukan, kembali ke halaman sebelumnya.", "Pemberitahuan", "warning", function() {
      window.location.href = "opsi-pembayaran.html";
    });
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
// 2. FUNGSI UTAMA MIDTRANS PEMBAYARAN (UPDATED)
// ==========================================
async function bayarSekarang() {
  const invoiceID = getInvoice();
  const customer = getCustomerData();

  if (!customer) return;

  // 1. AMBIL ELEMEN TOMBOL & LAKUKAN SMOOTH SCROLL KE TOMBOL
  const btnBayar = document.querySelector('.btn-midtrans');
  if (btnBayar) {
    // 💡 AUTOMATIC SMOOTH SCROLL PAS DI TENGAH TOMBOL
    btnBayar.scrollIntoView({ behavior: 'smooth', block: 'center' });

    btnBayar.disabled = true;
    btnBayar.style.opacity = '0.6';
    btnBayar.innerText = 'Memproses...';
  }

  // 2. AMBIL PACKAGE ID & SUSUN INFORMASI PELANGGAN
  const packageId = customer.packageId || customer.package_id || customer.paket || "";
  
  const customerInfo = [
    customer.nama || "",
    customer.telepon || "",
    customer.email || ""
  ].join("|");

  const amountStr = String(customer.total || "").replace(/[^0-9]/g, '');
  const amount = parseInt(amountStr, 10) || 1000;

  try {
    const uniqueOrderId = `${invoiceID}-${Date.now().toString().slice(-4)}`;

    // 3. KIRIM REQUEST LENGKAP KE BACKEND VERCEL
    const response = await fetch('https://midtrans-backend-xi.vercel.app/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: uniqueOrderId,
        amount: amount,
        packageId: packageId,
        customerInfo: customerInfo
      })
    });
    
    const data = await response.json();

    if (data.token) {
      window.snap.pay(data.token, {
        onSuccess: function(result) {
          showAlert("Pembayaran berhasil diterima!", "Berhasil 🎉", "success", function() {
            window.location.href = "status-pembayaran.html?invoice=" + invoiceID;
          });
        },
        onPending: function(result) {
          showAlert("Menunggu pembayaran... Silakan selesaikan transaksi Anda.", "Pending", "info", function() {
            window.location.href = "status-pembayaran.html?invoice=" + invoiceID;
          });
        },
        onError: function(result) {
          showAlert("Pembayaran gagal! Silakan coba beberapa saat lagi.", "Gagal", "warning");
          resetButton(btnBayar);
        },
        onClose: function() {
          console.log("User menutup halaman pembayaran.");
          resetButton(btnBayar);
        }
      });
    } else {
      showAlert("Gagal mendapatkan token pembayaran dari server.", "Error", "warning");
      resetButton(btnBayar);
    }
  } catch (error) {
    console.error("Error panggil Vercel:", error);
    showAlert("Gagal terhubung ke server pembayaran Vercel.", "Error Server", "warning");
    resetButton(btnBayar);
  }
}

// HELPER KEMBALIKAN TOMBOL KETIKA BATAL / ERROR
function resetButton(btn) {
  if (btn) {
    btn.disabled = false;
    btn.style.opacity = '1';
    btn.innerHTML = '<i class="fa-solid fa-bolt"></i> Tap untuk Pembayaran';
  }
}

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
// 4. NAVIGATION
// ==========================================
function kembaliProduk() {
  window.location.href = "preview-index.html";
}

// ==========================================
// 5. FUNGSI PREMIUM CUSTOM ALERT
// ==========================================
function showAlert(message, title = "Informasi", type = "info", callback = null) {
  const modal = document.getElementById("customAlertModal");
  const iconBox = document.getElementById("customAlertIcon");
  const iconI = document.getElementById("customAlertIconI");
  const btnOk = document.getElementById("btnAlertOk");

  if (!modal) return;

  // Update Judul & Pesan
  document.getElementById("customAlertTitle").innerText = title;
  document.getElementById("customAlertMessage").innerText = message;

  // Set Tipe & Ikon ('info', 'success', 'warning')
  iconBox.className = "custom-alert-icon " + type;
  let iconClass = "fa-circle-info";
  if (type === "success") iconClass = "fa-circle-check";
  if (type === "warning") iconClass = "fa-triangle-exclamation";
  iconI.className = "fa-solid " + iconClass;

  // Tampilkan Modal
  modal.classList.add("active");

  // Event Tombol OK
  btnOk.onclick = function() {
    modal.classList.remove("active");
    if (callback && typeof callback === "function") {
      callback();
    }
  };
}
