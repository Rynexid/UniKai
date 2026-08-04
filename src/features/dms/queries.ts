import { eq, and, or, sql, desc, count, ilike } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { dmRooms, dmMessages } from "../../db";
import { profiles } from "../../db";
import { user } from "../../db";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DmProfile {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
}

export interface DmMessage {
  id: string;
  roomId: string;
  content: string;
  imageUrl: string | null;
  senderId: string;
  createdAt: string;
  sender: DmProfile;
}

export interface DmRoomListItem {
  roomId: string;
  otherUser: DmProfile;
  lastMessage: { content: string; senderId: string; createdAt: string } | null;
  unreadCount: number;
  updatedAt: string;
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function normalizePair(a: string, b: string): [string, string] {
  return a < b ? [a, b] : [b, a];
}

export async function isDmMember(
  roomId: string,
  userId: string,
): Promise<boolean> {
  const room = await db.query.dmRooms.findFirst({
    where: eq(dmRooms.id, roomId),
    columns: { userA: true, userB: true },
  });
  if (!room) return false;
  return room.userA === userId || room.userB === userId;
}

/* ------------------------------------------------------------------ */
/*  Room operations                                                    */
/* ------------------------------------------------------------------ */

/**
 * Cari atau buat room DM antara dua user.
 * Room selalu 1:1 — pair di-normalize (userA < userB).
 */
export async function getOrCreateDmRoom(
  userId1: string,
  userId2: string,
): Promise<string> {
  if (userId1 === userId2) throw new Error("Tidak bisa DM diri sendiri.");

  const [a, b] = normalizePair(userId1, userId2);

  const existing = await db.query.dmRooms.findFirst({
    where: and(eq(dmRooms.userA, a), eq(dmRooms.userB, b)),
    columns: { id: true },
  });
  if (existing) return existing.id;

  const [created] = await db
    .insert(dmRooms)
    .values({ userA: a, userB: b })
    .onConflictDoNothing()
    .returning({ id: dmRooms.id });

  if (created) return created.id;

  const fallback = await db.query.dmRooms.findFirst({
    where: and(eq(dmRooms.userA, a), eq(dmRooms.userB, b)),
    columns: { id: true },
  });
  if (fallback) return fallback.id;

  throw new Error("Gagal membuat ruang DM.");
}

/* ------------------------------------------------------------------ */
/*  List rooms for user                                                 */
/* ------------------------------------------------------------------ */

export async function listDmRoomsForUser(
  userId: string,
): Promise<DmRoomListItem[]> {
  const roomRows = await db
    .select({
      roomId: dmRooms.id,
      userA: dmRooms.userA,
      userB: dmRooms.userB,
      lastMessageAt: dmRooms.lastMessageAt,
      lastReadAAt: dmRooms.lastReadAAt,
      lastReadBAt: dmRooms.lastReadBAt,
      updatedAt: dmRooms.updatedAt,
    })
    .from(dmRooms)
    .where(or(eq(dmRooms.userA, userId), eq(dmRooms.userB, userId)))
    .orderBy(desc(dmRooms.lastMessageAt));

  if (roomRows.length === 0) return [];

  const roomIds = roomRows.map((r) => r.roomId);

  // Batch: last message per room
  const lastMessageRows = await db
    .select({
      roomId: dmMessages.roomId,
      content: dmMessages.content,
      senderId: dmMessages.senderId,
      createdAt: dmMessages.createdAt,
    })
    .from(dmMessages)
    .innerJoin(
      dmRooms,
      and(
        eq(dmMessages.roomId, dmRooms.id),
        eq(dmMessages.createdAt, dmRooms.lastMessageAt),
      ),
    )
    .where(sql`${dmMessages.roomId} IN ${roomIds}`);

  const lastMessageMap = new Map(
    lastMessageRows.map((r) => [r.roomId, r]),
  );

  // Batch: unread count per room
  const unreadRows = await db
    .select({
      roomId: dmMessages.roomId,
      unreadCount: sql<number>`count(*)::int`,
    })
    .from(dmMessages)
    .innerJoin(dmRooms, eq(dmMessages.roomId, dmRooms.id))
    .where(
      and(
        sql`${dmMessages.roomId} IN ${roomIds}`,
        sql`${dmMessages.senderId} != ${userId}`,
        or(
          and(
            eq(dmRooms.userA, userId),
            sql`${dmMessages.createdAt} > COALESCE(${dmRooms.lastReadAAt}, '1970-01-01'::timestamptz)`,
          ),
          and(
            eq(dmRooms.userB, userId),
            sql`${dmMessages.createdAt} > COALESCE(${dmRooms.lastReadBAt}, '1970-01-01'::timestamptz)`,
          ),
        ),
      ),
    )
    .groupBy(dmMessages.roomId);

  const unreadMap = new Map(
    unreadRows.map((u) => [u.roomId, u.unreadCount]),
  );

  // Batch: profiles for other users
  const otherUserIds = roomRows.map((r) =>
    r.userA === userId ? r.userB : r.userA,
  );
  const profileRows = await db.query.profiles.findMany({
    where: sql`${profiles.userId} IN ${otherUserIds}`,
    columns: { userId: true, username: true },
    with: { user: { columns: { id: true, name: true, image: true } } },
  });
  const profileMap = new Map(
    profileRows.map((p) => [
      p.userId,
      { id: p.userId, name: p.user.name, image: p.user.image, username: p.username },
    ]),
  );

  return roomRows.map((r) => {
    const otherId = r.userA === userId ? r.userB : r.userA;
    const last = lastMessageMap.get(r.roomId);
    return {
      roomId: r.roomId,
      otherUser: profileMap.get(otherId) ?? {
        id: otherId,
        name: "Unknown",
        image: null,
        username: null,
      },
      lastMessage: last
        ? {
            content: last.content,
            senderId: last.senderId,
            createdAt: last.createdAt.toISOString(),
          }
        : null,
      unreadCount: unreadMap.get(r.roomId) ?? 0,
      updatedAt: r.updatedAt.toISOString(),
    };
  });
}

/* ------------------------------------------------------------------ */
/*  Messages                                                            */
/* ------------------------------------------------------------------ */

export async function getDmMessages(
  roomId: string,
  userId: string,
  limit = 100,
): Promise<DmMessage[]> {
  if (!(await isDmMember(roomId, userId))) {
    return [];
  }

  const rows = await db
    .select({
      id: dmMessages.id,
      roomId: dmMessages.roomId,
      content: dmMessages.content,
      imageUrl: dmMessages.imageUrl,
      senderId: dmMessages.senderId,
      createdAt: dmMessages.createdAt,
      senderName: user.name,
      senderImage: user.image,
      senderUsername: profiles.username,
    })
    .from(dmMessages)
    .innerJoin(user, eq(dmMessages.senderId, user.id))
    .leftJoin(profiles, eq(profiles.userId, user.id))
    .where(eq(dmMessages.roomId, roomId))
    .orderBy(dmMessages.createdAt)
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    content: r.content,
    imageUrl: r.imageUrl,
    senderId: r.senderId,
    createdAt: r.createdAt.toISOString(),
    sender: {
      id: r.senderId,
      name: r.senderName,
      image: r.senderImage,
      username: r.senderUsername,
    },
  }));
}

