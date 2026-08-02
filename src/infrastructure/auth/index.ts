import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { dash } from "@better-auth/infra";
import { db } from "../database";
import { user, session, account, verification } from "../../db";

/**
 * Instance Better Auth tunggal, di-share ke seluruh route API.
 * Terhubung ke Neon via Drizzle (driver @neondatabase/serverless).
 */
export const auth = betterAuth({
  baseURL: process.env.PUBLIC_APP_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: { user, session, account, verification },
  }),

  // --- Email & Password ---
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // set true di production + tambahkan emailVerification hook
    minPasswordLength: 8,
  },

  // --- OAuth Social Login ---
  socialProviders: {
    discord: {
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
      // Discord bisa mengembalikan email null (akun phone-only).
      // Fallback: pakai email sintetis berbasis id agar akun tetap bisa dibuat.
      mapProfileToUser: (profile) => {
        const p = profile as unknown as Record<string, unknown>;
        const avatar = typeof p.avatar === "string" ? p.avatar : null;
        const username = typeof p.username === "string" ? p.username : null;
        const rawName = typeof p.name === "string" ? p.name : null;
        const rawEmail = typeof p.email === "string" ? p.email : null;
        const id = String(p.id ?? "discord");

        return {
          name: rawName ?? username ?? `Discord ${id}`,
          email: rawEmail && rawEmail.length > 0 ? rawEmail : `${id}@users.unikai.invalid`,
          image:
            typeof p.image_url === "string" && p.image_url
              ? p.image_url
              : avatar
                ? `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`
                : undefined,
          emailVerified: true, // email Discord sudah diverifikasi oleh Discord
        };
      },
    },
  },

  // --- Session & Performance ---
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 hari
    updateAge: 60 * 60 * 24, // perpanjang sekali per 1 hari saja
    cookieCache: {
      enabled: true, // simpan payload session di cookie terenkripsi
      maxAge: 60 * 5, // 5 menit - di rentang ini, validasi session TIDAK query ke DB
    },
  },

  // --- Plugin Dashboard Better Auth (dash.better-auth.com) ---
  plugins: [dash()],

  // --- Keamanan ---
  advanced: {
    // Neon selalu di belakang HTTPS (Vercel/Cloudflare), maka secure cookie wajib di production
    useSecureCookies: process.env.NODE_ENV === "production",
  },

  trustedOrigins: [
    process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
    "http://localhost:5173",
    "http://localhost:5174",
  ],
});

export type Auth = typeof auth;
