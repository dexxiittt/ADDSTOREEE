const ADMIN_NUMBER = "6285881500868";

function openWhatsApp(message){

window.open(

`https://wa.me/${ADMIN_NUMBER}?text=${encodeURIComponent(message)}`,

"_blank"

);

}

function chatAdminTransaksi(data){

console.log("Nama :", data.buyerName);

console.log("Nomor :", data.buyerPhone);

console.log("Invoice :", data.invoice);

console.log("Produk :", data.product);

console.log("Paket :", data.package);

console.log("Aktivasi :", data.activatedDate);

console.log("Paket Berakhir :", data.packageExpired);

console.log("Garansi Berakhir :", data.warrantyExpired);

console.log("Paket Aktif :", data.packageActive);

}
