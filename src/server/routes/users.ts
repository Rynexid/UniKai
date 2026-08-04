import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db } from "../../infrastructure/database";
import { user, profiles } from "../../db";
import { requireAuth } from "../../middleware/auth";
import { getUserDiscussionCount } from "@/features/discussions/queries";
import { getUserProfile } from "@/features/users/queries";
import { getEffectiveRole } from "@/features/auth/role-resolver";
import {
  generateUniqueUsername,
  isUsernameTaken,
  isValidUsername,
  slugifyUsername,
} from "@/features/users/usernames";

const router = new Hono();

router.get("/:id/discussion-count", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "User id wajib." }, 400);
  const count = await getUserDiscussionCount(id);
  return c.json({ discussionCount: count });
});

router.get("/:id/profile", async (c) => {
  const id = c.req.param("id");
  if (!id) return c.json({ error: "User id wajib." }, 400);
  return c.json(await getUserProfile(id));
});

// GET /api/users/availability?username= - cek ketersediaan username (case-insensitive)
router.get("/availability", requireAuth, async (c) => {
  const raw = (c.req.query("username") ?? "").trim();
  const username = slugifyUsername(raw);
  const currentUser = c.get("user");
  const ownProfile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, currentUser.id),
    columns: { username: true },
  });
  const isOwn = ownProfile?.username === username;
  if (!username || !isValidUsername(username)) {
    return c.json({ valid: false, available: false });
  }
  return c.json({
    valid: true,
    available: isOwn || !(await isUsernameTaken(username)),
  });
});

// GET /api/users/me - profil lengkap user yang sedang login (termasuk role & profile)
router.get("/me", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const [role, profile, discussionCount] = await Promise.all([
    getEffectiveRole(currentUser),
    db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
      columns: {
        username: true,
        bio: true,
        location: true,
        website: true,
        coverImage: true,
      },
    }),
    getUserDiscussionCount(currentUser.id),
  ]);

  return c.json({
    id: currentUser.id,
    name: currentUser.name,
    email: currentUser.email,
    image: currentUser.image,
    role,
    username: profile?.username ?? null,
    bio: profile?.bio ?? null,
    location: profile?.location ?? null,
    website: profile?.website ?? null,
    coverImage: profile?.coverImage ?? null,
    discussionCount,
  });
});

// PATCH /api/users/me/profile - perbarui profil sendiri
router.patch("/me/profile", requireAuth, async (c) => {
  const currentUser = c.get("user");
  const body = (await c.req.json().catch(() => null)) as
    | { name?: string; username?: string; bio?: string; location?: string; website?: string }
    | null;
  if (!body) return c.json({ error: "Body tidak valid." }, 400);

  const updates: { name?: string } = {};
  if (typeof body.name === "string" && body.name.trim().length >= 2) {
    updates.name = body.name.trim().slice(0, 100);
  }
  if (updates.name) {
    await db.update(user).set({ name: updates.name }).where(eq(user.id, currentUser.id));
  }

  const profileFields: {
    username?: string;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
  } = {};

  if (typeof body.username === "string" && body.username.trim()) {
    const username = slugifyUsername(body.username);
    if (!isValidUsername(username)) {
      return c.json(
        { error: "Username hanya boleh huruf kecil, angka, dan tanda hubung (3-32 karakter)." },
        400,
      );
    }
    const currentProfile = await db.query.profiles.findFirst({
      where: eq(profiles.userId, currentUser.id),
      columns: { id: true, username: true },
    });
    if (!currentProfile || currentProfile.username !== username) {
      if (await isUsernameTaken(username)) {
        return c.json({ error: `Username "${username}" sudah dipakai orang lain.` }, 409);
      }
    }
    profileFields.username = username;
  }

  if (typeof body.bio === "string") profileFields.bio = body.bio.trim().slice(0, 300) || null;
  if (typeof body.location === "string")
    profileFields.location = body.location.trim().slice(0, 100) || null;
  if (typeof body.website === "string")
    profileFields.website = body.website.trim().slice(0, 200) || null;

  const profile = await db.query.profiles.findFirst({
    where: eq(profiles.userId, currentUser.id),
    columns: { id: true },
  });

  if (profile) {
    await db
      .update(profiles)
      .set(profileFields)
      .where(eq(profiles.userId, currentUser.id));
  } else {
    await db.insert(profiles).values({
      userId: currentUser.id,
      username:
        profileFields.username ??
        (await generateUniqueUsername(currentUser.name ?? currentUser.email)),
      bio: profileFields.bio,
      location: profileFields.location,
      website: profileFields.website,
    });
  }

  return c.json({ ok: true });
});

export default router;
