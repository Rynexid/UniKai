"use client";

import Ably from "ably";

/**
 * Singleton client Ably browser (Pub/Sub).
 * Autentikasi via token auth: SDK meminta /api/ably/token, server menandatangani
 * TokenRequest, dan SDK auto-renew sebelum token kedaluwarsa.
 * Client HANYA subscribe — publish hanya dari server.
 *
 * Client ID di-embed pada setiap token. Jika status auth berubah
 * (mis. user masuk/keluar), singleton lama harus ditutup dan diganti
 * baru agar tidak crash dengan "mismatched clientId for existing connection".
 */
let realtime: Ably.Realtime | null = null;
let expectedClientId: string | null = null;

export function getRealtimeClient(): Ably.Realtime {
  if (typeof window === "undefined") {
    throw new Error("getRealtimeClient hanya tersedia di browser.");
  }
  if (!realtime) {
    realtime = createClient();
  }
  return realtime;
}

function createClient(): Ably.Realtime {
  const client = new Ably.Realtime({
    authUrl: "/api/ably/token",
    echoMessages: true,
  });

  // Jika koneksi gagal karena clientId mismatch, reset singleton
  // agar hook berikutnya membuat koneksi baru dengan token yang tepat.
  client.connection.on("failed", () => {
    realtime = null;
  });

  return client;
}

/** Tutup & hapus singleton agar getRealtimeClient() membuat koneksi baru. */
export function resetRealtimeClient(): void {
  if (realtime) {
    try {
      realtime.close();
    } catch {
      //
    }
    realtime = null;
  }
}

/**
 * Sinkronkan singleton realtime dengan state auth yang sedang aktif.
 * Dipanggil oleh useAuthRealtimeSync di layout.
 */
export function syncRealtimeWithAuth(userId: string | null): void {
  if (expectedClientId !== userId) {
    resetRealtimeClient();
    expectedClientId = userId;
  }
}