export async function createDmMessage(
  roomId: string,
  senderId: string,
  content: string,
  imageUrl?: string,
): Promise<DmMessage> {
  if (!(await isDmMember(roomId, senderId))) {
    throw new Error("Ruang DM tidak ditemukan.");
  }

  const trimmed = content.trim();
  if ((!trimmed && !imageUrl) || trimmed.length > 2000) {
    throw new Error("Isi pesan harus 1–2000 karakter atau ada gambar.");
  }

  const [row] = await db
    .insert(dmMessages)
    .values({ roomId, senderId, content: trimmed, imageUrl: imageUrl ?? null })
    .returning();

  await db
    .update(dmRooms)
    .set({ lastMessageAt: row.createdAt, updatedAt: row.createdAt })
    .where(eq(dmRooms.id, roomId));

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, senderId),
    columns: { username: true },
    with: { user: { columns: { id: true, name: true, image: true } } },
  });

  return {
    id: row.id,
    roomId: row.roomId,
    content: row.content,
    imageUrl: row.imageUrl,
    senderId: row.senderId,
    createdAt: row.createdAt.toISOString(),
    sender: profile
      ? {
          id: profile.user.id,
          name: profile.user.name,
          image: profile.user.image,
          username: profile.username,
        }
      : { id: senderId, name: "Unknown", image: null, username: null },
  };
}

/* ------------------------------------------------------------------ */
/*  Read tracking                                                      */
/* ------------------------------------------------------------------ */

export async function markDmRead(
  roomId: string,
  userId: string,
): Promise<{ otherUserId: string } | null> {
  const room = await db.query.dmRooms.findFirst({
    where: eq(dmRooms.id, roomId),
    columns: { userA: true, userB: true },
  });
  if (!room || (room.userA !== userId && room.userB !== userId)) return null;

  const isA = room.userA === userId;
  const now = new Date();

  await db
    .update(dmRooms)
    .set(isA ? { lastReadAAt: now } : { lastReadBAt: now })
    .where(eq(dmRooms.id, roomId));

  return { otherUserId: isA ? room.userB : room.userA };
}

export async function getDmPeerUserId(
  roomId: string,
  userId: string,
): Promise<string | null> {
  const room = await db.query.dmRooms.findFirst({
    where: eq(dmRooms.id, roomId),
    columns: { userA: true, userB: true },
  });
  if (!room || (room.userA !== userId && room.userB !== userId)) return null;
  return room.userA === userId ? room.userB : room.userA;
}

/* ------------------------------------------------------------------ */
/*  Search messages                                                     */
/* ------------------------------------------------------------------ */

export async function searchDmMessages(
  roomId: string,
  userId: string,
  query: string,
  limit = 50,
): Promise<DmMessage[]> {
  if (!(await isDmMember(roomId, userId))) return [];

  const rows = await db
    .select({
      id: dmMessages.id,
      roomId: dmMessages.roomId,
      content: dmMessages.content,
      imageUrl: dmMessages.imageUrl,
      senderId: dmMessages.senderId,
      createdAt: dmMessages.createdAt,
      senderName: user.name,
      senderImage: user.image,
      senderUsername: profiles.username,
    })
    .from(dmMessages)
    .innerJoin(user, eq(dmMessages.senderId, user.id))
    .leftJoin(profiles, eq(profiles.userId, user.id))
    .where(
      and(
        eq(dmMessages.roomId, roomId),
        ilike(dmMessages.content, `%${query}%`),
      ),
    )
    .orderBy(desc(dmMessages.createdAt))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    roomId: r.roomId,
    content: r.content,
    imageUrl: r.imageUrl,
    senderId: r.senderId,
    createdAt: r.createdAt.toISOString(),
    sender: {
      id: r.senderId,
      name: r.senderName,
      image: r.senderImage,
      username: r.senderUsername,
    },
  }));
}
