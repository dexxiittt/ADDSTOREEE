let rawInvoice = "";

window.onload = async function(){

// =============================
// PRIORITAS: AMBIL DARI LOCAL STORAGE
// =============================
const localData = JSON.parse(localStorage.getItem("paymentData"))

if(localData){

const status = localStorage.getItem("paymentStatus") || "pending"

// =============================
// CUSTOMER
// =============================

document.getElementById("nama").innerText = localData.nama
document.getElementById("wa").innerText = localData.telepon
document.getElementById("email").innerText = localData.email

// =============================
// // PRODUK
// =============================

document.getElementById("paket").innerText = localData.paket
document.getElementById("paketDetail").innerText = localData.paketDetail

// =============================
// GAMBAR PRODUK 
// =============================
const img = document.getElementById("productImage")

if(img){
  if(localData.image){
    img.src = localData.image
  }else{
    document.getElementById("productImageBox").style.display = "none"
  }
}
  

  
// ambil semua harga Rp xxx
const matches = localData.paketHarga.match(/Rp\s?[\d\.]+/g)

// ambil harga pertama (harga lama)
const hargaLama = matches ? matches[0].replace("Rp ", "") : "0"

document.getElementById("harga").innerHTML = `
<div class="price-old">Rp ${hargaLama}</div>
<div class="price-final">${localData.total}</div>
`
  
document.getElementById("diskon").innerText = localData.diskon
document.getElementById("hemat").innerText = localData.hemat

document.getElementById("total").innerText = localData.total
document.getElementById("total2").innerText = localData.total
document.getElementById("total3").innerText = localData.total

const invoiceBox = document.getElementById("invoiceBox")
const statusBox = document.getElementById("statusBox")
const statusBadgeIcon = document.getElementById("statusBadgeIcon")
const statusBadgeText = document.getElementById("statusBadgeText")
const statusTitle = document.getElementById("statusTitle")
const statusDescription = document.getElementById("statusDescription")
const statusTipText = document.getElementById("statusTipText")
const statusIconFa = document.getElementById("statusIconFa")

// =============================
// TAMPILKAN STATUS
// =============================
if(status==="pending"){

setPendingUI();

}else{

setSuccessUI();

}

// =============================
// INVOICE & TIME
// =============================

let invoice = localStorage.getItem("invoiceID")
  
rawInvoice = invoice
  
document.getElementById("invoice").innerText = "INV" + invoice
const now = new Date()

const formattedTime = now.toLocaleString("id-ID", {
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false
})
.replace(",", "")       // hapus koma
.replace("pukul", "")   // hapus kata "pukul"
.trim()                 // rapihin spasi

document.getElementById("time").innerText = formattedTime
return
}

// =============================
// FALLBACK: AMBIL DARI SHEET
// =============================
const params = new URLSearchParams(window.location.search)
const invoiceID = params.get("invoice")

if(!invoiceID){
alert("Invoice tidak ditemukan ❌")
return
}

// =============================
// AMBIL INVOICE DARI URL
// ============================= 
const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id")
const data = await res.json()

const found = data.find(x => x.invoice == invoiceID)

if(!found){
alert("Invoice tidak ditemukan ❌")
return
}

// =============================
// AMBIL STATUS PEMBAYARAN
// =============================
const statusRes = await fetch(
"https://opensheet.elk.sh/SPREADSHEET_ID/status_payment"
);

const statusData = await statusRes.json();

const statusRow =
statusData.find(x => x.invoice == found.invoice);

const paymentStatus =
(statusRow?.status || "").trim().toLowerCase();

  

// split customer
const info = found.informasi_pelanggan.split("|")

rawInvoice = found.invoice

document.getElementById("invoice").innerText =
"INV" + found.invoice
document.getElementById("nama").innerText = info[0]
document.getElementById("wa").innerText = info[1]
document.getElementById("email").innerText = info[2]

document.getElementById("time").innerText = new Date().toLocaleString("id-ID")

const resProduk = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL")
const produk = await resProduk.json()

const detail = produk.find(p => p.package_id == found.package_id)

// GAMBAR DARI SHEET (fallback)
if(detail.image_url){
document.getElementById("productImage").src = detail.image_url
}

  const harga = parseInt(detail.price)
const diskon = parseFloat(detail.discount.replace("%",""))
const potongan = harga * diskon / 100
const total = harga - potongan

function rp(x){
return "Rp " + x.toLocaleString("id-ID")
}

document.getElementById("paket").innerText = detail.title
document.getElementById("paketDetail").innerText = detail.subtitle

document.getElementById("harga").innerHTML = `<s>${rp(harga)}</s>`
document.getElementById("diskon").innerText = "-" + diskon + "%"
document.getElementById("hemat").innerText = rp(potongan)

document.getElementById("total").innerText = rp(total)
document.getElementById("total2").innerText = rp(total)
document.getElementById("total3").innerText = rp(total)

}


