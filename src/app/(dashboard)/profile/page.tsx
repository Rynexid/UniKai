"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Loader2, MapPin, MessageSquare, Save, UserCircle, Globe } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import RoleBadge from "@/components/dashboard/RoleBadge";
import type { Role } from "@/features/auth/roles";

interface Me {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  username: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  discussionCount: number;
}

export default function ProfilePage() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({ name: "", username: "", bio: "", location: "", website: "" });
  const [usernameHint, setUsernameHint] = useState<{
    state: "idle" | "available" | "taken" | "invalid";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!me) return;
    const candidate = form.username.trim();
    if (!candidate) {
      setUsernameHint(null);
      return;
    }
    const t = setTimeout(() => {
      fetch(`/api/users/availability?username=${encodeURIComponent(candidate)}`, {
        credentials: "include",
      })
        .then(async (res) => {
          if (!res.ok) throw new Error();
          const data = (await res.json()) as { valid: boolean; available: boolean };
          if (!data.valid) {
            setUsernameHint({
              state: "invalid",
              text: "Hanya huruf kecil, angka, dan tanda hubung (3-32 karakter).",
            });
          } else if (data.available) {
            setUsernameHint(null);
          } else {
            setUsernameHint({ state: "taken", text: "Username sudah dipakai." });
          }
        })
        .catch(() => setUsernameHint(null));
    }, 400);
    return () => clearTimeout(t);
  }, [form.username, me]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/users/me", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat profil");
        const data = (await res.json()) as Me;
        if (!cancelled) {
          setMe(data);
          setForm({
            name: data.name,
            username: data.username ?? "",
            bio: data.bio ?? "",
            location: data.location ?? "",
            website: data.website ?? "",
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat profil");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch("/api/users/me/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal menyimpan profil");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal menyimpan profil");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!me) {
    return <p className="text-sm text-destructive">{error ?? "Profil tidak ditemukan."}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border/25 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            {me.image ? (
              <AvatarImage src={me.image} alt={me.name} />
            ) : (
              <AvatarFallback className="text-2xl">{me.name.charAt(0).toUpperCase()}</AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-semibold">{me.name}</h2>
              <RoleBadge role={me.role} />
            </div>
            <p className="truncate text-sm text-muted-foreground">{me.email}</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              {me.username && (
                <>
                  <Link
                    href={`/${me.username}`}
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    @{me.username}
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                  <span aria-hidden="true" className="text-foreground/20">
                    ·
                  </span>
                </>
              )}
              <span>Profil publik</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {me.discussionCount} diskusi
              </span>
              {me.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {me.location}
                </span>
              )}
              {me.website && (
                <a
                  href={me.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {me.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
            </div>
            {me.bio && <p className="mt-3 text-sm leading-relaxed text-foreground/85">{me.bio}</p>}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border/25 bg-card/60 p-5 sm:p-6">
        <div className="mb-4 flex items-center gap-2">
          <UserCircle className="h-5 w-5 text-primary" />
          <h3 className="font-display text-base font-semibold">Edit Profil</h3>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Nama</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nama tampilan"
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Username</Label>
            <Input
              value={form.username}
              onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
              placeholder="@username"
              maxLength={40}
            />
            {usernameHint && (
              <p
                className={
                  usernameHint.state === "taken" || usernameHint.state === "invalid"
                    ? "text-xs text-destructive"
                    : "text-xs text-muted-foreground"
                }
              >
                {usernameHint.text}
              </p>
            )}
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Bio</Label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              placeholder="Ceritakan tentang dirimu..."
              rows={3}
              maxLength={300}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground/60 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
          </div>
          <div className="space-y-2">
            <Label>Lokasi</Label>
            <Input
              value={form.location}
              onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
              placeholder="Kota, provinsi..."
              maxLength={100}
            />
          </div>
          <div className="space-y-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
              placeholder="https://..."
              maxLength={200}
            />
          </div>
        </div>

        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

        <div className="mt-5 flex items-center gap-3">
          <Button type="button" onClick={() => void save()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? "Menyimpan..." : "Simpan"}
          </Button>
          {saved && <span className="text-sm text-emerald-600 dark:text-emerald-400">Tersimpan ✓</span>}
        </div>
      </div>
    </div>
  );
}
