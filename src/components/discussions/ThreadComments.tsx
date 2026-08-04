"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CommentTree, { type CommentSort } from "@/components/discussions/CommentTree";
import { countAllComments } from "@/components/discussions/comment-count";
import { parseMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { useChannelEvent } from "@/lib/realtime/hooks";
import { THREAD_CHANNEL } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type {
  ReplyCreatedPayload,
  ReplyUpdatedPayload,
  ReplyDeletedPayload,
} from "@/server/lib/ably/types";
import type { ThreadComment } from "@/types";

const SORT_LABELS: Record<CommentSort, string> = {
  newest: "Terbaru",
  oldest: "Terlama",
  liked: "Paling Disukai",
  relevant: "Paling Relevan",
};

interface ThreadCommentsProps {
  threadId: string;
  threadSlug: string;
  comments: ThreadComment[];
  isAuthenticated: boolean;
  currentUserId?: string | null;
}

function insertComment(nodes: ThreadComment[], node: ThreadComment): ThreadComment[] {
  if (findComment(nodes, node.id)) return nodes;
  if (node.parentId) {
    return nodes.map((n) => {
      if (n.id === node.parentId) {
        return { ...n, replies: [node, ...n.replies] };
      }
      return { ...n, replies: insertComment(n.replies, node) };
    });
  }
  return [node, ...nodes];
}

function updateComment(
  nodes: ThreadComment[],
  id: string,
  updater: (node: ThreadComment) => ThreadComment,
): ThreadComment[] {
  return nodes.map((n) => {
    if (n.id === id) return updater(n);
    return { ...n, replies: updateComment(n.replies, id, updater) };
  });
}

function removeComment(nodes: ThreadComment[], id: string): ThreadComment[] {
  return nodes
    .filter((n) => n.id !== id)
    .map((n) => ({ ...n, replies: removeComment(n.replies, id) }));
}

function findComment(nodes: ThreadComment[], id: string): ThreadComment | undefined {
  for (const n of nodes) {
    if (n.id === id) return n;
    const found = findComment(n.replies, id);
    if (found) return found;
  }
  return undefined;
}

/** Gabungkan daftar server (fresh) dengan komentar realtime yang belum masuk. */
function mergeComments(serverList: ThreadComment[], live: ThreadComment[]): ThreadComment[] {
  const merged = serverList.map((n) => ({
    ...n,
    replies: mergeComments(n.replies, live),
  }));
  const existingIds = new Set<string>();
  const collect = (nodes: ThreadComment[]) => {
    for (const n of nodes) {
      existingIds.add(n.id);
      collect(n.replies);
    }
  };
  collect(merged);
  const extra = live.filter((n) => !existingIds.has(n.id));
  return [...merged, ...extra];
}

function toThreadComment(payload: ReplyCreatedPayload): ThreadComment {
  return {
    id: payload.comment.id,
    content: payload.comment.content,
    createdAt: payload.comment.createdAt,
    updatedAt: payload.comment.createdAt,
    reactionCount: 0,
    author: payload.comment.author,
    parentId: payload.comment.parentId,
    replies: [],
  };
}

export default function ThreadComments({
  threadId,
  threadSlug,
  comments,
  isAuthenticated,
  currentUserId = null,
}: ThreadCommentsProps) {
  const router = useRouter();
  const [sort, setSort] = useState<CommentSort>("newest");
  const [content, setContent] = useState("");
  const [isPreview, setIsPreview] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [liveComments, setLiveComments] = useState<ThreadComment[]>(comments);
  const [incoming, setIncoming] = useState<ReplyCreatedPayload[]>([]);

  // Sinkronkan hasil refresh server tanpa menghapus komentar realtime.
  useEffect(() => {
    setLiveComments((prev) => mergeComments(comments, incoming.length > 0 ? prev : []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments]);

  const channel = threadId ? THREAD_CHANNEL(threadId) : null;

  useChannelEvent(channel, EVENTS.reply.created, (message) => {
    const data = message.data as ReplyCreatedPayload | undefined;
    if (!data?.comment?.id) return;
    setIncoming((list) => [...list, data]);
    setLiveComments((prev) => insertComment(prev, toThreadComment(data)));
  });

  useChannelEvent(channel, EVENTS.reply.updated, (message) => {
    const data = message.data as ReplyUpdatedPayload | undefined;
    if (!data?.commentId) return;
    setLiveComments((prev) =>
      updateComment(prev, data.commentId, (node) => ({
        ...node,
        content: data.content,
        updatedAt: data.updatedAt,
      })),
    );
  });

  useChannelEvent(channel, EVENTS.reply.deleted, (message) => {
    const data = message.data as ReplyDeletedPayload | undefined;
    if (!data?.commentId) return;
    setLiveComments((prev) => removeComment(prev, data.commentId));
  });

  const total = useMemo(() => countAllComments(liveComments), [liveComments]);

  const submitTopLevel = async () => {
    if (!content.trim()) return;
    setIsSending(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/discussions/threads/${threadSlug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: content.trim() }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal mengirim komentar.",
        );
      }

      setContent("");
      setIsPreview(false);
      router.refresh();
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold">Komentar ({total})</h2>
        {total > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border/40 px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {SORT_LABELS[sort]}
                  <ChevronDown className="h-3.5 w-3.5" />
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-44">
              {(Object.keys(SORT_LABELS) as CommentSort[]).map((key) => (
                <DropdownMenuItem key={key} onSelect={() => setSort(key)}>
                  {SORT_LABELS[key]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {liveComments.length > 0 ? (
        <CommentTree
          comments={liveComments}
          threadSlug={threadSlug}
          isAuthenticated={isAuthenticated}
          currentUserId={currentUserId}
          sort={sort}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-border/50 bg-card/30 px-5 py-10 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada komentar. Mulai diskusinya di bawah.
          </p>
        </div>
      )}

      {isAuthenticated ? (
        <div className="mt-6 rounded-2xl border border-border/30 bg-card/40 p-4 sm:p-5">
          <div className="mb-2.5 flex items-center justify-between gap-2">
            <span className="text-sm font-medium">Tulis komentar</span>
            <button
              type="button"
              onClick={() => setIsPreview((v) => !v)}
              className="rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {isPreview ? "Edit" : "Preview"}
            </button>
          </div>

          {isPreview ? (
            <div
              className={cn(
                "min-h-[96px] rounded-lg border border-border/40 bg-background/60 px-3 py-2.5 text-sm leading-relaxed",
                !content.trim() && "text-muted-foreground/60",
              )}
              dangerouslySetInnerHTML={{
                __html: content.trim() ? parseMarkdown(content) : "Belum ada isi untuk dipratinjau.",
              }}
            />
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Tulis komentarmu... (Markdown didukung)"
              className="min-h-[96px] resize-y text-sm"
            />
          )}

          {errorMessage && <p className="mt-1.5 text-sm text-destructive">{errorMessage}</p>}

          <div className="mt-2.5 flex items-center justify-between gap-3">
            <p className="text-[11px] text-muted-foreground/70">
              Markdown: <code className="rounded bg-muted px-1">**tebal**</code>{" "}
              <code className="rounded bg-muted px-1">`kode`</code>{" "}
              <code className="rounded bg-muted px-1">[tautan](url)</code>
            </p>
            <Button size="sm" disabled={isSending || !content.trim()} onClick={() => void submitTopLevel()}>
              {isSending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Kirim Komentar
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-border/40 bg-card/30 px-4 py-5 text-center text-sm text-muted-foreground">
          <Link
            href={`/login?redirect=/thread/${threadSlug}`}
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Masuk
          </Link>{" "}
          untuk ikut berkomentar.
        </div>
      )}
    </section>
  );
}
