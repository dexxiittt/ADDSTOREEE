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
