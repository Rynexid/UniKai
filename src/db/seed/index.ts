/**
 * Seed kategori komunitas (schema "category").
 * Jalankan: bun run src/db/seed/index.ts
 * Idempotent - kategori yang sudah ada tidak akan digandakan.
 */

import { categories } from "../../db";
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
process.exit(0);
