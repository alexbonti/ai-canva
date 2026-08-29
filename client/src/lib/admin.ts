import { db } from "./firebase.js";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import type { User } from "firebase/auth";

const USERS_COLLECTION = "users";
const ADMINS_COLLECTION = "admins";

/** Whether the given UID is an admin (a doc exists at `admins/{uid}`). */
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const snap = await getDoc(doc(db, ADMINS_COLLECTION, uid));
    return snap.exists();
  } catch (err) {
    console.error("[admin] isAdmin check failed:", err);
    return false;
  }
}

/**
 * Records/refreshes the current user's profile in the `users` collection.
 * Preserves the original `createdAt` across re-logins (only set on first sight).
 */
export async function updateUserProfile(user: User): Promise<void> {
  const ref = doc(db, USERS_COLLECTION, user.uid);
  const existing = await getDoc(ref);
  const now = Date.now();
  await setDoc(
    ref,
    {
      email: user.email || "",
      displayName: user.displayName || user.email || "",
      photoURL: user.photoURL || "",
      // Only set createdAt on first creation so re-logins don't reset it.
      createdAt: existing.exists() ? existing.data()?.createdAt ?? now : now,
      lastActive: now,
    },
    { merge: true }
  );
}

/** Updates the user's `lastActive` heartbeat (used for "active now" stats). */
export async function heartbeat(user: User): Promise<void> {
  try {
    await updateDoc(doc(db, USERS_COLLECTION, user.uid), {
      lastActive: Date.now(),
    });
  } catch (err) {
    // Best-effort — ignore transient failures.
    console.error("[admin] heartbeat failed:", err);
  }
}

export interface AdminStats {
  generatedAt: number;
  users: { total: number; activeLast5m: number; newLast7d: number };
  boards: { total: number; newLast7d: number };
  storage: { bytes: number; files: number };
}

/**
 * Fetches system-wide admin stats from the backend.
 * Requires the caller to be an admin; the backend verifies the ID token.
 */
export async function fetchAdminStats(user: User): Promise<AdminStats> {
  const token = await user.getIdToken();
  const res = await fetch("/api/admin/stats", {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }
  return res.json();
}
