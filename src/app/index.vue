<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { BarChart3, Flame, Plus, Search, Users } from "lucide-vue-next";
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

const { threads, isLoading, fetchThreads } = useThreads();
const { chips, load: loadCommunities } = useCommunities();
const userStore = useUserStore();

const route = useRoute();
const router = useRouter();

const activeCategory = ref<string | undefined>(undefined);
const searchQuery = ref("");
const isCreateDialogOpen = ref(false);

const filteredThreads = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return threads.value;
  return threads.value.filter(
    (t) => t.title.toLowerCase().includes(q) || t.category.name.toLowerCase().includes(q),
  );
});

const popularThreads = computed(() =>
  [...threads.value].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5),
);

const totalCommunityThreads = computed(() =>
  chips.value.reduce((sum, chip) => sum + chip.threadCount, 0),
);

const totalViews = computed(() =>
  threads.value.reduce((sum, thread) => sum + thread.viewCount, 0),
);

function handleCategorySelect(slug: string | undefined): void {
  activeCategory.value = slug;
  void fetchThreads(slug);
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
        class="absolute inset-0 bg-[radial-gradient(620px_360px_at_6%_92%,rgba(255,154,99,0.09),transparent_60%)]"
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
      <!-- ---------------------- DAFTAR DISKUSI ---------------------- -->
      <div class="min-w-0">
        <div
          class="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          role="group"
          aria-label="Filter kategori diskusi"
        >
          <button
            type="button"
            class="shrink-0 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            :class="
              activeCategory === undefined
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            "
            @click="handleCategorySelect(undefined)"
          >
            Semua
          </button>
          <button
            v-for="chip in chips"
            :key="chip.slug"
            type="button"
            class="flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm transition-colors"
            :class="
              activeCategory === chip.slug
                ? 'border-primary bg-primary/10 font-medium text-foreground'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
            "
            @click="handleCategorySelect(chip.slug)"
          >
            <span class="h-1.5 w-1.5 rounded-full" :class="HUE_CLASSES[chip.hue].dot" />
            {{ chip.name }}
          </button>
        </div>

        <p class="mt-4 text-xs text-muted-foreground">
          Menampilkan {{ filteredThreads.length }} diskusi
          <template v-if="searchQuery.trim()"> untuk "{{ searchQuery.trim() }}"</template>
        </p>

        <div class="mt-3 space-y-3">
          <Skeleton v-if="isLoading" v-for="i in 6" :key="i" class="h-[76px] w-full rounded-xl" />

          <template v-else>
            <ThreadCard v-for="thread in filteredThreads" :key="thread.id" :thread="thread" />

            <div
              v-if="filteredThreads.length === 0"
              class="rounded-xl border border-dashed border-border px-6 py-14 text-center"
            >
              <p class="font-medium">
                {{ searchQuery ? "Tidak ada diskusi yang cocok." : "Verse masih sepi di sini." }}
              </p>
              <p class="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
                {{
                  searchQuery
                    ? "Coba kata kunci lain, atau mulai diskusi baru tentang topik ini."
                    : "Belum ada diskusi di kategori ini. Jadilah yang pertama menyalakan bintang baru."
                }}
              </p>
              <Button class="mt-5" @click="handleOpenCreateDialog">Mulai Diskusi</Button>
            </div>
          </template>
        </div>
      </div>

      <!-- ---------------------------- SIDEBAR ---------------------------- -->
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
            <BarChart3 class="h-4 w-4 text-primary" />
            Statistik
          </h2>
          <dl class="mt-4 grid grid-cols-3 gap-3 text-center">
            <div class="rounded-lg bg-accent/60 px-2 py-3">
              <dt class="text-[11px] text-muted-foreground">Komunitas</dt>
              <dd class="mt-1 font-display text-xl font-semibold tabular-nums">
                {{ chips.length }}
              </dd>
            </div>
            <div class="rounded-lg bg-accent/60 px-2 py-3">
              <dt class="text-[11px] text-muted-foreground">Diskusi</dt>
              <dd class="mt-1 font-display text-xl font-semibold tabular-nums">
                {{ formatCompactNumber(totalCommunityThreads) }}
              </dd>
            </div>
            <div class="rounded-lg bg-accent/60 px-2 py-3">
              <dt class="text-[11px] text-muted-foreground">Lihat</dt>
              <dd class="mt-1 font-display text-xl font-semibold tabular-nums">
                {{ formatCompactNumber(totalViews) }}
              </dd>
            </div>
          </dl>
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
                  {{ formatCompactNumber(thread.viewCount) }} lihat
                </p>
              </div>
            </li>
          </ol>
          <p v-else class="mt-4 text-sm text-muted-foreground">Belum ada data diskusi.</p>
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
