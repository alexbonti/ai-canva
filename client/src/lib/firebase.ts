import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAxrnXWRqwvmT2i3eRM60ZkUlxJoDOYAVI",
  authDomain: "carbondocs.firebaseapp.com",
  projectId: "carbondocs",
  storageBucket: "carbondocs.firebasestorage.app",
  messagingSenderId: "204832558744",
  appId: "1:204832558744:web:38a6b5d7887160fdc64aed",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);