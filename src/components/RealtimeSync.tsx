"use client";

import { useAuthRealtimeSync } from "@/lib/realtime/hooks";

/** Wrapper agar useAuthRealtimeSync (hook client) dijalankan di layout server komponen. */
export default function RealtimeSync() {
  useAuthRealtimeSync();
  return null;
}
