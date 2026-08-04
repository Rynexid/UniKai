import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { CalendarDays, Globe, MapPin, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ThreadCard from "@/components/threads/ThreadCard";
import { getUserProfileByUsername, getUserThreads } from "@/features/users/queries";
import { ROLE_LABELS } from "@/features/auth/roles";
import { getSession } from "@/features/auth/session";
import DmButton from "@/components/dms/DmButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ username: string }>;
}): Promise<Metadata> {
  try {
    const { username } = await params;
    const profile = await getUserProfileByUsername(username);
    return {
      title: `${profile.name} (@${profile.username}) · UniKai`,
      description: profile.bio ?? `${profile.name} di UniKai · ${profile.discussionCount} diskusi`,
    };
  } catch {
    return { title: "Profil · UniKai" };
  }
}

const PRIVILEGED_ROLES = ["sudo", "admin", "mod"] as const;

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  let profile;
  try {
    profile = await getUserProfileByUsername(username);
  } catch {
    notFound();
  }

  const [threads, sessionHeaderList] = await Promise.all([
    getUserThreads(profile.id),
    headers(),
  ]);
  const session = await getSession(sessionHeaderList);

  const joined = new Date(profile.joinedAt).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
  const privileged = (PRIVILEGED_ROLES as readonly string[]).includes(profile.role);
  const roleLabel = ROLE_LABELS[profile.role as keyof typeof ROLE_LABELS] ?? profile.role;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 xl:max-w-7xl">
      <div className="rounded-2xl border border-border/25 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start gap-4">
          <Avatar className="size-20">
            {profile.image ? (
              <AvatarImage src={profile.image} alt={profile.name} />
            ) : (
              <AvatarFallback className="text-3xl">
                {profile.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-display text-2xl font-semibold tracking-tight">
                {profile.name}
              </h1>
              {privileged && (
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                  {roleLabel}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">@{profile.username}</p>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4" />
                {profile.discussionCount} diskusi
              </span>
              {profile.location && (
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-primary hover:underline"
                >
                  <Globe className="h-4 w-4" />
                  {profile.website.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                </a>
              )}
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="h-4 w-4" />
                Bergabung {joined}
              </span>
            </div>

            {profile.bio && (
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-foreground/85">
                {profile.bio}
              </p>
            )}
          </div>

          {session && session.user.id !== profile.id && (
            <div className="shrink-0">
              <DmButton targetUserId={profile.id} />
            </div>
          )}
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-4 font-display text-lg font-semibold">Diskusi {profile.name}</h2>
        {threads.length ? (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard key={thread.id} thread={thread} />
            ))}
          </div>
        ) : (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            Belum ada diskusi.{" "}
            <Link href="/discussions/create" className="text-primary hover:underline">
              Mulai diskusi pertama
            </Link>
          </p>
        )}
      </section>
    </div>
  );
}
