// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD3wgq6AHRTOz1VQTJ4Dr9OAO_wEi0J-Bg",
  authDomain: "geek-house-2b74d.firebaseapp.com",
  projectId: "geek-house-2b74d",
  storageBucket: "geek-house-2b74d.firebasestorage.app",
  messagingSenderId: "529674257378",
  appId: "1:529674257378:web:e4656ebcb871dfcbe16fbb",
  measurementId: "G-6NTNMKB751"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);