import { onRequest } from "firebase-functions/v2/https";
import express from "express";
import cors from "cors";
import { generateContent } from "./claude.js";
import { generateCartoonImage } from "./fal.js";

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

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    anthropicKey: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
    falKey: process.env.FAL_KEY ? "configured" : "missing",
  });
});

export const api = onRequest({ maxInstances: 5, timeoutSeconds: 60, memory: "512MiB" }, app);