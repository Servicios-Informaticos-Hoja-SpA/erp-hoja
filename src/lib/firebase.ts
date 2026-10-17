import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore/lite"; // Using LITE for server-side stability
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDzs3mc-WIUS_1lFyr-z9nt-MszcCp75o8",
  authDomain: "hojadev-9bc22.firebaseapp.com",
  projectId: "hojadev-9bc22",
  storageBucket: "hojadev-9bc22.firebasestorage.app",
  messagingSenderId: "737232317652",
  appId: "1:737232317652:web:8eb77201d1bd65d2851f41"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Firestore Lite is stateless and much more reliable in Next.js API Routes (server-side)
const db = getFirestore(app);

// Firebase Storage for user avatars and attachments
const storage = getStorage(app);

export { app, auth, db, storage };

