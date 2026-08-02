<script setup lang="ts">
import { computed } from "vue";
import {
  TagsInputRoot,
  TagsInputInput,
  TagsInputItem,
  TagsInputItemText,
  TagsInputClear,
} from "reka-ui";
import { X } from "lucide-vue-next";

const model = defineModel<string[]>();

interface Props {
  placeholder?: string;
  suggestions?: string[];
  allowNew?: boolean;
  max?: number;
  id?: string;
  name?: string;
  required?: boolean;
  /** string or RegExp accepted by reka-ui delimiter */
  delimiter?: string | RegExp;
  disabled?: boolean;
}
const props = withDefaults(defineProps<Props>(), {
  placeholder: "Ketik & tekan Enter/spasi…",
  suggestions: () => [],
  allowNew: true,
  max: 0,
  delimiter: ",",
  disabled: false,
});

const emit = defineEmits<{
  (e: "add", value: string): void;
  (e: "remove", value: string): void;
}>();

const delimiter = computed(() => {
  const d = props.delimiter;
  if (typeof d === "string") {
    if (d.length === 1) return new RegExp(`[${d}]`);
    return d;
  }
  return d;
});

const canAddMore = computed(() =>
  props.max > 0 ? (model.value?.length ?? 0) < props.max : true,
);
const inputDisabled = computed(() => props.disabled || !canAddMore.value);

function tags(): string[] {
  return model.value ?? [];
}

function onAdd(value: string) {
  const v = value.trim();
  if (!v) return;
  if (!canAddMore.value) return;
  if (tags().includes(v)) return;
  if (!props.allowNew && !(props.suggestions || []).includes(v)) return;
  model.value = [...tags(), v];
  emit("add", v);
}

function onRemove(value: string) {
  model.value = tags().filter((t) => t !== value);
  emit("remove", value);
}
</script>

<template>
  <TagsInputRoot
    v-model="model"
    :delimiter="delimiter"
    :max="max"
    :name="name"
    :required="required"
    :disabled="disabled"
    @add-tag="onAdd"
    @remove-tag="onRemove"
    class="flex flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-2 py-1.5 text-sm transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
  >
    <template v-if="tags().length">
      <TagsInputItem
        v-for="t in tags()"
        :key="t"
        :value="t"
        class="m-0.5 inline-flex items-center gap-1 rounded-md bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground"
      >
        <TagsInputItemText />
        <button
          type="button"
          @click.stop="onRemove(t)"
          class="inline-flex items-center justify-center rounded-full p-0.5 hover:bg-secondary-foreground/20"
          :aria-label="`Hapus ${t}`"
        >
          <X class="h-3 w-3" />
        </button>
      </TagsInputItem>
    </template>

    <TagsInputInput
      :placeholder="canAddMore ? placeholder : 'Batas tercapai'"
      :disabled="inputDisabled"
      class="flex-1 border-0 bg-transparent px-1 py-1 text-sm outline-none placeholder:text-muted-foreground"
    />

    <TagsInputClear
      v-if="tags().length"
      class="shrink-0 cursor-pointer p-1 text-muted-foreground hover:text-foreground"
      @click.stop
    >
      <X class="h-3.5 w-3.5" />
      <span class="sr-only">Hapus semua tag</span>
    </TagsInputClear>
  </TagsInputRoot>
</template>
