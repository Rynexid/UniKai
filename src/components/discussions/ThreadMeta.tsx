"use client";

import { useState } from "react";
import { Eye, Heart, MessageCircle, Users } from "lucide-react";
import { useChannelEvent, useThreadViewerCount } from "@/lib/realtime/hooks";
import { THREAD_CHANNEL } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type {
  ViewUpdatedPayload,
  ReactionUpdatedPayload,
} from "@/server/lib/ably/types";
import { formatCompactNumber } from "@/lib/utils";

interface ThreadMetaProps {
  threadId: string;
  initialViewCount: number;
  initialReplies: number;
  initialReactions: number;
}

/**
 * Meta thread realtime: jumlah lihat, balasan, reaksi, dan viewer yang sedang
 * berada di halaman ini. Hanya subscribe — data datang dari publish server.
 */
export default function ThreadMeta({
  threadId,
  initialViewCount,
  initialReplies,
  initialReactions,
}: ThreadMetaProps) {
  const channel = THREAD_CHANNEL(threadId);
  const [viewCount, setViewCount] = useState(initialViewCount);
  const [replies, setReplies] = useState(initialReplies);
  const [reactions, setReactions] = useState(initialReactions);

  useChannelEvent(channel, EVENTS.view.updated, (message) => {
    const data = message.data as ViewUpdatedPayload | undefined;
    if (data?.threadId === threadId && typeof data.viewCount === "number") {
      setViewCount(data.viewCount);
    }
  });

  useChannelEvent(channel, EVENTS.reply.created, () => {
    setReplies((n) => n + 1);
  });

  useChannelEvent(channel, EVENTS.reply.deleted, () => {
    setReplies((n) => Math.max(0, n - 1));
  });

  useChannelEvent(channel, EVENTS.reaction.updated, (message) => {
    const data = message.data as ReactionUpdatedPayload | undefined;
    if (data?.targetType === "thread" && data.targetId === threadId) {
      setReactions(data.reactionCount);
    }
  });

  const viewers = useThreadViewerCount(threadId);

  return (
    <>
      <span className="inline-flex items-center gap-1">
        <Eye className="h-3.5 w-3.5" />
        {formatCompactNumber(viewCount)} lihat
      </span>
      <span aria-hidden="true" className="text-foreground/20">
        ·
      </span>
      <span className="inline-flex items-center gap-1">
        <MessageCircle className="h-3.5 w-3.5" />
        {replies} balasan
      </span>
      <span aria-hidden="true" className="text-foreground/20">
        ·
      </span>
      <span className="inline-flex items-center gap-1">
        <Heart className="h-3.5 w-3.5" />
        {formatCompactNumber(reactions)} reaksi
      </span>
      {viewers > 0 && (
        <>
          <span aria-hidden="true" className="text-foreground/20">
            ·
          </span>
          <span className="inline-flex items-center gap-1 text-primary/80">
            <Users className="h-3.5 w-3.5" />
            {viewers} melihat sekarang
          </span>
        </>
      )}
    </>
  );
}
