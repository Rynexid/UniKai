import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { config } from "../config";
import errorHandler from "../middleware/error";
import authRouter from "./routes/auth";
import adminRouter from "./routes/admin";
import ablyRouter from "./routes/ably";
import communitiesRouter from "./routes/communities";
import discussionsRouter from "./routes/discussions";
import dmRouter from "./routes/dms";
import engagementRouter from "./routes/engagement";
import notificationsRouter from "./routes/notifications";
import uploadsRouter from "./routes/uploads";
import usersRouter from "./routes/users";

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
app.route("/api/admin", adminRouter);
app.route("/api/ably", ablyRouter);
app.route("/api/communities", communitiesRouter);
app.route("/api/discussions", discussionsRouter);
app.route("/api/dms", dmRouter);
app.route("/api/engagement", engagementRouter);
app.route("/api/notifications", notificationsRouter);
app.route("/api/uploads", uploadsRouter);
app.route("/api/users", usersRouter);

// TODO: mount domain berikut setelah route handler-nya tersedia:
//   users, marketplace, resources, articles, events, notifications, search

app.get("/api/health", (c) => c.json({ status: "ok" }));

export { app };
