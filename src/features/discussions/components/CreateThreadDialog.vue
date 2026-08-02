<script setup lang="ts">
import { ref, watch } from "vue";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const props = defineProps<{ open: boolean; categorySlug?: string }>();
const emit = defineEmits<{
  "update:open": [value: boolean];
  created: [];
}>();

const title = ref("");
const content = ref("");
const isSubmitting = ref(false);
const errorMessage = ref<string | null>(null);
const submitProgress = ref(0);
let progressTimer: ReturnType<typeof setInterval> | null = null;

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) {
      title.value = "";
      content.value = "";
      errorMessage.value = null;
      submitProgress.value = 0;
      if (progressTimer) {
        clearInterval(progressTimer);
        progressTimer = null;
      }
    }
  },
);

function startProgress(): void {
  submitProgress.value = 0;
  progressTimer = setInterval(() => {
    submitProgress.value = Math.min(90, submitProgress.value + 7);
  }, 160);
}

function stopProgress(): void {
  if (progressTimer) {
    clearInterval(progressTimer);
    progressTimer = null;
  }
}

async function handleSubmit(): Promise<void> {
  if (title.value.trim().length < 5 || content.value.trim().length < 10) {
    errorMessage.value = "Judul minimal 5 karakter, isi minimal 10 karakter.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;
  startProgress();

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/discussions/threads`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // wajib: mengirim cookie session Better Auth
      body: JSON.stringify({
        title: title.value,
        content: content.value,
        categorySlug: props.categorySlug,
      }),
    });

    if (!res.ok) {
      const data = (await res.json().catch(() => null)) as { error?: string } | null;
      throw new Error(data?.error ?? "Gagal membuat thread.");
    }

    submitProgress.value = 100;
    emit("created");
  } catch (e) {
    stopProgress();
    errorMessage.value = e instanceof Error ? e.message : "Terjadi kesalahan.";
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <Dialog :open="open" @update:open="(value: boolean) => emit('update:open', value)">
    <DialogContent class="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Buat Thread Baru</DialogTitle>
        <DialogDescription>
          Mulai diskusi baru. Pastikan judul jelas dan sesuai kategori yang dipilih.
          Konten mendukung Markdown.
        </DialogDescription>
      </DialogHeader>

      <div class="space-y-4 py-2">
        <div class="space-y-1.5">
          <Label for="thread-title">Judul</Label>
          <Input id="thread-title" v-model="title" placeholder="Judul thread" maxlength="150" />
        </div>

        <div class="space-y-1.5">
          <Label for="thread-content">Isi</Label>
          <MarkdownEditor
            id="thread-content"
            v-model="content"
            placeholder="Tulis isi diskusi di sini... Dukung **Markdown**."
          />        </div>

        <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>
      </div>

      <DialogFooter class="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-3">
          <span v-if="isSubmitting" class="text-xs text-muted-foreground">
            Mengirim {{ submitProgress }}%
          </span>
          <Progress v-if="isSubmitting" class="w-36" :model-value="submitProgress" />
        </div>
        <div class="flex items-center justify-end gap-2">
          <Button variant="outline" :disabled="isSubmitting" @click="emit('update:open', false)">
            Batal
          </Button>
          <Button :disabled="isSubmitting" @click="handleSubmit">
            {{ isSubmitting ? "Mengirim..." : "Kirim" }}
          </Button>
        </div>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
