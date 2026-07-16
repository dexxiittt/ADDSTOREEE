const ADMIN_NUMBER = "6285881500868";

function openWhatsApp(message){

window.open(

`https://wa.me/${ADMIN_NUMBER}?text=${encodeURIComponent(message)}`,

"_blank"

);

}

function chatAdminTransaksi(data){

const packageStatus =
data.packageActive
? "Aktif ✅"
: "Tidak Aktif ❌";

const warrantyStatus =
data.warrantyActive
? "Aktif ✅"
: "Tidak Aktif ❌";

console.log("Nama :", data.buyerName);

console.log("Nomor :", data.buyerPhone);

console.log("Invoice :", data.invoice);

console.log("Produk :", data.product);

console.log("Paket :", data.package);

console.log("Aktivasi :", data.activatedDate);

console.log("Paket Berakhir :", data.packageExpired);

console.log("Garansi Berakhir :", data.warrantyExpired);

console.log("Status Paket :", packageStatus);

console.log("Status Garansi :", warrantyStatus);

}
