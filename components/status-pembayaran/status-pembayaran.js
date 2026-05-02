document.addEventListener("DOMContentLoaded", async function(){

// =============================
// 🔥 PRIORITAS: AMBIL DARI LOCAL STORAGE
// =============================


if(false && localData){


// =============================
// FALLBACK: AMBIL DARI SHEET
// =============================
const params = new URLSearchParams(window.location.search)
const invoiceID = params.get("invoice")

if(!invoiceID){
alert("Invoice tidak ditemukan ❌")
return
}

const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id")
const data = await res.json()

const found = data.find(x => x.invoice == invoiceID)

if(!found){
alert("Invoice tidak ditemukan ❌")
return
}

const status = found.status

// split customer
const info = found.informasi_pelanggan.split("|")

document.getElementById("invoice").innerText = found.invoice
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

const invoiceBox = document.getElementById("invoiceBox")
const statusText = document.getElementById("statusText")
const statusBox = document.querySelector(".status-box")

if(status === "pending"){

  invoiceBox.style.background = "#fef9c3"
  invoiceBox.style.border = "1px solid #fde047"

  statusBox.style.background = "#fef9c3"
  statusBox.style.border = "1px solid #fde047"

  statusText.innerText = "Konfirmasi Pembayaran"
  statusText.style.color = "#ca8a04"

  statusBox.innerHTML = `
  <div class="status-title" style="color:#ca8a04;">
    Konfirmasi Pembayaran
  </div>
  <div>
    Silahkan konfirmasi pembayaran sebesar <b>${rp(total)}</b>
  </div>
  `

}else{

  invoiceBox.style.background = "#dcfce7"
  invoiceBox.style.border = "1px solid #86efac"

  statusText.innerText = "Pembayaran Berhasil"
  statusText.style.color = "#16a34a"

  statusBox.innerHTML = `
  <div class="status-title">✅ Sudah Dibayarkan</div>
  <div>Pembayaran telah diterima sebesar <b>${rp(total)}</b></div>
  `
}

 setInterval(() => {
  location.reload()
}, 5000)
  
}) 

function chatAdmin(){

// ambil dari tampilan
const invoice = document.getElementById("invoice").innerText
const nama = document.getElementById("nama").innerText
const wa = document.getElementById("wa").innerText
const email = document.getElementById("email").innerText

const paket = document.getElementById("paket").innerText
const detail = document.getElementById("paketDetail").innerText
const total = document.getElementById("total").innerText

// format pesan
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
