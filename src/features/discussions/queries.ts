import { eq, ne, and, sql, inArray } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { comments, threads, categories, reactions, profiles } from "../../db";
import { NotFoundError } from "../../types/errors";

export interface DiscussionListItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  replyCount: number;
  featured: boolean;
  author: CommentAuthor;
  category: { id: string; name: string; slug: string };
  participants: CommentAuthor[];
}

export interface CommentAuthor {
  id: string;
  name: string;
  image: string | null;
  username?: string | null;
}

export interface ThreadComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reactionCount: number;
  author: CommentAuthor;
  parentId: string | null;
  replies: ThreadComment[];
}

export interface ThreadDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  featured: boolean;
  viewCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; image: string | null };
  category: { id: string; name: string; slug: string };
  comments: ThreadComment[];
}

/**
 * Daftar thread + author + kategori. Filter opsional per slug kategori.
 * Limit 20 wajib - jangan pernah query tanpa limit.
 */
export async function getThreads(categorySlug?: string): Promise<DiscussionListItem[]> {
  const category = categorySlug
    ? await db.query.categories.findFirst({ where: eq(categories.slug, categorySlug) })
    : null;

  if (categorySlug && !category) {
    throw new NotFoundError("Kategori tidak ditemukan.");
  }

  const rows = await db.query.threads.findMany({
    where: category ? eq(threads.categoryId, category.id) : undefined,
    columns: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      viewCount: true,
      featured: true,
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
      category: { columns: { id: true, name: true, slug: true } },
      comments: { columns: { id: true } },
    },
    orderBy: (t, { desc: descOp }) => [descOp(t.createdAt)],
    limit: 20,
  });

  const participantsByThread = await getThreadParticipants(rows.map((r) => r.id));
  const items = withParticipants(
    rows.map(({ comments, ...thread }) => ({
      ...thread,
      replyCount: comments.length,
    })) as unknown as DiscussionListItem[],
    participantsByThread,
  );
  await attachAuthorUsernames(items);
  return items;
}

/**
 * Diskusi milik satu user (untuk halaman profil publik), terbaru dulu.
 */
export async function getThreadsByAuthor(
  userId: string,
  limit = 50,
): Promise<DiscussionListItem[]> {
  const rows = await db.query.threads.findMany({
    where: eq(threads.userId, userId),
    columns: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      viewCount: true,
      featured: true,
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
      category: { columns: { id: true, name: true, slug: true } },
      comments: { columns: { id: true } },
    },
    orderBy: (t, { desc: descOp }) => [descOp(t.createdAt)],
    limit,
  });

  const participantsByThread = await getThreadParticipants(rows.map((r) => r.id));
  const items = withParticipants(
    rows.map(({ comments, ...thread }) => ({
      ...thread,
      replyCount: comments.length,
    })) as unknown as DiscussionListItem[],
    participantsByThread,
  );
  await attachAuthorUsernames(items);
  return items;
}

/**
 * Isi username publik untuk author & partisipan (batch, hindari N+1).
 */
async function attachAuthorUsernames(
  items: Array<{ author: CommentAuthor; participants?: CommentAuthor[] }>,
): Promise<void> {
  const authors = items.flatMap((it) => [it.author, ...(it.participants ?? [])]);
  const ids = [...new Set(authors.map((a) => a.id))];
  if (!ids.length) return;
  const rows = await db
    .select({ userId: profiles.userId, username: profiles.username })
    .from(profiles)
    .where(inArray(profiles.userId, ids));
  const map = new Map(rows.map((r) => [r.userId, r.username]));
  for (const author of authors) {
    author.username = map.get(author.id) ?? null;
  }
}

/**
 * Ambil partisipan terbaru (author + komentator terakhir) per thread.
 * Dipakai untuk AvatarGroup di kartu diskusi.
 */
