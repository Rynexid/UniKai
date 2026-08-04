"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  ChevronDown,
  ChevronUp,
  Flag,
  Heart,
  Loader2,
  Pencil,
  Reply,
  Trash2,
  Link2,
} from "lucide-react";
import { parseMarkdown } from "@/lib/markdown";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatRelativeTime } from "@/lib/utils";
import { countAllComments } from "@/components/discussions/comment-count";
import type { ThreadComment } from "@/types";

export type CommentSort = "newest" | "oldest" | "liked" | "relevant";

export { countAllComments };

function compareComments(a: ThreadComment, b: ThreadComment, sort: CommentSort): number {
  switch (sort) {
    case "oldest":
      return a.createdAt.localeCompare(b.createdAt);
    case "liked":
      return b.reactionCount - a.reactionCount || b.createdAt.localeCompare(a.createdAt);
    case "relevant":
      return (
        b.reactionCount * 3 + b.replies.length * 2 - (a.reactionCount * 3 + a.replies.length * 2) ||
        b.createdAt.localeCompare(a.createdAt)
      );
    case "newest":
    default:
      return b.createdAt.localeCompare(a.createdAt);
  }
}

interface CommentNodeProps {
  comment: ThreadComment;
  threadSlug: string;
  isAuthenticated: boolean;
  currentUserId: string | null;
  sort: CommentSort;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
}

