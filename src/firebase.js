// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAANLqTiF-IqpotvO0-SNkRlhii5vxxVlE",
  authDomain: "bamboo-journy.firebaseapp.com",
  projectId: "bamboo-journy",
  storageBucket: "bamboo-journy.firebasestorage.app",
  messagingSenderId: "259620791962",
  appId: "1:259620791962:web:fb463aa02134750e402123",
  measurementId: "G-PDG5YYDZ0L"
};

// เริ่มต้นการทำงานของ Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export { db };