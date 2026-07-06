let rawInvoice = "";

window.onload = async function(){

// =======================
// CUSTOMER
// =======================

const customer =
await getCustomerData();



// =======================
// PRODUCT
// =======================

const product =
await getProductData(customer);



// =======================
// RENDER
// =======================

renderCustomer(customer);

renderProduct(product);

renderInvoice(customer);



// =======================
// STATUS
// =======================

const paymentStatus =
await getPaymentStatus(customer.invoice);

renderStatus(paymentStatus);

}
