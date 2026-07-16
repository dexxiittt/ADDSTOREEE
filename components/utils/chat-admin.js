const ADMIN_NUMBER = "6285881500868";

function openWhatsApp(message){
  window.open(
    `https://wa.me/${ADMIN_NUMBER}?text=${encodeURIComponent(message)}`,
    "_blank"
  );
}

function chatAdminTransaksi(data){
  const packageStatus = data.packageActive ? "Aktif ✅" : "Tidak Aktif ❌";
  const warrantyStatus = data.warrantyActive ? "Aktif ✅" : "Tidak Aktif ❌";

  let messageText = "";

  if(data.packageActive && data.warrantyActive){
    messageText = "Halo admin, paket saya sedang mengalami kendala, bisa tolong bantu saya?";
  }
  else if(data.packageActive && !data.warrantyActive){
    messageText = "Halo admin, paket saya sedang mengalami kendala, apakah masih dalam cakupan garansi?";
  }
  else{
    messageText = "Halo admin, Saya ingin memesan paket yang sama, bisa tolong bantu saya?";
  }

  const message = `🙌 Halo admin, saya ingin meminta bantuan.

🫐 Data Pembeli

🍎 Nama : ${data.buyerName}
🍏 Nomor : ${data.buyerPhone}

🍐 Detail Pesanan

🍉 INV : ${data.invoice}
🥭 Produk : ${data.product}
🍒 Paket : ${data.package}
🍍 Aktivasi : ${data.activatedDate}
🥥 Paket Berakhir : ${data.packageExpired}
🍅 Garansi Berakhir : ${data.warrantyExpired}

🌶 Status

🍒 Paket : ${packageStatus}
🥥 Garansi : ${warrantyStatus}

🥝 Pesan

${messageText}`;

  console.log(message);
  
  /* FIX BONUS: Panggil fungsi ini agar chat terbuka otomatis di tab baru */
  openWhatsApp(message);
}
