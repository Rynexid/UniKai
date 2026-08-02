<script setup lang="ts">
defineProps<{
  eyebrow: string;
  title: string;
  description?: string;
}>();
</script>

<template>
  <div class="space-y-2">
    <p class="font-display text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
      {{ eyebrow }}
    </p>
    <h2 class="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
      {{ title }}
    </h2>
    <p v-if="description" class="max-w-xl text-sm text-muted-foreground">
      {{ description }}
    </p>
  </div>
</template>
