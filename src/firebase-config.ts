import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

// TODO: Replace with your Firebase project configuration
// Get this from Firebase Console > Project Settings > General > Your apps
const firebaseConfig = {
  apiKey: "AIzaSyDLi6QYxAZbg20jhldB4wxjYxScJRKiiRI",
  authDomain: "test-f2400.firebaseapp.com",
  databaseURL: "https://test-f2400-default-rtdb.firebaseio.com",
  projectId: "test-f2400",
  storageBucket: "test-f2400.firebasestorage.app",
  messagingSenderId: "842023167603",
  appId: "1:842023167603:web:13aceff43da8849793ac06",
  measurementId: "G-6YJM5Y0WJZ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const database = getDatabase(app);
