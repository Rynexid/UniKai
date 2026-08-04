# Migrasi ke Next.js 16 App Router

Satu repo, FE + BE satu paket `app/`. Backend logic (Hono + Drizzle + BetterAuth) **tetap dipakai** via Next route handler (mount catch-all), tidak rewrite business logic. Frontend port ke React.

## Asumsi
- Auth: BetterAuth + `@better-auth/react`
- DB: Drizzle Neon (neon-http), tetap
- UI: shadcn/ui **react** + Tailwind (CSS existing direuse)
- Ikon: `lucide-react`

## Fases
### 0. Scaffold
1. Hapus deps Vue: `vue, vue-router, pinia, vite, vue-tsc, @vitejs/plugin-vue, unplugin-vue-router, lucide-vue-next, reka-ui, @vueuse/core, @tailwindcss/typography` (tetap tailwindcss/postcss/autoprefixer).
   - Tambah: `next@16 react@19 react-dom@19 @better-auth/react lucide-react`
2. `next.config.mjs`, `tsconfig.json`, `app/` alias `@/*` ke `./src/app` + `../lib` etc. (reuse src/ structure).
   - Keep `src/**` — Next 16 mendukung `src/app/`, `src/lib/`, `src/components/`.
3. Build script: `next build`, dev: `next dev`, start: `next start`.

### 1. API (mount Hono)
- `src/app/api/[...route]/route.ts`:
```ts
import { app } from "../../../src/server/app"; // re-export hono app (server/index.ts)
export const GET = async (req, ctx) => app.fetch(req as any, ctx);
export const POST = GET; PUT = GET; DELETE = GET; PATCH = GET;
```
- Auth `/api/auth/*` via better-auth → handled oleh `auth` instance (sudah mount).
- Middleware Hono `requireAuth`/`attachSessionIfExists` tetap via `auth.api.getSession`.

### 2. Auth
- Server: `src/lib/auth.ts` (re-export `auth` from infrastructure + helper).
- Client: `src/lib/auth-client.ts`:
```ts
import { createAuthClient } from "@better-auth/react";
export const authClient = createAuthClient({ baseURL: "/api" });
```
- Session: gunakan `authClient.useSession()` (react hook) — ganti zustand context.
- Theme: provider `src/providers/ThemeProvider.tsx` (dark/light, localStorage) replace pinia.
- Middleware app router: `src/middleware.ts` — protect `/thread/*` atau semua kec. `/login`, `/register`.

### 3. Komponen UI (React)
- `npx shadcn-ui@latest init` → react style (tailwind.config). Generate: avatar, button, card, dialog, dropdown-menu, input, textarea, label, skeleton, badge, progress.
- Shadcn output ke `src/components/ui/*`. Rename existing Vue → jaga.
- Markdown editor → pakai `textarea` + preview sederhana, atau `react-markdown-it`.

### 4. Komponen features → React
- `ThreadCard`, `ThreadContent` (markdown-it renderer), `CommentTree` (recursive), `AuthorCard`, `RelatedThreads`, `SectionFeed`, `CreateThreadDialog`, komunitas (CommunitySidebar, CommunitiesSection, CommunityCard, VerseField).
- Types reuse `src/types` (lihat `queries.ts`/`useThreadDetail` interface → `.ts`).

### 5. Pages (app router)
- `src/app/layout.tsx`: SiteNav, SiteFooter, providers, auth session check.
- `src/app/page.tsx`: home feed (port index.vue logic: sections, search query).
- `src/app/login/page.tsx`, `register/page.tsx`: use `authClient.signIn` / `signUp`.
- `src/app/thread/[slug]/page.tsx`: port `[slug].vue` (loadThread, CommentTree, CreateThreadDialog untuk reply, RelatedThreads).
- `src/app/discussions/create/page.tsx`: atau gunakan dialog global di Nav.

### 6. CSS
- `src/app/globals.css` import `tailwind base`, `prose`, `main.css`. Rename `main.css` global.

## Risk / mitigasi
- `lucide-vue-next` → ganti import `lucide-react`.
- `RouterLink` → `next/link`.
- `ref/reactive/computed` → React state/hooks.
- Tailwind class sama persis — tidak perlu desain redraw.

## Verifikasi akhir
- `bun run build` Next (type-check + RSC build).
- Dev: `/api/health 200`, `/api/discussions/threads` list, `/thread/:slug` render SSR + komentar.
- Auth: login → cookie, `useSession` reactive.
