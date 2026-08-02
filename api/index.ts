import { handle } from "hono/vercel";
import { app } from "../src/server/index";

/**
 * Function Vercel modern (folder api/ terdeteksi otomatis).
 * Semua /api/* di-rewrite ke /api/index oleh vercel.json.
 * Runtime nodejs agar kompatibel dengan better-auth + drizzle/neon-http.
 */
export const config = {
  runtime: "nodejs",
} as const;

export default handle(app);
