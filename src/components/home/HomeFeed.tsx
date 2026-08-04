"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Flame,
  HelpCircle,
  Search,
  Sparkles,
  Star,
  Users,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import VerseField from "@/features/communities/components/VerseField";
import CommunitiesSection from "@/features/communities/components/CommunitiesSection";
import ThreadCard from "@/components/threads/ThreadCard";
import HomeSidebar from "@/components/home/HomeSidebar";
import FeaturedCarousel from "@/components/home/FeaturedCarousel";
import { useChannelEvent } from "@/lib/realtime/hooks";
import { FEED_CHANNELS } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type { CommunityChip, DiscussionListItem } from "@/types";

interface HomeFeedProps {
  threads: DiscussionListItem[];
  chips: CommunityChip[];
}

interface FeedSectionDef {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEED_SECTIONS: FeedSectionDef[] = [
  { id: "for-you", title: "For You", description: "Rekomendasi yang dipersonalisasi untukmu.", icon: Sparkles },
  { id: "featured", title: "Featured", description: "Dipilih dan diunggulkan oleh moderator.", icon: Star },
  { id: "trending", title: "Trending", description: "Sedang hangat diperbincangkan.", icon: Flame },
  { id: "popular", title: "Popular", description: "Paling banyak dibaca dan dibalas.", icon: BarChart3 },
  { id: "unanswered", title: "Unanswered", description: "Pertanyaan yang menunggu jawaban.", icon: HelpCircle },
  { id: "following", title: "Following", description: "Dari komunitas dan orang yang kamu ikuti.", icon: Users },
];

const PER_SECTION = 6;

function trendScore(t: DiscussionListItem): number {
  const ageHours = (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 3600);
  const recency = Math.max(0, 24 - ageHours);
  return t.viewCount + t.replyCount * 5 + recency;
}

function useFeedData(threads: DiscussionListItem[]) {
  return useMemo<Record<string, DiscussionListItem[]>>(() => {
    const byDateDesc = [...threads].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return {
      "for-you": threads,
      trending: [...threads].sort((a, b) => trendScore(b) - trendScore(a)),
      popular: [...threads].sort((a, b) => b.viewCount - a.viewCount),
      unanswered: threads.filter((t) => t.replyCount === 0),
      following: byDateDesc,
      featured: threads.filter((t) => t.featured),
    };
  }, [threads]);
}

function FeedSection({
  section,
  items,
  expanded,
  onToggle,
  children,
}: {
  section: FeedSectionDef;
  items: DiscussionListItem[];
  expanded: boolean;
  onToggle: () => void;
  children?: ReactNode;
}) {
  const Icon = section.icon;
  const visible = expanded ? items : items.slice(0, PER_SECTION);

  return (
    <section className="scroll-mt-24" aria-labelledby={`feed-${section.id}-title`}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <h2
            id={`feed-${section.id}-title`}
            className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-4 w-4" />
            </span>
            {section.title}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{section.description}</p>
        </div>

        {items.length > PER_SECTION && (
          <Button variant="ghost" size="sm" onClick={onToggle} className="shrink-0 gap-1">
            {expanded ? "Sembunyikan" : "Lihat Semua"}
            <ChevronRight
              className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </Button>
        )}
      </div>

      {children ?? (
        <div className="space-y-3">
          {visible.map((thread) => (
            <ThreadCard key={thread.id} thread={thread} />
          ))}
        </div>
      )}
    </section>
  );
}

export default function HomeFeed({ threads, chips }: HomeFeedProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("q") ?? "";
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  // Muat ulang feed saat thread baru tayang (tanpa mengganggu pencarian aktif).
  const lastRefresh = useRef(0);
  useChannelEvent(FEED_CHANNELS.latest, EVENTS.thread.created, () => {
    if (searchQuery) return;
    const now = Date.now();
    if (now - lastRefresh.current < 5000) return;
    lastRefresh.current = now;
    router.refresh();
  });

  const feedData = useFeedData(threads);

  const toggleSection = (id: string) =>
    setExpandedSections((prev) => ({ ...prev, [id]: !prev[id] }));

  const filteredThreads = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q) ||
        t.author.name.toLowerCase().includes(q),
    );
  }, [threads, searchQuery]);

  return (
    <>
      {/* ========================= HEADER BAND ========================= */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute inset-0 bg-[radial-gradient(900px_420px_at_72%_18%,hsl(var(--primary)/0.16),transparent_60%)]" />
          <div className="absolute inset-0 bg-[radial-gradient(620px_360px_at_6%_92%,rgba(255,154,91,0.09),transparent_60%)]" />
          <div className="absolute inset-0 opacity-60">
            <VerseField />
          </div>
        </div>

        <div className="relative mx-auto max-w-6xl px-4 py-10 sm:py-14 xl:max-w-7xl">
          <p className="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
            One Place. Every Community.
          </p>

          <div className="mt-3 max-w-2xl">
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
              Semua komunitas. Semua percakapan.
              <span className="bg-gradient-to-r from-primary to-[#FF9A63] bg-clip-text text-transparent">
                {" "}
                Dalam satu tempat.
              </span>
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              Temukan diskusi, bagikan pengalaman, dan bangun koneksi bersama orang-orang yang
              memiliki minat yang sama.
            </p>
          </div>
        </div>
      </section>

      {/* ============================ ISI ============================= */}
      <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10 xl:max-w-7xl">
        <div className="flex items-start gap-8">
          <div className="min-w-0 flex-1">
            {filteredThreads ? (
              <section aria-labelledby="search-results-title">
                <h2
                  id="search-results-title"
                  className="flex items-center gap-2 font-display text-xl font-semibold tracking-tight"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Search className="h-4 w-4" />
                  </span>
                  Hasil pencarian
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {filteredThreads.length} diskusi untuk &quot;{searchQuery.trim()}&quot;
                </p>

                <div className="mt-5 space-y-3">
                  {filteredThreads.length > 0 ? (
                    filteredThreads.map((thread) => (
                      <ThreadCard key={thread.id} thread={thread} />
                    ))
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
                      <p className="font-medium">Tidak ada diskusi yang cocok.</p>
                      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                        Coba kata kunci lain, atau mulai diskusi baru tentang topik ini.
                      </p>
                    </div>
                  )}
                </div>
              </section>
            ) : threads.length === 0 ? (
              <div className="space-y-3" aria-busy="true">
                {[0, 1, 2, 3].map((n) => (
                  <Skeleton key={`sk-${n}`} className="h-[76px] w-full rounded-2xl" />
                ))}
              </div>
            ) : (
              <div className="space-y-12 sm:space-y-14">
                {FEED_SECTIONS.map((section) => {
                  const items = feedData[section.id];
                  if (items.length === 0) return null;
                  return (
                    <FeedSection
                      key={section.id}
                      section={section}
                      items={items}
                      expanded={!!expandedSections[section.id]}
                      onToggle={() => toggleSection(section.id)}
                    >
                      {section.id === "featured" && <FeaturedCarousel threads={items} />}
                    </FeedSection>
                  );
                })}
              </div>
            )}
          </div>

          <HomeSidebar chips={chips} threads={threads} />
        </div>
      </div>

      <CommunitiesSection />
    </>
  );
}
