import { Hono } from "hono";
import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireAuth } from "../../middleware/auth";

/**
 * Upload lampiran (gambar) untuk konten diskusi/komentar.
 * File disimpan ke public/uploads (dilayani Next sebagai statis).
 */
const router = new Hono();

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

router.post("/", requireAuth, async (c) => {
  const body = await c.req.parseBody();
  const file = body["file"];

  if (!(file instanceof File)) {
    return c.json({ error: "File tidak ditemukan." }, 400);
  }
  if (!(file.type in ALLOWED_TYPES)) {
    return c.json({ error: "Tipe file tidak didukung (PNG/JPG/WebP/GIF)." }, 400);
  }
  if (file.size > MAX_SIZE) {
    return c.json({ error: "Ukuran file maksimal 5MB." }, 400);
  }

  const ext = ALLOWED_TYPES[file.type];
  const name = `${Date.now()}-${randomUUID().slice(0, 8)}.${ext}`;

  await mkdir(UPLOAD_DIR, { recursive: true });
  await writeFile(path.join(UPLOAD_DIR, name), Buffer.from(await file.arrayBuffer()));

  return c.json({ url: `/uploads/${name}`, name: file.name }, 201);
});

router.delete("/:name", requireAuth, async (c) => {
  const name = c.req.param("name");
  if (!name || !/^[\w-]+\.(png|jpg|webp|gif)$/.test(name)) {
    return c.json({ error: "Nama file tidak valid." }, 400);
  }
  await unlink(path.join(UPLOAD_DIR, name)).catch(() => {});
  return c.json({ ok: true });
});

export default router;
