/* ============================= */
/* CONFIG SHEET */
/* ============================= */

const sheetID="1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08";
const sheetName="WARRANTY_DATA";
const sheetURL=`https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&sheet=${sheetName}`;

const params=new URLSearchParams(window.location.search);
const buyer=params.get("buyer");

if(!buyer){
  
renderNotFound();
  
throw new Error(
"Buyer parameter not found"
);
}

/* ============================= */
/* FETCH DATA */
/* ============================= */

fetch(sheetURL)
.then(res=>{

return res.text();

})
  
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

function normalizeNumber(num) {
  num = String(num).replace(/\D/g, "");
  if (num.startsWith("62")) num = num.substring(2);
  if (num.startsWith("0")) num = num.substring(1);
  return num;
}

function getNoteData(
isPackageActive,
isWarrantyActive
){

if(
isPackageActive &&
isWarrantyActive
){

return{

noteClass:"note-active",

noteTemplate:
"noteActiveTemplate"

};

}

if(
isPackageActive &&
!isWarrantyActive
){

return{

noteClass:"note-active",

noteTemplate:
"noteWarrantyExpiredTemplate"

};

}

return{

noteClass:"note-expired",

noteTemplate:
"noteExpiredTemplate"

};

}

function getStatusData(
isPackageActive,
isWarrantyActive
){

return{

statusPaket:isPackageActive?
"Paket Aktif":
"Paket Berakhir",

statusGaransi:isWarrantyActive?
"Garansi Aktif":
"Garansi Berakhir",

statusClassPaket:isPackageActive?
"status-active":
"status-expired",

statusClassGaransi:isWarrantyActive?
"status-active":
"status-expired"

};

}

function getMetaData(
item,
activated,
packageExpired,
expired
){

return{

title:item.title,
package:item.package,
activated,
packageExpired,
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

function renderNotFound(){

const template=
document.getElementById(
"notFoundTemplate"
);

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

const status1 =
wrapper.querySelector(".status-item-1");

status1.classList.add(
statusData.statusClassPaket
);

const status2 =
wrapper.querySelector(".status-item-2");

status2.classList.add(
statusData.statusClassGaransi
);

const icon1 =
wrapper.querySelector(".status-icon-1");

const icon2 =
wrapper.querySelector(".status-icon-2");

wrapper
.querySelector(".status-text-1")
.textContent=
statusData.statusPaket;

wrapper
.querySelector(".status-text-2")
.textContent=
statusData.statusGaransi;

if(
statusData.statusClassPaket===
"status-active"
){

icon1.className=
"status-icon-1 fa-solid fa-circle-check";

}else{

icon1.className=
"status-icon-1 fa-solid fa-circle-xmark";

}

if(
statusData.statusClassGaransi===
"status-active"
){

icon2.className=
"status-icon-2 fa-solid fa-circle-check";

}else{

icon2.className=
"status-icon-2 fa-solid fa-circle-xmark";

}

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

wrapper
.querySelector(".meta-package-expired")
.textContent=
metaData.packageExpired;

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

const contentTemplate=
document.getElementById(
noteTemplate
);

wrapper
.querySelector(".note-content")
.innerHTML=
contentTemplate.innerHTML;

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

const template=
document.getElementById(
"cardTemplate"
);

const wrapper=
document.createElement("div");

wrapper.innerHTML=
template.innerHTML;

wrapper
.querySelector(".card-image")
.src=
item.image_url;

wrapper
.querySelector(".card-image")
.alt=
item.title;

wrapper
.querySelector(".card-invoice")
.innerHTML=
`<i class="fa-solid fa-receipt"></i>
${item.invoice}`;

wrapper
.querySelector(".card-title")
.textContent=
item.title;

wrapper
.querySelector(".card-status")
.innerHTML=
statusHtml;

wrapper
.querySelector(".card-meta")
.innerHTML=
metaHtml;

wrapper
.querySelector(".card-note")
.innerHTML=
noteHtml;

wrapper
.querySelector(".card-button")
.innerHTML=
buttonHtml;

return wrapper.innerHTML;

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


const packageEndDate=
getEndDate(
activatedDate,
item.duration_package
);
  
const isPackageActiveStatus=
isPackageActive(
now,
packageEndDate 
);

const isWarrantyActive=
isPackageActive(
now,
endDate
);

const{
noteClass,
noteTemplate
}=getNoteData(
isPackageActiveStatus,
isWarrantyActive
);

const statusData=
getStatusData(
isPackageActiveStatus,
isWarrantyActive
);
  
const activated=
formatIndoDate(
activatedDate
);

const expired=
formatIndoDate(
endDate
);

const packageExpired=
formatIndoDate(
packageEndDate
);

const metaData=
getMetaData(
item,
activated,
packageExpired,
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
});

}

