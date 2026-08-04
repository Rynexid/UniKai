import { eq, and, isNull, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { notifications } from "../../db";

export interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  relatedUrl: string | null;
  read: boolean;
  createdAt: string;
}

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  content?: string | null;
  relatedUrl?: string | null;
}

/** Simpan notifikasi (dipanggil setelah aksi user, sebelum publish realtime). */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationItem> {
  const [row] = await db
    .insert(notifications)
    .values({
      userId: input.userId,
      type: input.type,
      title: input.title,
      content: input.content ?? null,
      relatedUrl: input.relatedUrl ?? null,
    })
    .returning();
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    relatedUrl: row.relatedUrl,
    read: row.readAt !== null,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listNotifications(
  userId: string,
  limit = 30,
): Promise<NotificationItem[]> {
  const rows = await db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    columns: { id: true, type: true, title: true, content: true, relatedUrl: true, readAt: true, createdAt: true },
    orderBy: (n, { desc }) => [desc(n.createdAt)],
    limit,
  });
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title,
    content: r.content,
    relatedUrl: r.relatedUrl,
    read: r.readAt !== null,
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getUnreadNotificationCount(userId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
  return Number(row?.n ?? 0);
}

export async function markNotificationsRead(userId: string): Promise<void> {
  await db
    .update(notifications)
    .set({ readAt: new Date() })
    .where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));
}
