import { getAbly, isAblyConfigured } from "./client";
import { PUBLIC_CHANNEL_CAPABILITIES, type CapabilityOp } from "./channels";
import { config } from "../../../config";
import type { TokenRequest } from "ably";

/**
 * Autentikasi token Ably untuk browser.
 * Endpoint /api/ably/token memanggil fungsi ini; SDK client auto-renew
 * sebelum token kedaluwarsa. API key tidak pernah terekspos.
 */

/** Kapabilitas token: subscribe channel publik + channel pribadi milik user. */
export function buildClientCapability(
  clientId: string | null,
): Record<string, CapabilityOp[]> {
  const capability: Record<string, CapabilityOp[]> = {
    ...PUBLIC_CHANNEL_CAPABILITIES,
  };
  if (clientId) {
    capability[`user:${clientId}`] = ["subscribe"];
    capability[`notification:${clientId}`] = ["subscribe"];
  }
  return capability;
}

export interface AblyTokenRequestOptions {
  /** clientId sesi (userId) atau null untuk anonim. */
  clientId: string | null;
  ttlMs?: number;
}

/**
 * Buat TokenRequest Ably yang ditandatangani server.
 * Anonim diberi clientId acak agar presence (mis. "sedang melihat thread")
 * tetap berfungsi tanpa login — Ably butuh identified client untuk presence.
 */
export async function createAblyTokenRequest(
  options: AblyTokenRequestOptions,
): Promise<TokenRequest | null> {
  if (!isAblyConfigured()) return null;
  const clientId = options.clientId ?? `anon-${cryptoRandomId()}`;
  const ably = getAbly();
  return ably.auth.createTokenRequest({
    clientId,
    ttl: options.ttlMs ?? config.ably.tokenTtlMs,
    capability: buildClientCapability(options.clientId),
  });
}

function cryptoRandomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}
