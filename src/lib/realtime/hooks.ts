"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Message, RealtimeChannel } from "ably";
import { getRealtimeClient, syncRealtimeWithAuth } from "./client";
import { PRESENCE_THREAD_CHANNEL } from "@/server/lib/ably/channels";
import { useSession } from "@/lib/auth-client";

/**
 * Hook realtime ringan untuk Ably Pub/Sub.
 * Lazy subscribe saat dibutuhkan, auto-unsubscribe saat unmount,
 * dan channel instance di-reuse (tanpa release agar tidak memutus subscriber lain).
 *
 * Semua operasi tahan gagal (resilient): jika channel berstatus "failed"
 * (mis. token/network gagal saat attach), subscribe tidak melempar error —
 * hook menunggu koneksi pulih lalu subscribe ulang secara otomatis.
 */

/** Subscribe ulang saat koneksi siap / channel pulih. Return true jika berhasil. */
function subscribeResilient(
  channel: RealtimeChannel,
  event: string,
  listener: (message: Message) => void,
): boolean {
  try {
    channel.subscribe(event, listener);
    return true;
  } catch {
    // channel masih "failed"/"initialized" — retry dilakukan via event handler
    return false;
  }
}

function unsubscribeResilient(
  channel: RealtimeChannel,
  event: string,
  listener: (message: Message) => void,
): void {
  try {
    channel.unsubscribe(event, listener);
  } catch {
    // abaikan — channel mungkin sudah release
  }
}

/**
 * Subscribe satu event pada satu channel.
 * Handler disimpan di ref sehingga tidak perlu re-subscribe saat berubah.
 */
export function useChannelEvent(
  channelName: string | null,
  event: string | null,
  handler: (message: Message) => void,
): void {
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!channelName || !event) return;
    let active = true;
    let subscribed = false;
    const client = getRealtimeClient();
    const channel = client.channels.get(channelName);
    const listener = (message: Message) => {
      if (active) handlerRef.current(message);
    };

    const doSubscribe = () => {
      if (!active || subscribed) return;
      subscribed = subscribeResilient(channel, event, listener);
    };

    const onConnected = () => {
      // Koneksi pulih — pastikan ter-subscribe
      if (active && !subscribed) doSubscribe();
    };
    const onChannelState = (state: { current: string }) => {
      if (state.current === "failed" && active) {
        // Channel gagal attach — retry saat koneksi pulih
        subscribed = false;
        channel.attach().catch(() => {});
      }
      if (state.current === "attached" && active && !subscribed) {
        doSubscribe();
      }
    };

    client.connection.on("connected", onConnected);
    channel.on("failed", onChannelState);
    channel.on("attached", onChannelState);
    doSubscribe();

    return () => {
      active = false;
      client.connection.off("connected", onConnected);
      channel.off("failed", onChannelState);
      channel.off("attached", onChannelState);
      unsubscribeResilient(channel, event, listener);
    };
  }, [channelName, event]);
}

/** Data presence anggota (clientId → data). Ephemeral — tidak disimpan server. */
export function usePresence(
  channelName: string | null,
  enterData?: unknown,
): Map<string, unknown> {
  const [members, setMembers] = useState<Map<string, unknown>>(new Map());
  const enterDataRef = useRef(enterData);
  enterDataRef.current = enterData;

  useEffect(() => {
    if (!channelName) return;
    let active = true;
    const client = getRealtimeClient();
    const channel = client.channels.get(channelName);

    const enterListener = (member: { clientId: string; data: unknown }) => {
      if (!active) return;
      setMembers((prev) => {
        const next = new Map(prev);
        next.set(member.clientId, member.data);
        return next;
      });
    };
    const leaveListener = (member: { clientId: string }) => {
      if (!active) return;
      setMembers((prev) => {
        const next = new Map(prev);
        next.delete(member.clientId);
        return next;
      });
    };

    const doSubscribe = () => {
      try {
        channel.presence.subscribe("enter", enterListener);
        channel.presence.subscribe("leave", leaveListener);
        channel.presence.enter(enterDataRef.current).catch(() => {});
      } catch {
        // channel belum siap — retry via event handler
      }
    };

    const onConnected = () => doSubscribe();
    const onChannelState = (state: { current: string }) => {
      if (state.current === "failed" && active) {
        channel.attach().catch(() => {});
      }
      if (state.current === "attached" && active) {
        doSubscribe();
      }
    };

    client.connection.on("connected", onConnected);
    channel.on("failed", onChannelState);
    channel.on("attached", onChannelState);

    // Ambil daftar member awal
    channel.presence
      .get()
      .then((existing) => {
        if (!active) return;
        const next = new Map<string, unknown>();
        for (const member of existing) {
          next.set(member.clientId, member.data);
        }
        setMembers(next);
      })
      .catch(() => {});

    doSubscribe();

    return () => {
      active = false;
      client.connection.off("connected", onConnected);
      channel.off("failed", onChannelState);
      channel.off("attached", onChannelState);
      try {
        channel.presence.unsubscribe("enter", enterListener);
        channel.presence.unsubscribe("leave", leaveListener);
        channel.presence.leave().catch(() => {});
      } catch {
        // abaikan
      }
    };
  }, [channelName]);

  return members;
}

