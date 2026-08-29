import { onRequest } from "firebase-functions/v2/https";
import express from "express";
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
    // Verify the caller's Firebase ID token.
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return res.status(401).json({ error: "Missing authorization token" });
    }
    let uid: string;
    try {
      const decoded = await getAuth().verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    // Only admins may read stats.
    const db = getFirestore();
    const adminSnap = await db.doc(`admins/${uid}`).get();
    if (!adminSnap.exists) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    const ACTIVE_WINDOW_MS = 5 * 60 * 1000;

    // Aggregate counts via Firestore count() queries.
    const [usersTotal, boardsTotal, usersNew, boardsNew, usersActive] = await Promise.all([
      db.collection("users").count().get(),
      db.collection("boards").count().get(),
      db.collection("users").where("createdAt", ">=", now - 7 * DAY_MS).count().get(),
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
        total: usersTotal.data().count,
        activeLast5m: usersActive.data().count,
        newLast7d: usersNew.data().count,
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

export const api = onRequest({ maxInstances: 5, timeoutSeconds: 120, memory: "512MiB" }, app);