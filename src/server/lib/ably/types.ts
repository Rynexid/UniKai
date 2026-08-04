/**
 * Payload event realtime. Jaga tetap kecil — cukup data untuk memperbarui UI,
 * jangan kirim isi dokumen besar.
 */

export interface RealtimeAuthor {
  id: string;
  name: string;
  image: string | null;
  username?: string | null;
}

export interface ReplyCreatedPayload {
  threadId: string;
  threadSlug: string;
  comment: {
    id: string;
    content: string;
    createdAt: string;
    parentId: string | null;
    author: RealtimeAuthor;
  };
}

export interface ReplyUpdatedPayload {
  threadId: string;
  commentId: string;
  content: string;
  updatedAt: string;
}

export interface ReplyDeletedPayload {
  threadId: string;
  commentId: string;
}

export interface ReactionUpdatedPayload {
  targetType: "thread" | "comment";
  targetId: string;
  reactionCount: number;
}

export interface BookmarkUpdatedPayload {
  threadId: string;
  savedCount: number;
}

export interface ViewUpdatedPayload {
  threadId: string;
  viewCount: number;
}

export interface ThreadCreatedPayload {
  id: string;
  slug: string;
  title: string;
  category: { id: string; name: string; slug: string };
  author: RealtimeAuthor;
}

export interface NotificationCreatedPayload {
  id: string;
  type: string;
  title: string;
  content: string | null;
  relatedUrl: string | null;
  createdAt: string;
}

export interface FeedUpdatedPayload {
  feed: string;
  reason: string;
}

export interface DmMessageCreatedPayload {
  roomId: string;
  message: {
    id: string;
    content: string;
    imageUrl: string | null;
    createdAt: string;
    sender: RealtimeAuthor;
  };
}

export interface DmReadPayload {
  roomId: string;
  userId: string;
  readAt: string;
}
