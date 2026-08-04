"use client";

import Ably from "ably";

/**
 * Singleton client Ably browser (Pub/Sub).
 * Autentikasi via token auth: SDK meminta /api/ably/token, server menandatangani
 * TokenRequest, dan SDK auto-renew sebelum token kedaluwarsa.
 * Client HANYA subscribe — publish hanya dari server.
 */
let realtime: Ably.Realtime | null = null;

export function getRealtimeClient(): Ably.Realtime {
  if (typeof window === "undefined") {
    throw new Error("getRealtimeClient hanya tersedia di browser.");
  }
  if (!realtime) {
    realtime = new Ably.Realtime({
      authUrl: "/api/ably/token",
      echoMessages: true,
    });
  }
  return realtime;
}
