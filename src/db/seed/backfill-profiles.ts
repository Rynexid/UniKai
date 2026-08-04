/*
 * Backfill username untuk user yang belum punya baris profil.
 * Jalankan: bun --env-file=.env src/db/seed/backfill-profiles.ts
 */
import { db } from "../../infrastructure/database";
import { user, profiles } from "../../db";
import { ensureProfileWithUsername } from "../../features/users/usernames";

const [users, existingProfiles] = await Promise.all([
  db.select({ id: user.id, name: user.name, email: user.email }).from(user),
  db.select({ userId: profiles.userId }).from(profiles),
]);

const haveProfile = new Set(existingProfiles.map((p) => p.userId));
const missing = users.filter((u) => !haveProfile.has(u.id));

console.log(`Total user: ${users.length}, tanpa profil: ${missing.length}`);

let ok = 0;
let failed = 0;
for (const u of missing) {
  try {
    const username = await ensureProfileWithUsername(u);
    console.log(`+ ${u.email} -> @${username}`);
    ok++;
  } catch (e) {
    console.error(`! ${u.email} gagal:`, e instanceof Error ? e.message : e);
    failed++;
  }
}

console.log(`Selesai: ${ok} berhasil, ${failed} gagal.`);
process.exit(failed ? 1 : 0);
