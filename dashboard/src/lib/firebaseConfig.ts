// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyAgCNERlOUnJyQsgFFGawHm9gIygUTxwQM",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "air-quality-monitor-c0862.firebaseapp.com",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL || "https://air-quality-monitor-c0862-default-rtdb.firebaseio.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "air-quality-monitor-c0862",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "air-quality-monitor-c0862.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "746914538418",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:746914538418:web:eb6322df4356c117affaab",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-C2WN5ME09P"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
const auth = getAuth(app);
const db = getFirestore(app);
const rtdb = getDatabase(app);
const storage = getStorage(app);
let analytics;

// Only initialize analytics in browser environment and if not in development
if (typeof window !== 'undefined' && process.env.NODE_ENV !== 'development') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    console.log('Analytics not available (likely due to ad blockers or SSR)');
    analytics = null;
  }
}

export { 
  auth, 
  db, 
  rtdb, 
  storage, 
  analytics 
};

export default app;