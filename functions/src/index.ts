import { onRequest } from "firebase-functions/v2/https";
import express, { type Request } from "express";
import cors from "cors";
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { generateContent } from "./ollama.js";
import { generateCartoonImage } from "./fal.js";
import { generateStitchUI } from "./stitch.js";

// Initialize the Admin SDK (uses the Cloud Function's default credentials).
initializeApp();

/**
 * Counts registered users (and those created in the last `newWindowMs`) from
 * Firebase Authentication. Auth is the authoritative source of registered users —
 * the `users` collection only tracks login heartbeats and undercounts accounts
 * that signed up before client-side tracking existed.
 */
async function countAuthUsers(now: number, newWindowMs: number): Promise<{ total: number; newLast7d: number }> {
  const auth = getAuth();
  const cutoff = now - newWindowMs;
  let total = 0;
  let newLast7d = 0;
  let nextPageToken: string | undefined;
  do {
    const result = await auth.listUsers(1000, nextPageToken);
    for (const u of result.users) {
      total += 1;
      const createdMs = u.metadata?.creationTime
        ? new Date(u.metadata.creationTime).getTime()
        : 0;
      if (createdMs >= cutoff) newLast7d += 1;
    }
    nextPageToken = result.pageToken;
  } while (nextPageToken);
  return { total, newLast7d };
}

/**
 * Verifies that a request is from an admin. Returns the caller's UID on
 * success, or an error descriptor `{ status, error }` on failure.
 */
async function requireAdmin(req: Request): Promise<{ uid: string } | { status: number; error: string }> {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { status: 401, error: "Missing authorization token" };
  }
  let uid: string;
  try {
    uid = (await getAuth().verifyIdToken(token)).uid;
  } catch {
    return { status: 401, error: "Invalid or expired token" };
  }
  const adminSnap = await getFirestore().doc(`admins/${uid}`).get();
  if (!adminSnap.exists) {
    return { status: 403, error: "Forbidden" };
  }
  return { uid };
}

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: "10mb" }));

app.post("/api/generate", async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body as { systemPrompt?: string; userPrompt?: string };
    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({ error: "userPrompt is required" });
    }
    const content = await generateContent(systemPrompt || "You are a helpful assistant.", userPrompt);
    res.json({ content });
  } catch (err: any) {
    console.error("[/api/generate] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate content" });
  }
});

app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, imageUrl } = req.body as { prompt?: string; imageUrl?: string };
    if (!prompt && !imageUrl) {
      return res.status(400).json({ error: "Either prompt or imageUrl is required" });
    }
    const resultUrl = await generateCartoonImage({ prompt: prompt || "Cartoon style profile picture", imageUrl });
    res.json({ imageUrl: resultUrl });
  } catch (err: any) {
    console.error("[/api/generate-image] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate image" });
  }
});

app.post("/api/stitch-generate", async (req, res) => {
  try {
    const { prompt } = req.body as { prompt?: string };
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "prompt is required" });
    }
    const result = await generateStitchUI(prompt);
    res.json(result);
  } catch (err: any) {
    console.error("[/api/stitch-generate] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to generate UI" });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    ollamaKey: process.env.OLLAMA_API_KEY ? "configured" : "missing",
    falKey: process.env.FAL_KEY ? "configured" : "missing",
    stitchKey: process.env.STITCH_API_KEY ? "configured" : "missing",
  });
});

/**
 * GET /api/admin/stats
 * Admin-only. Returns system-wide usage stats (users, boards, storage).
 *
 * Auth: `Authorization: Bearer <Firebase ID token>`. The caller must be an
 * admin (a doc must exist at `admins/{uid}`). Stats are computed with the
 * Admin SDK so sensitive aggregates are never exposed to client Firestore rules.
 */
app.get("/api/admin/stats", async (req, res) => {
  try {
    // Verify the caller is an admin.
    const auth = await requireAdmin(req);
    if ("status" in auth) {
      return res.status(auth.status).json({ error: auth.error });
    }

    const db = getFirestore();
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

    // Total/new users come from Auth; active users come from the heartbeat
    // docs the client writes to the `users` collection. Boards/storage from
    // Firestore/Storage.
    const [authUsers, boardsTotal, boardsNew, usersActive] = await Promise.all([
      countAuthUsers(now, 7 * DAY_MS),
      db.collection("boards").count().get(),
      db.collection("boards").where("createdAt", ">=", now - 7 * DAY_MS).count().get(),
      db.collection("users").where("lastActive", ">=", now - ACTIVE_WINDOW_MS).count().get(),
    ]);

    // Storage usage: sum file sizes in the default bucket.
    let storageBytes = 0;
    let storageFiles = 0;
    const [files] = await getStorage().bucket().getFiles();
    for (const f of files) {
      storageBytes += Number(f.metadata?.size || 0);
      storageFiles += 1;
    }

    res.json({
      generatedAt: now,
      users: {
        total: authUsers.total,
        activeLast5m: usersActive.data().count,
        newLast7d: authUsers.newLast7d,
      },
      boards: {
        total: boardsTotal.data().count,
        newLast7d: boardsNew.data().count,
      },
      storage: { bytes: storageBytes, files: storageFiles },
    });
  } catch (err: any) {
    console.error("[/api/admin/stats] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to load admin stats" });
  }
});

/**
 * GET /api/admin/users?pageToken=...
 * Admin-only. Lists registered users from Firebase Auth (paginated).
 */
app.get("/api/admin/users", async (req, res) => {
  try {
    const auth = await requireAdmin(req);
    if ("status" in auth) {
      return res.status(auth.status).json({ error: auth.error });
    }
    const pageToken = typeof req.query.pageToken === "string" ? req.query.pageToken : undefined;
    const result = await getAuth().listUsers(200, pageToken);
    const users = result.users.map((u) => ({
      uid: u.uid,
      email: u.email || "",
      displayName: u.displayName || u.email || "",
      photoURL: u.photoURL || "",
      disabled: !!u.disabled,
      createdAt: u.metadata?.creationTime || null,
      lastSignIn: u.metadata?.lastSignInTime || null,
    }));
    res.json({ users, nextPageToken: result.pageToken || null });
  } catch (err: any) {
    console.error("[/api/admin/users] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to list users" });
  }
});

/**
 * POST /api/admin/users/:uid/status   { disabled: boolean }
 * Admin-only. Blocks (disabled: true) or unblocks (disabled: false) an account.
 * An admin cannot block their own account.
 */
app.post("/api/admin/users/:uid/status", async (req, res) => {
  try {
    const auth = await requireAdmin(req);
    if ("status" in auth) {
      return res.status(auth.status).json({ error: auth.error });
    }
    const { uid } = req.params;
    if (uid === auth.uid) {
      return res.status(400).json({ error: "You cannot block your own account" });
    }
    const disabled = Boolean(req.body?.disabled);
    await getAuth().updateUser(uid, { disabled });
    res.json({ uid, disabled });
  } catch (err: any) {
    if (err?.code === "auth/user-not-found") {
      return res.status(404).json({ error: "User not found" });
    }
    console.error("[/api/admin/users/:uid/status] Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to update user" });
  }
});

export const api = onRequest({ maxInstances: 5, timeoutSeconds: 120, memory: "512MiB" }, app);