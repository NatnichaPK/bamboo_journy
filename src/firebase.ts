// src/firebase.js
import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, CACHE_SIZE_UNLIMITED } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAANLqTiF-IqpotvO0-SNkRlhii5vxxVlE",
  authDomain: "bamboo-journy.firebaseapp.com",
  projectId: "bamboo-journy",
  storageBucket: "bamboo-journy.firebasestorage.app",
  messagingSenderId: "259620791962",
  appId: "1:259620791962:web:fb463aa02134750e402123",
  measurementId: "G-PDG5YYDZ0L"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: undefined, 
    cacheSizeBytes: CACHE_SIZE_UNLIMITED 
  })
});

export const storage = getStorage(app);