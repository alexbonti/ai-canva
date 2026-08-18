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
} from "firebase/firestore";

export interface BoardDoc {
  id: string;
  title: string;
  ownerId: string;
  ownerEmail: string;
  nodes: unknown[];
  edges: unknown[];
  boxData: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}

const BOARDS_COLLECTION = "boards";

/** Saves a board to Firestore (creates or overwrites). */
export async function saveBoard(board: BoardDoc): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, board.id);
  await setDoc(
    ref,
    {
      title: board.title,
      ownerId: board.ownerId,
      ownerEmail: board.ownerEmail,
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
  const data = snap.data();
  return {
    id: snap.id,
    title: data.title || "Untitled",
    ownerId: data.ownerId || "",
    ownerEmail: data.ownerEmail || "",
    nodes: data.nodes || [],
    edges: data.edges || [],
    boxData: data.boxData || {},
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now(),
  };
}

/** Lists all boards owned by a user, newest first. */
export async function listBoards(userId: string): Promise<BoardDoc[]> {
  const q = query(
    collection(db, BOARDS_COLLECTION),
    where("ownerId", "==", userId),
    limit(50)
  );
  const snap = await getDocs(q);
  const boards = snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      title: data.title || "Untitled",
      ownerId: data.ownerId || "",
      ownerEmail: data.ownerEmail || "",
      nodes: data.nodes || [],
      edges: data.edges || [],
      boxData: data.boxData || {},
      createdAt: data.createdAt || Date.now(),
      updatedAt: data.updatedAt || Date.now(),
    };
  });
  // Sort client-side by updatedAt desc (avoids needing a composite index)
  return boards.sort((a, b) => b.updatedAt - a.updatedAt);
}

/** Deletes a board by ID. */
export async function deleteBoard(boardId: string): Promise<void> {
  const ref = doc(db, BOARDS_COLLECTION, boardId);
  await deleteDoc(ref);
}