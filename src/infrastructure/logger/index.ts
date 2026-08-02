/*
 * Logger aplikasi minimal (tanpa dependensi ekstra).
 * Untuk observability produksi, ganti implementasi ini dengan pino/bunyan
 * atau kegunaan pihak tanpa mengganti API `appLogger`.
 */
import type { LogLevel } from "../../types";

export type { LogLevel };

const LEVELS: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
} as const;

const currentLevel = (process.env.LOG_LEVEL as LogLevel) ?? "info";

function emit(level: LogLevel, msg: string, meta?: unknown): void {
  if (LEVELS[level] < LEVELS[currentLevel]) return;
  const line: Record<string, unknown> = { ts: new Date().toISOString(), level, msg };
  if (meta !== undefined) line.meta = meta;
  // eslint-disable-next-line no-console
  console[level === "warn" ? "warn" : level === "error" ? "error" : "log"](JSON.stringify(line));
}

export const appLogger = {
  debug: (msg: string, meta?: unknown) => emit("debug", msg, meta),
  info: (msg: string, meta?: unknown) => emit("info", msg, meta),
  warn: (msg: string, meta?: unknown) => emit("warn", msg, meta),
  error: (msg: string, meta?: unknown) => emit("error", msg, meta),
};
