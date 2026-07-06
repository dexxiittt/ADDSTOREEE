window.onload = async function(){

// =======================
// CUSTOMER
// =======================

const customer = getCustomerData();

renderCustomer(customer);
  

// =======================
// QR
// =======================

await loadQRCode();

}

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

}

function generateInvoice(){

}


// =======================
// NAVIGATION
// =======================

function kembaliProduk(){

}


// =======================
// QR MODAL
// =======================

function openQR(){

}

function closeQR(){

}
