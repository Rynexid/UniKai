import { app } from "./index";
import { config } from "../config";

/**
 * Entry server lokal Bun (bukan untuk Vercel):
 *   bun run src/server/dev.ts
 * Deployment Vercel memakai src/server/vercel.ts.
 */
export default {
  port: config.port,
  fetch: app.fetch,
};
