import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged, User } from "firebase/auth";
import { getFirestore, collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyBccvTH_K7Pi_bNxUbmhJFu3_WI09bGInM",
    authDomain: "posup-ba5be.firebaseapp.com",
    projectId: "posup-ba5be",
    storageBucket: "posup-ba5be.firebasestorage.app",
    messagingSenderId: "659640233256",
    appId: "1:659640233256:web:6ee1ab489b509b9bc2341d",
    measurementId: "G-6FRTDTPZWP"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

export {
    auth,
    db,
    provider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    getDoc,
    getDocs,
    query,
    where
};
export type { User };
