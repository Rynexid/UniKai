import { Hono } from "hono";
import { getThreads } from "../../../features/discussions/queries";
import { createThread, createThreadSchema } from "../../../features/discussions/commands";
import { requireAuth, attachSessionIfExists } from "../../../middleware/auth";

const router = new Hono();

// GET /api/discussions/threads?category=slug - daftar thread (login opsional)
router.get("/threads", attachSessionIfExists, async (c) => {
  const categorySlug = c.req.query("category");
  const threads = await getThreads(categorySlug ?? undefined);
  return c.json(threads);
});

// POST /api/discussions/threads - buat thread baru (wajib login)
router.post("/threads", requireAuth, async (c) => {
  const body = await c.req.json();
  const parsed = createThreadSchema.safeParse(body);

  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  const currentUser = c.get("user");
  const thread = await createThread(parsed.data, currentUser.id);
  return c.json(thread, 201);
});

export default router;
