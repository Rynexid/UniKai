import { ref } from "vue";
import { hueForSlug, type HueKey } from "@/features/communities/data/communities";

export interface CommunityChip {
  name: string;
  slug: string;
  hue: HueKey;
  description: string;
  threadCount: number;
}

/**
 * Kategori komunitas untuk filter diskusi & sidebar.
 * Selalu mengambil data nyata dari /api/communities (termasuk jumlah thread);
 * tidak ada data fallback - jika API kosong/gagal, daftar ikut kosong.
 */
export function useCommunities() {
  const chips = ref<CommunityChip[]>([]);
  const isLoading = ref(true);

  async function load(): Promise<void> {
    isLoading.value = true;
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/communities`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const rows = (await res.json()) as Array<{
        name: string;
        slug: string;
        description: string | null;
        threadCount: number;
      }>;
      chips.value = rows.map((r) => ({
        name: r.name,
        slug: r.slug,
        hue: hueForSlug(r.slug),
        description: r.description ?? "",
        threadCount: r.threadCount,
      }));
    } catch {
      // biarkan kosong - hanya data real yang ditampilkan
    } finally {
      isLoading.value = false;
    }
  }

  return { chips, isLoading, load };
}
