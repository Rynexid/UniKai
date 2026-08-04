import { app } from "@/server/index";
import type { NextRequest } from "next/server";

// Mount full Hono app (discussions, users, communities, auth handler, ...) ke
// satu catch-all route. Backend business logic Hono tidak ditulis ulang; hanya
// dibungkus oleh Next API route agar satu origin (Next) jalan di dev & prod.
//
// BetterAuth but URL origin absolute; Next kirim relatif sehingga kita rekonstruk.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toAbsolute(req: NextRequest): Request {
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  const url = new URL(req.url, `${proto}://${host}`);
  const hasBody = req.method !== "GET" && req.method !== "HEAD";
  const init: RequestInit & { duplex: "half" } = {
    method: req.method,
    headers: req.headers,
    body: hasBody ? req.body : undefined,
    duplex: "half",
  };
  return new Request(url, init);
}

async function handler(req: NextRequest): Promise<Response> {
  return app.fetch(toAbsolute(req));
}

export { handler as GET, handler as POST, handler as PUT, handler as PATCH, handler as DELETE };
