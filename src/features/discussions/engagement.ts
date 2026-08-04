import { eq, and, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { reactions, saves, follows, reports, comments, threads } from "../../db";
import { AppError, NotFoundError } from "../../types/errors";

async function countReactions(targetType: string, targetId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(reactions)
    .where(and(eq(reactions.targetType, targetType), eq(reactions.targetId, targetId)));
  return Number(row?.n ?? 0);
}

export async function countThreadSaves(threadId: string): Promise<number> {
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(saves)
    .where(eq(saves.threadId, threadId));
  return Number(row?.n ?? 0);
}

export async function resolveThreadIdByCommentId(commentId: string): Promise<string> {
  const row = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { threadId: true },
  });
  if (!row) throw new NotFoundError("Komentar tidak ditemukan.");
  return row.threadId;
}

export interface ThreadEngagement {
  reactionCount: number;
  reacted: boolean;
  saved: boolean;
  savedCount: number;
  following: boolean;
}

export async function getThreadEngagement(
  threadId: string,
  userId?: string,
): Promise<ThreadEngagement> {
  const [reactionCount, reacted, saved, savedCount, following] = await Promise.all([
    countReactions("thread", threadId),
    userId
      ? db
          .select({ id: reactions.id })
          .from(reactions)
          .where(
            and(
              eq(reactions.userId, userId),
              eq(reactions.targetType, "thread"),
              eq(reactions.targetId, threadId),
            ),
          )
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    userId
      ? db
          .select({ id: saves.id })
          .from(saves)
          .where(and(eq(saves.userId, userId), eq(saves.threadId, threadId)))
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
    countThreadSaves(threadId),
    userId
      ? db
          .select({ id: follows.id })
          .from(follows)
          .where(
            and(
              eq(follows.followerId, userId),
              eq(follows.targetType, "thread"),
              eq(follows.targetId, threadId),
            ),
          )
          .limit(1)
          .then((r) => r.length > 0)
      : Promise.resolve(false),
  ]);

  return { reactionCount, reacted, saved, savedCount, following };
}

export async function toggleThreadReaction(
  threadId: string,
  userId: string,
): Promise<{ reacted: boolean; reactionCount: number }> {
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.userId, userId),
        eq(reactions.targetType, "thread"),
        eq(reactions.targetId, threadId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
  } else {
    await db.insert(reactions).values({
      userId,
      targetType: "thread",
      targetId: threadId,
      type: "like",
    });
  }

  const reactionCount = await countReactions("thread", threadId);
  return { reacted: existing.length === 0, reactionCount };
}

export async function toggleThreadBookmark(
  threadId: string,
  userId: string,
): Promise<{ saved: boolean }> {
  const existing = await db
    .select({ id: saves.id })
    .from(saves)
    .where(and(eq(saves.userId, userId), eq(saves.threadId, threadId)))
    .limit(1);

  if (existing.length > 0) {
    await db.delete(saves).where(eq(saves.id, existing[0].id));
  } else {
    await db.insert(saves).values({ userId, threadId });
  }

  return { saved: existing.length === 0 };
}

export async function toggleThreadFollow(
  threadId: string,
  userId: string,
): Promise<{ following: boolean }> {
  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, userId),
        eq(follows.targetType, "thread"),
        eq(follows.targetId, threadId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
  } else {
    await db.insert(follows).values({
      followerId: userId,
      targetType: "thread",
      targetId: threadId,
    });
  }

  return { following: existing.length === 0 };
}

export async function toggleUserFollow(
  targetUserId: string,
  followerId: string,
): Promise<{ following: boolean }> {
  const existing = await db
    .select({ id: follows.id })
    .from(follows)
    .where(
      and(
        eq(follows.followerId, followerId),
        eq(follows.targetType, "user"),
        eq(follows.targetId, targetUserId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(follows).where(eq(follows.id, existing[0].id));
  } else {
    await db.insert(follows).values({
      followerId,
      targetType: "user",
      targetId: targetUserId,
    });
  }

  return { following: existing.length === 0 };
}

export async function createThreadReport(
  threadId: string,
  userId: string,
  reason?: string,
): Promise<{ reported: boolean }> {
  await db.insert(reports).values({
    reporterId: userId,
    targetType: "thread",
    targetId: threadId,
    reason,
  });
  return { reported: true };
}

export async function createCommentReport(
  commentId: string,
  userId: string,
  reason?: string,
): Promise<{ reported: boolean }> {
  await db.insert(reports).values({
    reporterId: userId,
    targetType: "comment",
    targetId: commentId,
    reason,
  });
  return { reported: true };
}

export async function toggleCommentReaction(
  commentId: string,
  userId: string,
): Promise<{ reacted: boolean; reactionCount: number }> {
  const existing = await db
    .select({ id: reactions.id })
    .from(reactions)
    .where(
      and(
        eq(reactions.userId, userId),
        eq(reactions.targetType, "comment"),
        eq(reactions.targetId, commentId),
      ),
    )
    .limit(1);

  if (existing.length > 0) {
    await db.delete(reactions).where(eq(reactions.id, existing[0].id));
  } else {
    await db.insert(reactions).values({
      userId,
      targetType: "comment",
      targetId: commentId,
      type: "like",
    });
  }

  const reactionCount = await countReactions("comment", commentId);
  return { reacted: existing.length === 0, reactionCount };
}

export async function updateCommentContent(
  commentId: string,
  content: string,
  userId: string,
): Promise<{ id: string; content: string; updatedAt: string }> {
  const existing = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, userId: true },
  });
  if (!existing) throw new NotFoundError("Komentar tidak ditemukan.");
  if (existing.userId !== userId) {
    throw new AppError(403, "Kamu tidak berhak mengubah komentar ini.");
  }

  const [row] = await db
    .update(comments)
    .set({ content })
    .where(eq(comments.id, commentId))
    .returning({ id: comments.id, content: comments.content, updatedAt: comments.updatedAt });

  return {
    id: row.id,
    content: row.content,
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function deleteComment(commentId: string, userId: string): Promise<void> {
  const existing = await db.query.comments.findFirst({
    where: eq(comments.id, commentId),
    columns: { id: true, userId: true },
  });
  if (!existing) throw new NotFoundError("Komentar tidak ditemukan.");
  if (existing.userId !== userId) {
    throw new AppError(403, "Kamu tidak berhak menghapus komentar ini.");
  }
  await db.delete(comments).where(eq(comments.id, commentId));
}

export async function resolveThreadIdBySlug(slug: string): Promise<string> {
  const row = await db.query.threads.findFirst({
    where: eq(threads.slug, slug),
    columns: { id: true },
  });
  if (!row) throw new NotFoundError("Thread tidak ditemukan.");
  return row.id;
}
