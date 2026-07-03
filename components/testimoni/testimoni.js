// firebase app
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

// firestore
import { 
getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, query, where, onSnapshot, deleteDoc, updateDoc, orderBy
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

//  AUTH
import { getAuth, signInAnonymously, onAuthStateChanged } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBzuIo_i_TAAJevZMNqYtWuZoFB8wfj_RE",
  authDomain: "addstoreapps.firebaseapp.com",
  projectId: "addstoreapps",
  storageBucket: "addstoreapps.firebasestorage.app",
  messagingSenderId: "712672256555",
  appId: "1:712672256555:web:9069f8ea4d7776d1f3806e",
  measurementId: "G-92MPF6V96X"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
let currentUser = null;

onAuthStateChanged(auth, (user) => {
  if (user) {
    currentUser = user;
    console.log("User login:", user.uid);
  } else {
    signInAnonymously(auth)
      .catch((error) => {
        console.error("Auth error:", error);
      });
  }
});

async function kirimTestimoni(){

if(!currentUser){
  alert("bentar ya, sistem lagi nyiapin user...");
  return;
}

let invoice = document.getElementById("invoice").value
let nama = document.getElementById("nama").value
let rating = document.getElementById("rating").value
let pesan = document.getElementById("pesan").value

let valid = true

document.getElementById("errorInvoice").style.display="none"
document.getElementById("errorNama").style.display="none"
document.getElementById("errorPesan").style.display="none"
document.getElementById("invoice").classList.remove("input-error")
document.getElementById("nama").classList.remove("input-error")
document.getElementById("pesan").classList.remove("input-error")

if(!invoice){
document.getElementById("errorInvoice").style.display="block"
document.getElementById("invoice").classList.add("input-error")
valid=false
}

if(!nama){
document.getElementById("errorNama").style.display="block"
document.getElementById("nama").classList.add("input-error")
valid=false
}

if(!pesan){
document.getElementById("errorPesan").style.display="block"
document.getElementById("pesan").classList.add("input-error")
valid=false
}

if(!rating){
showToast()
return
}

if(!valid) return

// cek invoice dari Google Sheets
const res = await fetch("https://opensheet.elk.sh/1JtmaN7ASwvnQzoOKPqVA3Uy85fcNfcLTArYOyQZRV08/WARRANTY_DATA")
const data = await res.json()
const invoiceValid = data.some(item => item.invoice === invoice)

if(!invoiceValid){
showInvoiceInvalid()
return
}

// cek apakah invoice sudah pernah memberi testimoni
const q = query(collection(db,"testimoni"), where("invoice","==",invoice))
const snapshot = await getDocs(q)

if(!snapshot.empty){
  showInvoicePopup()
  return
}

  // kirim testimoni
await setDoc(doc(db,"testimoni", invoice),{
invoice:invoice,
nama:nama,
rating:rating,
pesan:pesan,
uid: currentUser.uid,
tanggal:new Date().toLocaleDateString(),
createdAt:new Date()
})

let myInvoices =
JSON.parse(localStorage.getItem("myTestimoni")) || []

if(!myInvoices.includes(invoice)){
myInvoices.push(invoice)
}

localStorage.setItem("myTestimoni",JSON.stringify(myInvoices))

showToast()
}

window.kirimTestimoni = kirimTestimoni
function showToast(){
const toast = document.getElementById("toastSuccess")

toast.classList.add("show")
setTimeout(()=>{
toast.classList.remove("show")
},2500)
}

let semuaTestimoni = []
let jumlahTampil = 6
let filterBintang = null
let activeEditId = null
let editRating = {}

function loadTestimoni(){

let container = document.getElementById("testimoni-container");

if(container){

container.innerHTML = `
<div class="skeleton"></div>
<div class="skeleton"></div>
<div class="skeleton"></div>
`;

}

const q = query(
collection(db,"testimoni"),
orderBy("createdAt","desc")
)
onSnapshot(q,(snapshot)=>{
semuaTestimoni = []
snapshot.forEach(d=>{
semuaTestimoni.push({
id:d.id,
...d.data()
})
})

if(document.getElementById("testimoni-container")){
renderTestimoni();
}

if(document.getElementById("preview-testimoni-container")){
renderPreviewTestimoni();
}

})

}

function renderTestimoni(){
let container = document.getElementById("testimoni-container")

// HITUNG RATING RATA RATA
let totalRating = 0

let count = {
1:0,
2:0,
3:0,
4:0,
5:0
}

semuaTestimoni.forEach(t=>{
let r = parseInt(t.rating || 0)
totalRating += r

if(count[r] !== undefined){
count[r]++
}
})

let total = semuaTestimoni.length

let avg = total
? (totalRating / total).toFixed(1)
: "0.0"

document.getElementById("avgRating").innerText = avg

document.getElementById("totalReview").innerText =
total + " ulasan pelanggan"

function percent(val){
return total ? (val/total)*100 : 0
}

document.getElementById("bar5").style.width = percent(count[5]) + "%"
document.getElementById("bar4").style.width = percent(count[4]) + "%"
document.getElementById("bar3").style.width = percent(count[3]) + "%"
document.getElementById("bar2").style.width = percent(count[2]) + "%"
document.getElementById("bar1").style.width = percent(count[1]) + "%"
  
container.innerHTML=""

// SORT TESTIMONI (BEST RATING FIRST)
let dataTampil = semuaTestimoni

if(filterBintang){
dataTampil = semuaTestimoni.filter(t => parseInt(t.rating) === filterBintang)
}

dataTampil.sort((a,b)=>{

let ratingA = parseInt(a.rating || 0)
let ratingB = parseInt(b.rating || 0)

if(ratingB !== ratingA){
return ratingB - ratingA
}

// jika rating sama -> terbaru dulu
return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)

})
  
let tampil = dataTampil.slice(0,jumlahTampil)
tampil.forEach((t,i)=>{

let avatar = t.nama.charAt(0).toUpperCase()
let myInvoices =
JSON.parse(localStorage.getItem("myTestimoni")) || []
let tombolMenu = ""

let currentInvoice =
document.getElementById("invoice").value

  if(currentUser && t.uid === currentUser.uid){
tombolMenu = `
<div style="position:absolute;top:12px;right:12px;cursor:pointer;font-size:18px;"
onclick="toggleMenu('${t.id}', event)">⋮</div>

<div id="menu-${t.id}" 
class="menu-box"
style="
display:none;
position:absolute;
right:10px;
top:35px;

background:rgba(255,255,255,0.9);
backdrop-filter:blur(10px);

border-radius:12px;
box-shadow:0 12px 30px rgba(0,0,0,0.15);

padding:6px;
z-index:10;
min-width:90px;
">

<div onclick="editTestimoni('${t.id}','${t.pesan}')" 
style="padding:8px 12px;cursor:pointer;">Edit</div>

<div onclick="hapusTestimoni('${t.id}')" 
style="padding:8px 12px;color:red;cursor:pointer;">Hapus</div>

</div>
`
}

container.innerHTML += `

<div class="testimoni-card" style="animation-delay:${i*0.08}s">

${tombolMenu}

<div class="stars" id="stars-${t.id}">
${"⭐".repeat(parseInt(t.rating))}
</div>

<div id="editStars-${t.id}" style="
display:none;
font-size:22px;
margin-bottom:8px;
cursor:pointer;
color:#d1d5db;
">
<span data-value="1">★</span>
<span data-value="2">★</span>
<span data-value="3">★</span>
<span data-value="4">★</span>
<span data-value="5">★</span>
</div>

<p id="text-${t.id}" class="clamp">"${t.pesan}"</p>

${t.pesan.length > 120 ? `
<span 
id="toggle-${t.id}" 
style="color:#6d28d9;cursor:pointer;font-size:13px;"
onclick="toggleText('${t.id}')">
Lihat Selengkapnya
</span>
` : ""}

<textarea id="edit-${t.id}" maxlength="300" style="
display:none;
width:100%;
margin-top:8px;
padding:10px;
border-radius:8px;
border:1px solid #ddd;
font-size:14px;
">${t.pesan}</textarea>

<div id="charCounter-${t.id}" class="char-counter" style="display:none;">
Maks: 300 karakter
</div>

<div id="save-${t.id}" style="display:none;margin-top:8px;">
<button onclick="simpanEdit('${t.id}')" style="
padding:6px 12px;
border:none;
background:#6d28d9;
color:white;
border-radius:6px;
cursor:pointer;
">Simpan</button>
</div>

<div class="testimoni-user">

<div class="testimoni-avatar" id="avatar-${t.id}">
${avatar}
</div>

<div>

<strong id="nama-${t.id}">
${t.nama}
</strong>

<input id="editNama-${t.id}" 
style="
display:none;
margin-top:4px;
padding:6px 8px;
border-radius:8px;
border:1px solid #ddd;
font-size:14px;
width:120px;
"
value="${t.nama}"
>

<br>
<small>${t.tanggal}</small>

</div>

</div>

</div>
`
})

// KONTROL TOMBOL LOAD MORE
let btn = document.getElementById("loadMoreBtn")
if(jumlahTampil >= semuaTestimoni.length){
btn.innerText = "Lihat Lebih Sedikit"
}else{
btn.innerText = "Lihat Lebih Banyak"

}
  
}

