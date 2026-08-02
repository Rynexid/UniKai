<script setup lang="ts">
import { ref } from "vue";
import { RouterLink } from "vue-router";
import { Menu, Moon, Sun, X } from "lucide-vue-next";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useThemeStore } from "@/stores/theme.store";
import { useUserStore } from "@/stores/user.store";

const themeStore = useThemeStore();
const userStore = useUserStore();

const isMenuOpen = ref(false);

function closeMenu(): void {
  isMenuOpen.value = false;
}

async function handleLogout(): Promise<void> {
  await userStore.logout();
}
</script>

<template>
  <header
    class="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md"
  >
    <div
      class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 xl:max-w-7xl"
    >
      <div class="flex items-center gap-8">
        <RouterLink to="/" class="group flex items-center gap-2.5">
          <img
            src="/UniKai.png"
            alt="Logo UniKai"
            class="h-8 w-8 rounded-lg object-contain transition-transform duration-300 group-hover:rotate-45"
          />
          <span class="font-display text-lg font-semibold tracking-tight">UniKai</span>
        </RouterLink>

        <nav class="hidden items-center gap-1 text-sm md:flex">
          <a
            href="#komunitas"
            class="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Komunitas
          </a>
          <a
            href="#diskusi"
            class="rounded-md px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Diskusi
          </a>
          <span class="flex items-center gap-1.5 px-3 py-2 text-muted-foreground/60">
            Marketplace
            <span
              class="rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground"
            >
              Segera
            </span>
          </span>
        </nav>
      </div>

      <div class="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="themeStore.theme === 'dark' ? 'Mode terang' : 'Mode gelap'"
          @click="themeStore.toggleTheme"
        >
          <Sun v-if="themeStore.theme === 'dark'" class="h-4 w-4" />
          <Moon v-else class="h-4 w-4" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          class="md:hidden"
          :aria-label="isMenuOpen ? 'Tutup menu' : 'Buka menu'"
          :aria-expanded="isMenuOpen"
          aria-controls="mobile-nav"
          @click="isMenuOpen = !isMenuOpen"
        >
          <Menu v-if="!isMenuOpen" class="h-5 w-5" />
          <X v-else class="h-5 w-5" />
        </Button>

        <DropdownMenu v-if="userStore.isAuthenticated">
          <DropdownMenuTrigger as-child>
            <Button variant="ghost" size="icon" class="rounded-full p-0">
              <Avatar class="h-8 w-8">
                <AvatarImage
                  v-if="userStore.user?.image"
                  :src="userStore.user.image"
                  :alt="userStore.user.name"
                />
                <AvatarFallback>
                  {{ userStore.user?.name?.charAt(0).toUpperCase() ?? "?" }}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-44">
            <div class="px-2 py-1.5 text-sm">
              <p class="font-medium leading-tight">{{ userStore.user?.name }}</p>
              <p class="truncate text-xs text-muted-foreground">{{ userStore.user?.email }}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem disabled>Lihat Profil</DropdownMenuItem>
            <DropdownMenuItem class="text-destructive" @select="handleLogout">
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button v-else variant="outline" size="sm" as-child>
          <RouterLink to="/login">Masuk</RouterLink>
        </Button>
      </div>
    </div>

    <nav
      v-if="isMenuOpen"
      id="mobile-nav"
      class="border-t border-border/60 bg-background/95 backdrop-blur-md md:hidden"
      aria-label="Navigasi utama"
    >
      <div class="mx-auto max-w-6xl space-y-1 px-4 py-3 xl:max-w-7xl">
        <a
          href="#komunitas"
          class="block rounded-md px-3 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
          @click="closeMenu"
        >
          Komunitas
        </a>
        <a
          href="#diskusi"
          class="block rounded-md px-3 py-2.5 text-sm text-foreground/85 transition-colors hover:bg-accent hover:text-foreground"
          @click="closeMenu"
        >
          Diskusi
        </a>
        <span
          class="flex items-center gap-2 px-3 py-2.5 text-sm text-muted-foreground/70"
        >
          Marketplace
          <span
            class="rounded-full border px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground"
          >
            Segera
          </span>
        </span>
      </div>
    </nav>
  </header>
</template>
