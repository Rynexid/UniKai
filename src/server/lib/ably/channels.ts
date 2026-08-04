/**
 * Konvensi penamaan channel Ably.
 * Pola dapat diprediksi: thread:{id}, community:{id}, user:{id},
 * notification:{id}, feed:{slug}, presence:thread:{id}, presence:community:{id},
 * dm:{roomId}, presence:dm:{roomId}.
 */

export const THREAD_CHANNEL = (threadId: string) => `thread:${threadId}`;
export const COMMUNITY_CHANNEL = (communityId: string) => `community:${communityId}`;
export const USER_CHANNEL = (userId: string) => `user:${userId}`;
export const NOTIFICATION_CHANNEL = (userId: string) => `notification:${userId}`;
export const FEED_CHANNEL = (feed: string) => `feed:${feed}`;
export const PRESENCE_THREAD_CHANNEL = (threadId: string) => `presence:thread:${threadId}`;
export const PRESENCE_COMMUNITY_CHANNEL = (communityId: string) =>
  `presence:community:${communityId}`;
export const DM_CHANNEL = (roomId: string) => `dm:${roomId}`;
export const PRESENCE_DM_CHANNEL = (roomId: string) => `presence:dm:${roomId}`;

/** Channel feed standar. */
export const FEED_CHANNELS = {
  forYou: FEED_CHANNEL("for-you"),
  latest: FEED_CHANNEL("latest"),
  trending: FEED_CHANNEL("trending"),
  popular: FEED_CHANNEL("popular"),
  featured: FEED_CHANNEL("featured"),
  unanswered: FEED_CHANNEL("unanswered"),
} as const;

export type FeedChannel = (typeof FEED_CHANNELS)[keyof typeof FEED_CHANNELS];

/** Kapabilitas token per channel (wildcard diperbolehkan Ably). */
export const PUBLIC_CHANNEL_CAPABILITIES: Record<string, CapabilityOp[]> = {
  "thread:*": ["subscribe"],
  "community:*": ["subscribe"],
  "feed:*": ["subscribe"],
  "presence:thread:*": ["subscribe", "presence"],
  "presence:community:*": ["subscribe", "presence"],
  "dm:*": ["subscribe"],
  "presence:dm:*": ["subscribe", "presence"],
};

export type CapabilityOp =
  | "publish"
  | "subscribe"
  | "presence"
  | "history"
  | "object-subscribe"
  | "object-publish"
  | "annotation-subscribe"
  | "annotation-publish"
  | "message-update-any"
  | "message-update-own"
  | "message-delete-any"
  | "message-delete-own";
