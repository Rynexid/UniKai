<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { RouterLink } from "vue-router";
import { Loader2 } from "lucide-vue-next";
import { definePage } from "unplugin-vue-router/runtime";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { useUserStore } from "@/stores/user.store";

definePage({ meta: { authPage: true } });

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const name = ref("");
const email = ref("");
const password = ref("");
const isSubmitting = ref(false);
const isDiscordSubmitting = ref(false);
const errorMessage = ref<string | null>(null);

const redirectTo =
  typeof route.query.redirect === "string" && route.query.redirect.startsWith("/")
    ? route.query.redirect
    : "/";

watch(
  () => userStore.isAuthenticated,
  (authenticated) => {
    if (authenticated) void router.replace(redirectTo);
  },
  { immediate: true },
);

async function handleSubmit(): Promise<void> {
  if (name.value.trim().length < 2 || !email.value.trim() || password.value.length < 8) {
    errorMessage.value = "Nama minimal 2 karakter, email valid, dan kata sandi minimal 8 karakter.";
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  const { error } = await authClient.signUp.email({
    name: name.value,
    email: email.value,
    password: password.value,
  });

  isSubmitting.value = false;

  if (error) {
    errorMessage.value = error.message ?? "Gagal membuat akun.";
    return;
  }

  void router.replace(redirectTo);
}

async function handleDiscord(): Promise<void> {
  isDiscordSubmitting.value = true;
  errorMessage.value = null;

  const { error } = await authClient.signIn.social({
    provider: "discord",
    callbackURL: redirectTo,
  });

  isDiscordSubmitting.value = false;

  if (error) {
    errorMessage.value = error.message ?? "Gagal masuk dengan Discord.";
  }
}
</script>

<template>
  <div class="grid min-h-screen lg:grid-cols-2">
    <div class="hidden flex-col justify-between border-r border-border/60 bg-card/30 p-12 lg:flex">
      <div class="flex items-center gap-2.5">
        <img src="/UniKai.png" alt="Logo UniKai" class="h-9 w-9 rounded-lg object-contain" />
        <span class="font-display text-lg font-semibold tracking-tight">UniKai</span>
      </div>

      <div class="max-w-sm">
        <h2 class="font-display text-3xl font-semibold tracking-tight">
          Gabung ke komunitasmu.
          <span class="bg-gradient-to-r from-primary to-[#FF9A63] bg-clip-text text-transparent">
            Mulai dari sini.
          </span>
        </h2>
        <p class="mt-3 text-sm leading-relaxed text-muted-foreground">
          Buat akun dalam satu menit. Diskusi, kolaborasi, dan karya barumu menantimu di setiap
          komunitas.
        </p>
      </div>

      <p class="text-xs text-muted-foreground">Connect · Share · Create · Explore · Grow</p>
    </div>

    <div class="flex items-center justify-center px-4 py-10 sm:px-6">
      <div class="w-full max-w-sm">
        <div class="mb-8 flex items-center gap-2.5 lg:hidden">
          <img src="/UniKai.png" alt="Logo UniKai" class="h-9 w-9 rounded-lg object-contain" />
          <span class="font-display text-lg font-semibold tracking-tight">UniKai</span>
        </div>

        <h1 class="font-display text-2xl font-semibold tracking-tight">Buat akun baru</h1>
        <p class="mt-1.5 text-sm text-muted-foreground">
          Sudah punya akun?
          <RouterLink
            to="/login"
            class="font-medium text-primary underline-offset-4 hover:underline"
          >
            Masuk di sini
          </RouterLink>
        </p>

        <form class="mt-7 space-y-4" @submit.prevent="handleSubmit">
          <div class="space-y-1.5">
            <Label for="register-name">Nama</Label>
            <Input
              id="register-name"
              v-model="name"
              autocomplete="name"
              placeholder="Nama kamu"
              required
            />
          </div>

          <div class="space-y-1.5">
            <Label for="register-email">Email</Label>
            <Input
              id="register-email"
              v-model="email"
              type="email"
              autocomplete="email"
              placeholder="kamu@contoh.com"
              required
            />
          </div>

          <div class="space-y-1.5">
            <Label for="register-password">Kata sandi</Label>
            <Input
              id="register-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-destructive">{{ errorMessage }}</p>

          <Button class="w-full" type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            {{ isSubmitting ? "Membuat akun..." : "Daftar" }}
          </Button>
        </form>

        <div class="my-5 flex items-center gap-3">
          <span class="h-px flex-1 bg-border/60" />
          <span class="text-[11px] uppercase tracking-widest text-muted-foreground">atau</span>
          <span class="h-px flex-1 bg-border/60" />
        </div>

        <Button
          variant="outline"
          class="w-full"
          :disabled="isDiscordSubmitting"
          @click="handleDiscord"
        >
          <Loader2 v-if="isDiscordSubmitting" class="h-4 w-4 animate-spin" />
          <svg viewBox="0 0 24 24" class="h-4 w-4 fill-current" aria-hidden="true">
            <path d="M20.317 4.37a19.79 19.79 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128c.126-.094.252-.192.372-.291a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.891.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
          </svg>
          {{ isDiscordSubmitting ? "Menghubungkan..." : "Lanjut dengan Discord" }}
        </Button>
      </div>
    </div>
  </div>
</template>
