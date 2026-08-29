import { auth, googleProvider } from "./firebase.js";
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

export async function signInWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(auth, callback);
}

// --- E2E test helpers (unused by the app UI, so tree-shaken from prod) ---
// The E2E suite (client/e2e.mjs) imports this module from the Vite dev server
// and signs in with email/password — the prod UI only offers Google. Requires
// the Email/Password provider to be enabled in Firebase Auth (see AGENTS.md
// "E2E suite"). Test accounts are created/removed by the suite itself.

export async function createTestAccount(email: string, password: string): Promise<User> {
  const { createUserWithEmailAndPassword } = await import("firebase/auth");
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function signInTestAccount(email: string, password: string): Promise<User> {
  const { signInWithEmailAndPassword } = await import("firebase/auth");
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}