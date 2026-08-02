<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user.store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import type { CommunityCategory } from "@/features/communities/queries";
import {
  CheckCircle,
  ChevronLeft,
  Edit3,
  Eye,
  List as ListIcon,
  Send,
  Sparkles,
  X,
} from "lucide-vue-next";

const router = useRouter();
const userStore = useUserStore();

const communities = ref<CommunityCategory[]>([]);
const communityLoading = ref(false);
const communityError = ref<string | null>(null);

const form = ref({
  title: "",
  content: "",
  communitySlug: "",
});

const errors = ref<Record<string, string | undefined>>({});
const isPublishing = ref(false);
const savedRef = ref(false);

const DRAFT_KEY = "unikai:create-draft";

const titleRules = computed(() => {
  const v = form.value.title.length;
  return v < 10
    ? { valid: false, msg: `Judul minimal 10 karakter (saat ini ${v})` }
    : v > 150
      ? { valid: false, msg: "Judul maksimal 150 karakter" }
      : { valid: true, msg: "" };
});
const contentRules = computed(() => {
  const v = form.value.content.trim().length;
  return v < 10
    ? { valid: false, msg: "Konten minimal 10 karakter" }
    : { valid: true, msg: "" };
});
const canPublish = computed(
  () =>
    titleRules.value.valid && contentRules.value.valid && !isPublishing.value,
);

async function loadCommunities() {
  communityLoading.value = true;
  communityError.value = null;
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/communities`,
      { credentials: "include" },
    );
    if (!res.ok) throw new Error("Gagal memuat komunitas");
    communities.value = (await res.json()) as CommunityCategory[];
  } catch (e) {
    communityError.value =
      e instanceof Error ? e.message : "Gagal memuat komunitas";
  } finally {
    communityLoading.value = false;
  }
}

const selectedCommunity = computed(() =>
  communities.value.find((c) => c.slug === form.value.communitySlug),
);

function pickCategory(slug: string) {
  form.value.communitySlug = slug;
  errors.value.communitySlug = undefined;
}

function saveDraft() {
  localStorage.setItem(DRAFT_KEY, JSON.stringify(form.value));
  savedRef.value = true;
  setTimeout(() => (savedRef.value = false), 2000);
}

function restoreDraft() {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;
  const data: Partial<typeof form.value> = JSON.parse(raw);
  Object.assign(form.value, data);
}

function clearDraft() {
  localStorage.removeItem(DRAFT_KEY);
  form.value = { title: "", content: "", communitySlug: "" };
}

watch(() => form.value.title, saveDraft, { immediate: true });
watch(() => form.value.content, saveDraft);

function validate(): boolean {
  errors.value = {};
  let ok = true;
  if (!titleRules.value.valid) {
    errors.value.title = titleRules.value.msg;
    ok = false;
  }
  if (!contentRules.value.valid) {
    errors.value.content = contentRules.value.msg;
    ok = false;
  }
  if (!form.value.communitySlug) {
    errors.value.communitySlug = "Pilih komunitas";
    ok = false;
  }
  return ok;
}

async function publish() {
  if (!validate()) return;
  isPublishing.value = true;
  const payload = {
    title: form.value.title.trim(),
    content: form.value.content,
    categorySlug: form.value.communitySlug,
  };
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/discussions/threads`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const data = (await res
        .json()
        .catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Gagal memublikasikan diskusi");
    }
    clearDraft();
    void router.push("/discussions");
  } catch (e) {
    errors.value.submit =
      e instanceof Error ? e.message : "Gagal memublikasikan diskusi";
  } finally {
    isPublishing.value = false;
  }
}

if (!userStore.isAuthenticated) {
  void router.replace(`/login?redirect=/discussions/create`);
} else {
  restoreDraft();
  loadCommunities();
}

onBeforeUnmount(() => saveDraft());
</script>

