import { Hono } from "hono";
import { requireAuth } from "../../middleware/auth";
import {
  listNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
} from "../../features/notifications/queries";

const router = new Hono();

// GET /api/notifications - daftar notifikasi milik sendiri (wajib login)
router.get("/", requireAuth, async (c) => {
  const user = c.get("user");
  const [items, unread] = await Promise.all([
    listNotifications(user.id, 30),
    getUnreadNotificationCount(user.id),
  ]);
  return c.json({ items, unread });
});

// POST /api/notifications/read - tandai semua dibaca (wajib login)
router.post("/read", requireAuth, async (c) => {
  const user = c.get("user");
  await markNotificationsRead(user.id);
  return c.json({ ok: true });
});

export default router;
