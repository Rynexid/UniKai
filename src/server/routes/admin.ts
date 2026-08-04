import { Hono } from "hono";
import { desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { user, reports, threads } from "../../db";
import { requireRole } from "../../middleware/auth";
import {
  ROLES,
  normalizeRole,
  type Role,
} from "../../features/auth/roles";
import { getEffectiveRole } from "../../features/auth/role-resolver";

const router = new Hono();

// Seluruh route admin hanya untuk role sudo & admin.
router.use("*", requireRole("sudo", "admin"));

// GET /api/admin/stats - ringkasan platform
router.get("/stats", async (c) => {
  const [userCount] = await db.select({ n: sql<number>`count(*)::int` }).from(user);
  const [threadCount] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(threads);
  const [openReports] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(reports)
    .where(eq(reports.status, "open"));
  return c.json({
    users: Number(userCount?.n ?? 0),
    threads: Number(threadCount?.n ?? 0),
    openReports: Number(openReports?.n ?? 0),
  });
});

// GET /api/admin/users?q= - daftar user + role efektif
router.get("/users", async (c) => {
  const q = (c.req.query("q") ?? "").trim();
  const rows = await db.query.user.findMany({
    columns: { id: true, name: true, email: true, image: true, role: true, createdAt: true },
    where: q
      ? or(ilike(user.name, `%${q}%`), ilike(user.email, `%${q}%`))
      : undefined,
    orderBy: [desc(user.createdAt)],
    limit: 100,
  });

  const items = await Promise.all(
    rows.map(async (row) => {
      const effectiveRole = await getEffectiveRole(row);
      return {
        id: row.id,
        name: row.name,
        email: row.email,
        image: row.image,
        role: effectiveRole,
        createdAt: row.createdAt.toISOString(),
      };
    }),
  );

  return c.json(items);
});

// PATCH /api/admin/users/:id/role - ubah role user
router.patch("/users/:id/role", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "User id wajib." }, 400);

  const body = await c.req.json().catch(() => null) as { role?: string } | null;
  const nextRole = normalizeRole(body?.role);
  if (!(ROLES as readonly string[]).includes(nextRole)) {
    return c.json({ error: "Role tidak valid." }, 400);
  }

  const target = await db.query.user.findFirst({
    where: eq(user.id, id),
    columns: { id: true, role: true },
  });
  if (!target) return c.json({ error: "User tidak ditemukan." }, 404);

  const actor = c.get("user");
  const actorRole = await getEffectiveRole(actor);
  const targetRole = await getEffectiveRole(target);

  // Sudo tidak bisa diturunkan, termasuk oleh dirinya sendiri.
  if (targetRole === "sudo" && nextRole !== "sudo") {
    return c.json({ error: "Role Sudo tidak dapat diubah." }, 403);
  }
  // Hanya sudo yang bisa memberikan/mengubah role sudo & admin.
  if (
    actorRole !== "sudo" &&
    (nextRole === "sudo" || nextRole === "admin" || targetRole === "admin")
  ) {
    return c.json({ error: "Hanya Sudo yang dapat mengelola role Admin/Sudo." }, 403);
  }

  await db.update(user).set({ role: nextRole }).where(eq(user.id, id));
  return c.json({ ok: true, id, role: nextRole });
});

// GET /api/admin/reports?status= - daftar laporan
router.get("/reports", async (c) => {
  const status = c.req.query("status");
  const rows = await db.query.reports.findMany({
    where: status ? eq(reports.status, status) : undefined,
    with: { reporter: { columns: { id: true, name: true, image: true } } },
    orderBy: [desc(reports.createdAt)],
    limit: 100,
  });
  return c.json(
    rows.map((r) => ({
      id: r.id,
      targetType: r.targetType,
      targetId: r.targetId,
      reason: r.reason,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
      reporter: r.reporter,
    })),
  );
});

// PATCH /api/admin/reports/:id - ubah status laporan (open/resolved/dismissed)
router.patch("/reports/:id", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "Report id wajib." }, 400);

  const body = (await c.req.json().catch(() => null)) as { status?: string } | null;
  const status = body?.status;
  if (!["open", "resolved", "dismissed"].includes(status ?? "")) {
    return c.json({ error: "Status tidak valid." }, 400);
  }

  const updated = await db
    .update(reports)
    .set({ status, updatedAt: new Date() })
    .where(eq(reports.id, id))
    .returning({ id: reports.id, status: reports.status });
  if (!updated[0]) return c.json({ error: "Report tidak ditemukan." }, 404);
  return c.json({ ok: true, id, status });
});

export default router;
