import { initializeApp, getApps, getApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
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

/**
 * Create a Firebase Auth user WITHOUT signing the admin out of the current session.
 * Uses a secondary Firebase app instance that is destroyed right after.
 */
export async function createUserSecondary(email: string, password: string): Promise<string> {
  const tmpName = `tmp-create-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const tmpApp = initializeApp(firebaseConfig, tmpName);
  const tmpAuth = getAuth(tmpApp);
  try {
    const cred = await createUserWithEmailAndPassword(tmpAuth, email, password);
    return cred.user.uid;
  } finally {
    try { await tmpAuth.signOut(); } catch {}
    try { await deleteApp(tmpApp); } catch {}
  }
}
