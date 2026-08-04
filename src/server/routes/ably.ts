import { Hono } from "hono";
import { attachSessionIfExists } from "../../middleware/auth";
import { createAblyTokenRequest } from "../lib/ably/auth";

/**
 * GET /api/ably/token - token Ably sementara untuk browser.
 * Browser TIDAK pernah melihat API key; hanya menerima TokenRequest
 * yang ditandatangani server. SDK client auto-renew sebelum kedaluwarsa.
 */
const router = new Hono();

router.get("/token", attachSessionIfExists, async (c) => {
  const user = c.get("user") as { id: string } | undefined;
  const tokenRequest = await createAblyTokenRequest({
    clientId: user?.id ?? null,
  });
  if (!tokenRequest) {
    return c.json({ error: "Realtime tidak dikonfigurasi." }, 503);
  }
  return c.json(tokenRequest);
});

export default router;
