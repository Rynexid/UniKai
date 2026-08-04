"use client";

import { useCallback, useEffect, useState } from "react";
import { CheckCircle2, Flag, XCircle } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ReportStatus = "open" | "resolved" | "dismissed";

interface ReportItem {
  id: string;
  targetType: string;
  targetId: string;
  reason: string | null;
  status: ReportStatus;
  createdAt: string;
  reporter: { id: string; name: string; image: string | null } | null;
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Terbuka",
  resolved: "Selesai",
  dismissed: "Ditolak",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<ReportStatus | "all">("all");
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/reports", { credentials: "include" });
      if (!res.ok) throw new Error("Gagal memuat laporan");
      const data = (await res.json()) as ReportItem[];
      setReports(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const updateStatus = async (report: ReportItem, status: ReportStatus) => {
    if (report.status === status) return;
    setBusyId(report.id);
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui laporan");
      setReports((prev) => prev.map((r) => (r.id === report.id ? { ...r, status } : r)));
    } catch {
      setError("Gagal memperbarui laporan.");
    } finally {
      setBusyId(null);
    }
  };

  const visible = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <Flag className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold">Moderasi Laporan</h2>
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border bg-card p-1 text-xs">
          {(["all", "open", "resolved", "dismissed"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-md px-2.5 py-1 font-medium capitalize transition-colors",
                filter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "all" ? "Semua" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Tidak ada laporan.
        </p>
      ) : (
        <ul className="space-y-3">
          {visible.map((r) => (
            <li
              key={r.id}
              className="rounded-2xl border border-border/25 bg-card/60 p-4 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="rounded-md bg-muted px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                      {r.targetType}
                    </span>
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
                        r.status === "open" && "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
                        r.status === "resolved" && "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
                        r.status === "dismissed" && "border-border bg-muted text-muted-foreground",
                      )}
                    >
                      {STATUS_LABELS[r.status]}
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm text-foreground/85">{r.reason || "Tanpa alasan"}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    Target: {r.targetId} · Dilaporkan oleh{" "}
                    {r.reporter ? (
                      <span className="inline-flex items-center gap-1 align-middle">
                        <Avatar className="size-4">
                          {r.reporter.image ? (
                            <AvatarImage src={r.reporter.image} alt={r.reporter.name} />
                          ) : (
                            <AvatarFallback className="text-[8px]">
                              {r.reporter.name.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        {r.reporter.name}
                      </span>
                    ) : (
                      "pengguna terhapus"
                    )}{" "}
                    · {new Date(r.createdAt).toLocaleDateString("id-ID")}
                  </p>
                </div>
                {r.status === "open" && (
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void updateStatus(r, "resolved")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Selesai
                    </button>
                    <button
                      type="button"
                      disabled={busyId === r.id}
                      onClick={() => void updateStatus(r, "dismissed")}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50"
                    >
                      <XCircle className="h-3.5 w-3.5" />
                      Tolak
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
