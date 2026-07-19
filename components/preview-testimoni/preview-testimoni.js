// firebase app
import { initializeApp } 
from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";

// firestore
import {
getFirestore,
collection,
query,
orderBy,
onSnapshot
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

    const loading = document.getElementById("preview-testimoni-loading");

    if(loading){
        loading.style.display = "grid";
    }

    const q = query(
        collection(db,"testimoni"),
        orderBy("createdAt","desc")
    );

    onSnapshot(q,(snapshot)=>{

        semuaTestimoni = [];

        snapshot.forEach(d=>{
            semuaTestimoni.push({
                id:d.id,
                ...d.data()
            });
        });

        renderPreviewTestimoni();

    });

}

function renderPreviewTestimoni(){

const container = document.getElementById("preview-testimoni-container");
const loading = document.getElementById("preview-testimoni-loading");

if(!container) return;

// sembunyikan loading
if(loading){
loading.style.display = "none";
}

container.innerHTML = "";

// hanya rating 5
let data = semuaTestimoni.filter(t => parseInt(t.rating) === 5);

// terbaru dulu
data.sort((a,b)=>
(b.createdAt?.seconds || 0) -
(a.createdAt?.seconds || 0)
);

// ambil 4
data = data.slice(0,6);

data.forEach(t=>{

const avatar = t.nama.charAt(0).toUpperCase();

container.innerHTML += `

<div class="preview-testimoni-card">

<div class="stars">
${"⭐".repeat(5)}
</div>

<p class="clamp">
"${t.pesan}"
</p>

<div class="preview-testimoni-user">

<div class="preview-testimoni-avatar">
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

loadTestimoni();