// =========================
// PREVIEW TESTIMONI
// =========================

function renderPreviewTestimoni(){

const container = document.getElementById("preview-testimoni-container");

if(!container) return;

container.innerHTML = "";

// hanya rating 5
let data = semuaTestimoni.filter(t => parseInt(t.rating) === 5);

// terbaru dulu
data.sort((a,b)=>
(b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
);

// ambil 4
data = data.slice(0,4);

data.forEach(t=>{

const avatar = t.nama.charAt(0).toUpperCase();

container.innerHTML += `

<div class="preview-testimoni-card">

<div class="stars">
${"⭐".repeat(5)}
</div>

<p>"${t.pesan}"</p>

<div class="preview-user">

<div class="preview-avatar">
${avatar}
</div>

<div>

<strong>${t.nama}</strong>

<br>

<small>${t.tanggal}</small>

</div>

</div>

</div>

`;

});

}


// PREVIEW TESTIMONI HABIS DISINI
// =========================

document.getElementById("loadMoreBtn").onclick=function(){
if(jumlahTampil >= semuaTestimoni.length){
// reset ke awal
jumlahTampil = 6
}else{
// tambah 6
jumlahTampil += 6
}

renderTestimoni()

}

const savedInvoice = localStorage.getItem("userInvoice")
if(savedInvoice){
document.getElementById("invoice").value = savedInvoice
}

loadTestimoni()
const stars = document.querySelectorAll("#ratingStars span")
let ratingValue = 0

stars.forEach(star => {
star.addEventListener("click", function(){

ratingValue = parseInt(this.dataset.value)
document.getElementById("rating").value = ratingValue

stars.forEach(s => s.classList.remove("active"))
  
for(let i=0;i<ratingValue;i++){
stars[i].classList.add("active")

  }
})
})

document.getElementById("invoice").addEventListener("input",function(){
renderTestimoni()
})

window.toggleText = function(id){
  let text = document.getElementById("text-"+id)
  let btn = document.getElementById("toggle-"+id)

  if(!text || !btn) return

  if(text.classList.contains("clamp")){
    text.classList.remove("clamp")
    btn.innerText = "Lihat Lebih Sedikit"
  }else{
    text.classList.add("clamp")
    btn.innerText = "Lihat Selengkapnya"
  }


setTimeout(()=>{
  semuaTestimoni.forEach(t=>{
    let el = document.getElementById("text-"+t.id)
    let btn = document.getElementById("toggle-"+t.id)

    if(el && btn){
  let terlaluPendek = el.scrollHeight <= el.clientHeight
  let teksPendek = t.pesan.length < 120

  if(terlaluPendek || teksPendek){
    btn.style.display = "none"
  }
    }
  })
},100)
  
}

window.toggleMenu = function(id, e){
  if(e) e.stopPropagation()

  const menu = document.getElementById("menu-"+id)

  if(!menu) return

  menu.style.display =
    menu.style.display === "block" ? "none" : "block"
}

// 1. untuk menu titik tiga
document.addEventListener("click", function(e){

  // =========================
  // 1. MENU TITIK TIGA
  // =========================
  if(
    e.target.closest("[onclick^='editTestimoni']") ||
    e.target.closest("textarea") ||
    e.target.closest("[id^='editStars-']") ||
    e.target.closest("[id^='editNama-']")
  ){
    return
  }

  document.querySelectorAll("[id^='menu-']").forEach(menu=>{
    if(!menu.contains(e.target)){
      menu.style.display="none"
    }
  })

  if(activeEditId){
    let editBox = document.getElementById("edit-"+activeEditId)
    if(editBox && !editBox.contains(e.target)){
      cancelEdit(activeEditId)
    }
  }


  // =========================
  // 2. FILTER MENU
  // =========================
  let filterMenu = document.getElementById("filterMenu")
  let icon = e.target.closest("[onclick='toggleFilterMenu()']")

  if(icon) return

  if(filterMenu && !filterMenu.contains(e.target)){
    filterMenu.style.display = "none"
  }

})

let deleteID = null
window.hapusTestimoni = function(id){
deleteID = id
document
.getElementById("deleteModal")
.classList.add("show")
}

window.tutupDelete = function(){
document
.getElementById("deleteModal")
.classList.remove("show")
}

window.showInvoicePopup = function(){
document
.getElementById("invoiceModal")
.classList.add("show")
}

window.tutupInvoice = function(){
document
.getElementById("invoiceModal")
.classList.remove("show")
}

window.showInvoiceInvalid = function(){
document
.getElementById("invoiceInvalidModal")
.classList.add("show")
}

window.tutupInvoiceInvalid = function(){
document
.getElementById("invoiceInvalidModal")
.classList.remove("show")
}

window.konfirmasiDelete = async function(){
if(!deleteID) return
await deleteDoc(doc(db,"testimoni",deleteID))
tutupDelete()
}

window.editTestimoni = function(id){

if(activeEditId && activeEditId !== id){
cancelEdit(activeEditId)
}

activeEditId = id

// sembunyikan menu edit/hapus saat edit
let menu = document.getElementById("menu-"+id)
if(menu) menu.style.display = "none"

let titik = document.querySelector(
"[onclick=\"toggleMenu('"+id+"')\"]"
)
if(titik) titik.style.display = "none"

setTimeout(()=>{
document
.getElementById("edit-"+id)
.closest(".testimoni-card")
.scrollIntoView({
behavior:"smooth",
block:"center"
})
},150)
  
document.getElementById("text-"+id).style.display="none"
document.getElementById("edit-"+id).style.display="block"
document.getElementById("save-"+id).style.display="block"
document.getElementById("stars-"+id).style.display="none"
document.getElementById("editStars-"+id).style.display="block"
document.getElementById("nama-"+id).style.display="none"
document.getElementById("editNama-"+id).style.display="inline-block"

let inputNama = document.getElementById("editNama-"+id)
  
inputNama.addEventListener("input",function(){
let huruf = this.value.trim().charAt(0).toUpperCase()
let avatar = document.getElementById("avatar-"+id)

if(huruf){
avatar.innerText = huruf
avatar.style.transform = "scale(1.18)"

setTimeout(()=>{
avatar.style.transform = "scale(1)"
},120)
}
})

  let stars = document.querySelectorAll("#editStars-"+id+" span")

stars.forEach(star=>{
star.onclick = function(){

let value = this.dataset.value
editRating[id] = value

stars.forEach(s=>s.style.color="#d1d5db")

for(let i=0;i<value;i++){
stars[i].style.color="#fbbf24"
}

}
})

// AUTO FOCUS
let textarea = document.getElementById("edit-"+id)
textarea.focus()
textarea.setSelectionRange(textarea.value.length, textarea.value.length)


// =========================
// CHARACTER COUNTER EDIT
// =========================
let counter = document.getElementById("charCounter-"+id)

// tampilkan counter
counter.style.display = "block"

// trigger awal
textarea.dispatchEvent(new Event("input"))

textarea.addEventListener("input", function(){

  let max = 300
  let sisa = max - this.value.length

  counter.innerText = "Maks: " + sisa + " karakter"

  counter.classList.remove("counter-normal","counter-warning","counter-danger")

  if(sisa >= 201){
    counter.classList.add("counter-normal")
  } 
  else if(sisa >= 51){
    counter.classList.add("counter-warning")
  } 
  else{
    counter.classList.add("counter-danger")
  }

})

}

function cancelEdit(id){
document.getElementById("text-"+id).style.display="block"
document.getElementById("edit-"+id).style.display="none"
document.getElementById("save-"+id).style.display="none"
document.getElementById("stars-"+id).style.display="block"
document.getElementById("editStars-"+id).style.display="none"
document.getElementById("nama-"+id).style.display="inline"
document.getElementById("editNama-"+id).style.display="none"

let titik = document.querySelector(
"[onclick=\"toggleMenu('"+id+"')\"]"
)
if(titik) titik.style.display = "block"

let counter = document.getElementById("charCounter-"+id)
if(counter) counter.style.display = "none"
  
activeEditId = null
}
  
window.simpanEdit = async function(id){
  
let pesanBaru = document.getElementById("edit-"+id).value
let namaBaru = document.getElementById("editNama-"+id).value
let dataUpdate = {
pesan: pesanBaru,
nama: namaBaru
}

if(editRating[id]){
dataUpdate.rating = editRating[id]
}

await updateDoc(doc(db,"testimoni",id), dataUpdate)

cancelEdit(id)
}

document.getElementById("invoice").addEventListener("input",function(){
this.classList.remove("input-error")
document.getElementById("errorInvoice").style.display="none"
})

document.getElementById("nama").addEventListener("input",function(){
this.classList.remove("input-error")
document.getElementById("errorNama").style.display="none"
})

document.getElementById("pesan").addEventListener("input",function(){
this.classList.remove("input-error")
document.getElementById("errorPesan").style.display="none"
})

window.toggleFilterMenu = function(){
let menu = document.getElementById("filterMenu")
menu.style.display =
menu.style.display === "block" ? "none" : "block"
}

window.filterRating = function(star){
filterBintang = star
jumlahTampil = 6
  
renderTestimoni()
document.getElementById("filterMenu").style.display="none"
}

window.resetFilter = function(){
filterBintang = null
jumlahTampil = 6

renderTestimoni()
document.getElementById("filterMenu").style.display="none"
}

// =========================
// CHARACTER COUNTER
// =========================
const pesanInput = document.getElementById("pesan");
const counter = document.getElementById("charCounter");

if(pesanInput && counter){

  pesanInput.addEventListener("input", function(){

    let max = 300;
    let sisa = max - this.value.length;

    counter.innerText = "Maks: " + sisa + " karakter";

    counter.classList.remove("counter-normal","counter-warning","counter-danger");

    if(sisa >= 201){
  counter.classList.add("counter-normal"); // putih
} 
else if(sisa >= 51){
  counter.classList.add("counter-warning"); // kuning
} 
else{
  counter.classList.add("counter-danger"); // merah
}

 if(sisa <= 10){
  counter.style.transform = "scale(1.1)";
  setTimeout(()=>{
    counter.style.transform = "scale(1)";
  },150);
}

  });

  // trigger awal biar langsung muncul
  pesanInput.dispatchEvent(new Event("input"));
  }
