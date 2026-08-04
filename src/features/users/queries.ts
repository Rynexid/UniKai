import { eq, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { user } from "../../db";
import { profiles } from "../../db";
import { NotFoundError } from "../../types/errors";
import { getUserDiscussionCount, getThreadsByAuthor } from "../discussions/queries";
import type { DiscussionListItem } from "../discussions/queries";

export interface UserProfile {
  id: string;
  name: string;
  image: string | null;
  bio: string | null;
  joinedAt: string;
  discussionCount: number;
  reputation: number;
  username: string | null;
  role: string;
}

export interface PublicUserProfile extends UserProfile {
  username: string;
  location: string | null;
  website: string | null;
  coverImage: string | null;
}

async function toUserProfile(
  row: {
    id: string;
    name: string;
    image: string | null;
    role: string | null;
    createdAt: Date;
  },
  profile: { username: string | null; bio: string | null } | null | undefined,
): Promise<UserProfile> {
  const discussionCount = await getUserDiscussionCount(row.id);
  return {
    id: row.id,
    name: row.name,
    image: row.image,
    bio: profile?.bio ?? null,
    username: profile?.username ?? null,
    role: row.role ?? "warga",
    joinedAt: row.createdAt.toISOString(),
    discussionCount,
    reputation: 0,
  };
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  const row = await db.query.user.findFirst({
    where: eq(user.id, userId),
    columns: { id: true, name: true, image: true, role: true, createdAt: true },
  });
  if (!row) throw new NotFoundError("User tidak ditemukan.");

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, userId),
    columns: { username: true, bio: true },
  });

  return toUserProfile(row, profile);
}

/**
 * Profil publik by username (case-insensitive, mis. /Adinfauzan atau /adinfauzan).
 */
export async function getUserProfileByUsername(username: string): Promise<PublicUserProfile> {
  const row = await db.query.profiles.findFirst({
    where: sql`lower(${profiles.username}) = lower(${username})`,
    columns: {
      username: true,
      bio: true,
      location: true,
      website: true,
      coverImage: true,
    },
    with: {
      user: {
        columns: { id: true, name: true, image: true, role: true, createdAt: true },
      },
    },
  });
  if (!row) throw new NotFoundError("User tidak ditemukan.");

  const discussionCount = await getUserDiscussionCount(row.user.id);
  return {
    id: row.user.id,
    name: row.user.name,
    image: row.user.image,
    role: row.user.role ?? "warga",
    username: row.username,
    bio: row.bio,
    location: row.location,
    website: row.website,
    coverImage: row.coverImage,
    joinedAt: row.user.createdAt.toISOString(),
    discussionCount,
    reputation: 0,
  };
}

/** Diskusi milik user, terbaru dulu. */
export async function getUserThreads(userId: string): Promise<DiscussionListItem[]> {
  return getThreadsByAuthor(userId);
}
