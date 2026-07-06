window.onload = async function(){

// =======================
// CUSTOMER
// =======================

const customer = getCustomerData();

renderCustomer(customer);
  

// =======================
// CUSTOMER
// =======================

function getCustomerData(){

const customer =
JSON.parse(localStorage.getItem("paymentData"));

if(!customer){

alert("Data tidak ditemukan, kembali ke halaman sebelumnya");

window.location.href = "opsi-pembayaran.html";

}

return customer;

}

function renderCustomer(customer){

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


// =======================
// QR
// =======================

async function loadQRCode(){

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

});
}
  
// =======================
// QR
// =======================

await loadQRCode();

}


// =======================
// EVENT
// =======================

function cekStatus(){

const invoice = getInvoice();

redirectStatus(invoice);

}


// =======================
// INVOICE
// =======================

function getInvoice(){

let invoice =
localStorage.getItem("invoiceID");

if(!invoice){

invoice = generateInvoice();

localStorage.setItem("invoiceID", invoice);

}

return invoice;
  
}

function generateInvoice(){

const now = new Date();

const year = now.getFullYear();

const random =
Math.floor(10000 + Math.random() * 90000);

const jam =
String(now.getHours()).padStart(2,"0");

const menit =
String(now.getMinutes()).padStart(2,"0");

const detik =
String(now.getSeconds()).padStart(2,"0");

return `${year}${random}${jam}${menit}${detik}`;

}

function redirectStatus(invoice){

window.location.href =
"status-pembayaran.html?invoice=" + invoice;

}


// =======================
// NAVIGATION
// =======================

function kembaliProduk(){

window.location.href = "preview-index.html";
  
}


// =======================
// QR MODAL
// =======================

function openQR(){

}

function closeQR(){

}
