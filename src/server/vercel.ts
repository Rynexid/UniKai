import { handle } from "hono/vercel";
import { app } from "./index";

/**
 * Entry untuk deployment Vercel (lihat vercel.json).
 * Builder @vercel/node men-bundle seluruh import (termasuk src/) jadi satu fungsi,
 * berbeda dari folder api/ zero-config yang hanya meng-transpile file per file.
 */
export const config = {
  runtime: "nodejs",
} as const;

export default handle(app);
