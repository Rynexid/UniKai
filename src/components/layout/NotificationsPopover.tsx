"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useChannelEvent } from "@/lib/realtime/hooks";
import { NOTIFICATION_CHANNEL } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type { NotificationCreatedPayload } from "@/server/lib/ably/types";
import { useSession } from "@/lib/auth-client";
import { formatRelativeTime } from "@/lib/utils";

interface NotificationItem {
  id: string;
  type: string;
  title: string | null;
  content: string | null;
  relatedUrl: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationsPopoverProps {
  className?: string;
  label?: string;
  showLabel?: boolean;
}

export default function NotificationsPopover({
  className,
  label = "Notifikasi",
  showLabel = false,
}: NotificationsPopoverProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const [marking, setMarking] = useState(false);
  const fetchedRef = useRef(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/notifications", { credentials: "include" });
      if (!res.ok) return;
      const data = (await res.json()) as { items: NotificationItem[]; unread: number };
      setItems(data.items ?? []);
      setUnread(data.unread ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      setItems([]);
      setUnread(0);
      return;
    }
    if (!fetchedRef.current) {
      fetchedRef.current = true;
      void load();
    }
  }, [userId, load]);

  useChannelEvent(userId ? NOTIFICATION_CHANNEL(userId) : null, EVENTS.notification.created, (message) => {
    const data = message.data as NotificationCreatedPayload | undefined;
    if (!data?.id) return;
    setItems((prev) => {
      if (prev.some((n) => n.id === data.id)) return prev;
      return [
        {
          id: data.id,
          type: data.type,
          title: data.title,
          content: data.content,
          relatedUrl: data.relatedUrl,
          read: false,
          createdAt: data.createdAt,
        },
        ...prev,
      ].slice(0, 30);
    });
    setUnread((n) => n + 1);
  });

  const openDialog = () => {
    setOpen(true);
    if (items.length === 0 && userId) void load();
  };

  const markAllRead = async () => {
    if (!userId || marking) return;
    setMarking(true);
    try {
      const res = await fetch("/api/notifications/read", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        setItems((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnread(0);
      }
    } finally {
      setMarking(false);
    }
  };

  const openNotification = (item: NotificationItem) => {
    if (item.relatedUrl) router.push(item.relatedUrl);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        aria-label="Notifikasi"
        aria-haspopup="dialog"
        className={cn(
          "relative flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground",
          className,
        )}
      >
        <Bell className="h-5 w-5" />
        {showLabel && <span className="text-[10px] font-medium">{label}</span>}
        {unread > 0 && (
          <span className="absolute right-[-2px] top-[-2px] flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader className="flex-row items-center justify-between space-y-0">
            <DialogTitle>Notifikasi</DialogTitle>
            {unread > 0 && (
              <Button variant="ghost" size="sm" onClick={() => void markAllRead()} disabled={marking}>
                {marking ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <CheckCheck className="h-3.5 w-3.5" />
                )}
                Tandai dibaca
              </Button>
            )}
          </DialogHeader>

          <div className="mt-2 max-h-[60vh] overflow-y-auto">
            {loading && items.length === 0 ? (
              <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Memuat...
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-10 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium">Belum ada notifikasi</p>
                <p className="text-xs text-muted-foreground">
                  Aktivitas terbaru akan muncul di sini.
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-border/40">
                {items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => openNotification(item)}
                      className={cn(
                        "flex w-full flex-col gap-1 px-1 py-3 text-left transition-colors hover:bg-accent/50",
                        !item.read && "bg-primary/[0.04]",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className={cn("text-sm font-medium", !item.read && "text-foreground")}>
                          {item.title}
                        </span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatRelativeTime(item.createdAt)}
                        </span>
                      </div>
                      {item.content && (
                        <span className="line-clamp-2 text-xs text-muted-foreground">
                          {item.content}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {items.length > 0 && (
            <p className="text-center text-[11px] text-muted-foreground/70">
              Buka tautan untuk menandai notifikasi dibaca.
            </p>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
