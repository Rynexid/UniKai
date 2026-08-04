import type { ReactNode } from "react";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { requireServerAuth } from "@/features/auth/server-guard";
import DashboardNav from "@/components/dashboard/DashboardNav";
import RoleBadge from "@/components/dashboard/RoleBadge";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { role } = await requireServerAuth();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 xl:max-w-7xl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <LayoutDashboard className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-xl font-semibold tracking-tight">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Kelola profil & platform kamu</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <RoleBadge role={role} />
          <Link
            href="/"
            className="text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            ← Beranda
          </Link>
        </div>
      </header>

      <div className="flex flex-col gap-6 md:flex-row">
        <DashboardNav role={role} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
