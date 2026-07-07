let rawInvoice = "";

window.onload = async function(){

    // STEP 1
    loadFromLocalStorage();

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

renderStatus(localData.status || "pending");

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

try{

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

const processStatus =
(statusRow?.proses || "")
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
parseFloat(
    detail.discount
    .replace("%","")
    .replace(",",".")
);

const potongan =
harga * diskon / 100;

// Total dibulatkan ke bawah
const total =
Math.floor(harga - potongan);

// Hemat dihitung dari selisih harga asli dan total
const hemat =
harga - total;

const hargaHtml = `
<div class="price-old">${rp(harga)}</div>
<div class="price-final">${rp(total)}</div>
`;

renderProduct(
    detail.image_url,
    detail.title,
    detail.subtitle,
    hargaHtml,
      "-" + detail.discount,
    rp(hemat),
    rp(total)
);

// =======================
// RENDER STATUS
// =======================

renderStatus(
    paymentStatus,
    processStatus
);
    
// =======================
// RENDER INVOICE
// =======================

const waktu = new Date().toLocaleString("id-ID",{
    day:"numeric",
    month:"long",
    year:"numeric",
    hour:"2-digit",
    minute:"2-digit",
    second:"2-digit",
    hour12:false
})
.replace(",", "")
.replace("pukul", "")
.trim();

renderInvoice(
    found.invoice,
    waktu
);

return;

}catch(err){

        alert(err.message);
        console.error(err);

    }

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


function renderStatus(
    status,
    proses
){
    
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

const ui = getStatusElements();


// =======================
// AKTIFKAN TEMA CSS
// =======================

ui.invoiceBox.classList.remove("status-success");
ui.statusBox.classList.remove("status-success");

ui.invoiceBox.classList.add("status-pending");
ui.statusBox.classList.add("status-pending");

updateProgress("pending");

// =======================
// STATUS PENDING
// =======================
  
ui.statusBadgeText.innerText =
"Menunggu Pembayaran";
ui.statusTitle.innerText =
"Menunggu Pembayaran";
ui.statusDescription.innerText =
"Silakan lakukan pembayaran sesuai nominal yang tertera pada invoice.";
ui.statusTipText.innerHTML =
"Pastikan nominal pembayaran sesuai agar proses verifikasi oleh admin berjalan lebih cepat.";
ui.statusBadgeIcon.className =
"fa-solid fa-stopwatch";
ui.statusIconFa.className =
"fa-solid fa-hourglass-half";

document
.getElementById("statusSectionIcon")
.className =
"section-icon icon-gold";

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
function setSuccessUI(proses);{

const ui = getStatusElements();


// =======================
// AKTIFKAN TEMA CSS
// =======================

ui.invoiceBox.classList.remove("status-pending");
ui.statusBox.classList.remove("status-pending");

ui.invoiceBox.classList.add("status-success");
ui.statusBox.classList.add("status-success");
  
updateProgress(
    "success",
    proses
);

// =======================
// STATUS SUCCESS
// =======================
  
ui.statusBadgeText.innerText =
"Pembayaran Berhasil";
ui.statusTitle.innerText =
"Pembayaran Berhasil";
ui.statusDescription.innerText =
"Pembayaran telah diterima dan berhasil diverifikasi oleh admin.";
ui.statusTipText.innerHTML =
"Pesanan sedang diproses oleh admin. Terima kasih telah melakukan pembayaran.";
ui.statusBadgeIcon.className =
"fa-solid fa-check";
ui.statusIconFa.className =
"fa-solid fa-check";

document
.getElementById("statusSectionIcon")
.className =
"section-icon icon-green";

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

// =============================
// UPDATE PROGRESS
// =============================
function updateProgress(
    status,
    proses
){

if(status==="pending"){

// =======================
// STEP PENDING
// =======================

document.getElementById("stepOrder")
.className =
"progress-item completed";

document.getElementById("stepPayment")
.className =
"progress-item current";

document.getElementById("stepVerification")
.className =
"progress-item";

document.getElementById("stepProcess")
.className =
"progress-item";

}else if(status==="success"){

// =======================
// STEP SUCCESS
// =======================

document.getElementById("stepOrder")
.className =
"progress-item completed";

document.getElementById("stepPayment")
.className =
"progress-item completed";

document.getElementById("stepVerification")
.className =
"progress-item completed";

document.getElementById("stepProcess")
.className =
"progress-item current";

// STEP 1
document.querySelector("#stepOrder i").className =
"fa-solid fa-check";

// STEP 2
document.querySelector("#stepPayment i").className =
"fa-solid fa-check";

document.querySelector("#stepPayment .floating-icon")
.className =
"floating-icon icon-purple";

// STEP 3
document.querySelector("#stepVerification i").className =
"fa-solid fa-check";

document.querySelector("#stepVerification .floating-icon")
.className =
"floating-icon icon-purple";

// STEP 4
document.querySelector("#stepProcess i").className =
"fa-solid fa-box-open";

document.querySelector("#stepProcess .floating-icon")
.className =
"floating-icon icon-green";

document.getElementById("stepProcess")
.className =
"progress-item completed";

document
.querySelector("#stepProcess i")
.className =
"fa-solid fa-check";

document
.querySelector("#stepProcess .floating-icon")
.className =
"floating-icon icon-purple";
    
}


else if(status==="expired"){

// TODO

}else if(status==="cancel"){

// TODO

}else if(status==="refund"){

// TODO

}
  
}

// =============================
// WA ADMIN
// =============================
function chatAdmin(){

// ambil dari tampilan
const invoice = rawInvoice;
const nama = document.getElementById("nama").innerText
const wa = document.getElementById("wa").innerText
const email = document.getElementById("email").innerText

const paket = document.getElementById("paket").innerText
const detail = document.getElementById("paketDetail").innerText
const total = document.getElementById("total").innerText

  
// =============================
// FORMAT PESAN
// =============================
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



function copyInvoice(){
navigator.clipboard.writeText(rawInvoice);
showCopyToast();
}


function showCopyToast(){

const toast =
document.getElementById("copyToast");
toast.classList.add("show");

setTimeout(()=>{
toast.classList.remove("show");
},2000);
}

