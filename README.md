# Forum App - Satu Repo (Client + Server), Routing Standar

Ini versi paling sederhana secara tooling: **satu `package.json`, satu `bun install`, satu git repo** - tanpa workspace, tanpa file-based routing tambahan. Vue tetap pakai `@vitejs/plugin-vue` polos dan `vue-router` didaftarkan manual, persis seperti Vite+Vue default.

```
forum-app/
├── src/
│   ├── client/                      # SEMUA kode frontend Vue
│   │   ├── assets/main.css
│   │   ├── components/
│   │   │   ├── ui/                  # shadcn-vue
│   │   │   └── forum/
│   │   │       ├── CategorySidebar.vue
│   │   │       ├── ThreadCard.vue
│   │   │       └── CreateThreadDialog.vue
│   │   ├── composables/useThreads.ts
│   │   ├── lib/auth-client.ts
│   │   ├── stores/{user,theme}.store.ts
│   │   ├── router/index.ts          # Routing didaftarkan MANUAL (bukan file-based)
│   │   ├── views/ForumHomeView.vue
│   │   ├── App.vue
│   │   └── main.ts
│   │
│   └── server/                      # SEMUA kode backend - folder sibling, bukan proyek lain
│       ├── db/{schema,client}.ts
│       ├── routes/{threads,categories}.route.ts
│       ├── middleware/session.middleware.ts
│       ├── auth.ts
│       └── index.ts                 # Entry point Hono
│
├── index.html                        # Tetap di root, <script> menunjuk ke /src/client/main.ts
├── vite.config.ts                    # alias "@" → ./src/client (BUKAN ./src)
├── drizzle.config.ts                 # schema path: ./src/server/db/schema.ts
├── tailwind.config.ts                # content: ./src/client/**/*.{vue,ts}
├── components.json                   # css: src/client/assets/main.css
├── package.json                      # SATU file untuk client + server
├── tsconfig.json
└── .env                              # VITE_API_URL (client) + DATABASE_URL dkk (server) - satu file
```

## Yang perlu diperhatikan dibanding struktur terpisah sebelumnya

1. **`vite.config.ts` alias `@` diarahkan ke `./src/client`**, bukan `./src`. Kalau lupa diubah, semua import `@/components/...` di komponen Vue akan salah resolve karena Vite akan mencari di `src/components` yang tidak ada (yang ada `src/client/components`).
2. **Vite tidak pernah menyentuh `src/server`** secara otomatis - ini murni karena `src/server` tidak pernah di-*import* dari graph module yang dimulai `index.html` → `src/client/main.ts`. Jadi aman ditaruh bersebelahan, tidak akan ikut ter-bundle ke output frontend. Tapi ini juga berarti **tidak ada proteksi tooling** yang mencegah Anda tidak sengaja meng-`import` sesuatu dari `../server` ke dalam kode client - kalau itu terjadi, kode backend (termasuk `DATABASE_URL` dan logic Better Auth) bisa ikut ter-bundle ke JS yang dikirim ke browser. **Disiplin manual jadi penting** di pendekatan satu-repo seperti ini.
3. **`drizzle.config.ts`, `tailwind.config.ts`, `components.json`** semua path-nya disesuaikan relatif ke root repo (bukan relatif ke `apps/web` seperti sebelumnya) - karena sekarang cuma ada satu root.
4. **Menjalankan dua proses tetap terpisah** meski satu repo:
   ```bash
   bun install                # sekali saja untuk semuanya
   bun run dev:client         # Vite dev server, port 5173
   bun run dev:server         # Hono di atas Bun, port 3000 (terminal terpisah)
   ```
5. **Deploy tetap dua artefak berbeda** - `bun run build:client` menghasilkan `dist/client/` (aset statis untuk Vercel/Netlify/Cloudflare Pages), sedangkan server dijalankan langsung dari source (`bun run src/server/index.ts`) di layanan compute terpisah (Fly.io/Railway/dst). Satu repo tidak berarti satu proses deploy - cukup satu tempat kode disimpan dan di-develop.

## Kapan pola ini masuk akal dibanding folder terpisah?

Cocok kalau **satu orang/tim kecil yang pegang full-stack sekaligus** dan ingin overhead tooling seminimal mungkin (satu `node_modules`, satu lockfile, satu PR untuk perubahan yang menyentuh FE+BE sekaligus). Kurang cocok kalau tim FE dan BE benar-benar terpisah dan ingin siklus rilis/versioning independen - untuk kasus itu, struktur `forum-frontend/` + `forum-backend/` terpisah (yang sudah dibuat sebelumnya) lebih tepat.
