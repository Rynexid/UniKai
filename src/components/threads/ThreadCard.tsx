import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from "@/components/ui/avatar";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils";
import type { DiscussionListItem } from "@/types";

export default function ThreadCard({ thread }: { thread: DiscussionListItem }) {
  const hueClasses = HUE_CLASSES[hueForSlug(thread.category.slug)];
  const participants = thread.participants ?? [];
  const showGroup = participants.length > 1;

  return (
    <article className="group relative flex overflow-hidden rounded-2xl border border-border/25 bg-card/80 shadow-sm transition-all duration-300 hover:translate-y-[-2px] hover:shadow-lg">
      <span aria-hidden="true" className={`h-1 w-1.5 shrink-0 ${hueClasses.solid}`} />

      <div className="flex min-w-0 flex-1 flex-col gap-3 px-4 py-4 sm:py-4.5">
        <Link
          href={`/thread/${thread.slug}`}
          className="line-clamp-2 text-[15px] font-semibold leading-tight transition-colors group-hover:text-primary"
          title={thread.title}
        >
          {thread.title}
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${hueClasses.softBg} ${hueClasses.text}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${hueClasses.dot}`} />
            {thread.category.name}
          </span>

          {showGroup ? (
            <AvatarGroup
              className="-space-x-1.5"
              aria-label={`${participants.length} orang berdiskusi`}
            >
              {participants.slice(0, 3).map((p) => {
                const avatar = (
                  <Avatar key={p.id} className="size-5">
                    {p.image ? (
                      <AvatarImage src={p.image} alt={p.name} />
                    ) : (
                      <AvatarFallback className="text-[9px]">
                        {p.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                );
                return p.username ? (
                  <Link
                    key={p.id}
                    href={`/${p.username}`}
                    title={p.name}
                    className="transition-opacity hover:opacity-80"
                  >
                    {avatar}
                  </Link>
                ) : (
                  avatar
                );
              })}
              {participants.length > 3 && (
                <AvatarGroupCount className="size-5 text-[9px]">
                  +{participants.length - 3}
                </AvatarGroupCount>
              )}
              <span className="sr-only">{participants.length} orang berdiskusi</span>
            </AvatarGroup>
          ) : thread.author.username ? (
            <Link
              href={`/${thread.author.username}`}
              title={thread.author.name}
              className="inline-flex items-center gap-1.5 transition-opacity hover:opacity-80"
            >
              <Avatar className="size-5">
                {thread.author.image ? (
                  <AvatarImage src={thread.author.image} alt={thread.author.name} />
                ) : (
                  <AvatarFallback className="text-[9px]">
                    {thread.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium text-foreground/80 hover:text-primary">
                {thread.author.name}
              </span>
            </Link>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <Avatar className="size-5">
                {thread.author.image ? (
                  <AvatarImage src={thread.author.image} alt={thread.author.name} />
                ) : (
                  <AvatarFallback className="text-[9px]">
                    {thread.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="font-medium text-foreground/80">{thread.author.name}</span>
            </span>
          )}

          <span aria-hidden="true" className="text-foreground/20">·</span>
          <span>{formatRelativeTime(thread.createdAt)}</span>

          <span className="ml-auto inline-flex items-center gap-3 sm:hidden">
            <span className="inline-flex items-center gap-1" title={`${thread.replyCount} balasan`}>
              <MessageCircle className="h-3.5 w-3.5" />
              {formatCompactNumber(thread.replyCount)}
            </span>
            <span className="inline-flex items-center gap-1" title={`${thread.viewCount} lihat`}>
              <Eye className="h-3.5 w-3.5" />
              {formatCompactNumber(thread.viewCount)}
            </span>
          </span>
        </div>
      </div>

      <div className="hidden shrink-0 flex-col items-end justify-center gap-2.5 border-l border-border/40 px-4 text-xs text-muted-foreground sm:flex">
        <span className="inline-flex items-center gap-1.5" title={`${thread.replyCount} balasan`}>
          <MessageCircle className="h-3.5 w-3.5" />
          {formatCompactNumber(thread.replyCount)}
        </span>
        <span className="inline-flex items-center gap-1.5" title={`${thread.viewCount} lihat`}>
          <Eye className="h-3.5 w-3.5" />
          {formatCompactNumber(thread.viewCount)}
        </span>
      </div>
    </article>
  );
}
