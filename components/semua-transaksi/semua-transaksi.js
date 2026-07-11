/* ============================= */
/* CONFIG SHEET */
/* ============================= */

const sheetID="1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";
const sheetName="WARRANTY_DATA";
const sheetURL=`https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

const params=new URLSearchParams(window.location.search);
const buyer=params.get("buyer");

if(!buyer){
  document.getElementById("wrapper").innerHTML=
  `<p style="text-align:center;opacity:.6;">Nomor tidak ditemukan.</p>`;
}

/* ============================= */
/* FETCH DATA */
/* ============================= */

fetch(sheetURL)
.then(res=>res.text())
.then(text=>{
const json=JSON.parse(text.substr(47).slice(0,-2));
const rows=json.table.rows;
const headers=json.table.cols.map(c=>c.label);

let result=[];

rows.forEach(row=>{
if(!row.c)return;

let rowData={};
headers.forEach((h,i)=>{
rowData[h]=row.c[i]?.v ?? "";
});

function normalizeNumber(num) {
  num = String(num).replace(/\D/g, "");
  if (num.startsWith("62")) num = num.substring(2);
  if (num.startsWith("0")) num = num.substring(1);
  return num;
}

if(normalizeNumber(rowData.buyer_contact) === normalizeNumber(buyer)){
result.push(rowData);
}
});

render(result);
});


// 🔥 TAMBAHKAN INI DI SINI
function parseIndoDate(value) {
  if (!value) return null;

  // Kalau format dari Google = Date(2026,1,28,14,43,0)
  if (typeof value === "string" && value.startsWith("Date(")) {
    const parts = value.match(/\d+/g);
    return new Date(
      Number(parts[0]),
      Number(parts[1]),
      Number(parts[2]),
      Number(parts[3] || 0),
      Number(parts[4] || 0),
      Number(parts[5] || 0)
    );
  }

    // Kalau format normal 28/02/2026 14:43:00
  if (typeof value === "string" && value.includes("/")) {
    const [datePart, timePart] = value.split(" ");
    const [day, month, year] = datePart.split("/");
    const [hour="0", minute="0", second="0"] = (timePart || "").split(":");

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second)
    );
  }

  // fallback
  return new Date(value);
}

function getWrapper(){
return document.getElementById("wrapper");
}

function clearWrapper(){
getWrapper().innerHTML="";
}

function renderEmpty(){

getWrapper().innerHTML=`
<p class="transaksi-message">
Belum ada transaksi.
</p>
`;

}

function generateMetaHtml(item, activated, expired){

return `
<div class="meta">
Produk: ${item.title}<br>
Paket: ${item.package}<br>
Aktivasi: ${activated}<br>
Berakhir: ${expired}
</div>
`;

}

function render(data){

const wrapper=getWrapper();

if(data.length===0){
renderEmpty();
return;
}

clearWrapper();

function appendCard(html){
getWrapper().innerHTML+=html;
}

data.forEach(item=>{

const now=new Date();

// 🔥 TAMBAHKAN INI DI SINI
const activatedDate = parseIndoDate(item["activated_at"]);

if(!activatedDate) return;

let endDate;

// Kalau valid_until adalah angka (durasi)
if (!isNaN(item.valid_until)) {
  const durationDays = Number(item.valid_until) || 0;
  endDate = new Date(
    activatedDate.getTime() + durationDays * 24 * 60 * 60 * 1000
  );
}
// Kalau valid_until adalah tanggal
else {
  endDate = parseIndoDate(item.valid_until);
}

const isActive = now <= endDate;

function generateStatusHtml(isActive){

return `
${statusHtml}
`;

}

let autoNote;
let noteClass;

  if(isActive){
  noteClass = "note-active";
  autoNote = `
  <span class="note-icon">
  <svg viewBox="0 0 24 24" width="16" height="16">
  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
  <path d="M7 12.5L10.2 15.5L17 9" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
  </span>
  Paket dan Garansi telah aktif.<br>
  Layanan dalam cakupan garansi.
  `;
}else{
  noteClass = "note-expired";
  autoNote = `
  <span class="note-icon">
  <svg viewBox="0 0 24 24" width="16" height="16">
  <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.15"/>
  <path d="M12 7v6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
  <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
  </svg>
  </span>
  Paket dan Garansi telah berakhir.<br>
  Layanan tidak lagi termasuk dalam cakupan garansi. <br>
  Jika ingin melanjutkan layanan hubungi admin untuk pembelian ulang.
  `;
}

const activated=activatedDate.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});
const expired=endDate.toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"});

const statusHtml=
generateStatusHtml(isActive);
const metaHtml=
generateMetaHtml(
item,
activated,
expired
);

const noteHtml=
generateNoteHtml(
noteClass,
autoNote
);

const buttonHtml=
generateButtonHtml(item);

const cardHtml=
generateCardHtml(
item,
statusHtml,
metaHtml,
noteHtml,
buttonHtml
);

function generateCardHtml(
item,
statusHtml,
metaHtml,
noteHtml,
buttonHtml
){

return `
<div class="transaksi-card">
<img src="${item.image_url}" alt="">
<h3>${item.title}</h3>

${statusHtml}
${metaHtml}
${noteHtml}
${buttonHtml}
</div>
`;

}
  
function generateNoteHtml(noteClass, autoNote){

return `
${noteHtml}
`;

}

function generateButtonHtml(item){

return `
<div class="button-group">
<a href="status-pesanan.html?inv=${item.invoice}" class="btn btn-detail">
Detail Paket
</a>

<a href="https://wa.me/6281234567890" class="btn btn-wa">
Hubungi Admin
</a>
</div>
`;

}
  
appendCard(`
<div class="transaksi-card">
<img src="${item.image_url}" alt="">
<h3>${item.title}</h3>

<div class="status-row">
${statusPaket}
${statusGaransi}
</div>

${metaHtml}

<div class="note ${noteClass}">
${autoNote}
</div>

${buttonHtml}

</div>
`;
});
}
