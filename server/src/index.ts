import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { generateContent } from "./claude.js";
import { generateCartoonImage } from "./fal.js";
import { generateStitchUI } from "./stitch.js";
import { findPort } from "./findPort.js";

dotenv.config();

const app = express();
const PREFERRED_PORT = Number(process.env.PORT) || 3001;

// Resolve the project root (two levels up from src/index.ts)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "../..");
const PORT_FILE = path.join(PROJECT_ROOT, ".server-port");

app.use(cors());
app.use(express.json({ limit: "10mb" }));

/**
 * POST /api/generate
 * Body: { systemPrompt: string, userPrompt: string }
 * Returns: { content: string }
 */
app.post("/api/generate", async (req, res) => {
  try {
    const { systemPrompt, userPrompt } = req.body as {
      systemPrompt?: string;
      userPrompt?: string;
    };

    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({ error: "userPrompt is required" });
    }

    const content = await generateContent(
      systemPrompt || "You are a helpful assistant.",
      userPrompt
    );

    res.json({ content });
  } catch (err: any) {
    console.error("[/api/generate] Error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to generate content",
    });
  }
});

/**
 * POST /api/generate-image
 * Body: { prompt: string, imageUrl?: string }
 * Returns: { imageUrl: string }
 *
 * Generates a cartoon profile picture via fal.ai.
 * If imageUrl is provided, uses image-to-image (cartoonify).
 * Otherwise, uses text-to-image (flux schnell) as fallback.
 */
app.post("/api/generate-image", async (req, res) => {
  try {
    const { prompt, imageUrl } = req.body as {
      prompt?: string;
      imageUrl?: string;
    };

    if (!prompt && !imageUrl) {
      return res.status(400).json({
        error: "Either prompt or imageUrl is required",
      });
    }

    const resultUrl = await generateCartoonImage({
      prompt: prompt || "Cartoon style profile picture",
      imageUrl,
    });

    res.json({ imageUrl: resultUrl });
  } catch (err: any) {
    console.error("[/api/generate-image] Error:", err.message);
    res.status(500).json({
      error: err.message || "Failed to generate image",
    });
  }
});

/**
 * POST /api/stitch-generate
 * Body: { prompt: string }
 * Returns: { html: string, imageUrl: string }
 *
 * Generates a UI screen using Google Stitch.
 */
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

/**
 * GET /api/health — simple health check
 */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    anthropicKey: process.env.ANTHROPIC_API_KEY ? "configured" : "missing",
    falKey: process.env.FAL_KEY ? "configured" : "missing",
    stitchKey: process.env.STITCH_API_KEY ? "configured" : "missing",
  });
});

// Find an available port (auto-increments if the preferred port is in use)
findPort(PREFERRED_PORT).then((actualPort) => {
  // Write the actual port to a file so the Vite client can read it
  // and proxy /api requests to the correct server address.
  fs.writeFileSync(PORT_FILE, String(actualPort));

  app.listen(actualPort, () => {
    if (actualPort !== PREFERRED_PORT) {
      console.warn(
        `[server] Port ${PREFERRED_PORT} was in use — switched to ${actualPort}`
      );
    }
    console.log(`[server] Running on http://localhost:${actualPort}`);

    if (!process.env.ANTHROPIC_API_KEY) {
      console.warn(
        "[server] ANTHROPIC_API_KEY not set — AI generation will fail. Add it to server/.env"
      );
    }
  });
});