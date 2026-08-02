<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Eye, MessageCircle } from "lucide-vue-next";
import type { ThreadListItem } from "@/features/discussions/composables/useThreads";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { formatCompactNumber, formatRelativeTime } from "@/lib/utils";

const props = defineProps<{ thread: ThreadListItem }>();

const hueClasses = HUE_CLASSES[hueForSlug(props.thread.category.slug)];
</script>

<template>
  <article
    class="group relative flex overflow-hidden rounded-xl border bg-card/60 transition-colors duration-300 hover:border-primary/40 hover:bg-primary/[0.03]"
  >
    <span aria-hidden="true" class="w-1 shrink-0" :class="hueClasses.solid" />

    <div class="flex min-w-0 flex-1 flex-col gap-2.5 px-4 py-3.5">
      <RouterLink
        :to="`/thread/${thread.slug}`"
        class="truncate text-[15px] font-semibold leading-snug transition-colors group-hover:text-primary"
        :title="thread.title"
      >
        {{ thread.title }}
      </RouterLink>

      <div class="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
        <span
          class="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
          :class="[hueClasses.softBg, hueClasses.text]"
        >
          <span class="h-1.5 w-1.5 rounded-full" :class="hueClasses.dot" />
          {{ thread.category.name }}
        </span>

        <span class="inline-flex items-center gap-1.5">
          <Avatar class="h-5 w-5">
            <AvatarImage v-if="thread.author.image" :src="thread.author.image" :alt="thread.author.name" />
            <AvatarFallback class="text-[9px]">
              {{ thread.author.name.charAt(0).toUpperCase() }}
            </AvatarFallback>
          </Avatar>
          <span class="font-medium text-foreground/80">{{ thread.author.name }}</span>
        </span>

        <span aria-hidden="true">·</span>
        <span>{{ formatRelativeTime(thread.createdAt) }}</span>

        <span class="ml-auto inline-flex items-center gap-3 sm:hidden">
          <span class="inline-flex items-center gap-1" :title="`${thread.replyCount} balasan`">
            <MessageCircle class="h-3.5 w-3.5" />
            {{ formatCompactNumber(thread.replyCount) }}
          </span>
          <span class="inline-flex items-center gap-1" :title="`${thread.viewCount} lihat`">
            <Eye class="h-3.5 w-3.5" />
            {{ formatCompactNumber(thread.viewCount) }}
          </span>
        </span>
      </div>
    </div>

    <div
      class="hidden shrink-0 flex-col items-end justify-center gap-2 border-l border-border/60 px-4 text-xs text-muted-foreground sm:flex"
    >
      <span class="inline-flex items-center gap-1.5" :title="`${thread.replyCount} balasan`">
        <MessageCircle class="h-3.5 w-3.5" />
        {{ formatCompactNumber(thread.replyCount) }}
      </span>
      <span class="inline-flex items-center gap-1.5" :title="`${thread.viewCount} lihat`">
        <Eye class="h-3.5 w-3.5" />
        {{ formatCompactNumber(thread.viewCount) }}
      </span>
    </div>
  </article>
</template>
