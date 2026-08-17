import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";

/**
 * Reads the server's actual port from the .server-port file.
 * The server writes this file at startup once it finds an available port.
 * We poll for up to ~10 seconds in case the client starts before the server.
 */
function getServerPort(): number {
  const portFile = path.resolve(__dirname, "..", ".server-port");
  const maxAttempts = 100;
  const fallbackPort = 3001;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      if (fs.existsSync(portFile)) {
        const raw = fs.readFileSync(portFile, "utf-8").trim();
        const port = parseInt(raw, 10);
        if (!isNaN(port) && port > 0) return port;
      }
    } catch {
      // ignore read errors and keep polling
    }
    // Synchronous 100ms delay (config is evaluated synchronously)
    execSync("sleep 0.1");
  }

  console.warn(
    `[vite] Could not detect server port after ${maxAttempts} attempts — falling back to ${fallbackPort}`
  );
  return fallbackPort;
}

const serverPort = getServerPort();

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // If 5173 is in use, auto-increment to the next available port
    strictPort: false,
    proxy: {
      "/api": `http://localhost:${serverPort}`,
    },
  },
});