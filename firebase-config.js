// Firebase Configuration for StyledPages
export const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyAxOjafMY2zc_Da0gz1bfyyqYbH6_8v45Q",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "styledpages-ace17.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "styledpages-ace17",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "styledpages-ace17.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "100311993905",
  appId: process.env.FIREBASE_APP_ID || "1:100311993905:web:aa22c5b9136ba255a54f10",
  measurementId: process.env.FIREBASE_MEASUREMENT_ID || "G-C4LBWCVRYV"
};
