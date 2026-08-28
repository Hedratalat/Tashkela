// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAzJX7nXRL7_wI-LwFs8VVCkZs_hROh840",
  authDomain: "tashkela-7644a.firebaseapp.com",
  projectId: "tashkela-7644a",
  storageBucket: "tashkela-7644a.firebasestorage.app",
  messagingSenderId: "540090361633",
  appId: "1:540090361633:web:bd40e2a534a10682ea4060",
  measurementId: "G-WPYEVJJKJK",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
