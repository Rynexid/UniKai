import { ArrowUpRight } from "lucide-react";
import { HUE_CLASSES } from "@/features/communities/data/communities";
import type { CommunityMeta } from "@/features/communities/data/communities";

export default function CommunityCard({ community }: { community: CommunityMeta }) {
  return (
    <a
      href="#diskusi"
      className="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_32px_-16px_hsl(var(--primary)/0.5)]"
    >
      <div className="flex items-center justify-between">
        <span
          className={`h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125 ${HUE_CLASSES[community.hue].dot}`}
        />
        <ArrowUpRight className="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">{community.name}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{community.tagline}</p>
      </div>
    </a>
  );
}
