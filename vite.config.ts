import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import VueRouter from "unplugin-vue-router/vite";

export default defineConfig({
  plugins: [
    // File-based routing ala Next.js App Router: src/app/**/*.vue = route otomatis
    VueRouter({ routesFolder: "src/app", dts: "src/typed-router.d.ts" }),
    vue(),
  ],
  resolve: {
    alias: {
      // "@" menunjuk ke src/ — file server-only (src/app/api, src/infrastructure,
      // src/db, dst.) memakai import relatif dan tidak pernah masuk bundle client.
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    outDir: "dist/client",
  },
});
