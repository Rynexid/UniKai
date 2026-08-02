import { handle } from "hono/vercel";
import { app } from "./index";

/**
 * Entry untuk deployment Vercel (lihat vercel.json).
 * Fungsi Node.js serverless - runtime nodejs (aman untuk better-auth + drizzle/neon-http).
 */
export const config = {
  runtime: "nodejs",
} as const;

export default handle(app);
