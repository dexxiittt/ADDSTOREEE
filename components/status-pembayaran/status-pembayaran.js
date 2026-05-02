document.addEventListener("DOMContentLoaded", async function(){

// =============================
// 🔥 PRIORITAS: AMBIL DARI LOCAL STORAGE
// =============================
const localData = JSON.parse(localStorage.getItem("paymentData"))

if(localData){

const status = localStorage.getItem("paymentStatus") || "pending"

// CUSTOMER
document.getElementById("nama").innerText = localData.nama
document.getElementById("wa").innerText = localData.telepon
document.getElementById("email").innerText = localData.email

// PRODUK
document.getElementById("paket").innerText = localData.paket
document.getElementById("paketDetail").innerText = localData.paketDetail

// GAMBAR PRODUK 
const img = document.getElementById("productImage")

if(img){
  if(localData.image){
    img.src = localData.image
  }else{
    document.getElementById("productImageBox").style.display = "none"
  }
}
  
// HARGA
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
const statusText = document.getElementById("statusText")
const statusBox = document.querySelector(".status-box")

if(status === "pending"){

// warna kuning
invoiceBox.style.background = "#fef9c3"
invoiceBox.style.border = "1px solid #fde047"

statusBox.style.background = "#fef9c3"
statusBox.style.border = "1px solid #fde047"

// teks
statusText.innerHTML = `
<span style="display:flex; align-items:center; gap:8px;">

  <!-- BOX PUTIH -->
  <span style="
    background:white;
    padding:6px;
    border-radius:6px;
    display:flex;
    align-items:center;
    justify-content:center;
  ">

    <svg xmlns="http://www.w3.org/2000/svg" 
         width="16" height="16" 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="#7c3aed" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round">

      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v5l3 2"></path>

    </svg>

  </span>

  <span>Konfirmasi Pembayaran</span>
</span>
`
statusText.style.color = "#ca8a04"

// box bawah
statusBox.innerHTML = `
<div class="status-title" style="color:#ca8a04; display:flex; align-items:center; gap:10px;">

  <!-- BOX PUTIH ICON -->
  <span style="
    background:white;
    padding:6px;
    border-radius:6px;
    display:flex;
    align-items:center;
    justify-content:center;
  ">

    <svg xmlns="http://www.w3.org/2000/svg" 
         width="16" height="16" 
         viewBox="0 0 24 24" 
         fill="none" 
         stroke="#ca8a04" 
         stroke-width="2" 
         stroke-linecap="round" 
         stroke-linejoin="round">

      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
      <path d="M10.29 3.86l-7.34 12.73A2 2 0 0 0 4.63 20h14.74a2 2 0 0 0 1.68-3.41L13.71 3.86a2 2 0 0 0-3.42 0z"></path>

    </svg>

  </span>

  <span>Konfirmasi Pembayaran</span>

</div>

<div style="margin-left:2px;">
  Konfirmasi pembayaran sebesar <b>${localData.total}</b>
</div>
`

}else{

  // hijau (default)
invoiceBox.style.background = "#dcfce7"
invoiceBox.style.border = "1px solid #86efac"

statusText.innerText = "Pembayaran Berhasil"
statusText.style.color = "#16a34a"

statusBox.innerHTML = `
<div class="status-title">✅ Sudah Dibayarkan</div>
<div>Pembayaran telah diterima sebesar <b>${localData.total}</b></div>
`

}

// INVOICE & TIME
let invoice = localStorage.getItem("invoiceID")

document.getElementById("invoice").innerText = invoice
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
return // STOP di sini
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

const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id")
const data = await res.json()

const found = data.find(x => x.invoice == invoiceID)

if(!found){
alert("Invoice tidak ditemukan ❌")
return
}

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
