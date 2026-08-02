<script setup lang="ts">
import { computed } from "vue";
import { RouterView, useRoute } from "vue-router";
import SiteNav from "./SiteNav.vue";
import SiteFooter from "./SiteFooter.vue";

const route = useRoute();

const isAuthPage = computed(() => route.meta.authPage === true);
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <SiteNav v-if="!isAuthPage" />
    <main class="flex-1">
      <RouterView />
    </main>
    <SiteFooter v-if="!isAuthPage" />
  </div>
</template>
