import { sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { categories, threads } from "../../db";

export interface CommunityCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  threadCount: number;
}

/**
 * Daftar kategori komunitas + jumlah thread masing-masing.
 * Satu query LEFT JOIN + GROUP BY - bebas N+1.
 */
export async function getCategories(): Promise<CommunityCategory[]> {
  const rows = await db
    .select({
      id: categories.id,
      name: categories.name,
      slug: categories.slug,
      description: categories.description,
      threadCount: sql<number>`count(${threads.id})::int`,
    })
    .from(categories)
    .leftJoin(threads, sql`${threads.categoryId} = ${categories.id}`)
    .groupBy(categories.id)
    .orderBy(categories.name);

  return rows as CommunityCategory[];
}
