import { Suspense } from "react";
import HomeFeed from "@/components/home/HomeFeed";
import { Skeleton } from "@/components/ui/skeleton";
import { hueForSlug } from "@/features/communities/data/communities";
import type { CommunityChip, DiscussionListItem } from "@/types";

const API_BASE = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`GET ${path} -> ${res.status}`);
  return res.json() as Promise<T>;
}

interface CategoryPayload {
  id: string;
  name: string;
  slug: string;
  threadCount: number;
}

export default async function HomePage() {
  const [threads, categories] = await Promise.all([
    fetchJson<DiscussionListItem[]>("/api/discussions/threads").catch(() => []),
    fetchJson<CategoryPayload[]>("/api/communities").catch(() => []),
  ]);

  const chips: CommunityChip[] = categories.map((c) => ({
    name: c.name,
    slug: c.slug,
    threadCount: c.threadCount,
    hue: hueForSlug(c.slug),
  }));

  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl space-y-3 px-4 py-8 xl:max-w-7xl" aria-busy="true">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={`home-sk-${n}`} className="h-[76px] w-full rounded-2xl" />
          ))}
        </div>
      }
    >
      <HomeFeed threads={threads} chips={chips} />
    </Suspense>
  );
}
