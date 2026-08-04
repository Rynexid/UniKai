"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DmButtonProps {
  /** Target userId untuk DM. */
  targetUserId: string;
}

export default function DmButton({ targetUserId }: DmButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dms/with/${targetUserId}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) return;
      const data = (await res.json()) as { roomId: string };
      router.push(`/messages/${data.roomId}`);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={loading}
      onClick={() => void handleClick()}
    >
      <Send className="h-4 w-4" />
      Kirim Pesan
    </Button>
  );
}
