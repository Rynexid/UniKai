import { handle } from "hono/vercel";
import { app } from "./index";

/**
 * Entry runtime Vercel. Builder @vercel/node men-bundle seluruh src/ jadi satu fungsi.
 *
 * Vercel Node.js serverless functions tidak mengenali `export default` yang
 * mengembalikan `Response` (Web fetch-style) — itu membuat handler "return ignored"
 * dan request menghang sampai timeout 300s. Solusi: ekspor named handler GET/POST/…
 * seperti yang didokumentasikan Hono untuk Vercel.
 */
export const config = {
  runtime: "nodejs",
} as const;

const handler = handle(app);

export { handler as GET };
export { handler as POST };
export { handler as PUT };
export { handler as PATCH };
export { handler as DELETE };
export { handler as OPTIONS };
export { handler as HEAD };
