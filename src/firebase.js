// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDrkDwp8kvO5cCCpq0TAVTpYtX2JlMc9z0",
  authDomain: "teamstore-76a94.firebaseapp.com",
  projectId: "teamstore-76a94",
  storageBucket: "teamstore-76a94.firebasestorage.app",
  messagingSenderId: "670185385327",
  appId: "1:670185385327:web:8e45678239b02f30494c9a",
  measurementId: "G-JQEHZB5D80",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
