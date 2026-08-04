/* =========================================================================
 * SCHEMA "dms" - direct messaging: rooms 1:1 + messages.
 * Referensi silang ke auth.user.
 * ========================================================================= */

import {
  pgSchema,
  text,
  uuid,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { user } from "./auth";

export const dmsSchema = pgSchema("dms");

export const dmRooms = dmsSchema.table(
  "dm_rooms",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userA: text("user_a")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    userB: text("user_b")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastReadAAt: timestamp("last_read_a_at", { withTimezone: true }),
    lastReadBAt: timestamp("last_read_b_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pairIdx: uniqueIndex("dm_rooms_pair_idx").on(table.userA, table.userB),
    userAIdx: index("dm_rooms_user_a_idx").on(table.userA),
    userBIdx: index("dm_rooms_user_b_idx").on(table.userB),
    lastMessageIdx: index("dm_rooms_last_message_at_idx").on(
      table.lastMessageAt,
    ),
  }),
);

export const dmMessages = dmsSchema.table(
  "dm_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roomId: uuid("room_id")
      .notNull()
      .references(() => dmRooms.id, { onDelete: "cascade" }),
    senderId: text("sender_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    imageUrl: text("image_url"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    roomIdx: index("dm_messages_room_id_idx").on(
      table.roomId,
      table.createdAt,
    ),
    senderIdx: index("dm_messages_sender_id_idx").on(table.senderId),
  }),
);

export const dmRoomsRelations = relations(dmRooms, ({ one, many }) => ({
  memberA: one(user, { fields: [dmRooms.userA], references: [user.id] }),
  memberB: one(user, { fields: [dmRooms.userB], references: [user.id] }),
  messages: many(dmMessages),
}));

export const dmMessagesRelations = relations(dmMessages, ({ one }) => ({
  room: one(dmRooms, {
    fields: [dmMessages.roomId],
    references: [dmRooms.id],
  }),
  sender: one(user, {
    fields: [dmMessages.senderId],
    references: [user.id],
  }),
}));
