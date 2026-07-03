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

loadTestimoni()
