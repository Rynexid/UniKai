import type { Context } from "hono";
import { AppError } from "../types/errors";
import { appLogger } from "../infrastructure/logger";

/**
 * Handler error global Hono: error dari layer features (AppError) diterjemahkan
 * ke respons JSON, sementara error tak dikenal dilaporkan via logger.
 */
export default function errorHandler(err: unknown, c: Context): Response {
  if (err instanceof AppError) {
    return c.json({ error: err.message }, err.status);
  }
  appLogger.error("Unhandled error", err);
  return c.json({ error: "Internal Server Error" }, 500);
}
