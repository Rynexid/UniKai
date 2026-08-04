"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Search, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import RoleBadge from "@/components/dashboard/RoleBadge";
import { ROLES, type Role } from "@/features/auth/roles";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const searchTimer = useRef<number | null>(null);

  const load = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Gagal memuat pengguna");
      const data = (await res.json()) as AdminUser[];
      setUsers(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat pengguna");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load("");
    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current);
    };
  }, [load]);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (searchTimer.current) window.clearTimeout(searchTimer.current);
    searchTimer.current = window.setTimeout(() => void load(value), 350);
  };

  const changeRole = async (user: AdminUser, role: Role) => {
    if (user.role === role) return;
    setBusyId(user.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role }),
      });
      const data = (await res.json().catch(() => null)) as { error?: string; role?: Role } | null;
      if (!res.ok) throw new Error(data?.error ?? "Gagal mengubah role");
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
      setMessage(`Role ${user.name} diubah menjadi ${role}`);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Gagal mengubah role");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Kelola Pengguna</h2>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Cari nama atau email..."
          className="pl-8"
        />
      </div>

      {message && (
        <p
          className={cn(
            "rounded-lg border px-3 py-2 text-sm",
            message.includes("Gagal") || message.includes("tidak")
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          )}
        >
          {message}
        </p>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-border/25 bg-card/60">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3, 4].map((n) => (
              <Skeleton key={n} className="h-10 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="p-4 text-sm text-muted-foreground">Tidak ada pengguna ditemukan.</p>
        ) : (
          <table className="w-full min-w-[36rem] text-sm">
            <thead>
              <tr className="border-b border-border/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-4 py-3 font-medium">Pengguna</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Ubah role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border/30 last:border-0">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="size-8">
                        {u.image ? (
                          <AvatarImage src={u.image} alt={u.name} />
                        ) : (
                          <AvatarFallback>{u.name.charAt(0).toUpperCase()}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="min-w-0">
                        <p className="truncate font-medium">{u.name}</p>
                        <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <RoleBadge role={u.role} />
                  </td>
                  <td className="px-4 py-3">
                    {u.role === "sudo" ? (
                      <span className="text-xs text-muted-foreground">Terkunci</span>
                    ) : (
                      <select
                        value={u.role}
                        disabled={busyId === u.id}
                        onChange={(e) => void changeRole(u, e.target.value as Role)}
                        className="h-8 rounded-lg border border-border bg-background px-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50"
                      >
                        {ROLES.filter((r) => r !== "sudo").map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
