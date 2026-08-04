import Ably from "ably";
import { config } from "../../../config";

/**
 * Instance Ably server-side (Node.js SDK).
 * Hanya boleh dipakai di runtime server — API key TIDAK pernah dikirim ke browser.
 */
let serverClient: Ably.Rest | null = null;

export function isAblyConfigured(): boolean {
  return Boolean(config.ably.apiKey);
}

export function getAbly(): Ably.Rest {
  if (!config.ably.apiKey) {
    throw new Error("ABLY_API_KEY belum diset di environment.");
  }
  if (!serverClient) {
    serverClient = new Ably.Rest({ key: config.ably.apiKey });
  }
  return serverClient;
}