function CommentNode({
  comment,
  threadSlug,
  isAuthenticated,
  currentUserId,
  sort,
  depth,
  onReply,
}: CommentNodeProps) {
  const router = useRouter();

  const isOwner = currentUserId !== null && currentUserId === comment.author.id;
  const canReply = isAuthenticated && depth < 2;
  const isEdited = comment.updatedAt !== comment.createdAt;

  const [isReplyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(comment.content);
  const [isEditSending, setIsEditSending] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [isLiking, setIsLiking] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(comment.reactionCount);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportSent, setReportSent] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [repliesExpanded, setRepliesExpanded] = useState(true);

  const goToLogin = () => {
    router.push(`/login?redirect=/thread/${threadSlug}`);
  };

  const beginReply = (mention?: string) => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    setReplyText(mention ? `@${mention} ` : "");
    setReplyOpen(true);
  };

  const sendReply = async () => {
    if (!replyText.trim()) return;
    setIsSending(true);
    try {
      await onReply(comment.id, replyText.trim());
      setReplyOpen(false);
      setReplyText("");
    } finally {
      setIsSending(false);
    }
  };

  const toggleLike = async () => {
    if (!isAuthenticated) {
      goToLogin();
      return;
    }
    if (isLiking) return;
    setIsLiking(true);
    const prevLiked = liked;
    setLiked((v) => !v);
    setLikeCount((n) => n + (prevLiked ? -1 : 1));
    try {
      const res = await fetch(`/api/comments/${comment.id}/reaction`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { liked: boolean; reactionCount: number };
      setLiked(data.liked);
      setLikeCount(data.reactionCount);
    } catch {
      setLiked(prevLiked);
      setLikeCount(comment.reactionCount);
    } finally {
      setIsLiking(false);
    }
  };

  const saveEdit = async () => {
    const text = editText.trim();
    if (!text) return;
    setIsEditSending(true);
    setEditError(null);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal memperbarui komentar.",
        );
      }
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      setEditError(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setIsEditSending(false);
    }
  };

  const removeComment = async () => {
    if (!window.confirm("Hapus komentar ini? Tindakan ini tidak bisa dibatalkan.")) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } finally {
      setIsDeleting(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/thread/${threadSlug}#komentar-${comment.id}`,
      );
    } catch {
      /* clipboard tidak tersedia */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  const submitReport = async () => {
    if (reportBusy) return;
    setReportBusy(true);
    try {
      const res = await fetch(`/api/comments/${comment.id}/report`, {
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
    "inline-flex h-7 items-center gap-1 rounded-full px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <li className="group">
      <div className="flex gap-2.5">
        <Avatar className="h-6 w-6 shrink-0">
          {comment.author.image ? (
            <AvatarImage src={comment.author.image} alt={comment.author.name} />
          ) : (
            <AvatarFallback className="text-[10px]">
              {comment.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs">
            {comment.author.username ? (
              <Link
                href={`/${comment.author.username}`}
                className="font-medium text-foreground/85 transition-colors hover:text-primary"
              >
                {comment.author.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground/85">{comment.author.name}</span>
            )}
            <span className="text-muted-foreground/60">
              {formatRelativeTime(comment.createdAt)}
            </span>
            {isEdited && (
              <span className="rounded-full border border-border/40 px-1.5 py-px text-[10px] text-muted-foreground/70">
                diedit
              </span>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-1.5">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[80px] resize-y text-sm"
                autoFocus
              />
              {editError && <p className="text-xs text-destructive">{editError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                  Batal
                </Button>
                <Button
                  size="sm"
                  disabled={isEditSending || !editText.trim()}
                  onClick={() => void saveEdit()}
                >
                  {isEditSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Simpan
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed text-foreground/90 [&_p]:m-0"
              dangerouslySetInnerHTML={{ __html: parseMarkdown(comment.content) }}
            />
          )}

          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <button
              type="button"
              onClick={() => void toggleLike()}
              disabled={isLiking}
              className={cn(actionBtn, liked && "text-primary hover:text-primary")}
              aria-pressed={liked}
            >
              {isLiking ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} />
              )}
              {likeCount > 0 && likeCount}
            </button>

            {canReply && (
              <button
                type="button"
                onClick={() => beginReply(comment.author.name)}
                className={actionBtn}
              >
                <Reply className="h-3.5 w-3.5" />
                Balas
              </button>
            )}

            <button type="button" onClick={() => void copyLink()} className={cn(actionBtn, copied && "text-primary")}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
              {copied ? "Tersalin" : "Tautan"}
            </button>

            {isOwner && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setEditText(comment.content);
                    setIsEditing(true);
                  }}
                  className={actionBtn}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void removeComment()}
                  disabled={isDeleting}
                  className={cn(actionBtn, "text-destructive/80 hover:text-destructive")}
                >
                  {isDeleting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  Hapus
                </button>
              </>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className={cn(actionBtn, "text-destructive/80 hover:text-destructive")}
              >
                <Flag className="h-3.5 w-3.5" />
                Laporkan
              </button>
            )}

            {comment.replies.length > 0 && (
              <span className="px-1 text-xs text-muted-foreground/60">
                {comment.replies.length} balasan
              </span>
            )}
          </div>

          {isReplyOpen && (
            <div className="mt-2 space-y-1.5">
              <Textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Tulis balasan..."
                className="min-h-[64px] resize-y text-sm"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setReplyOpen(false)}>
                  Batal
                </Button>
                <Button size="sm" disabled={isSending || !replyText.trim()} onClick={() => void sendReply()}>
                  {isSending ? "Mengirim..." : "Kirim"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <div className="mt-2 ml-8 border-l border-border/30 pl-4">
          {depth + 1 >= 2 && !repliesExpanded ? (
            <button
              type="button"
              onClick={() => setRepliesExpanded(true)}
              className="inline-flex items-center gap-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              Lihat {comment.replies.length} balasan
            </button>
          ) : (
            <>
              {depth + 1 >= 2 && (
                <button
                  type="button"
                  onClick={() => setRepliesExpanded(false)}
                  className="inline-flex items-center gap-1 py-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                  Sembunyikan balasan
                </button>
              )}
              <CommentList
                comments={comment.replies}
                threadSlug={threadSlug}
                isAuthenticated={isAuthenticated}
                currentUserId={currentUserId}
                sort={sort}
                depth={depth + 1}
                onReply={onReply}
              />
            </>
          )}
        </div>
      )}

      <Dialog open={isReportOpen} onOpenChange={setReportOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Laporkan komentar</DialogTitle>
          </DialogHeader>
          <div className="mt-2 space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor={`report-reason-${comment.id}`}>Alasan (opsional)</Label>
              <Textarea
                id={`report-reason-${comment.id}`}
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
    </li>
  );
}

interface CommentListProps {
  comments: ThreadComment[];
  threadSlug: string;
  isAuthenticated: boolean;
  currentUserId: string | null;
  sort: CommentSort;
  depth: number;
  onReply: (parentId: string, content: string) => Promise<void>;
}

function CommentList({
  comments,
  threadSlug,
  isAuthenticated,
  currentUserId,
  sort,
  depth,
  onReply,
}: CommentListProps) {
  const sorted = [...comments].sort((a, b) => compareComments(a, b, sort));

  return (
    <ul className="space-y-4">
      {sorted.map((c) => (
        <CommentNode
          key={c.id}
          comment={c}
          threadSlug={threadSlug}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          sort={sort}
          depth={depth}
          onReply={onReply}
        />
      ))}
    </ul>
  );
}

interface CommentTreeProps {
  comments: ThreadComment[];
  threadSlug: string;
  isAuthenticated: boolean;
  currentUserId?: string | null;
  sort?: CommentSort;
}

export default function CommentTree({
  comments,
  threadSlug,
  isAuthenticated,
  currentUserId = null,
  sort = "newest",
}: CommentTreeProps) {
  const router = useRouter();

  const submitReply = async (parentId: string, content: string) => {
    const res = await fetch(`/api/discussions/threads/${threadSlug}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ content, parentId }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(
        typeof data?.error === "string" ? data.error : "Gagal mengirim balasan.",
      );
    }

    router.refresh();
  };

  return (
    <CommentList
      comments={comments}
      threadSlug={threadSlug}
      isAuthenticated={isAuthenticated}
      currentUserId={currentUserId}
      sort={sort}
      depth={0}
      onReply={submitReply}
    />
  );
}
