import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { threads, categories } from "../../db";
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
