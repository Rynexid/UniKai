import { Hono } from "hono";
import { eq } from "drizzle-orm";
import {
  getThreads,
  getThreadBySlug,
  incrementViewCount,
  getRelatedThreads,
} from "../../features/discussions/queries";
import {
  createThread,
  createThreadSchema,
  createComment,
  createCommentSchema,
} from "../../features/discussions/commands";
import { requireAuth, attachSessionIfExists } from "../../middleware/auth";
import { db } from "../../infrastructure/database";
import { profiles, threads, categories } from "../../db";
import {
  publishThreadCreated,
  publishReplyCreated,
  publishViewDebounced,
  publishNotificationCreated,
} from "../lib/ably/publish";
import { createNotification } from "../../features/notifications/queries";
import type {
  ThreadCreatedPayload,
  ReplyCreatedPayload,
} from "../lib/ably/types";

const router = new Hono();

// GET /api/discussions/threads?category=slug - daftar thread (login opsional)
router.get("/threads", attachSessionIfExists, async (c) => {
  const categorySlug = c.req.query("category");
  const threads = await getThreads(categorySlug ?? undefined);
  return c.json(threads);
});

// POST /api/discussions/threads - buat thread baru (wajib login)
router.post("/threads", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const currentUser = c.get("user");
  const thread = await createThread(parsed.data, currentUser.id);

  const [category, authorProfile] = await Promise.all([
    db.query.categories.findFirst({
      where: eq(categories.id, thread.categoryId),
      columns: { id: true, name: true, slug: true },
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
      columns: { username: true },
    }),
  ]);

  publishThreadCreated(thread.categoryId, {
    id: thread.id,
    slug: thread.slug,
    title: thread.title,
    category: {
      id: thread.categoryId,
      name: category?.name ?? "",
      slug: category?.slug ?? "",
    },
    author: {
      id: currentUser.id,
      name: currentUser.name,
      image: currentUser.image ?? null,
      username: authorProfile?.username,
    },
  } satisfies ThreadCreatedPayload);

  return c.json(thread, 201);
});

// GET /api/discussions/threads/:slug - detail thread + komentar (login opsional)
router.get("/threads/:slug", attachSessionIfExists, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  void incrementViewCount(slug).catch(() => {});
  const thread = await getThreadBySlug(slug);
  publishViewDebounced(thread.id, thread.viewCount + 1);
  return c.json(thread);
});

// POST /api/discussions/threads/:slug/comments - buat komentar (wajib login)
router.post("/threads/:slug/comments", requireAuth, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const body = await c.req.json();
  const parsed = createCommentSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const currentUser = c.get("user");
  const comment = await createComment(
    { ...parsed.data, threadSlug: slug },
    currentUser.id,
  );

  const [authorProfile, thread] = await Promise.all([
    db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
      columns: { username: true },
    }),
    db.query.threads.findFirst({
      where: eq(threads.id, comment.threadId),
      columns: { userId: true, title: true },
    }),
  ]);

  publishReplyCreated(comment.threadId, {
    threadId: comment.threadId,
    threadSlug: slug,
    comment: {
      id: comment.id,
      content: comment.content,
      createdAt: comment.createdAt,
      parentId: comment.parentId,
      author: {
        id: currentUser.id,
        name: currentUser.name,
        image: currentUser.image ?? null,
        username: authorProfile?.username,
      },
    },
  } satisfies ReplyCreatedPayload);

  // Notifikasi ke pemilik thread (kecuali penulisnya sendiri)
  if (thread && thread.userId !== currentUser.id) {
    const url = `/thread/${slug}#comment-${comment.id}`;
    const notification = await createNotification({
      userId: thread.userId,
      type: "reply",
      title: `${currentUser.name} membalas diskusimu`,
      content: comment.content.slice(0, 200),
      relatedUrl: url,
    });
    publishNotificationCreated(thread.userId, {
      id: notification.id,
      type: notification.type,
      title: notification.title ?? "",
      content: notification.content,
      relatedUrl: notification.relatedUrl,
      createdAt: notification.createdAt,
    });
  }

  return c.json(comment, 201);
});

// GET /api/discussions/threads/:slug/related - diskusi terkait sama kategori
router.get("/threads/:slug/related", attachSessionIfExists, async (c) => {
  const slug = c.req.param("slug");
  if (!slug) return c.notFound();
  const thread = await getThreadBySlug(slug);
  const related = await getRelatedThreads(thread.category.id, slug, 6);
  return c.json(related);
});

export default router;
