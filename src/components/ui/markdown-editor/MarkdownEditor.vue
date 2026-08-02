<script setup lang="ts">
import { computed, ref } from "vue";
import MarkdownIt from "markdown-it";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  PenLine,
  Quote,
  Strikethrough,
} from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const model = defineModel<string>({ default: "" });

withDefaults(
  defineProps<{
    id?: string;
    placeholder?: string;
    minHeight?: string;
  }>(),
  {
    placeholder: "Tulis dengan Markdown...",
    minHeight: "min-h-40",
  },
);

const textareaRef = ref<HTMLTextAreaElement | null>(null);
const mode = ref<"write" | "preview">("write");

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const previewHtml = computed(() => md.render(model.value));

interface ToolbarAction {
  icon: typeof Bold;
  label: string;
  before: string;
  after: string;
  placeholder: string;
}

const actions: ToolbarAction[] = [
  { icon: Bold, label: "Tebal", before: "**", after: "**", placeholder: "teks tebal" },
  { icon: Italic, label: "Miring", before: "*", after: "*", placeholder: "teks miring" },
  { icon: Strikethrough, label: "Coret", before: "~~", after: "~~", placeholder: "teks dicoret" },
  { icon: Heading2, label: "Subjudul", before: "## ", after: "", placeholder: "Subjudul bagian" },
  { icon: Quote, label: "Kutipan", before: "> ", after: "", placeholder: "kutipan" },
  { icon: Code, label: "Blok kode", before: "```\n", after: "\n```", placeholder: "kode" },
  { icon: List, label: "Daftar", before: "- ", after: "", placeholder: "item" },
  { icon: ListOrdered, label: "Daftar berurut", before: "1. ", after: "", placeholder: "item" },
  { icon: LinkIcon, label: "Tautan", before: "[", after: "](https://)", placeholder: "teks tautan" },
];

function insertAround(before: string, after: string, placeholder: string): void {
  const ta = textareaRef.value;
  if (!ta) return;

  const start = ta.selectionStart;
  const end = ta.selectionEnd;
  const selected = model.value.slice(start, end) || placeholder;
  const next =
    model.value.slice(0, start) + before + selected + after + model.value.slice(end);
  model.value = next;

  requestAnimationFrame(() => {
    ta.focus();
    ta.setSelectionRange(start + before.length, start + before.length + selected.length);
  });
}
</script>

<template>
  <div class="overflow-hidden rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background">
    <div class="flex items-center justify-between gap-2 border-b border-border/60 px-2 py-1.5">
      <div class="flex flex-wrap items-center gap-0.5">
        <Button
          v-for="action in actions"
          :key="action.label"
          variant="ghost"
          size="icon-sm"
          class="h-7 w-7"
          :aria-label="action.label"
          :title="action.label"
          @mousedown.prevent
          @click="insertAround(action.before, action.after, action.placeholder)"
        >
          <component :is="action.icon" class="h-3.5 w-3.5" />
        </Button>
      </div>

      <div class="flex shrink-0 items-center gap-0.5 rounded-md bg-muted p-0.5">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors"
          :class="mode === 'write' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="mode = 'write'"
        >
          <PenLine class="h-3 w-3" />
          Tulis
        </button>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs font-medium transition-colors"
          :class="mode === 'preview' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'"
          @click="mode = 'preview'"
        >
          <Eye class="h-3 w-3" />
          Pratinjau
        </button>
      </div>
    </div>

    <textarea
      v-if="mode === 'write'"
      :id="id"
      ref="textareaRef"
      v-model="model"
      :placeholder="placeholder"
      :class="cn('w-full resize-y bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground', minHeight)"
    />

    <div
      v-else
      class="prose prose-sm prose-invert max-w-none px-4 py-3 text-sm prose-headings:font-display prose-a:text-primary prose-pre:rounded-md prose-pre:bg-black/60 prose-code:text-primary"
      :class="minHeight"
      v-html="previewHtml"
    />
  </div>
</template>
