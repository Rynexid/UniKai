"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, UserCheck, UserPlus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

export interface AuthorProfileData {
  bio: string | null;
  joinedAt: string;
  discussionCount: number;
  reputation: number;
  username?: string | null;
}

interface AuthorCardProps {
  author: { id: string; name: string; image: string | null };
  profile: AuthorProfileData | null;
  isAuthenticated: boolean;
  isOwner: boolean;
  threadSlug: string;
}

function formatJoined(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}

export default function AuthorCard({
  author,
  profile,
  isAuthenticated,
  isOwner,
  threadSlug,
}: AuthorCardProps) {
  const router = useRouter();
  const [following, setFollowing] = useState(false);
  const [busy, setBusy] = useState(false);

  const toggleFollow = async () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/thread/${threadSlug}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    const prev = following;
    setFollowing((v) => !v);
    try {
      const res = await fetch(`/api/users/${author.id}/follow`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { following: boolean };
      setFollowing(data.following);
    } catch {
      setFollowing(prev);
    } finally {
      setBusy(false);
    }
  };

  const joined = profile ? formatJoined(profile.joinedAt) : "";

  return (
    <aside className="rounded-2xl border border-border/30 bg-card/40 p-4 sm:p-5">
      <div className="flex items-start gap-3.5">
        <Avatar className="h-11 w-11">
          {author.image ? (
            <AvatarImage src={author.image} alt={author.name} />
          ) : (
            <AvatarFallback className="text-base">
              {author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {profile?.username ? (
              <Link
                href={`/${profile.username}`}
                className="truncate font-medium text-foreground transition-colors hover:text-primary"
              >
                {author.name}
              </Link>
            ) : (
              <span className="truncate font-medium text-foreground">{author.name}</span>
            )}
            {!isOwner && (
              <Button
                variant="secondary"
                size="sm"
                className="ml-auto h-8 gap-1.5 text-xs"
                onClick={() => void toggleFollow()}
                disabled={busy}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : following ? (
                  <UserCheck className="h-3.5 w-3.5" />
                ) : (
                  <UserPlus className="h-3.5 w-3.5" />
                )}
                {following ? "Mengikuti" : "Ikuti"}
              </Button>
            )}
          </div>

          {profile?.bio && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{profile.bio}</p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {joined && <span>Bergabung {joined}</span>}
            {profile && (
              <>
                <span aria-hidden="true" className="text-foreground/20">
                  ·
                </span>
                <span>{profile.discussionCount} diskusi</span>
              </>
            )}
            {profile && profile.reputation > 0 && (
              <>
                <span aria-hidden="true" className="text-foreground/20">
                  ·
                </span>
                <span>{profile.reputation} reputasi</span>
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
