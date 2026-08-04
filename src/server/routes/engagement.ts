import { Hono } from "hono";
import { z } from "zod";
import {
  getThreadEngagement,
  toggleThreadReaction,
  toggleThreadBookmark,
  toggleThreadFollow,
  toggleUserFollow,
  createThreadReport,
  toggleCommentReaction,
  updateCommentContent,
  deleteComment,
  createCommentReport,
  resolveThreadIdBySlug,
  resolveThreadIdByCommentId,
  countThreadSaves,
} from "../../features/discussions/engagement";
import { requireAuth, attachSessionIfExists } from "../../middleware/auth";
import {
  publishReactionUpdated,
  publishBookmarkUpdated,
  publishReplyUpdated,
  publishReplyDeleted,
} from "../lib/ably/publish";
import type {
  ReactionUpdatedPayload,
  BookmarkUpdatedPayload,
  ReplyUpdatedPayload,
  ReplyDeletedPayload,
} from "../lib/ably/types";

const router = new Hono();

// GET /api/threads/:slug/engagement - status reaksi/bookmark/follow (login opsional)
router.get("/threads/:slug/engagement", attachSessionIfExists, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const threadId = await resolveThreadIdBySlug(slug);
  const user = c.get("user") as { id: string } | undefined;
  return c.json(await getThreadEngagement(threadId, user?.id));
});

// POST /api/threads/:slug/reaction - toggle like (wajib login)
router.post("/threads/:slug/reaction", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const threadId = await resolveThreadIdBySlug(slug);
  const currentUser = c.get("user");
  const result = await toggleThreadReaction(threadId, currentUser.id);
  publishReactionUpdated(threadId, {
    targetType: "thread",
    targetId: threadId,
    reactionCount: result.reactionCount,
  } satisfies ReactionUpdatedPayload);
  return c.json(result);
});

// POST /api/threads/:slug/bookmark - toggle simpan (wajib login)
router.post("/threads/:slug/bookmark", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const threadId = await resolveThreadIdBySlug(slug);
  const currentUser = c.get("user");
  const result = await toggleThreadBookmark(threadId, currentUser.id);
  publishBookmarkUpdated(threadId, {
    threadId,
    savedCount: await countThreadSaves(threadId),
  } satisfies BookmarkUpdatedPayload);
  return c.json(result);
});

// POST /api/threads/:slug/follow - toggle follow thread (wajib login)
router.post("/threads/:slug/follow", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const threadId = await resolveThreadIdBySlug(slug);
  const currentUser = c.get("user");
  return c.json(await toggleThreadFollow(threadId, currentUser.id));
});

// POST /api/users/:id/follow - toggle follow user (wajib login)
router.post("/users/:id/follow", requireAuth, async (c) => {
  const targetId = c.req.param("id");
  if (!targetId) return c.notFound();
  const currentUser = c.get("user");
  if (targetId === currentUser.id) {
    return c.json({ error: "Tidak bisa mengikuti diri sendiri." }, 400);
  }
  return c.json(await toggleUserFollow(targetId, currentUser.id));
});

// POST /api/threads/:slug/report - lapor thread (wajib login)
router.post("/threads/:slug/report", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const threadId = await resolveThreadIdBySlug(slug);
  const currentUser = c.get("user");
  const body = await c.req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : undefined;
  return c.json(await createThreadReport(threadId, currentUser.id, reason), 201);
});

// POST /api/comments/:id/reaction - toggle like komentar (wajib login)
router.post("/comments/:id/reaction", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const commentId = c.req.param("id");
  if (!commentId) return c.notFound();
  const [result, threadId] = await Promise.all([
    toggleCommentReaction(commentId, currentUser.id),
    resolveThreadIdByCommentId(commentId),
  ]);
  publishReactionUpdated(threadId, {
    targetType: "comment",
    targetId: commentId,
    reactionCount: result.reactionCount,
  } satisfies ReactionUpdatedPayload);
  return c.json(result);
});

// POST /api/comments/:id/report - lapor komentar (wajib login)
router.post("/comments/:id/report", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const commentId = c.req.param("id");
  if (!commentId) return c.notFound();
  const body = await c.req.json().catch(() => ({}));
  const reason = typeof body.reason === "string" ? body.reason.slice(0, 500) : undefined;
  return c.json(await createCommentReport(commentId, currentUser.id, reason), 201);
});

const updateCommentSchema = z.object({ content: z.string().min(2).max(5000) });

// PATCH /api/comments/:id - edit komentar milik sendiri (wajib login)
router.patch("/comments/:id", requireAuth, async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateCommentSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }
  const currentUser = c.get("user");
  const commentId = c.req.param("id");
  if (!commentId) return c.notFound();
  const result = await updateCommentContent(commentId, parsed.data.content, currentUser.id);
  const threadId = await resolveThreadIdByCommentId(commentId);
  publishReplyUpdated(threadId, {
    threadId,
    commentId,
    content: result.content,
    updatedAt: result.updatedAt,
  } satisfies ReplyUpdatedPayload);
  return c.json(result);
});

// DELETE /api/comments/:id - hapus komentar milik sendiri (wajib login)
router.delete("/comments/:id", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const commentId = c.req.param("id");
  if (!commentId) return c.notFound();
  const threadId = await resolveThreadIdByCommentId(commentId);
  await deleteComment(commentId, currentUser.id);
  publishReplyDeleted(threadId, { threadId, commentId } satisfies ReplyDeletedPayload);
  return c.json({ deleted: true });
});

export default router;
