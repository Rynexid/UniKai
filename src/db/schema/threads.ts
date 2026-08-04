/* =========================================================================
 * SCHEMA "threads" - diskusi: threads + comments (balasan bertingkat).
 * Referensi silang ke auth.user dan category.categories.
 * ========================================================================= */

import {
  pgSchema,
  text,
  timestamp,
  uuid,
  integer,
  boolean,
  index,
  uniqueIndex,
  type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";
import { categories } from "./category";

export const threadsSchema = pgSchema("threads");

export const threadStatusEnum = threadsSchema.enum("thread_status", ["open", "closed", "archived"]);

export const threads = threadsSchema.table(
  "threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    status: threadStatusEnum("status").notNull().default("open"),
    featured: boolean("featured").notNull().default(false),
    viewCount: integer("view_count").notNull().default(0),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    categoryCreatedIdx: index("threads_category_created_idx").on(
      table.categoryId,
      table.createdAt,
    ),
    userIdx: index("threads_user_id_idx").on(table.userId),
    slugIdx: uniqueIndex("threads_slug_idx").on(table.slug),
  }),
);

export const comments = threadsSchema.table(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    content: text("content").notNull(),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    parentCommentId: uuid("parent_comment_id").references((): AnyPgColumn => comments.id, {
      onDelete: "cascade",
    }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    threadIdx: index("comments_thread_id_idx").on(table.threadId),
    parentIdx: index("comments_parent_id_idx").on(table.parentCommentId),
    userIdx: index("comments_user_id_idx").on(table.userId),
  }),
);

export const threadsRelations = relations(threads, ({ one, many }) => ({
  author: one(user, { fields: [threads.userId], references: [user.id] }),
  category: one(categories, { fields: [threads.categoryId], references: [categories.id] }),
  comments: many(comments),
}));

export const commentsRelations = relations(comments, ({ one, many }) => ({
  thread: one(threads, { fields: [comments.threadId], references: [threads.id] }),
  author: one(user, { fields: [comments.userId], references: [user.id] }),
  parent: one(comments, {
    fields: [comments.parentCommentId],
    references: [comments.id],
    relationName: "replies",
  }),
  replies: many(comments, { relationName: "replies" }),
}));
