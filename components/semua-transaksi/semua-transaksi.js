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


/* ============================= */
/* LOGIC HELPER */
/* ============================= */

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

function getEndDate(activatedDate, validUntil){

// Kalau valid_until adalah jumlah hari
if(!isNaN(validUntil)){

const durationDays=
Number(validUntil)||0;

return new Date(
activatedDate.getTime()+
durationDays*24*60*60*1000
);

}

// Kalau valid_until berupa tanggal
return parseIndoDate(validUntil);
}

function isPackageActive(now, endDate){
return now <= endDate;
}

function formatIndoDate(date){

return date.toLocaleDateString(
"id-ID",
{
day:"numeric",
month:"long",
year:"numeric"
}
);

}

function getNoteData(isActive){

if(isActive){

return{

noteClass:"note-active",

noteTemplate:
"noteActiveTemplate"

};

}

return{

noteClass:"note-expired",

noteTemplate:
"noteExpiredTemplate"

};
  
}

function getStatusData(isActive){

return{

statusPaket:isActive?
"Paket Aktif":
"Paket Berakhir",

statusGaransi:isActive?
"Garansi Aktif":
"Garansi Berakhir",

statusClass:isActive?
"status-active":
"status-expired"

};

}

function getMetaData(
item,
activated,
expired
){

return{

title:item.title,
package:item.package,
activated,
expired

};

}

/* ============================= */
/* UI HELPER */
/* ============================= */

/* ---------- DOM Helper ---------- */
function getWrapper(){
return document.getElementById("wrapper");
}

function setWrapperHtml(html){
getWrapper().innerHTML=html;
}

function clearWrapper(){
setWrapperHtml("");
}

function appendCard(html){
getWrapper().innerHTML+=html;
}

function renderEmpty(){

const template=
document.getElementById("emptyTemplate");

setWrapperHtml(
template.innerHTML
);
}


/* ---------- HTML Helper ---------- */
function generateStatusHtml(statusData){

const template=
document.getElementById("statusTemplate");

const wrapper=
document.createElement("div");

wrapper.innerHTML=
template.innerHTML;

wrapper
.querySelector(".status-item-1")
.className=
statusData.statusClass;

wrapper
.querySelector(".status-item-1")
.classList.add(statusData.statusClass);

wrapper
.querySelector(".status-item-2")
.className=
statusData.statusClass;

wrapper
.querySelector(".status-item-2")
.classList.add(statusData.statusClass);

wrapper
.querySelector(".status-text-1")
.textContent=
statusData.statusPaket;

wrapper
.querySelector(".status-text-2")
.textContent=
statusData.statusGaransi;

return wrapper.innerHTML;
}

function generateMetaHtml(metaData){

const template=
document.getElementById("metaTemplate");

const wrapper=
document.createElement("div");

wrapper.innerHTML=
template.innerHTML;

wrapper
.querySelector(".meta-title")
.textContent=
metaData.title;

wrapper
.querySelector(".meta-package")
.textContent=
metaData.package;

wrapper
.querySelector(".meta-activated")
.textContent=
metaData.activated;

wrapper
.querySelector(".meta-expired")
.textContent=
metaData.expired;

return wrapper.innerHTML;
}

function generateNoteHtml(
noteClass,
noteTemplate
){

const template=
document.getElementById("noteTemplate");

const wrapper=
document.createElement("div");

wrapper.innerHTML=
template.innerHTML;

const note=
wrapper.querySelector(".note");

note.classList.add(noteClass);

const template=
document.getElementById(
noteTemplate
);

wrapper
.querySelector(".note-content")
.innerHTML=
template.innerHTML;

return wrapper.innerHTML;
}

function generateButtonHtml(item){

const template=
document.getElementById(
"buttonTemplate"
);

const wrapper=
document.createElement("div");

wrapper.innerHTML=
template.innerHTML;

wrapper
.querySelector(".btn-detail")
.href=
`status-pesanan.html?inv=${item.invoice}`;

return wrapper.innerHTML;

}

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

/* ============================= */
/* RENDER */
/* ============================= */

function render(data){

if(data.length===0){
renderEmpty();
return;
}

clearWrapper();

data.forEach(item=>{

const now=new Date();
const activatedDate = parseIndoDate(item["activated_at"]);

if(!activatedDate) return;

const endDate=
getEndDate(
activatedDate,
item.valid_until
);
  
const isActive=
isPackageActive(
now,
endDate
);

const{
noteClass,
noteTemplate
}=getNoteData(isActive);

const statusData=
getStatusData(isActive);
  
const activated=
formatIndoDate(
activatedDate
);

const expired=
formatIndoDate(
endDate
);

const metaData=
getMetaData(
item,
activated,
expired
);

const statusHtml=
generateStatusHtml(statusData);
  
const metaHtml=
generateMetaHtml(
metaData
);

const noteHtml=
generateNoteHtml(
noteClass,
noteTemplate
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
  
appendCard(cardHtml);
}
