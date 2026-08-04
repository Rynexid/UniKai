"use client";

import Link from "next/link";
import { Flame, Users } from "lucide-react";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { formatCompactNumber } from "@/lib/utils";
import type { CommunityChip, DiscussionListItem } from "@/types";

interface HomeSidebarProps {
  chips: CommunityChip[];
  threads: DiscussionListItem[];
}

function topThreads(threads: DiscussionListItem[]): DiscussionListItem[] {
  return [...threads].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5);
}

export default function HomeSidebar({ chips, threads }: HomeSidebarProps) {
  const popular = topThreads(threads);
  const tagChips = chips.slice(0, 8);

  return (
    <aside className="hidden w-72 shrink-0 xl:block" aria-label="Sisi kanan">
      <div className="sticky top-20 space-y-5">
        <div className="rounded-2xl border border-border/30 bg-card/40 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Users className="h-4 w-4 text-primary" />
            Komunitas
          </h2>
          <ul className="mt-4 space-y-1">
            {chips.map((chip) => {
              const hueClasses = HUE_CLASSES[chip.hue];
              return (
                <li key={chip.slug}>
                  <Link
                    href={`/explore?q=${encodeURIComponent(chip.name)}`}
                    className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                    title={`Lihat diskusi ${chip.name}`}
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${hueClasses.dot}`} />
                    <span className="truncate text-foreground/85">{chip.name}</span>
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                      {formatCompactNumber(chip.threadCount)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/40 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Flame className="h-4 w-4 text-primary" />
            Diskusi populer
          </h2>
          {popular.length > 0 ? (
            <ol className="mt-4 space-y-3">
              {popular.map((thread, index) => (
                <li key={thread.id} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 w-5 shrink-0 text-center font-display text-sm font-semibold ${
                      index === 0 ? "text-primary" : "text-muted-foreground/60"
                    }`}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <Link
                      href={`/thread/${thread.slug}`}
                      className="line-clamp-2 text-[13px] font-medium leading-snug transition-colors hover:text-primary"
                      title={thread.title}
                    >
                      {thread.title}
                    </Link>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      {formatCompactNumber(thread.viewCount)} lihat ·{" "}
                      {formatCompactNumber(thread.replyCount)} balasan
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada data diskusi.</p>
          )}
        </div>

        <div className="rounded-2xl border border-border/30 bg-card/40 p-5">
          <h2 className="text-sm font-semibold">Popular tags</h2>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {tagChips.map((chip) => (
              <Link
                key={chip.slug}
                href={`/explore?q=${encodeURIComponent(chip.name)}`}
                className="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/80 transition-colors hover:border-primary/40 hover:text-primary"
              >
                #{chip.slug}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
