import net from "net";

/**
 * Finds an available TCP port starting from `startPort`.
 * If `startPort` is in use, increments until a free port is found.
 *
 * Checks the same binding that Express uses by default (all interfaces,
 * IPv4+IPv6) — no explicit host is passed to listen(), matching
 * `app.listen(port)` behavior.
 *
 * @param startPort The preferred port to try first
 * @param maxAttempts Maximum number of ports to try (default 100)
 * @returns The first available port
 */
export function findPort(startPort: number, maxAttempts = 100): Promise<number> {
  return new Promise((resolve, reject) => {
    let attempts = 0;

    const tryPort = (port: number) => {
      if (attempts >= maxAttempts) {
        reject(
          new Error(
            `No available port found after ${maxAttempts} attempts starting from ${startPort}`
          )
        );
        return;
      }
      attempts++;

      const tester = net.createServer();
      tester.once("error", (err: any) => {
        if (err.code === "EADDRINUSE") {
          // Port in use — try the next one
          tryPort(port + 1);
        } else {
          reject(err);
        }
      });

      tester.once("listening", () => {
        // Port is free — close the tester and resolve
        tester.close(() => resolve(port));
      });

      // No host specified — matches Express app.listen(port) default
      // which binds to all interfaces (IPv4 0.0.0.0 and IPv6 ::)
      tester.listen(port);
    };

    tryPort(startPort);
  });
}