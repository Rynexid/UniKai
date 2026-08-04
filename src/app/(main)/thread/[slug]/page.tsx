import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import ThreadContent from "@/components/discussions/ThreadContent";
import ThreadComments from "@/components/discussions/ThreadComments";
import ThreadActions from "@/components/discussions/ThreadActions";
import ThreadMeta from "@/components/discussions/ThreadMeta";
import AuthorCard from "@/components/discussions/AuthorCard";
import RelatedThreads from "@/components/discussions/RelatedThreads";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HUE_CLASSES, hueForSlug } from "@/features/communities/data/communities";
import { formatRelativeTime } from "@/lib/utils";
import { getSession } from "@/features/auth/session";
import { countAllComments } from "@/components/discussions/comment-count";
import type { DiscussionListItem, ThreadDetail } from "@/types";

const API_BASE = process.env.PUBLIC_APP_URL ?? "http://localhost:3000";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const res = await fetch(`${API_BASE}/api/discussions/threads/${slug}`, {
    cache: "no-store",
  });
  const thread = res.ok ? ((await res.json()) as ThreadDetail) : null;
  return { title: thread ? `${thread.title} · UniKai` : "Thread · UniKai" };
}

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const res = await fetch(`${API_BASE}/api/discussions/threads/${slug}`, {
    cache: "no-store",
  });
  if (!res.ok) notFound();
  const thread = (await res.json()) as ThreadDetail;

  const [relatedRes, profileRes] = await Promise.all([
    fetch(`${API_BASE}/api/discussions/threads/${slug}/related`, {
      cache: "no-store",
    }).catch(() => null),
    fetch(`${API_BASE}/api/users/${thread.author.id}/profile`, {
      cache: "no-store",
    }).catch(() => null),
  ]);

  const related = relatedRes?.ok
    ? ((await relatedRes.json()) as DiscussionListItem[])
    : [];
  const profile = profileRes?.ok
    ? await profileRes.json().catch(() => null)
    : null;

  const headerList = await headers();
  const session = await getSession(headerList);
  const isAuthenticated = session !== null;
  const currentUserId = session?.user?.id ?? null;
  const isOwner = currentUserId === thread.author.id;

  const hueClasses = HUE_CLASSES[hueForSlug(thread.category.slug)];
  const isEdited = thread.updatedAt !== thread.createdAt;
  const totalReplies = countAllComments(thread.comments);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:py-10 xl:max-w-7xl">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>Beranda</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink
              render={<Link href={`/explore?q=${encodeURIComponent(thread.category.name)}`} />}
            >
              {thread.category.name}
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="line-clamp-1 max-w-[16rem] sm:max-w-none">
              {thread.title}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <header className="mt-5">
        <span
          className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${hueClasses.softBg} ${hueClasses.text}`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${hueClasses.dot}`} />
          {thread.category.name}
        </span>

        <h1 className="mt-2.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
          {thread.title}
        </h1>

        <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Avatar className="h-5 w-5">
              {thread.author.image ? (
                <AvatarImage src={thread.author.image} alt={thread.author.name} />
              ) : (
                <AvatarFallback className="text-[9px]">
                  {thread.author.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
            {thread.author.username ? (
              <Link
                href={`/${thread.author.username}`}
                className="font-medium text-foreground/80 transition-colors hover:text-primary"
              >
                {thread.author.name}
              </Link>
            ) : (
              <span className="font-medium text-foreground/80">{thread.author.name}</span>
            )}
          </span>
          <span aria-hidden="true" className="text-foreground/20">
            ·
          </span>
          <span>{formatRelativeTime(thread.createdAt)}</span>
          {isEdited && (
            <span className="rounded-full border border-border/40 px-1.5 py-px text-[10px] text-muted-foreground/70">
              diedit
            </span>
          )}
          <span aria-hidden="true" className="text-foreground/20">
            ·
          </span>
          <ThreadMeta
            threadId={thread.id}
            initialViewCount={thread.viewCount}
            initialReplies={totalReplies}
            initialReactions={thread.reactionCount}
          />
        </div>

        <div className="mt-4">
          <ThreadActions
            threadId={thread.id}
            threadSlug={thread.slug}
            threadTitle={thread.title}
            initialReactionCount={thread.reactionCount}
            isAuthenticated={isAuthenticated}
          />
        </div>
      </header>

      <article className="mt-5 rounded-2xl border border-border/30 bg-card/40 p-5 sm:p-6">
        <ThreadContent content={thread.content} />
      </article>

      <div className="mt-5">
        <AuthorCard
          author={thread.author}
          profile={profile}
          isAuthenticated={isAuthenticated}
          isOwner={isOwner}
          threadSlug={thread.slug}
        />
      </div>

      <ThreadComments
        threadId={thread.id}
        threadSlug={thread.slug}
        comments={thread.comments}
        isAuthenticated={isAuthenticated}
        currentUserId={currentUserId}
      />

      <RelatedThreads items={related} />
    </div>
  );
}
