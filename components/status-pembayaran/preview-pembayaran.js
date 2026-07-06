let rawInvoice = "";

window.onload = async function(){

    // STEP 1
    const loaded = loadFromLocalStorage();

    if(loaded){
        return;
    }

    // STEP 2
    await loadFromSheet();

}

function loadFromLocalStorage(){

    const localData =
    JSON.parse(localStorage.getItem("paymentData"));

    if(!localData){
        return false;
    }

    // lanjut Step 1.2

}

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
