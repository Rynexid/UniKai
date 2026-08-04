"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Moon, Plus, Search, Shield, Sun, UserCircle } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

export default function SiteNav() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const role = (user as { role?: string } | null)?.role;
  const isAdmin = role === "sudo" || role === "admin";

  const [isSearchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const submitSearch = () => {
    const q = searchQuery.trim();
    setSearchOpen(false);
    if (q) router.replace("/?q=" + encodeURIComponent(q));
  };

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 xl:max-w-7xl">
        <Link href="/" aria-label="UniKai — Beranda" className="flex items-center">
          <img
            src="/UniKai.png"
            alt="Logo UniKai"
            className="h-8 w-8 rounded-lg object-contain"
          />
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Cari diskusi"
            onClick={() => setSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </Button>

           <Button
             size="sm"
             className="hidden md:inline-flex"
             nativeButton={false}
             render={
                <Link href="/discussions/create">
                  <Plus className="h-4 w-4" />
                  Buat Diskusi
                </Link>
              }
           />

           {user && (
            <NotificationsPopover className="hidden h-9 w-9 items-center justify-center rounded-md transition-colors hover:bg-accent hover:text-foreground lg:flex" />
          )}

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon" className="hidden rounded-full p-0 lg:inline-flex">
                    <Avatar className="h-8 w-8">
                      {user.image ? (
                        <AvatarImage src={user.image} alt={user.name} />
                      ) : (
                        <AvatarFallback>
                          {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-1.5 text-sm">
                  <p className="truncate font-medium leading-tight">{user.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href="/profile" />}>
                  <UserCircle className="h-4 w-4" />
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
            <div className="hidden items-center gap-2 lg:flex">
              <Button size="sm" nativeButton={false} render={<Link href="/register">Daftar</Link>} />
            </div>
          )}
        </div>
      </div>

      <Dialog open={isSearchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cari diskusi</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) =>
                  e.key === "Enter" && (e.preventDefault(), submitSearch())
                }
                placeholder="Cari judul, kategori, atau penulis..."
                className="pl-8 text-sm"
                autoFocus
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Ketik lalu tekan Enter untuk mencari.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}
