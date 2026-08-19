import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, setPersistence, browserLocalPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyAxrnXWRqwvmT2i3eRM60ZkUlxJoDOYAVI",
  authDomain: "carbondocs.firebaseapp.com",
  projectId: "carbondocs",
  storageBucket: "carbondocs.firebasestorage.app",
  messagingSenderId: "204832558744",
  appId: "1:204832558744:web:38a6b5d7887160fdc64aed",
};

const app = initializeApp(firebaseConfig);

// Use localStorage for Auth persistence instead of the default IndexedDB.
// This avoids conflicts between Auth's IndexedDB and Firestore's IndexedDB cache.
const auth = getAuth(app);
setPersistence(auth, browserLocalPersistence).catch(console.error);

export { auth };
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
