import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// КОНФИГ вставь свой, который скопируешь из Firebase Console!
const firebaseConfig = {
    apiKey: "AIzaSyA50k2MXTKWG4cgxaUVOElsurRLNmXrYuI",
    authDomain: "rehabcare-fc585.firebaseapp.com",
    projectId: "rehabcare-fc585",
    storageBucket: "rehabcare-fc585.firebasestorage.app",
    messagingSenderId: "730661747104",
    appId: "1:730661747104:web:6bc5c0ebf64727b77e8cc5"
};
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
