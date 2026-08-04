import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../../middleware/auth";
import {
  getOrCreateDmRoom,
  listDmRoomsForUser,
  getDmMessages,
  createDmMessage,
  markDmRead,
  getDmPeerUserId,
  searchDmMessages,
} from "../../features/dms/queries";
import { publishDmMessageCreated, publishDmRead } from "../lib/ably/publish";
import type {
  DmMessageCreatedPayload,
  DmReadPayload,
} from "../lib/ably/types";

const router = new Hono();

const sendMessageSchema = z.object({
  content: z.string().trim().min(1, "Pesan tidak boleh kosong.").max(2000, "Pesan terlalu panjang.").optional(),
  imageUrl: z.string().url("URL gambar tidak valid.").optional(),
}).refine((d) => d.content || d.imageUrl, {
  message: "Isi pesan atau gambar wajib ada.",
});

// POST /api/dms/with/:userId - buat atau dapatkan room DM (wajib login)
router.post("/with/:userId", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const peerUserId = c.req.param("userId");
  if (!peerUserId) return c.json({ error: "userId wajib." }, 400);

  try {
    const roomId = await getOrCreateDmRoom(currentUser.id, peerUserId);
    return c.json({ roomId });
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Gagal." }, 400);
  }
});

// GET /api/dms - daftar room DM (wajib login)
router.get("/", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const rooms = await listDmRoomsForUser(currentUser.id);
  return c.json({ rooms });
});

// GET /api/dms/:id/messages - daftar pesan (wajib login + anggota)
router.get("/:id/messages", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const roomId = c.req.param("id");
  if (!roomId) return c.notFound();

  const messages = await getDmMessages(roomId, currentUser.id);
  return c.json({ messages });
});

// POST /api/dms/:id/messages - kirim pesan (wajib login + anggota)
router.post("/:id/messages", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const roomId = c.req.param("id");
  if (!roomId) return c.notFound();

  const body = await c.req.json().catch(() => ({}));
  const parsed = sendMessageSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: parsed.error.flatten() }, 400);
  }

  try {
    const message = await createDmMessage(
      roomId,
      currentUser.id,
      parsed.data.content ?? "",
      parsed.data.imageUrl,
    );

    // Publish realtime
    publishDmMessageCreated(roomId, {
      roomId,
      message: {
        id: message.id,
        content: message.content,
        imageUrl: message.imageUrl,
        createdAt: message.createdAt,
        sender: message.sender,
      },
    } satisfies DmMessageCreatedPayload);

    return c.json(message, 201);
  } catch (e) {
    return c.json({ error: e instanceof Error ? e.message : "Gagal mengirim." }, 400);
  }
});

// POST /api/dms/:id/read - tandai sudah dibaca (wajib login + anggota)
router.post("/:id/read", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const roomId = c.req.param("id");
  if (!roomId) return c.notFound();

  const result = await markDmRead(roomId, currentUser.id);
  if (!result) return c.json({ error: "Ruang tidak ditemukan." }, 404);

  // Publish read event ke peer
  publishDmRead(roomId, {
    roomId,
    userId: currentUser.id,
    readAt: new Date().toISOString(),
  } satisfies DmReadPayload);

  return c.json({ ok: true });
});

// POST /api/dms/:id/typing - kirim indikator mengetik (wajib login + anggota)
router.post("/:id/typing", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const roomId = c.req.param("id");
  if (!roomId) return c.notFound();
  return c.json({ ok: true });
});

// GET /api/dms/:id/search?q=... - cari pesan di room
router.get("/:id/search", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const roomId = c.req.param("id");
  if (!roomId) return c.notFound();
  const q = c.req.query("q");
  if (!q || q.trim().length < 2) {
    return c.json({ error: "Query minimal 2 karakter." }, 400);
  }
  const messages = await searchDmMessages(roomId, currentUser.id, q.trim());
  return c.json({ messages });
});

export default router;
