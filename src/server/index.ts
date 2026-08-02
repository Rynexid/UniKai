import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { config } from "../config";
import errorHandler from "../middleware/error";
import authRouter from "../app/api/auth/route";
import communitiesRouter from "../app/api/communities/route";
import discussionsRouter from "../app/api/discussions/route";

/**
 * Composition root Hono. Semua route handler per-domain di-mount di sini.
 * Entry runtime: server/dev.ts (Bun) & server/vercel.ts (Vercel function).
 */
const app = new Hono();

// --- Global middleware ---
app.use("*", honoLogger());
app.use(
  "*",
  cors({
    origin: config.appUrl,
    credentials: true, // wajib true agar cookie session Better Auth ikut terkirim
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
  }),
);
app.onError(errorHandler);

// --- Route handlers per domain (lihat src/server/app/) ---
app.route("/api/auth", authRouter);
app.route("/api/communities", communitiesRouter);
app.route("/api/discussions", discussionsRouter);

// TODO: mount domain berikut setelah route handler-nya tersedia:
//   users, marketplace, resources, articles, events, notifications, search

app.get("/api/health", (c) => c.json({ status: "ok" }));

export { app };
