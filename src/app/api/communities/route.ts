import { Hono } from "hono";
import { getCategories } from "../../../features/communities/queries";

const router = new Hono();

// GET /api/communities - daftar kategori komunitas + jumlah thread
router.get("/", async (c) => {
  const categories = await getCategories();
  return c.json(categories);
});

export default router;
