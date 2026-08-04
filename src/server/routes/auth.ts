import { Hono } from "hono";
import { auth } from "../../infrastructure/auth";

const router = new Hono();

// Better Auth menangani semua route /api/auth/* (sign-in, sign-up, callback OAuth)
router.on(["GET", "POST"], "/*", (c) => auth.handler(c.req.raw));

export default router;
