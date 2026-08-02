/* =========================================================================
 * SCHEMA "UniKai" - schema default aplikasi.
 * Konten inti: artikel, event, resources, notifikasi.
 * Fitur sosial & moderasi: profiles, follows, reactions, saves, reports.
 * Platform: announcements, app_settings.
 * ========================================================================= */

import {
  pgSchema,
  text,
  uuid,
  timestamp,
  index,
  uniqueIndex,
  jsonb,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import { threads } from "./threads";

export const unikaiSchema = pgSchema("UniKai");

export const articleStatusEnum = unikaiSchema.enum("article_status", [
  "draft",
  "published",
  "archived",
]);

/* ------------------------------ KONTEN ------------------------------ */

export const articles = unikaiSchema.table(
  "articles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    content: text("content").notNull(),
    status: articleStatusEnum("status").notNull().default("draft"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("articles_slug_idx").on(table.slug),
    authorIdx: index("articles_author_id_idx").on(table.authorId),
  }),
);

export const events = unikaiSchema.table(
  "events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    location: text("location"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    organizerId: text("organizer_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("events_slug_idx").on(table.slug),
    organizerIdx: index("events_organizer_id_idx").on(table.organizerId),
    startsAtIdx: index("events_starts_at_idx").on(table.startsAt),
  }),
);

export const resources = unikaiSchema.table(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    url: text("url"),
    authorId: text("author_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    slugIdx: uniqueIndex("resources_slug_idx").on(table.slug),
    authorIdx: index("resources_author_id_idx").on(table.authorId),
  }),
);

export const notifications = unikaiSchema.table(
  "notifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title"),
    content: text("content"),
    relatedUrl: text("related_url"),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("notifications_user_id_idx").on(table.userId),
    readIdx: index("notifications_read_at_idx").on(table.readAt),
  }),
);

/* --------------------------- PROFIL & SOSIAL --------------------------- */

export const profiles = unikaiSchema.table(
  "profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    username: text("username").notNull(),
    bio: text("bio"),
    location: text("location"),
    website: text("website"),
    coverImage: text("cover_image"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: uniqueIndex("profiles_user_id_idx").on(table.userId),
    usernameIdx: uniqueIndex("profiles_username_idx").on(table.username),
  }),
);

export const follows = unikaiSchema.table(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: text("follower_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    followerIdx: index("follows_follower_id_idx").on(table.followerId),
    targetIdx: index("follows_target_idx").on(table.targetType, table.targetId),
    uniqueIdx: uniqueIndex("follows_unique_idx").on(
      table.followerId,
      table.targetType,
      table.targetId,
    ),
  }),
);

export const reactions = unikaiSchema.table(
  "reactions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    type: text("type").notNull().default("like"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    targetIdx: index("reactions_target_idx").on(table.targetType, table.targetId),
    uniqueIdx: uniqueIndex("reactions_unique_idx").on(
      table.userId,
      table.targetType,
      table.targetId,
    ),
  }),
);

export const saves = unikaiSchema.table(
  "saves",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => threads.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    userIdx: index("saves_user_id_idx").on(table.userId),
    uniqueIdx: uniqueIndex("saves_unique_idx").on(table.userId, table.threadId),
  }),
);

/* ------------------------------ MODERASI ------------------------------ */

export const reports = unikaiSchema.table(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    targetType: text("target_type").notNull(),
    targetId: text("target_id").notNull(),
    reason: text("reason"),
    status: text("status").notNull().default("open"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => ({
    reporterIdx: index("reports_reporter_id_idx").on(table.reporterId),
    targetIdx: index("reports_target_idx").on(table.targetType, table.targetId),
    statusIdx: index("reports_status_idx").on(table.status),
  }),
);

/* ------------------------------ PLATFORM ------------------------------ */

export const announcements = unikaiSchema.table("announcements", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const appSettings = unikaiSchema.table("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
