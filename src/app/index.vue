<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import {
  BarChart3,
  Clock,
  Flame,
  HelpCircle,
  Plus,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import VerseField from "@/features/communities/components/VerseField.vue";
import ThreadCard from "@/features/discussions/components/ThreadCard.vue";
import CreateThreadDialog from "@/features/discussions/components/CreateThreadDialog.vue";
import { useThreads } from "@/features/discussions/composables/useThreads";
import { useCommunities } from "@/features/communities/composables/useCommunities";
import { HUE_CLASSES } from "@/features/communities/data/communities";
import { formatCompactNumber } from "@/lib/utils";
import { useUserStore } from "@/stores/user.store";
import type { ThreadListItem } from "@/features/discussions/composables/useThreads";

const { threads, isLoading, error, fetchThreads } = useThreads();
const { chips, load: loadCommunities } = useCommunities();
const userStore = useUserStore();

const route = useRoute();
const router = useRouter();

const activeCategory = ref<string | undefined>(undefined);
const activeTab = ref("for-you");
const searchQuery = ref("");
const sortDir = ref<"desc" | "asc">("desc");
const isCreateDialogOpen = ref(false);
const visibleCount = ref(12);

const FEED_TABS = [
  { id: "for-you", label: "For You", icon: Sparkles },
  { id: "latest", label: "Latest", icon: Clock },
  { id: "trending", label: "Trending", icon: Flame },
  { id: "popular", label: "Popular", icon: BarChart3 },
  { id: "unanswered", label: "Unanswered", icon: HelpCircle },
  { id: "following", label: "Following", icon: Users },
  { id: "featured", label: "Featured", icon: Star },
] as const;

const SORT_OPTIONS = [
  { value: "desc", label: "Terbaru dulu" },
  { value: "asc", label: "Terlama dulu" },
] as const;

function trendScore(t: ThreadListItem): number {
  const ageHours =
    (Date.now() - new Date(t.createdAt).getTime()) / (1000 * 3600);
  const recency = Math.max(0, 24 - ageHours); // semakin baru, semakin naik
  return t.viewCount + t.replyCount * 5 + recency;
}

function sortedThreads(): ThreadListItem[] {
  const src = threads.value;
  const dir = sortDir.value === "desc" ? 1 : -1;
  const byDate = (a: ThreadListItem, b: ThreadListItem) =>
    dir *
    (new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  switch (activeTab.value) {
    case "latest":
      return [...src].sort(byDate);
    case "trending":
      return [...src].sort((a, b) =>
        sortDir.value === "desc"
          ? trendScore(b) - trendScore(a)
          : trendScore(a) - trendScore(b),
      );
    case "popular":
      return [...src].sort((a, b) =>
        sortDir.value === "desc" ? b.viewCount - a.viewCount : a.viewCount - b.viewCount,
      );
    case "unanswered":
      return src.filter((t) => t.replyCount === 0).sort(byDate);
    case "following":
      // Backend belum mengekspor grafik following → fallback Latest.
      return [...src].sort(byDate);
    case "featured":
      return []; // belum ada flag di schema
    case "for-you":
    default:
      return src;
  }
}

const displayedThreads = computed(() => {
  const list = sortedThreads();
  if (activeTab.value === "featured") return list;
  return list.slice(0, visibleCount.value);
});

const filteredThreads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return displayedThreads.value;
  return displayedThreads.value.filter(
    (t) =>
      t.title.toLowerCase().includes(q) ||
      t.category.name.toLowerCase().includes(q),
  );
});

const popularThreads = computed(() =>
  [...threads.value]
    .sort((a, b) => b.viewCount - a.viewCount)
    .slice(0, 5),
);

const showLoadMore = computed(
  () => activeTab.value !== "featured" && displayedThreads.value.length >= visibleCount.value && displayedThreads.value.length < threads.value.length,
);

function handleTabSelect(id: string) {
  activeTab.value = id;
  searchQuery.value = "";
  sortDir.value = "desc";
  visibleCount.value = 12;
  void fetchThreads(activeCategory.value);
}

function handleCategorySelect(slug: string | undefined): void {
  activeCategory.value = slug;
  visibleCount.value = 12;
  void fetchThreads(slug);
}

function loadMore(): void {
  visibleCount.value += 12;
}

function handleOpenCreateDialog(): void {
  if (!userStore.isAuthenticated) {
    void router.push({ path: "/login", query: { redirect: route.fullPath } });
    return;
  }
  isCreateDialogOpen.value = true;
}

function handleThreadCreated(): void {
  isCreateDialogOpen.value = false;
  void fetchThreads(activeCategory.value);
}

