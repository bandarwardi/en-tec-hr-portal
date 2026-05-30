import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCnm5vRwE7Cm7CTF9tuLIUmfefd9oWgYDo",
  authDomain: "hr-entec.firebaseapp.com",
  projectId: "hr-entec",
  storageBucket: "hr-entec.firebasestorage.app",
  messagingSenderId: "539558143909",
  appId: "1:539558143909:web:5f491a516d042e5dad6a4c",
  measurementId: "G-4LZR8R521N",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

export const isFirebaseConfigured = true;
