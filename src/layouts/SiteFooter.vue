<script setup lang="ts">
import { RouterLink } from "vue-router";
import { Facebook, Instagram, Rss, Youtube } from "lucide-vue-next";

const socials = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Youtube },
  { label: "TikTok", href: "#" },
  { label: "RSS", href: "#", icon: Rss },
];
</script>

<template>
  <footer class="border-t border-border/60">
    <div class="mx-auto max-w-6xl px-4 py-12 xl:max-w-7xl">
      <div class="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
        <div class="max-w-sm space-y-4">
          <div class="flex items-center gap-2.5">
            <img
              src="/UniKai.png"
              alt="Logo UniKai"
              class="h-8 w-8 rounded-lg object-contain"
            />
            <span class="font-display text-lg font-semibold tracking-tight">UniKai</span>
          </div>
          <p class="font-display text-sm text-muted-foreground">
            Satu Verse. Semua Komunitas.
          </p>
          <p class="text-sm leading-relaxed text-muted-foreground">
            Tempat komunitas berkumpul, berdiskusi, berkarya, dan berkembang tanpa harus
            berpindah platform.
          </p>

          <div class="flex items-center gap-2 pt-1">
            <a
              v-for="social in socials"
              :key="social.label"
              :href="social.href"
              :aria-label="social.label"
              :title="social.label"
              class="grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
            >
              <component v-if="social.icon" :is="social.icon" class="h-4 w-4" />
              <svg v-else viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>

        <nav class="grid grid-cols-2 gap-10 text-sm">
          <div class="space-y-3">
            <p class="font-display text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Verse
            </p>
            <ul class="space-y-2.5">
              <li><a href="#komunitas" class="text-foreground/80 transition-colors hover:text-primary">Komunitas</a></li>
              <li><a href="#diskusi" class="text-foreground/80 transition-colors hover:text-primary">Diskusi</a></li>
              <li><span class="text-muted-foreground/60">Marketplace · Segera</span></li>
              <li><span class="text-muted-foreground/60">Artikel · Segera</span></li>
            </ul>
          </div>
          <div class="space-y-3">
            <p class="font-display text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
              Bersama
            </p>
            <ul class="space-y-2.5">
              <li><span class="text-muted-foreground/60">Events · Segera</span></li>
              <li><span class="text-muted-foreground/60">Klub · Segera</span></li>
              <li><span class="text-muted-foreground/60">Belajar · Segera</span></li>
              <li><RouterLink to="/" class="text-foreground/80 transition-colors hover:text-primary">Beranda</RouterLink></li>
            </ul>
          </div>
        </nav>
      </div>

      <div
        class="mt-10 flex flex-col gap-2 border-t border-border/60 pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"
      >
        <p>© 2026 UniKai. Semua komunitas, satu tempat.</p>
        <p class="font-medium tracking-wide">Connect · Share · Create · Explore · Grow</p>
      </div>
    </div>
  </footer>
</template>
