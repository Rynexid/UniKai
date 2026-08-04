"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Home, Plus, Shield, Sun, Moon, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import NotificationsPopover from "@/components/layout/NotificationsPopover";
import { useTheme } from "@/providers/ThemeProvider";
import { useSession, signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function SiteBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "sudo" || role === "admin";

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  const itemCls = (active: boolean) =>
    cn(
      "flex flex-col items-center gap-1 text-[10px] font-medium transition-colors",
      active ? "text-primary" : "text-muted-foreground",
    );

  return (
    <nav
      aria-label="Navigasi bawah"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/90 backdrop-blur-md lg:hidden"
    >
      <div className="mx-auto grid h-16 max-w-lg grid-cols-5 items-center px-2">
        <Link href="/" className={itemCls(pathname === "/")}>
          <Home className="h-5 w-5" />
          Beranda
        </Link>

        <Link href="/explore" className={itemCls(pathname.startsWith("/explore"))}>
          <Compass className="h-5 w-5" />
          Jelajah
        </Link>

        <div className="flex justify-center">
          <Link
            href="/discussions/create"
            aria-label="Buat Diskusi"
            className="-mt-6 grid h-12 w-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-transform active:scale-95"
          >
            <Plus className="h-6 w-6" />
          </Link>
        </div>

        {user && (
          <NotificationsPopover
            showLabel
            className="items-center justify-center text-[10px] font-medium"
          />
        )}

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <button
                  type="button"
                  className={cn(itemCls(false), "mx-auto")}
                  aria-label="Akun"
                >
                  <Avatar className="h-5 w-5">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name} />
                    ) : (
                      <AvatarFallback className="text-[9px]">
                        {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <span>Profil</span>
                </button>
              }
            />
            <DropdownMenuContent align="end" className="w-52">
              <div className="px-2 py-1.5 text-sm">
                <p className="truncate font-medium leading-tight">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem render={<Link href="/profile" />}>
                <User className="h-4 w-4" />
                Lihat Profil
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem render={<Link href="/admin" />}>
                  <Shield className="h-4 w-4" />
                  Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={toggleTheme}>
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
                {theme === "dark" ? "Mode terang" : "Mode gelap"}
              </DropdownMenuItem>
              <DropdownMenuItem className="text-destructive" onSelect={handleLogout}>
                Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link href="/register" className={itemCls(false)}>
            <User className="h-5 w-5" />
            Daftar
          </Link>
        )}
      </div>
    </nav>
  );
}
