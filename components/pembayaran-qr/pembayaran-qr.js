function generateInvoice(){

const now = new Date()

const year = now.getFullYear()

// random 5 digit
const random = Math.floor(10000 + Math.random() * 90000)

// tanggal & bulan
const tanggal = String(now.getDate()).padStart(2, "0")
const bulan = String(now.getMonth() + 1).padStart(2, "0")

// jam menit detik
const jam = String(now.getHours()).padStart(2, "0")
const menit = String(now.getMinutes()).padStart(2, "0")
const detik = String(now.getSeconds()).padStart(2, "0")

// ⛔ counter DIHAPUS

return `INV${year}${random}${tanggal}${bulan}${jam}${menit}${detik}`
}
  
/* ==============================
AMBIL DATA DARI HALAMAN SEBELUMNYA
============================== */

const data = JSON.parse(localStorage.getItem("paymentData"))

if(!data){
alert("Data tidak ditemukan, kembali ke halaman sebelumnya")
window.location.href = "opsi-pembayaran.html"
}

// SET DATA
document.getElementById("nama").innerText = data.nama
document.getElementById("telepon").innerText = data.telepon
document.getElementById("email").innerText = data.email

document.getElementById("paket").innerText = data.paket
document.getElementById("paketDetail").innerText = data.paketDetail
document.getElementById("total").innerText = data.total

document.getElementById("paket-harga").innerHTML = data.paketHarga
document.getElementById("paket-diskon").innerText = data.diskon
document.getElementById("paket-hemat").innerText = data.hemat

document.getElementById("paket-img").src = data.image


const qrSheet =
"https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/qr_id"

fetch(qrSheet)
.then(res => res.json())
.then(data => {

// ambil baris pertama
const qr = data[0]?.qr_code

if(qr){
document.getElementById("qr-img").src = qr
}else{
document.getElementById("qr-img").src =
"https://via.placeholder.com/220?text=QR+Not+Found"
}

})
.catch(()=>{
document.getElementById("qr-img").src =
"https://via.placeholder.com/220?text=Error"
})

function cekStatus(){

  
// 🔥 generate invoice SAAT tombol diklik
const invoice = generateInvoice()

// simpan ke localStorage
localStorage.setItem("invoiceID", invoice)

// redirect bawa invoice
window.location.href = "status-pembayaran.html?invoice=" + invoice

}
  
function kembaliProduk(){
window.location.href = "index.html"
}

function openQR(el){
const modal = document.getElementById("qrModal")
const img = document.getElementById("qrModalImg")

img.src = el.src
modal.classList.add("active")
}

function closeQR(){
document.getElementById("qrModal").classList.remove("active")
}
