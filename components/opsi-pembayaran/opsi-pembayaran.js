/* ==========================================
   1. AMBIL DATA PACKAGE DARI URL & HELPER
   ========================================== */
const params = new URLSearchParams(window.location.search);
const packageId = params.get("package_id");

function parseDiscount(val) {
  if (!val) return 0;

  return Number(
    String(val)
      .replace('%', '')
      .replace(',', '.')
      .trim()
  ) || 0;
}

/* ==========================================
   2. FETCH SPREADSHEET & RENDER DATA
   ========================================= */
const sheetURL = "https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL";
let paymentData = [];

fetch(sheetURL)
  .then(res => res.json())
  .then(rawData => {
    
    // 🛠️ JEMBATAN KONVERSI: Mengubah final_price menjadi discount secara otomatis
    const data = rawData.map(item => {
      const price = Number(String(item.price).replace(/[^\d]/g, "")) || 0;
      const finalPrice = Number(String(item.final_price).replace(/[^\d]/g, "")) || 0;
      let discountStr = "0";

      if (finalPrice > 0 && finalPrice < price) {
        const pct = ((price - finalPrice) / price) * 100;
        discountStr = pct.toFixed(2);
      }

      return {
        ...item,
        discount: discountStr
      };
    });

    paymentData = data;
    const row = data.find(p => p.package_id == packageId);

    if (!row) {
      alert("Paket tidak ditemukan");
      return;
    }

    document.getElementById("paket").innerText = row.title;
    
    // FIX UTAMA: Gabungkan subtitle dan duration secara dinamis dari spreadsheet
    const fullDetail = (row.subtitle && row.duration) 
      ? `${row.subtitle} • ${row.duration}` 
      : (row.subtitle || row.duration || "");

    document.getElementById("paket-detail").innerText = fullDetail;

    const price = Number(String(row.price).replace(/[^\d]/g, "")) || 0;
    const sheetFinalPrice = Number(String(row.final_price).replace(/[^\d]/g, "")) || 0;
    const discount = parseDiscount(row.discount);

    // Kunci harga agar mengambil nilai asli mutlak dari kolom final_price di sheet
    let final = sheetFinalPrice > 0 ? sheetFinalPrice : (discount > 0 ? Math.round(price - (price * discount / 100)) : price);

    const diskonEl = document.getElementById("paket-diskon");
    const hematEl = document.getElementById("paket-hemat");

    if (discount > 0) {
      const hemat = price - final;

      // SUBTOTAL (KANAN FULL)
      document.getElementById("paket-harga").innerHTML = `
        <span class="price-old">Rp ${price.toLocaleString("id-ID")}</span>
        <span class="price-final">Rp ${final.toLocaleString("id-ID")}</span>
      `;

      // DISKON ROW
      diskonEl.innerText = `-${discount}%`;

      // HEMAT ROW
      hematEl.innerText = `Rp ${hemat.toLocaleString("id-ID")}`;
    } else {
      document.getElementById("paket-harga").innerHTML = `
        <span class="price-final">Rp ${final.toLocaleString("id-ID")}</span>
      `;

      diskonEl.innerText = "-";
      hematEl.innerText = "-";
    }

    document.getElementById("paket-total").innerText = "Rp " + final.toLocaleString("id-ID");

    // SET IMAGE
    const paketImg = document.getElementById("paket-img");
    if (row.image_url) {
      paketImg.src = row.image_url;
    } else {
      paketImg.src = "https://via.placeholder.com/800x200";
    }
  });

/* ==========================================
   3. PROSES PEMBAYARAN QRIS
   ========================================== */
function bayarQris() {
  const row = paymentData.find(p => p.package_id == packageId);
  if (!row) {
    alert("Data paket tidak ditemukan");
    return;
  }

  const btn = document.getElementById("payBtn");
  btn.innerText = "Memproses";
  btn.classList.add("loading-dots");
  btn.disabled = true;

  setTimeout(() => {
    window.location.href = row.qris_url;
  }, 700);
}

/* ==========================================
   4. INVENTARIS FORM & VALIDASI
   ========================================== */
const namaInput = document.getElementById("nama");
const telInput = document.getElementById("telepon");
const gmailInput = document.getElementById("gmail");
const payBtn = document.getElementById("payBtn");

// AUTO CAPITALIZE NAMA
if (namaInput) {
  namaInput.addEventListener("input", () => {
    let val = namaInput.value;

    val = val
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .replace(/\b\w/g, c => c.toUpperCase());

    namaInput.value = val;
  });
}

// FUNGSI CEK FORM DATA
function cekForm() {
  const email = gmailInput.value.trim();
  
  if (
    namaInput.value.trim() !== "" &&
    telInput.value.trim() !== "" &&
    email !== "" &&
    email.endsWith("@gmail.com")
  ) {
    payBtn.disabled = false;
  } else {
    payBtn.disabled = true;
  }
}

// VALIDASI EMAIL GMAIL (BORDER & BUTTON STATE)
function validEmail() {
  const email = gmailInput.value.trim();
  
  if (email !== "" && !email.endsWith("@gmail.com")) {
    gmailInput.style.border = "1px solid #ef4444";
    payBtn.disabled = true;
  } else {
    gmailInput.style.border = "";
    cekForm();
  }
}

// EVENT LISTENERS FORM VALIDASI
namaInput.addEventListener("input", cekForm);
telInput.addEventListener("input", cekForm);
gmailInput.addEventListener("input", cekForm);
gmailInput.addEventListener("input", validEmail);

// AUTO FORMAT NOMOR HP (08 → +628)
telInput.addEventListener("blur", () => {
  let val = telInput.value.trim();
  if (val.startsWith("08")) {
    telInput.value = "+628" + val.substring(2);
  }
});

/* ==========================================
   5. LANJUT PEMBAYARAN KE LOCALSTORAGE
   ========================================== */
function handlePayment() {
  const data = {
    nama: namaInput.value,
    telepon: telInput.value,
    email: gmailInput.value,
    paket: document.getElementById("paket").innerText,
    paketDetail: document.getElementById("paket-detail").innerText,
    total: document.getElementById("paket-total").innerText,
    paketHarga: document.getElementById("paket-harga").innerHTML,
    diskon: document.getElementById("paket-diskon").innerText,
    hemat: document.getElementById("paket-hemat").innerText,
    image: document.getElementById("paket-img").src
  };

  localStorage.setItem("paymentData", JSON.stringify(data));
  window.location.href = "pembayaran-qr.html";
}
