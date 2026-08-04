import type { HueKey } from "@/features/communities/data/communities";

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface DiscussionListItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  replyCount: number;
  featured: boolean;
  author: { id: string; name: string; image: string | null; username?: string | null };
  category: { id: string; name: string; slug: string };
  participants: { id: string; name: string; image: string | null; username?: string | null }[];
}

export interface ThreadComment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  reactionCount: number;
  author: { id: string; name: string; image: string | null; username?: string | null };
  parentId: string | null;
  replies: ThreadComment[];
}

export interface ThreadDetail {
  id: string;
  title: string;
  slug: string;
  content: string;
  status: string;
  featured: boolean;
  viewCount: number;
  reactionCount: number;
  createdAt: string;
  updatedAt: string;
  author: { id: string; name: string; image: string | null; username?: string | null };
  category: { id: string; name: string; slug: string };
  comments: ThreadComment[];
}

export interface CommunityChip {
  name: string;
  slug: string;
  threadCount: number;
  hue: HueKey;
}

export interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  threadCount: number;
}

export type { HueKey };
