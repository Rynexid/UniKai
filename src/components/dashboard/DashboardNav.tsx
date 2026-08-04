"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Flag, Home, Shield, UserCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Role } from "@/features/auth/roles";

export default function DashboardNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const canAdmin = role === "sudo" || role === "admin";

  const itemCls = (active: boolean) =>
    cn(
      "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <nav
      aria-label="Navigasi dashboard"
      className="flex gap-1 overflow-x-auto pb-2 md:sticky md:top-20 md:flex-col md:gap-0.5 md:overflow-visible md:pb-0 md:pr-2"
    >
      <Link href="/" className={itemCls(false)}>
        <Home className="h-4 w-4" />
        Beranda
      </Link>
      <Link href="/profile" className={itemCls(pathname.startsWith("/profile"))}>
        <UserCircle className="h-4 w-4" />
        Profil Saya
      </Link>

      {canAdmin && (
        <div className="flex items-center gap-1 md:mt-6 md:block md:gap-0">
          <span className="hidden px-3 pb-1.5 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70 md:block">
            Admin
          </span>
          <Link href="/admin" className={itemCls(pathname === "/admin")}>
            <Shield className="h-4 w-4" />
            Ringkasan
          </Link>
          <Link href="/admin/users" className={itemCls(pathname.startsWith("/admin/users"))}>
            <Users className="h-4 w-4" />
            Pengguna
          </Link>
          <Link href="/admin/reports" className={itemCls(pathname.startsWith("/admin/reports"))}>
            <Flag className="h-4 w-4" />
            Laporan
          </Link>
        </div>
      )}
    </nav>
  );
}
