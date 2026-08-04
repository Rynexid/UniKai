import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-4 py-8 text-center sm:flex-row sm:justify-between sm:text-left xl:max-w-7xl">
        <div className="flex items-center gap-2.5">
          <img
            src="/UniKai.png"
            alt="Logo UniKai"
            className="h-7 w-7 rounded-lg object-contain"
          />
          <span className="font-display text-base font-semibold tracking-tight">
            UniKai
          </span>
          <span className="hidden text-sm text-muted-foreground sm:inline">
            · One Place. Every Community.
          </span>
        </div>

        <nav aria-label="Tautan footer" className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-foreground">
            Beranda
          </Link>
          <Link href="/explore" className="text-muted-foreground transition-colors hover:text-foreground">
            Jelajah
          </Link>
          <Link href="/discussions/create" className="text-muted-foreground transition-colors hover:text-foreground">
            Buat Diskusi
          </Link>
          <span className="cursor-not-allowed text-muted-foreground/50" title="Segera">
            Marketplace
          </span>
        </nav>
      </div>

      <div className="border-t border-border/40">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-1 px-4 py-4 text-xs text-muted-foreground sm:flex-row xl:max-w-7xl">
          <p>© 2026 UniKai</p>
          <p>Made for communities.</p>
        </div>
      </div>
    </footer>
  );
}
