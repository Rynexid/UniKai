import { getAbly, isAblyConfigured } from "./client";

/**
 * Presence Ably bersifat ephemeral — tidak disimpan permanen.
 * Server hanya membaca agregat (mis. jumlah yang sedang melihat thread);
 * enter/leave dilakukan langsung oleh client via SDK.
 */

export interface PresenceMember {
  clientId: string;
  data: unknown;
}

/** Ambil member presence saat ini pada sebuah channel (via REST). */
export async function getPresenceMembers(
  channelName: string,
): Promise<PresenceMember[]> {
  if (!isAblyConfigured()) return [];
  try {
    const page = await getAbly().channels.get(channelName).presence.get();
    return page.items.map((m) => ({ clientId: m.clientId, data: m.data }));
  } catch {
    return [];
  }
}
