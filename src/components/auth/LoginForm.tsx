"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { DiscordIcon } from "@/components/common/DiscordIcon";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect")?.startsWith("/")
    ? searchParams.get("redirect")!
    : "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDiscordSubmitting, setIsDiscordSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setErrorMessage("Email dan kata sandi wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const { error } = await authClient.signIn.email({ email, password });

    setIsSubmitting(false);

    if (error) {
      setErrorMessage(error.message ?? "Email atau kata sandi salah.");
      return;
    }

    router.replace(redirect);
    router.refresh();
  };

  const handleDiscord = async () => {
    setIsDiscordSubmitting(true);
    setErrorMessage(null);

    const { error } = await authClient.signIn.social({
      provider: "discord",
      callbackURL: redirect,
    });

    setIsDiscordSubmitting(false);

    if (error) {
      setErrorMessage(error.message ?? "Gagal masuk dengan Discord.");
    }
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between border-r border-border/60 bg-card/30 p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2.5">
          <img src="/UniKai.png" alt="Logo UniKai" className="h-9 w-9 rounded-lg object-contain" />
          <span className="font-display text-lg font-semibold tracking-tight">UniKai</span>
        </Link>

        <div className="max-w-sm">
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Satu Verse.
            <span className="bg-gradient-to-r from-primary to-[#FF9A63] bg-clip-text text-transparent">
              Semua diskusimu.
            </span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            Kembali ke komunitasmu, lanjutkan percakapan, dan mulai diskusi baru. Semua di satu
            tempat.
          </p>
        </div>

        <p className="text-xs text-muted-foreground">Connect · Share · Create · Explore · Grow</p>
      </div>

      <div className="flex items-center justify-center px-4 py-10 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <img src="/UniKai.png" alt="Logo UniKai" className="h-9 w-9 rounded-lg object-contain" />
            <span className="font-display text-lg font-semibold tracking-tight">UniKai</span>
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight">Masuk ke akunmu</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Belum punya akun?{" "}
            <Link
              href="/register"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Daftar gratis
            </Link>
          </p>

          <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input
                id="login-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                autoComplete="email"
                placeholder="kamu@contoh.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Kata sandi</Label>
              <Input
                id="login-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
              />
            </div>

            {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? "Memasuki..." : "Masuk"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3">
            <span className="h-px flex-1 bg-border/60" />
            <span className="text-[11px] uppercase tracking-widest text-muted-foreground">atau</span>
            <span className="h-px flex-1 bg-border/60" />
          </div>

          <Button
            variant="outline"
            className="w-full"
            disabled={isDiscordSubmitting}
            onClick={handleDiscord}
          >
            {isDiscordSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            <DiscordIcon />
            {isDiscordSubmitting ? "Menghubungkan..." : "Lanjut dengan Discord"}
          </Button>
        </div>
      </div>
    </div>
  );
}
