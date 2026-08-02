import { defineStore } from "pinia";
import { computed } from "vue";
import { authClient } from "@/lib/auth-client";

/**
 * Store ini TIDAK menyimpan salinan manual data user (rawan stale/out-of-sync).
 * Ia membungkus reactive session dari Better Auth (useSession) sebagai
 * satu-satunya source of truth, lalu mengekspos getter yang nyaman dipakai
 * di seluruh komponen (computed, otomatis reaktif).
 */
export const useUserStore = defineStore("user", () => {
  const session = authClient.useSession();

  const user = computed(() => session.value.data?.user ?? null);
  const isAuthenticated = computed(() => !!user.value);
  const isLoading = computed(() => session.value.isPending);

  async function logout() {
    await authClient.signOut();
  }

  return { user, isAuthenticated, isLoading, logout };
});
