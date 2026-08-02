/**
 * Konfigurasi terpusat. Baca environment di sini sekali, ekspor dengan tipe.
 */
export const config = {
  appUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 3000),
} as const;
