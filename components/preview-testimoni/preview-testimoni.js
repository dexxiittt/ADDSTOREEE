// firebase app
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

// firestore
import { 
getFirestore, collection, addDoc, getDocs, doc, setDoc, getDoc, query, where, onSnapshot, deleteDoc, updateDoc, orderBy
} from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

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

let semuaTestimoni = []

function loadTestimoni(){
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

loadTestimoni()
