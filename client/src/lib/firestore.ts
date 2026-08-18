import { db } from "./firebase.js";
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  limit,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  updateDoc,
  setDoc as setDocPresence,
} from "firebase/firestore";
import type { PresenceUser } from "../types.js";

export interface BoardDoc {
  id: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  collaborators: string[];
  nodes: unknown[];
  edges: unknown[];
  boxData: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const BOARDS_COLLECTION = "boards";

function parseBoard(id: string, data: Record<string, any>): BoardDoc {
  return {
    id,
    title: data.title || "Untitled",
    ownerId: data.ownerId || "",
    ownerEmail: data.ownerEmail || "",
    collaborators: data.collaborators || [],
    nodes: data.nodes || [],
    edges: data.edges || [],
    boxData: data.boxData || {},
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
  };
}

/** Saves a board to Firestore (creates or overwrites). */
export async function saveBoard(board: BoardDoc): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, board.id);
  await setDoc(
    ref,
    {
      title: board.title,
      ownerId: board.ownerId,
      ownerEmail: board.ownerEmail,
      collaborators: board.collaborators || [],
      nodes: board.nodes,
      edges: board.edges,
      boxData: board.boxData,
      createdAt: board.createdAt,
      updatedAt: board.updatedAt,
    },
    { merge: true }
  );
}

/** Loads a single board by ID. */
export async function loadBoard(boardId: string): Promise<BoardDoc | null> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return parseBoard(snap.id, snap.data() as Record<string, any>);
}

/** Lists all boards owned by a user, newest first. */
export async function listBoards(userId: string): Promise<BoardDoc[]> {
  const q = query(
    collection(db, BOARDS_COLLECTION),
    where("ownerId", "==", userId),
    limit(50)
  );
  const snap = await getDocs(q);
  const boards = snap.docs.map((d) => parseBoard(d.id, d.data() as Record<string, any>));
  return boards.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Lists boards shared with a user by email, newest first. */
export async function listSharedBoards(userEmail: string): Promise<BoardDoc[]> {
  const q = query(
    collection(db, BOARDS_COLLECTION),
    where("collaborators", "array-contains", userEmail),
    limit(50)
  );
  const snap = await getDocs(q);
  const boards = snap.docs.map((d) => parseBoard(d.id, d.data() as Record<string, any>));
  return boards.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Deletes a board by ID. */
export async function deleteBoard(boardId: string): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  await deleteDoc(ref);
}

/** Updates only mutable board fields (nodes, edges, boxData, title, updatedAt).
 * Does NOT overwrite ownerId, ownerEmail, or createdAt.
 * This allows collaborators to save changes without claiming ownership.
 */
export async function updateBoardData(
  boardId: string,
  data: {
    title?: string;
    collaborators?: string[];
    nodes?: unknown[];
    edges?: unknown[];
    boxData?: Record<string, unknown>;
    updatedAt: number;
  }
): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  await updateDoc(ref, data as Record<string, unknown>);
}

// === Real-time subscription ===

/** Subscribes to real-time board updates. Returns an unsubscribe function. */
export function subscribeToBoard(
  boardId: string,
  callback: (board: BoardDoc) => void
): () => void {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  return onSnapshot(
    ref,
    (snap) => {
      if (snap.exists()) {
        callback(parseBoard(snap.id, snap.data() as Record<string, any>));
      }
    },
    (err) => console.error("[firestore] Board subscription error:", err.message)
  );
}

// === Presence (live cursors) ===

/** Subscribes to presence updates for a board. Returns an unsubscribe function. */
export function subscribeToPresence(
  boardId: string,
  callback: (users: PresenceUser[]) => void
): () => void {
  const colRef = collection(db, BOARDS_COLLECTION, boardId, "presence");
  return onSnapshot(
    colRef,
    (snap) => {
    const now = Date.now();
    const users: PresenceUser[] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as Record<string, any>;
      // Filter out stale entries (last active > 30s ago)
      if (data.lastActive && now - data.lastActive < 30000) {
        users.push({
          userId: data.userId || d.id,
          email: data.email || "",
          displayName: data.displayName || "",
          initials: data.initials || "",
          color: data.color || "#94a3b8",
          cursorX: data.cursorX ?? 0,
          cursorY: data.cursorY ?? 0,
        });
      }
    });
    callback(users);
    },
    (err) => console.error("[firestore] Presence subscription error:", err.message)
  );
}

/** Updates the current user's presence (cursor position + heartbeat). */
export async function updatePresence(
  boardId: string,
  userId: string,
  data: Partial<PresenceUser>
): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId, "presence", userId);
  await setDocPresence(ref, { ...data, lastActive: Date.now() }, { merge: true });
}

/** Removes the current user's presence when they leave. */
export async function removePresence(boardId: string, userId: string): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId, "presence", userId);
  try {
    await deleteDoc(ref);
  } catch {
    // ignore — might already be deleted
  }
}

// === Sharing ===

/** Adds collaborator emails to a board. */
export async function shareBoard(boardId: string, emails: string[]): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  await updateDoc(ref, { collaborators: arrayUnion(...emails) });
}

/** Removes a collaborator email from a board. */
export async function unshareBoard(boardId: string, email: string): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  await updateDoc(ref, { collaborators: arrayRemove(email) });
}
