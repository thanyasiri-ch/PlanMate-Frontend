// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9wMXgKFN35o_YQAHpXpcWoaMwTxdO45U",
  authDomain: "planmate-3a16a.firebaseapp.com",
  databaseURL: "https://planmate-3a16a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "planmate-3a16a",
  storageBucket: "planmate-3a16a.firebasestorage.app",
  messagingSenderId: "26375668622",
  appId: "1:26375668622:web:b474d94765a3f89d459adf",
  measurementId: "G-JP5C0PH02X"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, analytics, auth, storage };