export async function getThreadParticipants(
  threadIds: string[],
): Promise<Map<string, CommentAuthor[]>> {
  const map = new Map<string, CommentAuthor[]>();
  if (!threadIds.length) return map;

  const recentComments = await db.query.comments.findMany({
    where: inArray(comments.threadId, threadIds),
    columns: { threadId: true },
    with: { author: { columns: { id: true, name: true, image: true } } },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  for (const comment of recentComments) {
    const list = map.get(comment.threadId) ?? [];
    if (list.length < 4 && !list.some((p) => p.id === comment.author.id)) {
      list.push(comment.author as CommentAuthor);
    }
    map.set(comment.threadId, list);
  }

  return map;
}

function withParticipants(
  items: Array<{ id: string; author: CommentAuthor }>,
  participantsByThread: Map<string, CommentAuthor[]>,
): Array<DiscussionListItem & { participants: CommentAuthor[] }> {
  return items.map((item) => {
    const participants = participantsByThread.get(item.id) ?? [];
    if (!participants.some((p) => p.id === item.author.id)) {
      participants.unshift(item.author);
    }
    return {
      ...(item as DiscussionListItem),
      participants: participants.slice(0, 4),
    };
  });
}

/**
 * Thread detail by slug, beserta nested comments (top-level, urut terbaru).
 */
export async function getThreadBySlug(slug: string): Promise<ThreadDetail> {
  const row = await db.query.threads.findFirst({
    where: eq(threads.slug, slug),
    columns: {
      id: true,
      title: true,
      slug: true,
      content: true,
      status: true,
      featured: true,
      viewCount: true,
      createdAt: true,
      updatedAt: true,
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
      category: { columns: { id: true, name: true, slug: true } },
    },
  });

  if (!row) throw new NotFoundError("Thread tidak ditemukan.");

  const flatComments = await db.query.comments.findMany({
    where: eq(comments.threadId, row.id),
    columns: {
      id: true,
      content: true,
      createdAt: true,
      updatedAt: true,
      parentCommentId: true,
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
    },
    orderBy: (c, { desc }) => [desc(c.createdAt)],
  });

  const commentIds = flatComments.map((c) => c.id);
  const reactionRows = commentIds.length
    ? await db
        .select({ targetId: reactions.targetId, n: sql<number>`count(*)` })
        .from(reactions)
        .where(
          and(
            eq(reactions.targetType, "comment"),
            inArray(reactions.targetId, commentIds),
          ),
        )
        .groupBy(reactions.targetId)
    : [];
  const commentReactions = new Map(
    reactionRows.map((r) => [r.targetId, Number(r.n)]),
  );

  const [threadReactionRow] = await db
    .select({ n: sql<number>`count(*)` })
    .from(reactions)
    .where(
      and(eq(reactions.targetType, "thread"), eq(reactions.targetId, row.id)),
    );
  const threadReactionCount = Number(threadReactionRow?.n ?? 0);

  interface FlatComment {
    id: string;
    content: string;
    createdAt: string;
    updatedAt: string;
    reactionCount: number;
    author: CommentAuthor;
    parentId: string | null;
  }
  const normalized: FlatComment[] = flatComments.map(
    (c): FlatComment => ({
      id: c.id,
      content: c.content,
      createdAt: c.createdAt.toISOString(),
      updatedAt: c.updatedAt.toISOString(),
      reactionCount: commentReactions.get(c.id) ?? 0,
      author: c.author as CommentAuthor,
      parentId: c.parentCommentId,
    }),
  );

  // Isi username publik untuk author thread & komentator.
  const allAuthors = [row.author as CommentAuthor, ...normalized.map((c) => c.author)];
  const authorIds = [...new Set(allAuthors.map((a) => a.id))];
  if (authorIds.length) {
    const usernameRows = await db
      .select({ userId: profiles.userId, username: profiles.username })
      .from(profiles)
      .where(inArray(profiles.userId, authorIds));
    const usernameMap = new Map(usernameRows.map((r) => [r.userId, r.username]));
    for (const author of allAuthors) {
      author.username = usernameMap.get(author.id) ?? null;
    }
  }

  const byId = new Map<string, ThreadComment>();
  const forest: ThreadComment[] = [];
  for (const c of normalized) {
    byId.set(c.id, {
      id: c.id,
      content: c.content,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      reactionCount: c.reactionCount,
      author: c.author,
      parentId: c.parentId,
      replies: [],
    });
  }
  for (const [, node] of byId) {
    if (node.parentId === null) {
      forest.push(node);
    } else {
      const parent = byId.get(node.parentId);
      if (parent) parent.replies.push(node);
    }
  }
  forest.sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    content: row.content,
    status: row.status,
    featured: row.featured,
    viewCount: row.viewCount,
    reactionCount: threadReactionCount,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    author: row.author as { id: string; name: string; image: string | null },
    category: row.category as { id: string; name: string; slug: string },
    comments: forest,
  };
}

export async function incrementViewCount(slug: string): Promise<void> {
  await db
    .update(threads)
    .set({ viewCount: sql`${threads.viewCount} + 1` })
    .where(eq(threads.slug, slug));
}

export async function getUserDiscussionCount(userId: string): Promise<number> {
  const rows = await db
    .select({ count: sql<number>`count(*)` })
    .from(threads)
    .where(eq(threads.userId, userId));
  return Number(rows[0]?.count ?? 0);
}

export async function getRelatedThreads(
  categoryId: string,
  excludeSlug: string,
  limit = 6,
): Promise<DiscussionListItem[]> {
  const rows = await db.query.threads.findMany({
    where: (t) => and(eq(t.categoryId, categoryId), ne(t.slug, excludeSlug)),
    columns: {
      id: true,
      title: true,
      slug: true,
      createdAt: true,
      viewCount: true,
      featured: true,
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
      category: { columns: { id: true, name: true, slug: true } },
      comments: { columns: { id: true } },
    },
    orderBy: (t, { desc }) => [desc(t.createdAt)],
    limit,
  });

  const participantsByThread = await getThreadParticipants(rows.map((r) => r.id));

  const items = withParticipants(
    rows.map(({ comments, ...thread }) => ({
      ...thread,
      replyCount: comments.length,
    })) as unknown as DiscussionListItem[],
    participantsByThread,
  );
  await attachAuthorUsernames(items);
  return items;
}
