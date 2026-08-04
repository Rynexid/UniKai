import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getSession } from "@/features/auth/session";
import { getDmMessages, getDmPeerUserId } from "@/features/dms/queries";
import { getUserProfile } from "@/features/users/queries";
import DmChat from "@/components/dms/DmChat";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ roomId: string }>;
}): Promise<Metadata> {
  try {
    const { roomId } = await params;
    const headerList = await headers();
    const session = await getSession(headerList);
    if (!session) return { title: "Pesan · UniKai" };

    const peerId = await getDmPeerUserId(roomId, session.user.id);
    if (!peerId) return { title: "Pesan · UniKai" };
    const peer = await getUserProfile(peerId);
    return { title: `Pesan dengan ${peer.name} · UniKai` };
  } catch {
    return { title: "Pesan · UniKai" };
  }
}

export default async function DmRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = await params;
  const headerList = await headers();
  const session = await getSession(headerList);
  if (!session) redirect("/login?redirect=/messages");

  const peerId = await getDmPeerUserId(roomId, session.user.id);
  if (!peerId) redirect("/messages");

  const [messages, peerProfile] = await Promise.all([
    getDmMessages(roomId, session.user.id),
    getUserProfile(peerId),
  ]);

  return (
    <DmChat
      roomId={roomId}
      messages={messages}
      currentUserId={session.user.id}
      peerUser={{
        id: peerProfile.id,
        name: peerProfile.name,
        image: peerProfile.image,
        username: peerProfile.username,
      }}
    />
  );
}
