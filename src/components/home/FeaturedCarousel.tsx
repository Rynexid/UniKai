"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Eye,
  MessageCircle,
  Star,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { cn, formatCompactNumber, formatRelativeTime } from "@/lib/utils";
import type { DiscussionListItem } from "@/types";

const AUTO_ADVANCE_MS = 12_000;

interface FeaturedCarouselProps {
  threads: DiscussionListItem[];
}

export default function FeaturedCarousel({ threads }: FeaturedCarouselProps) {
  const count = threads.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTO_ADVANCE_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  if (count === 0) return null;

  const thread = threads[index];
  const hueClasses = HUE_CLASSES[hueForSlug(thread.category.slug)];

  return (
    <div
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/30 bg-card/60">
        <div
          className={cn(
            "pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full opacity-20 blur-3xl transition-transform duration-500 group-hover:scale-110",
            hueClasses.solid,
          )}
          aria-hidden="true"
        />
        <div
          className={cn(
            "pointer-events-none absolute -bottom-24 -left-16 h-56 w-56 rounded-full opacity-10 blur-3xl",
            hueClasses.solid,
          )}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(600px_280px_at_20%_0%,hsl(var(--primary)/0.10),transparent_60%)]"
          aria-hidden="true"
        />

        <div
          className="absolute inset-x-0 top-0 h-0.5 bg-primary/10"
          aria-hidden="true"
        >
          <div
            key={index}
            className={cn("h-full bg-primary", !paused && "animate-featured-progress")}
            style={{ animationDuration: paused ? "0s" : `${AUTO_ADVANCE_MS}ms` }}
          />
        </div>

        <Link
          key={index}
          href={`/thread/${thread.slug}`}
          className="group relative flex min-h-[230px] flex-col justify-between gap-6 p-6 animate-in fade-in slide-in-from-right-4 duration-500 sm:min-h-[250px] sm:p-8"
        >
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-[11px] font-semibold text-primary">
              <Star className="h-3 w-3 fill-current" />
              Featured
            </span>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
                hueClasses.softBg,
                hueClasses.text,
              )}
            >
              <span className={cn("h-1.5 w-1.5 rounded-full", hueClasses.dot)} />
              {thread.category.name}
            </span>
          </div>

          <div>
            <h3 className="line-clamp-2 font-display text-2xl font-semibold tracking-tight transition-colors group-hover:text-primary sm:text-3xl">
              {thread.title}
            </h3>
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary">
              Baca diskusi
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Avatar className="h-5 w-5">
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
            <span aria-hidden="true" className="text-foreground/20">
              ·
            </span>
            <span>{formatRelativeTime(thread.createdAt)}</span>
            <span aria-hidden="true" className="text-foreground/20">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" />
              {formatCompactNumber(thread.viewCount)} lihat
            </span>
            <span aria-hidden="true" className="text-foreground/20">
              ·
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageCircle className="h-3.5 w-3.5" />
              {formatCompactNumber(thread.replyCount)} balasan
            </span>
          </div>
        </Link>
      </div>

      {count > 1 && (
        <div className="mt-3.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5" role="tablist" aria-label="Pilih Featured">
            {threads.map((t, i) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                aria-label={`Featured ${i + 1}`}
                onClick={() => goTo(i)}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  i === index ? "w-6 bg-primary" : "w-1.5 bg-border hover:bg-muted-foreground",
                )}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label="Featured sebelumnya"
              onClick={() => goTo(index - 1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Featured berikutnya"
              onClick={() => goTo(index + 1)}
              className="grid h-8 w-8 place-items-center rounded-full border border-border/40 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
