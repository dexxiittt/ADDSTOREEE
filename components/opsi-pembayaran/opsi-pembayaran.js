/* ==============================
AMBIL DATA PACKAGE DARI URL
============================== */

const params = new URLSearchParams(window.location.search)

const packageId = params.get("package_id")


function parseDiscount(val){
  if(!val) return 0

  return Number(
    String(val)
      .replace('%','')
      .replace(',', '.')
      .trim()
  ) || 0
}
  
/* ==============================
FETCH SPREADSHEET
============================== */

const sheetURL =
"https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL"

let paymentData = []

fetch(sheetURL)
.then(res => res.json())
.then(data => {

paymentData = data

const row = data.find(p => p.package_id == packageId)

if(!row){
alert("Paket tidak ditemukan")
return
}

// ✅ SET TEXT
document.getElementById("paket").innerText = row.title
document.getElementById("paket-detail").innerText =
"Invite Member • " + row.duration

const price = Number(row.price) || 0
const discount = parseDiscount(row.discount)

const final = discount > 0
  ? Math.round(price - (price * discount / 100))
  : price

const diskonEl = document.getElementById("paket-diskon")
const hematEl = document.getElementById("paket-hemat")

if(discount > 0){

const hemat = price - final

// SUBTOTAL (KANAN FULL)
document.getElementById("paket-harga").innerHTML = `
<span class="price-old">
Rp ${price.toLocaleString("id-ID")}
</span>

<span class="price-final">
Rp ${final.toLocaleString("id-ID")}
</span>`

  // DISKON ROW
diskonEl.innerText = `-${discount}%`

// HEMAT ROW
hematEl.innerText = `Rp ${hemat.toLocaleString("id-ID")}`

}else{

document.getElementById("paket-harga").innerHTML = `
<span class="price-final">
Rp ${final.toLocaleString("id-ID")}
</span>
`

diskonEl.innerText = "-"
hematEl.innerText = "-"
}
  
document.getElementById("paket-total").innerText =
"Rp " + final.toLocaleString("id-ID")
  
// ✅ SET IMAGE
const paketImg = document.getElementById("paket-img")

if(row.image_url){
paketImg.src = row.image_url
}else{
paketImg.src = "https://via.placeholder.com/800x200"
}

})

/* ==============================
QRIS
============================== */

function bayarQris(){
const row = paymentData.find(p => p.package_id == packageId)
if(!row){
alert("Data paket tidak ditemukan")
return
}

const btn = document.getElementById("payBtn")
btn.innerText = "Memproses"
btn.classList.add("loading-dots")
btn.disabled = true

setTimeout(()=>{
window.location.href = row.qris_url
},700)
}



/* ==============================
LYNK ID
============================== */

function bayarLynk(){
const row = paymentData.find(p => p.package_id == packageId)
if(!row){
alert("Data paket tidak ditemukan")
return
}
window.location.href = row.lynk_id
}

/* ==============================
VALIDASI FORM
============================== */

const namaInput = document.getElementById("nama")

// ==============================
// AUTO CAPITALIZE NAMA
// ==============================

if(namaInput){
  namaInput.addEventListener("input", () => {
    let val = namaInput.value

    val = val
      .toLowerCase()
      .replace(/[^a-zA-Z\s]/g, "")
      .replace(/\b\w/g, c => c.toUpperCase())

    namaInput.value = val
  })
}

  
const telInput = document.getElementById("telepon")
const gmailInput = document.getElementById("gmail")
const payBtn = document.getElementById("payBtn")

function cekForm(){
const email = gmailInput.value.trim()
if(
namaInput.value.trim() !== "" &&
telInput.value.trim() !== "" &&
email !== "" &&
email.endsWith("@gmail.com")
){
payBtn.disabled = false
}else{
payBtn.disabled = true
}
}

namaInput.addEventListener("input",cekForm)
telInput.addEventListener("input",cekForm)
gmailInput.addEventListener("input",cekForm)



/* ==============================
AUTO FORMAT NOMOR HP
08 → +628
============================== */

telInput.addEventListener("blur",()=>{
let val = telInput.value.trim()
if(val.startsWith("08")){
telInput.value = "+628" + val.substring(2)
}
})



/* ==============================
VALIDASI EMAIL GMAIL
============================== */

function validEmail(){
const email = gmailInput.value.trim()
if(email !== "" && !email.endsWith("@gmail.com")){
gmailInput.style.border = "1px solid #ef4444"
payBtn.disabled = true
}else{
gmailInput.style.border = ""
cekForm()
}
}
gmailInput.addEventListener("input",validEmail)

/* ==============================
SWITCH BUTTON
============================== */

let selectedPayment = "qris"

function setPayment(method){
selectedPayment = method

const btnQris = document.getElementById("btnQris")
const btnLynk = document.getElementById("btnLynk")
const label = document.getElementById("payment-method")
const payBtn = document.getElementById("payBtn")
const form = document.getElementById("form-input")

btnQris.classList.remove("active")
btnLynk.classList.remove("active")

if(method === "qris"){
btnQris.classList.add("active")
label.innerText = "QRIS"
payBtn.innerText = "Lanjut Pembayaran QRIS"

// warna default
payBtn.classList.remove("lynk")

form.classList.remove("hide")
form.style.display = "block"

cekForm()

}else{
btnLynk.classList.add("active")
label.innerText = "Lynk ID"
payBtn.innerText = "Lanjut Pembayaran Lynk ID"

// 🔥 WARNA HIJAU
payBtn.classList.add("lynk")

form.classList.add("hide")

setTimeout(()=>{
form.style.display = "none"
},200)

payBtn.disabled = false
}
}

function handlePayment(){

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
}

localStorage.setItem("paymentData", JSON.stringify(data))

if(selectedPayment === "qris"){
  window.location.href = "pembayaran-qr.html"
}else{
  bayarLynk()
}

}
