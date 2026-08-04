"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ThreadCard from "@/components/threads/ThreadCard";
import type { DiscussionListItem } from "@/types";

export default function ExploreFeed({ threads }: { threads: DiscussionListItem[] }) {
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim().toLowerCase() ?? "";

  const filtered = useMemo(() => {
    if (!q) return threads;
    return threads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.category.name.toLowerCase().includes(q) ||
        t.author.name.toLowerCase().includes(q),
    );
  }, [threads, q]);

  if (filtered.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-medium">Tidak ada diskusi yang cocok.</p>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Coba kata kunci lain, atau mulai diskusi baru tentang topik ini.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {q && (
        <p className="text-sm text-muted-foreground">
          {filtered.length} hasil untuk &quot;{q}&quot;
        </p>
      )}
      {filtered.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
