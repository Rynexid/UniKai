import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { threads, comments, categories } from "../../db";
import { NotFoundError } from "../../types/errors";

export const createThreadSchema = z.object({
  title: z.string().min(5).max(150),
  content: z.string().min(10),
  categorySlug: z.string().optional(),
});

export type CreateThreadInput = z.infer<typeof createThreadSchema>;

export interface CreatedThread {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  viewCount: number;
  userId: string;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
}

/** Use-case pembuatan thread. Melempar AppError bila kategori tidak ditemukan. */
export async function createThread(
  input: CreateThreadInput,
  userId: string,
): Promise<CreatedThread> {
  const { title, content, categorySlug } = input;

  const category = categorySlug
    ? await db.query.categories.findFirst({ where: eq(categories.slug, categorySlug) })
    : await db.query.categories.findFirst(); // fallback kategori default/general

  if (!category) {
    throw new NotFoundError("Kategori tidak ditemukan.");
  }

  const slug = `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now().toString(36)}`;

  const [thread] = await db
    .insert(threads)
    .values({ title, content, slug, userId, categoryId: category.id })
    .returning();

  return thread as unknown as CreatedThread;
}

export const createCommentSchema = z.object({
  content: z.string().min(2).max(5000),
  parentId: z.string().uuid().optional(),
});

export type CreateCommentInput = z.infer<typeof createCommentSchema>;

export interface CreatedComment {
  id: string;
  content: string;
  createdAt: string;
  threadId: string;
  userId: string;
  parentId: string | null;
}

export async function createComment(
  input: CreateCommentInput & { threadSlug: string },
  userId: string,
): Promise<CreatedComment> {
  const thread = await db.query.threads.findFirst({
    where: eq(threads.slug, input.threadSlug),
    columns: { id: true },
  });
  if (!thread) throw new NotFoundError("Thread tidak ditemukan.");

  if (input.parentId) {
    const parent = await db.query.comments.findFirst({
      where: and(
        eq(comments.id, input.parentId),
        eq(comments.threadId, thread.id),
      ),
      columns: { id: true },
    });
    if (!parent) throw new NotFoundError("Komentar induk tidak ditemukan.");
  }

  const [comment] = await db
    .insert(comments)
    .values({
      content: input.content,
      threadId: thread.id,
      userId,
      parentCommentId: input.parentId ?? null,
    })
    .returning();

  return comment as unknown as CreatedComment;
}
