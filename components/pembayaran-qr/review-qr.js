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

function cekStatus(){

// =======================
// INVOICE
// =======================

const invoice = getInvoice();


// =======================
// REDIRECT
// =======================

redirectStatus(invoice);

}
