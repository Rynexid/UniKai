<script setup lang="ts">
import { ArrowUpRight } from "lucide-vue-next";
import { HUE_CLASSES } from "@/features/communities/data/communities";
import type { CommunityMeta } from "@/features/communities/data/communities";

defineProps<{ community: CommunityMeta }>();
</script>

<template>
  <a
    :href="`#diskusi`"
    class="group flex flex-col gap-3 rounded-xl border bg-card p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_12px_32px_-16px_hsl(var(--primary)/0.5)]"
  >
    <div class="flex items-center justify-between">
      <span
        class="h-2.5 w-2.5 rounded-full transition-transform duration-300 group-hover:scale-125"
        :class="HUE_CLASSES[community.hue].dot"
      />
      <ArrowUpRight
        class="h-4 w-4 text-muted-foreground opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
      />
    </div>
    <div class="space-y-1">
      <p class="text-sm font-semibold">{{ community.name }}</p>
      <p class="text-xs leading-relaxed text-muted-foreground">{{ community.tagline }}</p>
    </div>
  </a>
</template>
