import { getApp, getApps, initializeApp } from "firebase/app";
import { initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDVd58PEsx544xiYk7X3C9EwUEB6CN8YPI",
  authDomain: "friendsapp-2a2bc.firebaseapp.com",
  projectId: "friendsapp-2a2bc",
  storageBucket: "friendsapp-2a2bc.firebasestorage.app",
  messagingSenderId: "439451340971",
  appId: "1:439451340971:web:d5deb361a22b3d1eec67ee",
  measurementId: "G-PPECSCJE4P",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const auth = initializeAuth(app);

const db = getFirestore(app);

export { app, auth, db };
