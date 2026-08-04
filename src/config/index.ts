/**
 * Konfigurasi terpusat. Baca environment di sini sekali, ekspor dengan tipe.
 */
export const config = {
  appUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
  ably: {
    apiKey: process.env.ABLY_API_KEY ?? "",
    /** Durasi token client (ms). SDK auto-renew sebelum kedaluwarsa. */
    tokenTtlMs: Number(process.env.ABLY_TOKEN_TTL_MS ?? 60 * 60 * 1000),
  },
} as const;
