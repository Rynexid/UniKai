<script setup lang="ts">
import SectionHeading from "@/components/common/SectionHeading.vue";
import CommunityCard from "@/features/communities/components/CommunityCard.vue";
import { COMMUNITIES } from "@/features/communities/data/communities";
</script>

<template>
  <section id="komunitas" class="border-y border-border/60">
    <div class="mx-auto max-w-6xl px-4 py-16 sm:py-20">
      <SectionHeading
        eyebrow="Verse"
        title="Temukan komunitasmu"
        description="Dari gaming sampai open source, semua punya rumah di sini. Satu langit, banyak bintang."
      />
      <div class="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <CommunityCard v-for="community in COMMUNITIES" :key="community.slug" :community="community" />
      </div>
    </div>
  </section>
</template>
