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

// =======================
// CUSTOMER
// =======================

document.getElementById("nama").innerText =
localData.nama;

document.getElementById("wa").innerText =
localData.telepon;

document.getElementById("email").innerText =
localData.email;

// =======================
// PRODUK
// =======================

 document.getElementById("paket").innerText =
 localData.paket;

 document.getElementById("paketDetail").innerText =
 localData.paketDetail;

 // =======================
// GAMBAR PRODUK
// =======================
    
 const img =
document.getElementById("productImage");

if(img){

    if(localData.image){

        img.src =
        localData.image;

    }else{

        document.getElementById("productImageBox")
        .style.display = "none";

    }

}

// =======================
// HARGA
// =======================

// ambil semua harga Rp xxx
const matches =
localData.paketHarga.match(/Rp\s?[\d\.]+/g);

// ambil harga pertama (harga lama)
const hargaLama =
matches ? matches[0].replace("Rp ", "") : "0";

document.getElementById("harga").innerHTML = `
<div class="price-old">Rp ${hargaLama}</div>
<div class="price-final">${localData.total}</div>
`;

document.getElementById("diskon").innerText =
localData.diskon;

document.getElementById("hemat").innerText =
localData.hemat;

document.getElementById("total").innerText =
localData.total;

document.getElementById("total2").innerText =
localData.total;

document.getElementById("total3").innerText =
localData.total;

// =======================
// STATUS
// =======================

const status =
localStorage.getItem("paymentStatus") ||
"pending";

switch(status){

    case "success":
        setSuccessUI();
        break;

    case "expired":
        setExpiredUI();
        break;

    case "cancel":
        setCancelUI();
        break;

    case "refund":
        setRefundUI();
        break;

    default:
        setPendingUI();
        break;

}

// =======================
// INVOICE & TIME
// =======================

const invoice =
localStorage.getItem("invoiceID");

rawInvoice = invoice;

document.getElementById("invoice").innerText =
"INV" + invoice;

const now = new Date();

const formattedTime = now.toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
})
.replace(",", "")
.replace("pukul", "")
.trim();

document.getElementById("time").innerText =
formattedTime;

return true;

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
