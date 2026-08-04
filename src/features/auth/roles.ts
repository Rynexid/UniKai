/**
 * Role pengguna UniKai, dari tertinggi ke terendah:
 *  - sudo   : pemilik platform (Riu)
 *  - admin  : administrator platform
 *  - mod    : moderator komunitas
 *  - warga  : pengguna biasa (default)
 *
 * Modul ini MURNI (tanpa impor DB/neon) agar aman dipakai di komponen client.
 */
export const ROLES = ["sudo", "admin", "mod", "warga"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  sudo: "Sudo",
  admin: "Admin",
  mod: "Mod",
  warga: "Warga",
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  sudo: "Pemilik platform dengan akses penuh.",
  admin: "Administrator dengan kendali platform.",
  mod: "Moderator komunitas & konten.",
  warga: "Anggota komunitas biasa.",
};

const ROLE_RANK: Record<Role, number> = {
  sudo: 4,
  admin: 3,
  mod: 2,
  warga: 1,
};

/**
 * Discord User ID milik Riu (pemilik). Akun Discord ini selalu dianggap Sudo
 * meskipun kolom role di DB belum di-set. Bisa dioverride lewat env.
 */
export const SUDO_DISCORD_ID = process.env.SUDO_DISCORD_ID ?? "1020644780075659356";

export function normalizeRole(value: unknown): Role {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value)
    ? (value as Role)
    : "warga";
}

export function canAccess(role: Role, minimum: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[minimum];
}

export function hasRole(user: { role?: string | null }, minimum: Role): boolean {
  return canAccess(normalizeRole(user?.role), minimum);
}
