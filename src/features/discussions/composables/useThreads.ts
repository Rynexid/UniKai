import { ref } from "vue";

export interface ThreadListItem {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  viewCount: number;
  replyCount: number;
  author: { id: string; name: string; image: string | null };
  category: { id: string; name: string; slug: string };
}

export function useThreads() {
  const threads = ref<ThreadListItem[]>([]);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  async function fetchThreads(categorySlug?: string): Promise<void> {
    isLoading.value = true;
    error.value = null;
    try {
      const url = new URL(`${import.meta.env.VITE_API_URL}/api/discussions/threads`);
      if (categorySlug) url.searchParams.set("category", categorySlug);

      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat daftar thread.");
      threads.value = (await res.json()) as ThreadListItem[];
    } catch (e) {
      error.value = e instanceof Error ? e.message : "Terjadi kesalahan tidak diketahui.";
    } finally {
      isLoading.value = false;
    }
  }

  return { threads, isLoading, error, fetchThreads };
}
