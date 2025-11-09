import { initializeApp, getApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyBEfmbZMnCjeaxiK5ceOaUmoC6QJ703Ffk",
  authDomain: "lapatisseriex-cdaea.firebaseapp.com",
  projectId: "lapatisseriex-cdaea",
  storageBucket: "lapatisseriex-cdaea.firebasestorage.app",
  messagingSenderId: "952492614597",
  appId: "1:952492614597:web:b85e86a8fa9135c615e1ac",
  measurementId: "G-E81HFTZDSX"
};

// Initialize Firebase once (avoid duplicate-app in HMR)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

export { auth };

// For debugging
if (import.meta.env.DEV) {
  console.log('Firebase config:', {
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
  });
}

// For debugging
if (import.meta.env.DEV) {
  console.log('Firebase initialized');
}


export default app;