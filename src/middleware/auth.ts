import type { Context, Next } from "hono";
import { getSession } from "../features/auth/session";
import type { User, Session } from "better-auth";

// Augmentasi tipe Hono Context agar c.get("user") / c.get("session") type-safe
declare module "hono" {
  interface ContextVariableMap {
    user: User;
    session: Session;
  }
}

/**
 * Middleware wajib login. Pasang di route yang butuh autentikasi,
 * misal: app.post("/api/discussions/threads", requireAuth, handler)
 */
export async function requireAuth(c: Context, next: Next) {
  const session = await getSession(c.req.raw.headers);

  if (!session) {
    return c.json({ error: "Unauthorized. Silakan login terlebih dahulu." }, 401);
  }

  c.set("user", session.user);
  c.set("session", session.session);
  await next();
}

/**
 * Middleware opsional: tidak memblokir request tanpa session,
 * tapi tetap mengisi c.get("user") jika ada - berguna untuk endpoint publik
 * yang perlu tahu "apakah user ini sudah like/bookmark thread ini".
 */
export async function attachSessionIfExists(c: Context, next: Next) {
  const session = await getSession(c.req.raw.headers);
  if (session) {
    c.set("user", session.user);
    c.set("session", session.session);
  }
  await next();
}