/** Jumlah member presence pada channel thread — "sedang melihat diskusi ini". */
export function useThreadViewerCount(threadId: string | null): number {
  const channelName = threadId ? PRESENCE_THREAD_CHANNEL(threadId) : null;
  const members = usePresence(channelName, {});
  return members.size;
}

/**
 * Presence dengan update data dinamis (debounce 500ms).
 * Berguna untuk typing indicator — data berubah otomatis.
 */
export function usePresenceWithUpdates(
  channelName: string | null,
  data?: unknown,
): Map<string, unknown> {
  const [members, setMembers] = useState<Map<string, unknown>>(new Map());
  const dataRef = useRef(data);
  dataRef.current = data;

  useEffect(() => {
    if (!channelName) return;
    let active = true;
    const client = getRealtimeClient();
    const channel = client.channels.get(channelName);

    const enterListener = (member: { clientId: string; data: unknown }) => {
      if (!active) return;
      setMembers((prev) => {
        const next = new Map(prev);
        next.set(member.clientId, member.data);
        return next;
      });
    };
    const leaveListener = (member: { clientId: string }) => {
      if (!active) return;
      setMembers((prev) => {
        const next = new Map(prev);
        next.delete(member.clientId);
        return next;
      });
    };

    const doSubscribe = () => {
      try {
        channel.presence.subscribe("enter", enterListener);
        channel.presence.subscribe("leave", leaveListener);
        channel.presence.enter(dataRef.current).catch(() => {});
      } catch {
        // channel belum siap — retry via event handler
      }
    };

    const onConnected = () => doSubscribe();
    const onChannelState = (state: { current: string }) => {
      if (state.current === "failed" && active) {
        channel.attach().catch(() => {});
      }
      if (state.current === "attached" && active) {
        doSubscribe();
      }
    };

    client.connection.on("connected", onConnected);
    channel.on("failed", onChannelState);
    channel.on("attached", onChannelState);

    channel.presence
      .get()
      .then((existing) => {
        if (!active) return;
        const next = new Map<string, unknown>();
        for (const member of existing) {
          next.set(member.clientId, member.data);
        }
        setMembers(next);
      })
      .catch(() => {});

    doSubscribe();

    return () => {
      active = false;
      client.connection.off("connected", onConnected);
      channel.off("failed", onChannelState);
      channel.off("attached", onChannelState);
      try {
        channel.presence.unsubscribe("enter", enterListener);
        channel.presence.unsubscribe("leave", leaveListener);
        channel.presence.leave().catch(() => {});
      } catch {
        // abaikan
      }
    };
  }, [channelName]);

  useEffect(() => {
    if (!channelName || data === undefined) return;
    const client = getRealtimeClient();
    const channel = client.channels.get(channelName);
    const timer = setTimeout(() => {
      try {
        channel.presence.update(data).catch(() => {});
      } catch {
        // abaikan — update akan terjadi saat koneksi pulih
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [channelName, data]);

  return members;
}

/** Memaksa re-render ketika koneksi siap (opsional untuk penunda awal). */
export function useRealtimeReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const client = getRealtimeClient();
    if (client.connection.state === "connected") {
      setReady(true);
      return;
    }
    const listener = () => setReady(true);
    client.connection.once("connected", listener);
    return () => {
      client.connection.off("connected", listener);
    };
  }, []);
  return ready;
}

/**
 * Sinkronkan singleton Ably client dengan state auth.
 * Ketika userId berubah (login/logout), singleton lama ditutup agar
 * clientId tidak bermismatch dengan token baru di /api/ably/token.
 * Mount sekali di layout agar selalu aktip.
 */
export function useAuthRealtimeSync(): void {
  const { data: session } = useSession();
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    syncRealtimeWithAuth(userId);
  }, [userId]);
}
