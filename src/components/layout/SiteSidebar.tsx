"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  Bookmark,
  CalendarDays,
  Compass,
  Home,
  Layers,
  LayoutDashboard,
  Moon,
  Plus,
  Settings,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useTheme } from "@/providers/ThemeProvider";
import { useSession } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

const PLANNED = "Segera";

const plannedItems = [
  { label: "Komunitas", icon: Users },
  { label: "Marketplace", icon: Layers },
  { label: "Sumber Daya", icon: Bookmark },
  { label: "Acara", icon: CalendarDays },
  { label: "Mengikuti", icon: Bell },
  { label: "Pengaturan", icon: Settings },
];

export default function SiteSidebar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const role = (session?.user as { role?: string } | null)?.role;
  const isAdmin = role === "sudo" || role === "admin";

  if (!session?.user) return null;

  const linkCls = (active: boolean) =>
    cn(
      "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
      active
        ? "bg-primary/10 text-primary"
        : "text-muted-foreground hover:bg-accent hover:text-foreground",
    );

  return (
    <aside className="hidden w-52 shrink-0 lg:block">
      <nav
        aria-label="Navigasi samping"
        className="sticky top-20 flex flex-col gap-6 py-6"
      >
        <div className="space-y-0.5">
          <Link href="/" className={linkCls(pathname === "/")}>
            <Home className="h-4 w-4" />
            Beranda
          </Link>
          <Link href="/explore" className={linkCls(pathname.startsWith("/explore"))}>
            <Compass className="h-4 w-4" />
            Jelajah
          </Link>
          <Link href="/discussions/create" className={linkCls(false)}>
            <Plus className="h-4 w-4" />
            Buat Diskusi
          </Link>
          <Link href="/profile" className={linkCls(pathname.startsWith("/profile"))}>
            <LayoutDashboard className="h-4 w-4" />
            Dashboard
          </Link>
          {isAdmin && (
            <Link href="/admin" className={linkCls(pathname.startsWith("/admin"))}>
              <Shield className="h-4 w-4" />
              Admin
            </Link>
          )}
        </div>

        <div>
          <p className="mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70">
            Lainnya
          </p>
          <div className="space-y-0.5">
            {plannedItems.map((item) => (
              <span
                key={item.label}
                title={PLANNED}
                className="flex h-9 cursor-not-allowed items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground/45"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                <span className="ml-auto rounded-full border border-border/50 px-1.5 py-px text-[9px] font-medium tracking-wide text-muted-foreground/60">
                  {PLANNED}
                </span>
              </span>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={toggleTheme}
          className="mt-auto flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
          {theme === "dark" ? "Mode terang" : "Mode gelap"}
        </button>
      </nav>
    </aside>
  );
}
