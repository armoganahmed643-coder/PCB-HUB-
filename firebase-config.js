/**
 * PCB HUB - Firebase Configuration
 * ---------------------------------
 * Replace the placeholder values below with YOUR Firebase project's own
 * config values. Get these from:
 * Firebase Console -> Project Settings (gear icon) -> General ->
 * "Your apps" -> Web app -> SDK setup and configuration -> Config
 *
 * This file must be loaded AFTER the firebase-app / firebase-auth /
 * firebase-firestore CDN scripts, and BEFORE script.js / search.js.
 */
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Global references used across script.js and search.js
const auth = firebase.auth();
const db = firebase.firestore();
