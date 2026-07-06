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

renderCustomer(
    localData.nama,
    localData.telepon,
    localData.email
);
    
// =======================
// PRODUK
// =======================

// ambil semua harga Rp xxx
const matches =
localData.paketHarga.match(/Rp\s?[\d\.]+/g);

// ambil harga pertama (harga lama)
const hargaLama =
matches ? matches[0].replace("Rp ", "") : "0";

const hargaHtml = `
<div class="price-old">Rp ${hargaLama}</div>
<div class="price-final">${localData.total}</div>
`;

renderProduct(
    localData.image,
    localData.paket,
    localData.paketDetail,
    hargaHtml,
    localData.diskon,
    localData.hemat,
    localData.total
);

// =======================
// STATUS
// =======================

const status =
localStorage.getItem("paymentStatus") ||
"pending";

renderStatus(status);

// =======================
// INVOICE & TIME
// =======================

const invoice =
localStorage.getItem("invoiceID");

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

renderInvoice(
    invoice,
    formattedTime
);

return true;

}

async function loadFromSheet(){

// =======================
// AMBIL INVOICE DARI URL
// =======================

const params =
new URLSearchParams(window.location.search);

const invoiceID =
params.get("invoice");

if(!invoiceID){

    alert("Invoice tidak ditemukan ❌");

    return;

}

// =======================
// FETCH PAYMENT_ID
// =======================

const res =
await fetch(
"https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/payment_id"
);

const data =
await res.json();

// =======================
// CARI INVOICE
// =======================

const found =
data.find(x => x.invoice == invoiceID);

if(!found){

    alert("Invoice tidak ditemukan ❌");

    return;

}

// =======================
// FETCH STATUS_PAYMENT
// =======================

const statusRes =
await fetch(
"https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/status_payment"
);

const statusData =
await statusRes.json();

// =======================
// CARI STATUS INVOICE
// =======================

const statusRow =
statusData.find(
    x => x.invoice == found.invoice
);

const paymentStatus =
(statusRow?.status || "")
.trim()
.toLowerCase();

// =======================
// SPLIT CUSTOMER
// =======================

const info =
found.informasi_pelanggan.split("|");

rawInvoice =
found.invoice;

// =======================
// FETCH PACKAGE_DETAIL
// =======================

const resProduk =
await fetch(
"https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/PACKAGE_DETAIL"
);

const produk =
await resProduk.json();

// =======================
// CARI PRODUK
// =======================

const detail =
produk.find(
    p => p.package_id == found.package_id
);

// =======================
// RENDER CUSTOMER
// =======================

renderCustomer(
    info[0],
    info[1],
    info[2]
);

// =======================
// RENDER PRODUK
// =======================

function rp(x){
    return "Rp " + x.toLocaleString("id-ID");
}

const harga =
parseInt(detail.price);

const diskon =
parseFloat(detail.discount.replace("%",""));

const potongan =
harga * diskon / 100;

const total =
harga - potongan;

const hargaHtml =
`<s>${rp(harga)}</s>`;

renderProduct(
    detail.image_url,
    detail.title,
    detail.subtitle,
    hargaHtml,
    "-" + diskon + "%",
    rp(potongan),
    rp(total)
);

// =======================
// RENDER STATUS
// =======================

renderStatus(paymentStatus);

// =======================
// RENDER INVOICE
// =======================

renderInvoice(
    found.invoice,
    new Date().toLocaleString("id-ID")
);

return;

}

// =======================
// RENDER CUSTOMER
// =======================

function renderCustomer(nama, wa, email){

    document.getElementById("nama").innerText =
    nama;

    document.getElementById("wa").innerText =
    wa;

    document.getElementById("email").innerText =
    email;

}

// =======================
// RENDER PRODUCT
// =======================

function renderProduct(
    image,
    title,
    subtitle,
    hargaHtml,
    diskon,
    hemat,
    total
){

    // GAMBAR PRODUK
    const img =
    document.getElementById("productImage");

    if(img){

        if(image){

            img.src = image;

        }else{

            document.getElementById("productImageBox")
            .style.display = "none";

        }

    }

    // PRODUK
    document.getElementById("paket").innerText =
    title;

    document.getElementById("paketDetail").innerText =
    subtitle;

    // HARGA
    document.getElementById("harga").innerHTML =
    hargaHtml;

    document.getElementById("diskon").innerText =
    diskon;

    document.getElementById("hemat").innerText =
    hemat;

    document.getElementById("total").innerText =
    total;

    document.getElementById("total2").innerText =
    total;

    document.getElementById("total3").innerText =
    total;

}

// =======================
// RENDER STATUS
// =======================

function renderStatus(status){

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

}

// =======================
// RENDER INVOICE
// =======================

function renderInvoice(invoice, time){

    rawInvoice = invoice;

    document.getElementById("invoice").innerText =
    "INV" + invoice;

    document.getElementById("time").innerText =
    time;

}

