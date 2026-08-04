"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Flag, MessageSquare, Shield, Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminStats {
  users: number;
  threads: number;
  openReports: number;
}

const cards = [
  { key: "users", label: "Pengguna", icon: Users, href: "/admin/users", accent: "text-sky-500" },
  { key: "threads", label: "Diskusi", icon: MessageSquare, href: "/admin/users", accent: "text-primary" },
  { key: "openReports", label: "Laporan terbuka", icon: Flag, href: "/admin/reports", accent: "text-rose-500" },
] as const;

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/stats", { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error("Gagal memuat statistik");
        const data = (await res.json()) as AdminStats;
        if (!cancelled) setStats(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Gagal memuat statistik");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5">
        <Shield className="h-5 w-5 text-primary" />
        <h2 className="font-display text-lg font-semibold">Ringkasan Platform</h2>
      </div>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-3">
          {cards.map((card) => (
            <Link
              key={card.key}
              href={card.href}
              className="group rounded-2xl border border-border/25 bg-card/80 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <card.icon className={`h-4 w-4 ${card.accent}`} />
                {card.label}
              </div>
              {stats ? (
                <p className="mt-2 font-display text-3xl font-semibold tabular-nums">
                  {card.key === "openReports"
                    ? stats.openReports.toLocaleString("id-ID")
                    : card.key === "users"
                      ? stats.users.toLocaleString("id-ID")
                      : stats.threads.toLocaleString("id-ID")}
                </p>
              ) : (
                <Skeleton className="mt-2 h-8 w-16 rounded" />
              )}
            </Link>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-border/25 bg-card/60 p-4 sm:p-5">
        <h3 className="mb-2 text-sm font-semibold">Tindakan cepat</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/users"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Kelola role pengguna
          </Link>
          <Link
            href="/admin/reports"
            className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            Tinjau laporan
          </Link>
        </div>
      </div>
    </div>
  );
}
