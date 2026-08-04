import { Suspense } from "react";
import type { Metadata } from "next";
import { Skeleton } from "@/components/ui/skeleton";
import ExploreFeed from "@/features/explore/components/ExploreFeed";
import type { DiscussionListItem } from "@/types";

const API_BASE = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Jelajah · UniKai",
};

async function fetchThreads(): Promise<DiscussionListItem[]> {
  try {
    const res = await fetch(`${API_BASE}/api/discussions/threads`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    return (await res.json()) as DiscussionListItem[];
  } catch {
    return [];
  }
}

export default async function ExplorePage() {
  const threads = await fetchThreads();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <header className="mb-6">
        <p className="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground">
          Jelajah
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          Semua diskusi
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Jelajahi setiap pembahasan dari semua komunitas di UniKai.
        </p>
      </header>

      <Suspense
        fallback={
          <div className="space-y-3" aria-busy="true">
            {[0, 1, 2, 3, 4].map((n) => (
              <Skeleton key={`explore-sk-${n}`} className="h-[76px] w-full rounded-2xl" />
            ))}
          </div>
        }
      >
        <ExploreFeed threads={threads} />
      </Suspense>
    </div>
  );
}
