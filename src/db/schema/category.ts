/* =========================================================================
 * SCHEMA "category" - kategori komunitas (anime, movie, gaming, dll).
 * ========================================================================= */

import { pgSchema, text, uuid, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const categorySchema = pgSchema("category");

export const categories = categorySchema.table(
  "categories",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("category_slug_idx").on(table.slug),
  }),
);
