import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { MessageSquare } from "lucide-react";
import { getSession } from "@/features/auth/session";
import { listDmRoomsForUser } from "@/features/dms/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatRelativeTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pesan · UniKai",
};

export default async function MessagesPage() {
  const headerList = await headers();
  const session = await getSession(headerList);
  if (!session) redirect("/login?redirect=/messages");

  const rooms = await listDmRoomsForUser(session.user.id);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <h1 className="mb-6 font-display text-2xl font-semibold tracking-tight">
        Pesan
      </h1>

      {rooms.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center">
          <MessageSquare className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Belum ada percakapan. Mulai DM dari profil pengguna lain.
          </p>
        </div>
      ) : (
        <div className="space-y-1">
          {rooms.map((room) => (
            <Link
              key={room.roomId}
              href={`/messages/${room.roomId}`}
              className="flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-accent/50"
            >
              <Avatar className="h-11 w-11 shrink-0">
                {room.otherUser.image ? (
                  <AvatarImage
                    src={room.otherUser.image}
                    alt={room.otherUser.name}
                  />
                ) : (
                  <AvatarFallback>
                    {room.otherUser.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium">
                    {room.otherUser.name}
                    {room.otherUser.username && (
                      <span className="ml-1 text-muted-foreground">
                        @{room.otherUser.username}
                      </span>
                    )}
                  </p>
                  {room.lastMessage && (
                    <span className="shrink-0 text-[11px] text-muted-foreground">
                      {formatRelativeTime(room.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {room.lastMessage ? (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {room.lastMessage.senderId === session.user.id && "Kamu: "}
                    {room.lastMessage.content}
                  </p>
                ) : (
                  <p className="mt-0.5 text-xs text-muted-foreground italic">
                    Belum ada pesan
                  </p>
                )}
              </div>

              {room.unreadCount > 0 && (
                <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {room.unreadCount > 99 ? "99+" : room.unreadCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
