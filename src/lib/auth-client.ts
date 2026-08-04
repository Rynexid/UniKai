import { createAuthClient } from "better-auth/react";

/**
 * Better Auth React client.
 * Semua request ke /api/* (single origin, Next dev/build) — cookie session
 * dikirim otomatis oleh browser.
 */
const origin =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.PUBLIC_APP_URL ?? "http://localhost:3000";

export const authClient = createAuthClient({
  baseURL: `${origin}/api/auth`,
});

export const { signIn, signUp, signOut, useSession } = authClient;
