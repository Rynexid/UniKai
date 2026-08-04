import Link from "next/link";
import { Eye, MessageCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { formatCompactNumber } from "@/lib/utils";
import type { DiscussionListItem } from "@/types";

interface RelatedThreadsProps {
  items: DiscussionListItem[];
  isLoading?: boolean;
}

export default function RelatedThreads({ items, isLoading = false }: RelatedThreadsProps) {
  return (
    <section className="mt-8">
      <h2 className="mb-4 font-display text-lg font-semibold">Diskusi terkait</h2>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <Skeleton key={`r-${n}`} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : items.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {items.map((t) => {
            const hue = HUE_CLASSES[hueForSlug(t.category.slug)];
            return (
              <Link
                key={t.id}
                href={`/thread/${t.slug}`}
                className="group flex flex-col rounded-xl border border-border/25 bg-card/80 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                title={t.title}
              >
                <span
                  className={`mb-2 inline-flex w-fit max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium ${hue.softBg} ${hue.text}`}
                >
                  <span className={`h-1 w-1 shrink-0 rounded-full ${hue.dot}`} />
                  <span className="truncate">{t.category.name}</span>
                </span>
                <p className="line-clamp-3 text-sm font-medium leading-snug text-foreground/85 transition-colors group-hover:text-primary">
                  {t.title}
                </p>
                <span className="mt-auto flex items-center gap-2.5 pt-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3.5 w-3.5" />
                    {formatCompactNumber(t.replyCount)}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Eye className="h-3.5 w-3.5" />
                    {formatCompactNumber(t.viewCount)}
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Tidak ada diskusi terkait.</p>
      )}
    </section>
  );
}
