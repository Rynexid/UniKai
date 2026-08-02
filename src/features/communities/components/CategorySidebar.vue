<script setup lang="ts">
import { onMounted, ref } from "vue";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Hash } from "lucide-vue-next";

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  threadCount: number;
}

const props = defineProps<{ activeSlug?: string }>();
const emit = defineEmits<{ select: [slug: string | undefined] }>();

const categories = ref<CategoryItem[]>([]);
const isLoading = ref(true);

async function loadCategories() {
  isLoading.value = true;
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/communities`, {
      credentials: "include",
    });
    categories.value = (await res.json()) as CategoryItem[];
  } finally {
    isLoading.value = false;
  }
}

onMounted(loadCategories);
</script>

<template>
  <aside class="h-fit rounded-lg border bg-card p-3">
    <h2 class="mb-2 px-2 text-sm font-medium text-muted-foreground">Kategori</h2>

    <ScrollArea class="h-[70vh] pr-2">
      <nav class="space-y-1">
        <button
          type="button"
          class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          :class="{ 'bg-accent font-medium': !props.activeSlug }"
          @click="emit('select', undefined)"
        >
          <span class="flex items-center gap-2">
            <Hash class="h-4 w-4" /> Semua Thread
          </span>
        </button>

        <button
          v-for="category in categories"
          :key="category.id"
          type="button"
          class="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
          :class="{ 'bg-accent font-medium': props.activeSlug === category.slug }"
          @click="emit('select', category.slug)"
        >
          <span class="flex items-center gap-2 truncate">
            <Hash class="h-4 w-4 shrink-0" /> {{ category.name }}
          </span>
          <Badge variant="secondary">{{ category.threadCount }}</Badge>
        </button>

        <p v-if="!isLoading && categories.length === 0" class="px-2 py-4 text-xs text-muted-foreground">
          Belum ada kategori.
        </p>
      </nav>
    </ScrollArea>
  </aside>
</template>
