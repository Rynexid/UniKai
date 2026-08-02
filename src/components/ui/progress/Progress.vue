<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { ProgressIndicator, ProgressRoot } from "reka-ui"
import { cn } from "@/lib/utils"

const props = withDefaults(
  defineProps<{
    class?: HTMLAttributes["class"]
    modelValue?: number | null
    max?: number
  }>(),
  {
    modelValue: null,
    max: 100,
  },
)
</script>

<template>
  <ProgressRoot
    :model-value="modelValue"
    :max="max"
    :class="cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', props.class)"
  >
    <ProgressIndicator
      class="h-full w-full flex-1 bg-primary transition-all"
      :style="`transform: translateX(-${100 - ((props.modelValue ?? 0) / props.max) * 100}%)`"
    />
  </ProgressRoot>
</template>
