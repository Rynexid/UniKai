import { sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { profiles } from "../../db";

/**
 * Username publik: /{username} (case-insensitive, mis. /Adinfauzan, /adinfauzan, /adin-fauzan).
 * Selalu disimpan lowercase (alnum + hyphen) agar unik & bebas konflik URL.
 */

/** Segmen URL statis yang tidak boleh dipakai sebagai username. */
export const RESERVED_USERNAMES = new Set([
  "admin",
  "admins",
  "profile",
  "profiles",
  "dashboard",
  "login",
  "register",
  "sign-in",
  "sign-up",
  "logout",
  "explore",
  "jelajah",
  "discussions",
  "discussion",
  "thread",
  "threads",
  "buat",
  "create",
  "api",
  "auth",
  "search",
  "cari",
  "settings",
  "pengaturan",
  "notifications",
  "notifikasi",
  "users",
  "user",
  "pengguna",
  "reports",
  "report",
  "laporan",
  "moderation",
  "mod",
  "account",
  "akun",
  "home",
  "beranda",
  "feed",
  "komunitas",
  "marketplace",
  "acara",
  "sumber",
  "mengikuti",
]);

const NOUNS = [
  "kucing",
  "kelinci",
  "rubah",
  "harimau",
  "panda",
  "kura",
  "elang",
  "singa",
  "koala",
  "beruang",
  "kancil",
  "burung",
  "lumba",
  "paus",
  "komodo",
  "banteng",
];

const ADJECTIVES = [
  "galau",
  "periang",
  "pengembara",
  "cerdas",
  "pemimpi",
  "gigih",
  "seru",
  "penasaran",
  "ramah",
  "liar",
  "ceria",
  "bijak",
];

/**
 * Ubah nama menjadi slug username: huruf kecil, aksara dinormalisasi,
 * selain [a-z0-9] jadi hyphen. Kosong bila tidak ada karakter valid.
 */
export function slugifyUsername(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 24);
}

/** Username acak yang ramah: kata benda-kata sifat-angka. */
export function randomUsername(): string {
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const num = Math.floor(100 + Math.random() * 900);
  return `${noun}-${adj}-${num}`;
}

export function isValidUsername(value: string): boolean {
  return (
    /^[a-z0-9](?:[a-z0-9-]{1,30}[a-z0-9])?$/.test(value) &&
    value.length >= 3 &&
    value.length <= 32 &&
    !RESERVED_USERNAMES.has(value)
  );
}

export async function isUsernameTaken(username: string): Promise<boolean> {
  const rows = await db
    .select({ id: profiles.id })
    .from(profiles)
    .where(sql`lower(${profiles.username}) = lower(${username})`)
    .limit(1);
  return rows.length > 0;
}

/**
 * Buat username unik dari nama user (nama = username Discord saat login OAuth).
 * Bila nama tidak valid/terpakai -> fallback username acak.
 */
export async function generateUniqueUsername(baseName: string): Promise<string> {
  const desired = slugifyUsername(baseName ?? "");
  const base = !desired || RESERVED_USERNAMES.has(desired) ? randomUsername() : desired;

  for (let i = 0; i < 5; i++) {
    const attempt =
      i === 0
        ? base
        : `${base}-${Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 4)}`;
    if (!(await isUsernameTaken(attempt))) return attempt;
  }
  return `${randomUsername()}-${Date.now().toString(36)}`;
}

/**
 * Pastikan user punya baris profil (username). Dipanggil dari hook
 * Better Auth saat user baru dibuat dan dari skrip backfill.
 */
export async function ensureProfileWithUsername(user: {
  id: string;
  name: string;
}): Promise<string> {
  const username = await generateUniqueUsername(user.name ?? "");
  try {
    await db.insert(profiles).values({ userId: user.id, username });
    return username;
  } catch {
    // Konflik unik (race) — coba sekali lagi dengan suffix acak.
    const retry = `${username}-${Math.random().toString(36).replace(/[^a-z0-9]/g, "").slice(0, 4)}`;
    await db.insert(profiles).values({ userId: user.id, username: retry });
    return retry;
  }
}
