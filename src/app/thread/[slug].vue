<script setup lang="ts">
import { useRoute } from "vue-router";

const route = useRoute();
const slug = (route.params as { slug?: string }).slug ?? "";
</script>

<template>
  <div class="mx-auto max-w-3xl px-4 py-10">
    <h1 class="text-xl font-semibold">Thread: {{ slug }}</h1>
    <p class="mt-2 text-sm text-muted-foreground">
      Halaman detail thread masih placeholder. Implementasi menyusul.
    </p>
  </div>
</template>
