/* =========================================================================
 * SCHEMA "Markets" - marketplace produk digital & jasa.
 * ========================================================================= */

import {
  pgSchema,
  text,
  uuid,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const marketsSchema = pgSchema("Markets");

export const productTypeEnum = marketsSchema.enum("product_type", ["digital", "service"]);
export const productStatusEnum = marketsSchema.enum("product_status", [
  "draft",
  "published",
  "sold",
  "archived",
]);

export const products = marketsSchema.table(
  "products",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    priceCents: integer("price_cents").notNull().default(0),
    currency: text("currency").notNull().default("IDR"),
    type: productTypeEnum("type").notNull().default("digital"),
    status: productStatusEnum("status").notNull().default("draft"),
    sellerId: text("seller_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("products_slug_idx").on(table.slug),
    sellerIdx: index("products_seller_id_idx").on(table.sellerId),
  }),
);