// =============================
// PENDING
// =============================
function setPendingUI(){

const invoiceBox = document.getElementById("invoiceBox")
const statusBox = document.getElementById("statusBox")
const statusBadgeIcon = document.getElementById("statusBadgeIcon")
const statusBadgeText = document.getElementById("statusBadgeText")
const statusTitle = document.getElementById("statusTitle")
const statusDescription = document.getElementById("statusDescription")
const statusTipText = document.getElementById("statusTipText")
const statusIconFa = document.getElementById("statusIconFa")


// =======================
// AKTIFKAN TEMA CSS
// =======================

invoiceBox.classList.remove("status-success");
statusBox.classList.remove("status-success");

invoiceBox.classList.add("status-pending");
statusBox.classList.add("status-pending");

// =======================
// TIMELINE PENDING
// =======================

document.getElementById("stepOrder")
.className =
"progress-item completed";

document.getElementById("stepPayment")
.className =
"progress-item current";

document.getElementById("stepVerification")
.className =
"progress-item";

document.getElementById("stepProcess")
.className =
"progress-item";

  
// =======================
// STATUS PENDING
// =======================
  
statusBadgeText.innerText =
"Menunggu Pembayaran";
statusTitle.innerText =
"Menunggu Pembayaran";
statusDescription.innerText =
"Silakan lakukan pembayaran sesuai nominal yang tertera pada invoice.";
statusTipText.innerHTML =
"Pastikan nominal pembayaran sesuai agar proses verifikasi oleh admin berjalan lebih cepat.";
statusBadgeIcon.className =
"fa-solid fa-stopwatch";
statusIconFa.className =
"fa-solid fa-hourglass-half";


// =======================
// TOMBOL ADMIN
// =======================


}


// =============================
// SUCCESS
// =============================
function setSuccessUI(){

const invoiceBox = document.getElementById("invoiceBox")
const statusBox = document.getElementById("statusBox")
const statusBadgeIcon = document.getElementById("statusBadgeIcon")
const statusBadgeText = document.getElementById("statusBadgeText")
const statusTitle = document.getElementById("statusTitle")
const statusDescription = document.getElementById("statusDescription")
const statusTipText = document.getElementById("statusTipText")
const statusIconFa = document.getElementById("statusIconFa")


// =======================
// AKTIFKAN TEMA CSS
// =======================

invoiceBox.classList.remove("status-pending");
statusBox.classList.remove("status-pending");

invoiceBox.classList.add("status-success");
statusBox.classList.add("status-success");
  
// =======================
// TIMELINE SUCCESS
// =======================

  
document.getElementById("stepOrder")
.className =
"progress-item completed";

document.getElementById("stepPayment")
.className =
"progress-item completed";

document.getElementById("stepVerification")
.className =
"progress-item completed";

document.getElementById("stepProcess")
.className =
"progress-item current";

// =======================
// STATUS SUCCESS
// =======================
  
statusBadgeText.innerText =
"Pembayaran Berhasil";
statusTitle.innerText =
"Pembayaran Berhasil";
statusDescription.innerText =
"Pembayaran telah diterima dan berhasil diverifikasi oleh admin.";
statusTipText.innerHTML =
"Pesanan sedang diproses oleh admin. Terima kasih telah melakukan pembayaran.";
statusBadgeIcon.className =
"fa-solid fa-check";
statusIconFa.className =
"fa-solid fa-check";

// =======================
// TOMBOL ADMIN
// =======================
  
}




// =============================
// WA ADMIN
// =============================
function chatAdmin(){

// ambil dari tampilan
const invoice = rawInvoice;
const nama = document.getElementById("nama").innerText
const wa = document.getElementById("wa").innerText
const email = document.getElementById("email").innerText

const paket = document.getElementById("paket").innerText
const detail = document.getElementById("paketDetail").innerText
const total = document.getElementById("total").innerText

  
// =============================
// FORMAT PESAN
// =============================
const pesan = `Halo Admin, saya sudah melakukan pembayaran QRIS.

📌 Detail Pembayaran:
Invoice: ${invoice}
Nama: ${nama}
No WA: ${wa}
Email: ${email}

📦 Paket: ${paket}
📝 Detail: ${detail}
💰 Total: ${total}

📸 Bukti pembayaran: (saya lampirkan screenshot)

Mohon dicek ya 🙏`

// kirim ke WA
const url = "https://wa.me/6285881500868?text=" + encodeURIComponent(pesan)

window.open(url, "_blank")

}



function copyInvoice(){
navigator.clipboard.writeText(rawInvoice);
showCopyToast();
}


function showCopyToast(){

const toast =
document.getElementById("copyToast");
toast.classList.add("show");

setTimeout(()=>{
toast.classList.remove("show");
},2000);
}
