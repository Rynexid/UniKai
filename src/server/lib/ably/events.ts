/**
 * Konvensi nama event Ably (dot notation).
 * Tetap konsisten: {entitas}.{aksi}
 */

export const EVENTS = {
  thread: {
    created: "thread.created",
    updated: "thread.updated",
    deleted: "thread.deleted",
    locked: "thread.locked",
    pinned: "thread.pinned",
  },
  reply: {
    created: "reply.created",
    updated: "reply.updated",
    deleted: "reply.deleted",
  },
  reaction: {
    updated: "reaction.updated",
  },
  bookmark: {
    updated: "bookmark.updated",
  },
  notification: {
    created: "notification.created",
    read: "notification.read",
  },
  view: {
    updated: "view.updated",
  },
  community: {
    updated: "community.updated",
  },
  feed: {
    updated: "feed.updated",
  },
  presence: {
    enter: "presence.enter",
    leave: "presence.leave",
  },
  dm: {
    messageCreated: "dm.message.created",
    read: "dm.read",
  },
} as const;
