import { and, eq } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { account, user as userTable } from "../../db";
import { normalizeRole, SUDO_DISCORD_ID, type Role } from "./roles";

/**
 * Role efektif pengguna:
 *  1. Sudah tersimpan "sudo" -> sudo.
 *  2. Pemilik (Riu) login lewat Discord -> sudo (dan di-persist ke DB).
 *  3. Selain itu -> role tersimpan.
 *
 * Modul ini bergantung pada DB sehingga hanya boleh dipakai di server.
 */
export async function getEffectiveRole(user: {
  id: string;
  role?: string | null;
}): Promise<Role> {
  const stored = normalizeRole(user.role);
  if (stored === "sudo") return "sudo";

  const rows = await db
    .select({ accountId: account.accountId })
    .from(account)
    .where(and(eq(account.userId, user.id), eq(account.providerId, "discord")))
    .limit(1);

  if (rows[0]?.accountId === SUDO_DISCORD_ID) {
    if ((user.role ?? null) !== "sudo") {
      void db
        .update(userTable)
        .set({ role: "sudo" })
        .where(eq(userTable.id, user.id))
        .catch(() => {});
    }
    return "sudo";
  }

  return stored;
}

export async function isDiscordAccount(
  userId: string,
  discordId: string,
): Promise<boolean> {
  const rows = await db
    .select({ accountId: account.accountId })
    .from(account)
    .where(and(eq(account.userId, userId), eq(account.providerId, "discord")))
    .limit(1);
  return rows[0]?.accountId === discordId;
}
