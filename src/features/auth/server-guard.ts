import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "./session";
import type { AuthedSession } from "./session";
import { getEffectiveRole } from "./role-resolver";
import { canAccess, type Role } from "./roles";

/**
 * Sesion aktif untuk Server Component (Next.js).
 */
export async function getServerSession(): Promise<AuthedSession | null> {
  const headerList = await headers();
  return getSession(headerList);
}

export interface ServerGuardResult {
  session: AuthedSession;
  role: Role;
}

/**
 * Guard halaman: wajib login. Redirect ke /login bila belum login.
 */
export async function requireServerAuth(): Promise<ServerGuardResult> {
  const session = await getServerSession();
  if (!session) {
    redirect("/login");
  }
  const role = await getEffectiveRole(session.user);
  return { session, role };
}

/**
 * Guard halaman admin: role minimum (default "admin").
 * Redirect ke / bila role kurang.
 */
export async function requireServerRole(minimum: Role = "admin"): Promise<ServerGuardResult> {
  const result = await requireServerAuth();
  if (!canAccess(result.role, minimum)) {
    redirect("/");
  }
  return result;
}
