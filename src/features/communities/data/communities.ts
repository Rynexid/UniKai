/**
 * Daftar komunitas flagship UniKai (kurasi awal, lihat ABOUT.md).
 * Dipakai sebagai konten tampilan VerseField (konstelasi) & katalog komunitas.
 * Ketika entitas komunitas nyata sudah masuk DB, tampilan bisa beralih ke API.
 */

export type HueKey = "violet" | "sun" | "nebula" | "sky" | "mint";

export interface CommunityMeta {
  name: string;
  slug: string;
  tagline: string;
  hue: HueKey;
}

export const COMMUNITIES: CommunityMeta[] = [
  { name: "Gaming", slug: "gaming", tagline: "Main bareng, turnamen, dan speedrun.", hue: "violet" },
  { name: "Anime & Manga", slug: "anime-manga", tagline: "Rekomendasi, teori, dan fanbase.", hue: "nebula" },
  { name: "VTubers", slug: "vtubers", tagline: "Clip, fan-art, dan diskusi live.", hue: "sun" },
  { name: "Teknologi", slug: "teknologi", tagline: "Gadget, AI, dan tren digital.", hue: "sky" },
  { name: "Programming", slug: "programming", tagline: "Belajar, bertanya, dan kolaborasi.", hue: "mint" },
  { name: "Open Source", slug: "open-source", tagline: "Kontribusi ke proyek bersama.", hue: "violet" },
  { name: "Digital Products", slug: "digital-products", tagline: "Templat, UI kit, dan plugin.", hue: "sun" },
  { name: "Kreator", slug: "kreator", tagline: "Tumbuh dan monetisasi karya.", hue: "nebula" },
  { name: "Pendidikan", slug: "pendidikan", tagline: "Kursus, tutorial, dan mentoring.", hue: "sky" },
  { name: "Hobi", slug: "hobi", tagline: "Dari musik sampai fotografi.", hue: "mint" },
];

/** Warna per hue - class literal agar tetap ter-scan Tailwind. */
export const HUE_CLASSES: Record<HueKey, { dot: string; text: string; softBg: string; solid: string }> = {
  violet: { dot: "bg-[#8B7DFF]", text: "text-[#A79BFF]", softBg: "bg-[#8B7DFF]/12", solid: "bg-[#8B7DFF]" },
  sun: { dot: "bg-[#FF9A63]", text: "text-[#FFB38A]", softBg: "bg-[#FF9A63]/12", solid: "bg-[#FF9A63]" },
  nebula: { dot: "bg-[#E7A6FF]", text: "text-[#EEBFFF]", softBg: "bg-[#E7A6FF]/12", solid: "bg-[#E7A6FF]" },
  sky: { dot: "bg-[#6CC9FF]", text: "text-[#8FD6FF]", softBg: "bg-[#6CC9FF]/12", solid: "bg-[#6CC9FF]" },
  mint: { dot: "bg-[#5FE8C4]", text: "text-[#8FF0D6]", softBg: "bg-[#5FE8C4]/12", solid: "bg-[#5FE8C4]" },
};

export function hueForSlug(slug: string): HueKey {
  return COMMUNITIES.find((c) => c.slug === slug)?.hue ?? "violet";
}