watch(activeTab, () => {
  visibleCount.value = 12;
});

onMounted(() => {
  void fetchThreads();
  void loadCommunities();
});
</script>

<template>
  <!-- ========================= HEADER BAND ========================= -->
  <section class="relative overflow-hidden border-b border-border/60">
    <div class="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        class="absolute inset-0 bg-[radial-gradient(900px_420px_at_72%_18%,hsl(var(--primary)/0.16),transparent_60%)]"
      />
      <div
        class="absolute inset-0 bg-[radial-gradient(620px_360px_at_6%_92%,rgba(255,154,91,0.09),transparent_60%)]"
      />
      <VerseField class="absolute inset-0 opacity-60" />
    </div>

    <div class="relative mx-auto max-w-6xl px-4 py-10 sm:py-14 xl:max-w-7xl">
      <p
        class="font-display text-[11px] font-medium uppercase tracking-[0.35em] text-muted-foreground"
      >
        One Place. Every Community.
      </p>

      <div class="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div class="max-w-xl">
          <h1 class="font-display text-3xl font-semibold tracking-tight sm:text-4xl xl:text-5xl">
            Satu Verse.
            <span class="bg-gradient-to-r from-primary to-[#FF9A63] bg-clip-text text-transparent">
              Semua diskusimu.
            </span>
          </h1>
          <p class="mt-2 text-sm leading-relaxed text-muted-foreground">
            Baca, balas, dan mulai percakapan. Obrolan dari setiap sudut komunitasmu.
          </p>
        </div>

        <div class="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[440px]">
          <div class="relative flex-1">
            <Search
              class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              v-model="searchQuery"
              class="pl-9"
              placeholder="Cari diskusi atau kategori..."
              aria-label="Cari diskusi"
            />
          </div>
          <Button @click="handleOpenCreateDialog">
            <Plus class="h-4 w-4" />
            Buat Diskusi
          </Button>
        </div>
      </div>
    </div>
  </section>

  <!-- ============================ ISI ============================= -->
  <section class="mx-auto max-w-6xl px-4 py-8 sm:py-10 xl:max-w-7xl">
    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
      <!-- ===================== DAFTAR DISKUSI ===================== -->
      <div class="min-w-0">
        <!-- Feed Navigation -->
        <nav
          class="mb-4 flex items-center justify-between gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Tab umpan diskusi"
        >
          <div class="flex items-center gap-1.5">
            <button
              v-for="tab in FEED_TABS"
              :key="tab.id"
              type="button"
              @click="handleTabSelect(tab.id)"
              :aria-current="activeTab === tab.id ? 'page' : undefined"
              class="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
              :class="
                activeTab === tab.id
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              "
            >
              <component :is="tab.icon" class="h-3.5 w-3.5" />
              {{ tab.label }}
            </button>
          </div>

          <div v-if="activeTab !== 'featured' && activeTab !== 'following'" class="flex items-center gap-2">
            <label class="text-xs text-muted-foreground">Urutkan:</label>
            <select
              v-model="sortDir"
              class="appearance-none rounded-md border border-input bg-background px-2 py-1 text-xs outline-none ring-ring focus-within:ring-2"
            >
              <option v-for="s in SORT_OPTIONS" :key="s.value" :value="s.value">
                {{ s.label }}
              </option>
            </select>
          </div>
        </nav>

        <!-- Community filter chips -->
        <div
          v-if="activeTab === 'for-you'"
          class="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground"
        >
          <span>Komunitas:</span>
          <button
            type="button"
            class="rounded-full border border-border px-2.5 py-0.5 text-xs transition-colors"
            :class="
              activeCategory === undefined
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'text-foreground/80 hover:bg-accent hover:text-foreground'
            "
            @click="handleCategorySelect(undefined)"
          >
            Semua
          </button>
          <button
            v-for="chip in chips.slice(0, 5)"
            :key="chip.slug"
            type="button"
            class="rounded-full border border-border px-2.5 py-0.5 text-xs transition-colors"
            :class="
              activeCategory === chip.slug
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'text-foreground/80 hover:bg-accent hover:text-foreground'
            "
            @click="handleCategorySelect(chip.slug)"
          >
            {{ chip.name }}
          </button>
          <span
            v-if="chips.length > 5"
            class="text-foreground/50"
          >+{{ chips.length - 5 }} lagi</span>
        </div>

        <p class="mb-3 text-xs text-muted-foreground">
          {{ filteredThreads.length }} diskusi
          <template v-if="searchQuery.trim()"> untuk "{{ searchQuery.trim() }}"</template>
        </p>

        <div class="mt-3 space-y-3">
          <Skeleton v-if="isLoading" v-for="i in 6" :key="i" class="h-[76px] w-full rounded-xl" />

          <template v-else>
            <ThreadCard
              v-for="thread in filteredThreads"
              :key="thread.id"
              :thread="thread"
            />

            <div
              v-if="filteredThreads.length === 0"
              class="rounded-xl border border-dashed border-border px-6 py-14 text-center"
            >
              <p class="font-medium">
                {{ activeTab === 'featured' ? 'Belum ada diskusi yang diunggulkan.' : searchQuery ? 'Tidak ada diskusi yang cocok.' : 'Verse sedang sepi.' }}
              </p>
              <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {{
                  searchQuery
                    ? 'Coba kata kunci lain, atau mulai diskusi baru tentang topik ini.'
                    : activeTab === 'featured'
                      ? 'Diskusi yang diunggulkan akan muncul di sini.'
                      : 'Jadilah yang pertama untuk memulai percakapan.'
                }}
              </p>
              <Button class="mt-5" @click="handleOpenCreateDialog">
                <Plus class="h-4 w-4" />
                Mulai Diskusi
              </Button>
            </div>

            <div v-if="showLoadMore" class="pt-2 text-center">
              <Button variant="outline" @click="loadMore">Muat lebih</Button>
            </div>

            <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
          </template>
        </div>
      </div>

      <!-- =========================== SIDEBAR =========================== -->
      <aside class="space-y-5 lg:sticky lg:top-24 lg:self-start">
        <div class="rounded-xl border bg-card/50 p-5">
          <h2 class="flex items-center gap-2 text-sm font-semibold">
            <Users class="h-4 w-4 text-primary" />
            Komunitas
          </h2>
          <ul class="mt-4 space-y-1">
            <li v-for="chip in chips" :key="chip.slug">
              <button
                type="button"
                class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                :class="activeCategory === chip.slug ? 'bg-accent' : ''"
                @click="handleCategorySelect(activeCategory === chip.slug ? undefined : chip.slug)"
              >
                <span class="h-2 w-2 shrink-0 rounded-full" :class="HUE_CLASSES[chip.hue].dot" />
                <span class="truncate text-foreground/85">{{ chip.name }}</span>
                <span class="ml-auto shrink-0 text-xs tabular-nums text-muted-foreground">
                  {{ formatCompactNumber(chip.threadCount) }}
                </span>
              </button>
            </li>
          </ul>
        </div>

        <div class="rounded-xl border bg-card/50 p-5">
          <h2 class="flex items-center gap-2 text-sm font-semibold">
            <Flame class="h-4 w-4 text-primary" />
            Diskusi populer
          </h2>
          <ol v-if="popularThreads.length > 0" class="mt-4 space-y-3">
            <li
              v-for="(thread, index) in popularThreads"
              :key="thread.id"
              class="flex items-start gap-3"
            >
              <span
                class="mt-0.5 w-5 shrink-0 text-center font-display text-sm font-semibold"
                :class="index === 0 ? 'text-primary' : 'text-muted-foreground/60'"
              >
                {{ index + 1 }}
              </span>
              <div class="min-w-0">
                <RouterLink
                  :to="`/thread/${thread.slug}`"
                  class="line-clamp-2 text-[13px] font-medium leading-snug transition-colors hover:text-primary"
                >
                  {{ thread.title }}
                </RouterLink>
                <p class="mt-1 text-[11px] text-muted-foreground">
                  {{ formatCompactNumber(thread.viewCount) }} lihat · {{ formatCompactNumber(thread.replyCount) }} balasan
                </p>
              </div>
            </li>
          </ol>
          <p v-else class="mt-4 text-sm text-muted-foreground">Belum ada data diskusi.</p>
        </div>

        <div class="rounded-xl border bg-card/50 p-5">
          <h2 class="flex items-center gap-2 text-sm font-semibold">
            <span class="text-xs">Popular tags</span>
          </h2>
          <div class="mt-3 flex flex-wrap gap-1.5">
            <span
              v-for="chip in chips.slice(0, 8)"
              :key="chip.slug"
              class="rounded-full border border-border bg-background px-2.5 py-1 text-xs text-foreground/80"
            >
              #{{ chip.slug }}
            </span>
          </div>
        </div>
      </aside>
    </div>

    <CreateThreadDialog
      v-model:open="isCreateDialogOpen"
      :category-slug="activeCategory"
      @created="handleThreadCreated"
    />
  </section>
</template>
