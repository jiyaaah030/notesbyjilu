import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAvWIaOsjVRKQOxWGcTCMB9jSCfLtFO_M4",
  authDomain: "notesbyjilu-59f55.firebaseapp.com",
  projectId: "notesbyjilu-59f55",
  storageBucket: "notesbyjilu-59f55.firebasestorage.app",
  messagingSenderId: "243570053887",
  appId: "1:243570053887:web:065a0eee9f5285e8a5b2ca",
  measurementId: "G-0NP7ZXYHYT"
};

// Initialize Firebase safely
const app = initializeApp(firebaseConfig);
// const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
// const analytics = getAnalytics(app);

export { auth };
