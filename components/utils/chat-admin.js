const ADMIN_NUMBER = "6285881500868";

function openWhatsApp(message){

window.open(

`https://wa.me/${ADMIN_NUMBER}?text=${encodeURIComponent(message)}`,

"_blank"

);

}

function chatAdminTransaksi(data){

console.log(data);

}