// =======================
// STATUS ELEMENTS
// =======================

function getStatusElements(){

    return {

        invoiceBox:
        document.getElementById("invoiceBox"),

        statusBox:
        document.getElementById("statusBox"),

        statusBadgeIcon:
        document.getElementById("statusBadgeIcon"),

        statusBadgeText:
        document.getElementById("statusBadgeText"),

        statusTitle:
        document.getElementById("statusTitle"),

        statusDescription:
        document.getElementById("statusDescription"),

        statusTipText:
        document.getElementById("statusTipText"),

        statusIconFa:
        document.getElementById("statusIconFa"),

    };

}



// =============================
// PENDING UI
// =============================
function setPendingUI(){

const invoiceBox = document.getElementById("invoiceBox")
const statusBox = document.getElementById("statusBox")
const statusBadgeIcon = document.getElementById("statusBadgeIcon")
const statusBadgeText = document.getElementById("statusBadgeText")
const statusTitle = document.getElementById("statusTitle")
const statusDescription = document.getElementById("statusDescription")
const statusTipText = document.getElementById("statusTipText")
const statusIconFa = document.getElementById("statusIconFa")


// =======================
// AKTIFKAN TEMA CSS
// =======================

invoiceBox.classList.remove("status-success");
statusBox.classList.remove("status-success");

invoiceBox.classList.add("status-pending");
statusBox.classList.add("status-pending");

updateProgress("pending");

// =======================
// STATUS PENDING
// =======================
  
statusBadgeText.innerText =
"Menunggu Pembayaran";
statusTitle.innerText =
"Menunggu Pembayaran";
statusDescription.innerText =
"Silakan lakukan pembayaran sesuai nominal yang tertera pada invoice.";
statusTipText.innerHTML =
"Pastikan nominal pembayaran sesuai agar proses verifikasi oleh admin berjalan lebih cepat.";
statusBadgeIcon.className =
"fa-solid fa-stopwatch";
statusIconFa.className =
"fa-solid fa-hourglass-half";

// =======================
// BOX ADMIN
// =======================

const supportTitle =
document.getElementById("supportTitle");

const supportDescription =
document.getElementById("supportDescription");

const waButtonText =
document.getElementById("waButtonText");

const waButtonIcon =
document.getElementById("waButtonIcon");

supportTitle.innerText =
"Hubungi Admin";

supportDescription.innerHTML =
"Sudah melakukan pembayaran tetapi status masih <b>Pending</b>? Kirim bukti pembayaran ke admin agar proses verifikasi dapat segera dilakukan.";

waButtonText.innerText =
"Chat Admin Sekarang";

waButtonIcon.className =
"fa-brands fa-whatsapp";

}


// =============================
// SUCCESS UI
// =============================
function setSuccessUI(){

const invoiceBox = document.getElementById("invoiceBox")
const statusBox = document.getElementById("statusBox")
const statusBadgeIcon = document.getElementById("statusBadgeIcon")
const statusBadgeText = document.getElementById("statusBadgeText")
const statusTitle = document.getElementById("statusTitle")
const statusDescription = document.getElementById("statusDescription")
const statusTipText = document.getElementById("statusTipText")
const statusIconFa = document.getElementById("statusIconFa")


// =======================
// AKTIFKAN TEMA CSS
// =======================

invoiceBox.classList.remove("status-pending");
statusBox.classList.remove("status-pending");

invoiceBox.classList.add("status-success");
statusBox.classList.add("status-success");
  
updateProgress("success");

// =======================
// STATUS SUCCESS
// =======================
  
statusBadgeText.innerText =
"Pembayaran Berhasil";
statusTitle.innerText =
"Pembayaran Berhasil";
statusDescription.innerText =
"Pembayaran telah diterima dan berhasil diverifikasi oleh admin.";
statusTipText.innerHTML =
"Pesanan sedang diproses oleh admin. Terima kasih telah melakukan pembayaran.";
statusBadgeIcon.className =
"fa-solid fa-check";
statusIconFa.className =
"fa-solid fa-check";

// =======================
// BOX ADMIN
// =======================

const supportTitle =
document.getElementById("supportTitle");

const supportDescription =
document.getElementById("supportDescription");

const waButtonText =
document.getElementById("waButtonText");

const waButtonIcon =
document.getElementById("waButtonIcon");

supportTitle.innerText =
"Pesanan Sedang Diproses";

supportDescription.innerHTML =
"Pembayaran telah berhasil diverifikasi. Pesanan kamu sedang diproses oleh admin.";

waButtonText.innerText =
"Hubungi Admin";

waButtonIcon.className =
"fa-brands fa-whatsapp";
  
}


// =============================
// EXPIRED
// =============================
function setExpiredUI(){

}

// =============================
// CANCEL
// =============================
function setCancelUI(){

}

// =============================
// REFUND
// =============================
function setRefundUI(){

}

