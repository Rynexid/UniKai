import { getAbly, isAblyConfigured } from "./client";
import { EVENTS } from "./events";
import {
  THREAD_CHANNEL,
  COMMUNITY_CHANNEL,
  NOTIFICATION_CHANNEL,
  FEED_CHANNELS,
  DM_CHANNEL,
} from "./channels";
import type {
  ReplyCreatedPayload,
  ReplyUpdatedPayload,
  ReplyDeletedPayload,
  ReactionUpdatedPayload,
  BookmarkUpdatedPayload,
  ViewUpdatedPayload,
  ThreadCreatedPayload,
  NotificationCreatedPayload,
  DmMessageCreatedPayload,
  DmReadPayload,
} from "./types";

/**
 * Publish event realtime dari server (single source of truth).
 * Semua helper fire-and-forget: kegagalan realtime tidak boleh menggagalkan
 * permintaan HTTP utama.
 */

async function publish(channel: string, event: string, data: unknown): Promise<void> {
  if (!isAblyConfigured()) return;
  try {
    await getAbly().channels.get(channel).publish(event, data);
  } catch {
    // realtime bersifat best-effort
  }
}

/** Debounce view count per thread agar tidak membanjiri Ably. */
const viewTimers = new Map<string, { timer: ReturnType<typeof setTimeout>; count: number }>();
const VIEW_FLUSH_MS = 4000;

export function publishViewDebounced(threadId: string, viewCount: number): void {
  if (!isAblyConfigured()) return;
  const existing = viewTimers.get(threadId);
  if (existing) {
    existing.count = Math.max(existing.count, viewCount);
    return;
  }
  const timer = setTimeout(() => {
    const entry = viewTimers.get(threadId);
    if (!entry) return;
    viewTimers.delete(threadId);
    void publish(THREAD_CHANNEL(threadId), EVENTS.view.updated, {
      threadId,
      viewCount: entry.count,
    } satisfies ViewUpdatedPayload);
  }, VIEW_FLUSH_MS);
  viewTimers.set(threadId, { timer, count: viewCount });
}

export function publishReplyCreated(threadId: string, payload: ReplyCreatedPayload): void {
  void publish(THREAD_CHANNEL(threadId), EVENTS.reply.created, payload);
}

export function publishReplyUpdated(threadId: string, payload: ReplyUpdatedPayload): void {
  void publish(THREAD_CHANNEL(threadId), EVENTS.reply.updated, payload);
}

export function publishReplyDeleted(threadId: string, payload: ReplyDeletedPayload): void {
  void publish(THREAD_CHANNEL(threadId), EVENTS.reply.deleted, payload);
}

export function publishReactionUpdated(
  threadId: string,
  payload: ReactionUpdatedPayload,
): void {
  void publish(THREAD_CHANNEL(threadId), EVENTS.reaction.updated, payload);
}

export function publishBookmarkUpdated(threadId: string, payload: BookmarkUpdatedPayload): void {
  void publish(THREAD_CHANNEL(threadId), EVENTS.bookmark.updated, payload);
}

/** Thread baru: beri tahu anggota komunitas + feed "latest". */
export function publishThreadCreated(
  categoryId: string,
  payload: ThreadCreatedPayload,
): void {
  void publish(COMMUNITY_CHANNEL(categoryId), EVENTS.thread.created, payload);
  void publish(FEED_CHANNELS.latest, EVENTS.thread.created, payload);
}

export function publishNotificationCreated(
  userId: string,
  payload: NotificationCreatedPayload,
): void {
  void publish(NOTIFICATION_CHANNEL(userId), EVENTS.notification.created, payload);
}

export function publishDmMessageCreated(
  roomId: string,
  payload: DmMessageCreatedPayload,
): void {
  void publish(DM_CHANNEL(roomId), EVENTS.dm.messageCreated, payload);
}

export function publishDmRead(
  roomId: string,
  payload: DmReadPayload,
): void {
  void publish(DM_CHANNEL(roomId), EVENTS.dm.read, payload);
}
