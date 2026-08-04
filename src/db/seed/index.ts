/**
 * Seed kategori komunitas (schema "category").
 * Jalankan: bun run src/db/seed/index.ts
 * Idempotent - kategori yang sudah ada tidak akan digandakan.
 */

import { eq } from "drizzle-orm";
import { categories, threads, user } from "../../db";
import { db } from "../../infrastructure/database";

const seedCategories = [
  { name: "Anime & Manga", slug: "anime-manga", description: "Rekomendasi, teori, dan fanbase anime & manga." },
  { name: "Movie & Series", slug: "movie", description: "Ulasan film, serial, dan rekomendasi tontonan." },
  { name: "Gaming", slug: "gaming", description: "Main bareng, turnamen, dan speedrun." },
  { name: "VTubers", slug: "vtubers", description: "Clip, fan-art, dan diskusi live." },
  { name: "Teknologi", slug: "teknologi", description: "Gadget, AI, dan tren digital." },
  { name: "Programming", slug: "programming", description: "Belajar, bertanya, dan kolaborasi koding." },
  { name: "Open Source", slug: "open-source", description: "Kontribusi ke proyek bersama." },
  { name: "Digital Products", slug: "digital-products", description: "Templat, UI kit, dan plugin." },
  { name: "Kreator", slug: "kreator", description: "Tumbuh dan monetisasi karya." },
  { name: "Musik", slug: "musik", description: "Dari rekomendasi lagu sampai produksi." },
  { name: "Pendidikan", slug: "pendidikan", description: "Kursus, tutorial, dan mentoring." },
  { name: "Hobi", slug: "hobi", description: "Dari fotografi sampai koleksi." },
];

const result = await db.insert(categories).values(seedCategories).onConflictDoNothing();

console.log(`Seed selesai: ${seedCategories.length} kategori (rows inserted: ${result.rowCount ?? 0}).`);

/* ---------------------------------------------------------------------------
 * Seed thread contoh (opsional) - hanya dijalankan bila ada user terdaftar.
 * Idempotent via unique slug. Menormalisasi kolom "featured" tiap run.
 * ------------------------------------------------------------------------- */

const userRows = await db.select({ id: user.id }).from(user).limit(1);

if (userRows.length === 0) {
  console.log("Seed thread dilewati: belum ada user terdaftar.");
} else {
  const catRows = await db
    .select({ id: categories.id, slug: categories.slug })
    .from(categories);
  const catId = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  const seedThreads = [
    {
      title: "Tips memulai jualan digital product pertamamu",
      slug: "seed-tips-digital-product",
      content:
        "Buat produk kecil dulu: template, checklist, atau mini kit. Validasi ke komunitas sebelum buat produk besar. Jangan lupa halaman landasan yang jelas!",
      categorySlug: "digital-products",
      featured: true,
      viewCount: 132,
    },
    {
      title: "Rekomendasi anime musim ini yang wajib ditonton",
      slug: "seed-rekomendasi-anime-musim-ini",
      content:
        "Kumpulan rekomendasi anime musim ini dari warga verse: ada yang sci-fi, slice of life, sampai romcom. Share favoritmu di kolom komentar!",
      categorySlug: "anime-manga",
      featured: true,
      viewCount: 98,
    },
    {
      title: "Cara debug React hydration mismatch tanpa pusing",
      slug: "seed-debug-hydration-mismatch",
      content:
        "Penyebab umum: Math.random, Date.now, atau akses window di render. Solusinya pisahkan komponen yang butuh client dengan suppressHydrationMismatch yang tepat.",
      categorySlug: "programming",
      featured: true,
      viewCount: 210,
    },
    {
      title: "Setup Neovim untuk TypeScript di 2026",
      slug: "seed-neovim-typescript-2026",
      content:
        "Lazy.nvim + mason + lspconfig, lalu tambahkan eslint dan prettier lewat conform. Share config kamu dan diskusikan plugin favoritmu di sini.",
      categorySlug: "programming",
      featured: false,
      viewCount: 156,
    },
    {
      title: "Framework UI mana yang paling kamu suka sekarang?",
      slug: "seed-framework-ui-favorit",
      content:
        "React, Vue, Svelte, atau Solid? Diskusi santai soal DX, ekosistem, dan kecepatan rendering. Jangan lupa sebutkan alasanmu.",
      categorySlug: "programming",
      featured: true,
      viewCount: 74,
    },
    {
      title: "Review film sci-fi indie yang baru rilis",
      slug: "seed-review-film-sci-fi-indie",
      content:
        "Film indie ini punya premis kecil tapi eksekusi visualnya luar biasa. Cerita soal memori dan identitas, ending-nya bikin merinding.",
      categorySlug: "movie",
      featured: false,
      viewCount: 61,
    },
    {
      title: "Mau mulai speedrun, game apa yang cocok?",
      slug: "seed-speedrun-game-pemula",
      content:
        "Pilih game yang komunitasnya aktif dan dokumentasi run-nya lengkap. Mulai dari kategori sederhana seperti any% sebelum naik ke kategori berat.",
      categorySlug: "gaming",
      featured: false,
      viewCount: 43,
    },
    {
      title: "Trik fotografi golden hour untuk pemula",
      slug: "seed-fotografi-golden-hour",
      content:
        "Manfaatkan 30 menit sebelum matahari terbenam. Cari posisi dengan sumber cahaya di belakang subjek dan jangan ragu naikkan ISO sedikit.",
      categorySlug: "hobi",
      featured: false,
      viewCount: 29,
    },
  ];

  let inserted = 0;
  for (const t of seedThreads) {
    const categoryId = catId[t.categorySlug];
    if (!categoryId) continue;
    const r = await db
      .insert(threads)
      .values({
        title: t.title,
        slug: t.slug,
        content: t.content,
        categoryId,
        userId: userRows[0].id,
        featured: t.featured,
        viewCount: t.viewCount,
      })
      .onConflictDoNothing();
    inserted += r.rowCount ?? 0;
  }

  const featuredSlugs = seedThreads.filter((t) => t.featured).map((t) => t.slug);
  await db.update(threads).set({ featured: false });
  for (const slug of featuredSlugs) {
    await db.update(threads).set({ featured: true }).where(eq(threads.slug, slug));
  }

  console.log(`Seed thread: ${seedThreads.length} disiapkan (inserted: ${inserted}), featured: ${featuredSlugs.length}.`);
}

process.exit(0);
