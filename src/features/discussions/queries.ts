import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { threads, categories } from "../../db";
import { NotFoundError } from "../../types/errors";

export interface DiscussionListItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  replyCount: number;
  author: { id: string; name: string; image: string | null };
  category: { id: string; name: string; slug: string };
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
    },
    with: {
      author: { columns: { id: true, name: true, image: true } },
      category: { columns: { id: true, name: true, slug: true } },
      comments: { columns: { id: true } },
    },
    orderBy: (t, { desc: descOp }) => [descOp(t.createdAt)],
    limit: 20,
  });

  return rows.map(({ comments, ...thread }) => ({
    ...thread,
    replyCount: comments.length,
  })) as unknown as DiscussionListItem[];
}
