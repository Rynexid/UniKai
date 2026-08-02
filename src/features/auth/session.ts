import { auth } from "../../infrastructure/auth";
import type { User, Session } from "better-auth";

export interface AuthedSession {
  user: User;
  session: Session;
}

/**
 * Ambil sesi aktif dari header request (Better Auth).
 * Business-logic layer - middleware hanya memakai hasilnya sebagai guard HTTP.
 */
export async function getSession(headers: Headers): Promise<AuthedSession | null> {
  const result = await auth.api.getSession({ headers });
  if (!result) return null;
  return { user: result.user as User, session: result.session as Session };
}
