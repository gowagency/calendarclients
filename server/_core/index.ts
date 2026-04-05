import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// Hostname → client path mapping
// Supports: junior.railway.app, aliny.railway.app, junior.gow.agency, aliny.gow.agency
const HOSTNAME_MAP: Record<string, string> = {
  junior: "/juniorlopes",
  aliny: "/alinyrayze",
};

function getClientPathFromHost(hostname: string): string | null {
  const sub = hostname.split(".")[0].toLowerCase();
  return HOSTNAME_MAP[sub] ?? null;
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Redirect subdomain root → correct client path
  app.use((req, res, next) => {
    const clientPath = getClientPathFromHost(req.hostname);
    if (clientPath && !req.path.startsWith(clientPath) && !req.path.startsWith("/api")) {
      return res.redirect(301, clientPath);
    }
    next();
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} busy, using port ${port}`);
  }

  server.listen(port, () => {
    console.log(`Gow Calendar running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