<template>
  <div class="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:max-w-3xl">
    <header class="mb-8 flex items-center gap-4">
      <Button variant="ghost" size="sm" @click="router.back()">
        <ChevronLeft class="h-4 w-4" />
      </Button>
      <div class="flex items-center gap-3">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Edit3 class="h-5 w-5" />
        </div>
        <div>
          <h1 class="font-display text-2xl font-semibold tracking-tight">
            Buat Diskusi Baru
          </h1>
          <p class="text-sm text-muted-foreground">
            Bagikan pertanyaan, pandangan, atau temuan dengan komunitas.
          </p>
        </div>
      </div>
    </header>

    <section v-if="userStore.isAuthenticated" class="space-y-8">
      <form @submit.prevent="publish" class="space-y-8">
        <div class="space-y-2">
          <Label>Judul <span class="text-destructive">*</span></Label>
          <Input
            v-model="form.title"
            placeholder="Contoh: Cara mengoptimalkan performa Vue.js?"
            maxlength="150"
            :aria-invalid="!!errors.title"
            @paste="saveDraft"
          />
          <p
            class="text-xs"
            :class="{ 'text-destructive': !titleRules.valid, 'text-muted-foreground': titleRules.valid }"
          >
            {{ form.title.length }}/150 — {{ titleRules.msg || "OK" }}
          </p>
          <p v-if="errors.title" class="text-sm text-destructive">{{ errors.title }}</p>
        </div>

        <div class="space-y-2">
          <Label>Komunitas <span class="text-destructive">*</span></Label>
          <button
            v-if="selectedCommunity"
            type="button"
            @click="pickCategory('')"
            class="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <X class="h-3 w-3" /> Hapus pilihan
          </button>
          <div
            v-if="communityLoading"
            class="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ListIcon class="h-4 w-4 animate-pulse" /> Memuat komunitas…
          </div>
          <p v-else-if="communityError" class="text-sm text-destructive">
            {{ communityError }}
          </p>
          <div v-else-if="communities.length" class="flex flex-wrap gap-2">
            <button
              v-for="c in communities"
              :key="c.id"
              type="button"
              @click="pickCategory(c.slug)"
              :class="cn(
                'rounded-lg border px-3 py-2 text-left transition-colors',
                form.communitySlug === c.slug
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-card hover:bg-accent',
              )"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="font-medium">{c.name}</span>
                <CheckCircle
                  v-if="form.communitySlug === c.slug"
                  class="h-4 w-4"
                />
              </div>
              <p class="mt-0.5 text-xs text-muted-foreground">
                {{ c.threadCount }} diskusi
              </p>
            </button>
          </div>
          <p v-else class="text-sm text-muted-foreground">
            Belum ada komunitas tersedia.
          </p>
          <p v-if="errors.communitySlug" class="text-sm text-destructive">
            {{ errors.communitySlug }}
          </p>
        </div>

        <div class="space-y-2">
          <Label>Konten <span class="text-destructive">*</span></Label>
          <MarkdownEditor
            v-model="form.content"
            placeholder="Tulis dengan Markdown… #heading, **bold**, - list, ```code```"
            min-h-40
          />
          <p v-if="errors.content" class="text-sm text-destructive">{{ errors.content }}</p>
        </div>

        <div
          v-if="errors.submit"
          class="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          {{ errors.submit }}
        </div>

        <footer class="flex items-center justify-between gap-3 border-t pt-6">
          <div class="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles v-if="savedRef" class="h-4 w-4 text-amber-400" />
            <span
              v-if="savedRef"
              class="inline-flex items-center gap-1 font-medium text-amber-500"
            >
              <Sparkles class="h-3 w-3" /> Draft berhasil disimpan…
            </span>
            <span v-else>
              Draft disimpan otomatis ({{ form.title.length }} karakter judul)
            </span>
          </div>
          <div class="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              @click="clearDraft"
              title="Hapus draft lokal"
            >
              <Eye class="h-4 w-4" />
            </Button>
            <Button :disabled="!canPublish">
              <Send class="h-4 w-4" />
              Publikasikan
            </Button>
          </div>
        </footer>
      </form>
    </section>

    <div
      v-else
      class="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed py-20 text-center"
    >
      <Badge variant="outline">
        <ChevronLeft class="mr-1 h-4 w-4" /> Butuh login untuk membuat diskusi
      </Badge>
      <Button @click="router.replace('/login?redirect=/discussions/create')">
        Masuk untuk melanjutkan
      </Button>
    </div>
  </div>
</template>

<style scoped>
:deep(.prose) {
  font-family: "Geist Mono", ui-sans-serif, system-ui, sans-serif;
}
</style>
