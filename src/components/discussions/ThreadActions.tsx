"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  Bookmark,
  Check,
  Flag,
  Heart,
  Loader2,
  MoreVertical,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useChannelEvent } from "@/lib/realtime/hooks";
import { THREAD_CHANNEL } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type {
  ReactionUpdatedPayload,
  BookmarkUpdatedPayload,
} from "@/server/lib/ably/types";

interface ThreadActionsProps {
  threadId: string;
  threadSlug: string;
  threadTitle: string;
  initialReactionCount: number;
  isAuthenticated: boolean;
}

export default function ThreadActions({
  threadId,
  threadSlug,
  threadTitle,
  initialReactionCount,
  isAuthenticated,
}: ThreadActionsProps) {
  const router = useRouter();

  const [reactionCount, setReactionCount] = useState(initialReactionCount);
  const [savedCount, setSavedCount] = useState(0);
  const [reacted, setReacted] = useState(false);
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);

  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  const channel = threadId ? THREAD_CHANNEL(threadId) : null;

  useChannelEvent(channel, EVENTS.reaction.updated, (message) => {
    const data = message.data as ReactionUpdatedPayload | undefined;
    if (data?.targetType === "thread" && data.targetId === threadId) {
      setReactionCount(data.reactionCount);
    }
  });

  useChannelEvent(channel, EVENTS.bookmark.updated, (message) => {
    const data = message.data as BookmarkUpdatedPayload | undefined;
    if (data?.threadId === threadId && typeof data.savedCount === "number") {
      setSavedCount(data.savedCount);
    }
  });

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;
    fetch(`/api/threads/${threadSlug}/engagement`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { reactionCount?: number; reacted?: boolean; saved?: boolean; savedCount?: number; following?: boolean } | null) => {
        if (!cancelled && data) {
          setReactionCount(data.reactionCount ?? reactionCount);
          setReacted(!!data.reacted);
          setSaved(!!data.saved);
          setSavedCount(data.savedCount ?? savedCount);
          setFollowing(!!data.following);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, threadSlug]);

  const requireAuth = useCallback((): boolean => {
    if (isAuthenticated) return true;
    router.push(`/login?redirect=/thread/${threadSlug}`);
    return false;
  }, [isAuthenticated, router, threadSlug]);

  const toggleReaction = async () => {
    if (!requireAuth() || busy) return;
    setBusy("reaction");
    setReacted((v) => !v);
    setReactionCount((n) => n + (reacted ? -1 : 1));
    try {
      const res = await fetch(`/api/threads/${threadSlug}/reaction`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { reacted: boolean; reactionCount: number };
      setReacted(data.reacted);
      setReactionCount(data.reactionCount);
    } catch {
      setReacted((v) => !v);
      setReactionCount((n) => n + (reacted ? 1 : -1));
    } finally {
      setBusy(null);
    }
  };

  const toggleBookmark = async () => {
    if (!requireAuth() || busy) return;
    setBusy("bookmark");
    setSaved((v) => !v);
    try {
      const res = await fetch(`/api/threads/${threadSlug}/bookmark`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { saved: boolean };
      setSaved(data.saved);
    } catch {
      setSaved((v) => !v);
    } finally {
      setBusy(null);
    }
  };

  const toggleFollow = async () => {
    if (!requireAuth() || busy) return;
    setBusy("follow");
    setFollowing((v) => !v);
    try {
      const res = await fetch(`/api/threads/${threadSlug}/follow`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { following: boolean };
      setFollowing(data.following);
    } catch {
      setFollowing((v) => !v);
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/thread/${threadSlug}`,
      );
    } catch {
      /* clipboard tidak tersedia */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const submitReport = async () => {
    if (!requireAuth() || reportBusy) return;
    setReportBusy(true);
    try {
      const res = await fetch(`/api/threads/${threadSlug}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason: reportReason.trim() || undefined }),
      });
      if (!res.ok) throw new Error();
      setReportSent(true);
      window.setTimeout(() => {
        setReportOpen(false);
        setReportSent(false);
        setReportReason("");
      }, 1600);
    } finally {
      setReportBusy(false);
    }
  };

  const actionBtn =
    "inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-y border-border/40 py-2.5">
      <button
        type="button"
        onClick={toggleReaction}
        disabled={busy !== null}
        className={cn(actionBtn, reacted && "text-primary hover:text-primary")}
        aria-pressed={reacted}
      >
        {busy === "reaction" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Heart className={cn("h-4 w-4", reacted && "fill-current")} />
        )}
        {reactionCount}
      </button>

      <button
        type="button"
        onClick={toggleBookmark}
        disabled={busy !== null}
        className={cn(actionBtn, saved && "text-primary hover:text-primary")}
        aria-pressed={saved}
      >
        {busy === "bookmark" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Bookmark className={cn("h-4 w-4", saved && "fill-current")} />
        )}
        {savedCount > 0 ? `${saved ? "Tersimpan" : "Simpan"} · ${savedCount}` : saved ? "Tersimpan" : "Simpan"}
      </button>

      <button type="button" onClick={share} className={cn(actionBtn, copied && "text-primary")}>
        {copied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
        {copied ? "Tersalin" : "Bagikan"}
      </button>

      <button
        type="button"
        onClick={toggleFollow}
        disabled={busy !== null}
        className={cn(actionBtn, following && "text-primary hover:text-primary")}
        aria-pressed={following}
      >
        {busy === "follow" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : following ? (
          <BellOff className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        {following ? "Diikuti" : "Ikuti"}
      </button>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button type="button" className={actionBtn} aria-label="Menu lainnya">
              <MoreVertical className="h-4 w-4" />
            </button>
          }
        />
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => void share()}>
            <Share2 className="h-4 w-4" /> Salin tautan
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-destructive"
            onSelect={() => setReportOpen(true)}
          >
            <Flag className="h-4 w-4" /> Laporkan
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <span className="ml-auto hidden text-xs text-muted-foreground sm:block">
        {!isAuthenticated && (
          <Link
            href={`/login?redirect=/thread/${threadSlug}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Masuk
          </Link>
        )}
      </span>

      <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Laporkan diskusi ini</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <p className="text-sm text-muted-foreground">{threadTitle}</p>
            <div className="space-y-1.5">
              <Label htmlFor="report-reason">Alasan (opsional)</Label>
              <Textarea
                id="report-reason"
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Jelaskan alasan pelaporanmu..."
                className="min-h-[96px] resize-y text-sm"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setReportOpen(false)}>
                Batal
              </Button>
              <Button onClick={() => void submitReport()} disabled={reportBusy}>
                {reportBusy ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : reportSent ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Flag className="h-4 w-4" />
                )}
                {reportSent ? "Terlapor" : "Kirim Laporan"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
