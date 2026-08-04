"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  Image as ImageIcon,
  Loader2,
  Search,
  Send,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useChannelEvent } from "@/lib/realtime/hooks";
import { usePresenceWithUpdates } from "@/lib/realtime/hooks";
import { DM_CHANNEL, PRESENCE_DM_CHANNEL } from "@/server/lib/ably/channels";
import { EVENTS } from "@/server/lib/ably/events";
import type {
  DmMessageCreatedPayload,
  DmReadPayload,
} from "@/server/lib/ably/types";
import type { DmMessage } from "@/features/dms/queries";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface DmProfile {
  id: string;
  name: string;
  image: string | null;
  username: string | null;
}

interface DmChatProps {
  roomId: string;
  messages: DmMessage[];
  peerUser: DmProfile;
  currentUserId: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function DmChat({
  roomId,
  messages: initialMessages,
  peerUser,
  currentUserId,
}: DmChatProps) {
  const [messages, setMessages] = useState<DmMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [peerLastReadAt, setPeerLastReadAt] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<DmMessage[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Mark as read on mount
  useEffect(() => {
    fetch(`/api/dms/${roomId}/read`, {
      method: "POST",
      credentials: "include",
    });
  }, [roomId]);

  // Focus search input when opened
  useEffect(() => {
    if (showSearch) searchInputRef.current?.focus();
  }, [showSearch]);

  // Realtime: incoming messages
  const channel = DM_CHANNEL(roomId);
  useChannelEvent(channel, EVENTS.dm.messageCreated, (msg) => {
    const data = msg.data as DmMessageCreatedPayload;
    if (!data?.message?.id) return;
    setMessages((prev) => {
      if (prev.some((m) => m.id === data.message.id)) return prev;
      return [
        ...prev,
        {
          id: data.message.id,
          roomId,
          content: data.message.content,
          imageUrl: data.message.imageUrl ?? null,
          senderId: data.message.sender.id,
          createdAt: data.message.createdAt,
          sender: {
            ...data.message.sender,
            username: data.message.sender.username ?? null,
          },
        },
      ];
    });
    // Mark read when new message arrives from peer
    if (data.message.sender.id !== currentUserId) {
      fetch(`/api/dms/${roomId}/read`, {
        method: "POST",
        credentials: "include",
      });
    }
  });

  // Realtime: read receipts
  useChannelEvent(channel, EVENTS.dm.read, (msg) => {
    const data = msg.data as DmReadPayload;
    if (!data?.readAt) return;
    setPeerLastReadAt(data.readAt);
  });

  // Presence: typing indicator
  const presenceChannel = PRESENCE_DM_CHANNEL(roomId);
  const members = usePresenceWithUpdates(presenceChannel, {
    typing: isTyping,
    at: Date.now(),
  });

  // Check if peer is typing
  const peerTyping = useCallback(() => {
    for (const [clientId, data] of members.entries()) {
      if (clientId !== currentUserId && (data as { typing?: boolean })?.typing) {
        return true;
      }
    }
    return false;
  }, [members, currentUserId]);

  const peerIsTyping = peerTyping();

  const handleInput = (value: string) => {
    setInput(value);
    setIsTyping(true);

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 3000);
  };

  // Image upload
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Ukuran file maksimal 5MB.");
      return;
    }
    const allowed = ["image/png", "image/jpeg", "image/webp", "image/gif"];
    if (!allowed.includes(file.type)) {
      alert("Tipe file tidak didukung (PNG/JPG/WebP/GIF).");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload gagal");
      const { url } = (await res.json()) as { url: string };
      setImagePreview(url);
    } catch {
      alert("Gagal mengunggah gambar.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const removeImagePreview = () => {
    setImagePreview(null);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if ((!text && !imagePreview) || sending) return;

    const body: { content?: string; imageUrl?: string } = {};
    if (text) body.content = text;
    if (imagePreview) body.imageUrl = imagePreview;

    setInput("");
    setImagePreview(null);
    setIsTyping(false);
    setSending(true);

    try {
      const res = await fetch(`/api/dms/${roomId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        setInput(text);
        if (imagePreview) setImagePreview(imagePreview);
        return;
      }
      const msg = (await res.json()) as DmMessage;
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    } catch {
      setInput(text);
      if (imagePreview) setImagePreview(imagePreview);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  // Search messages
  const handleSearch = async () => {
    const q = searchQuery.trim();
    if (q.length < 2 || searching) return;
    setSearching(true);
    try {
      const res = await fetch(
        `/api/dms/${roomId}/search?q=${encodeURIComponent(q)}`,
        { credentials: "include" },
      );
      if (!res.ok) {
        setSearchResults([]);
        return;
      }
      const { messages: results } = (await res.json()) as { messages: DmMessage[] };
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Read receipt helper
  const getReadStatus = (msg: DmMessage) => {
    if (msg.senderId !== currentUserId) return null;
    if (!peerLastReadAt) return "delivered";
    return new Date(msg.createdAt) <= new Date(peerLastReadAt) ? "seen" : "delivered";
  };

  return (
    <div className="flex h-[calc(100dvh-4rem)] flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon" render={<Link href="/messages" />}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-8 w-8">
          {peerUser.image ? (
            <AvatarImage src={peerUser.image} alt={peerUser.name} />
          ) : (
            <AvatarFallback className="text-sm">
              {peerUser.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{peerUser.name}</p>
          {peerIsTyping && (
            <p className="text-xs text-muted-foreground animate-pulse">
              sedang mengetik…
            </p>
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setShowSearch(!showSearch);
            if (showSearch) {
              setSearchQuery("");
              setSearchResults(null);
            }
          }}
        >
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="border-b border-border/40 bg-background/80 px-4 py-2 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-center gap-2">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleSearch();
              }}
              placeholder="Cari pesan…"
              className="flex-1 rounded-full border border-border/40 bg-background px-4 py-2 text-sm outline-none transition-colors focus:border-primary/50"
            />
            <Button size="icon" variant="ghost" onClick={() => void handleSearch()} disabled={searching}>
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
          {searchResults !== null && (
            <p className="mt-1 text-center text-xs text-muted-foreground">
              {searchResults.length === 0
                ? "Tidak ada hasil"
                : `${searchResults.length} hasil ditemukan`}
            </p>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-2xl space-y-3">
          {(searchResults ?? messages).map((msg) => {
            const isMe = msg.senderId === currentUserId;
            const readStatus = searchResults ? null : getReadStatus(msg);
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    isMe
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {msg.imageUrl && (
                    <img
                      src={msg.imageUrl}
                      alt="Lampiran"
                      className="mb-2 max-h-60 w-full rounded-xl object-cover"
                    />
                  )}
                  {msg.content && (
                    <p className="break-words whitespace-pre-wrap">{msg.content}</p>
                  )}
                  <div
                    className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${
                      isMe ? "text-primary-foreground/60" : "text-muted-foreground/60"
                    }`}
                  >
                    <span>
                      {new Date(msg.createdAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {readStatus === "seen" && (
                      <CheckCheck className="h-3 w-3 text-blue-300" />
                    )}
                    {readStatus === "delivered" && (
                      <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Image preview */}
      {imagePreview && (
        <div className="border-t border-border/40 bg-background/80 px-4 pt-3 backdrop-blur-md">
          <div className="mx-auto max-w-2xl relative inline-block">
            <img
              src={imagePreview}
              alt="Pratinjau"
              className="h-20 rounded-lg object-cover"
            />
            <button
              onClick={removeImagePreview}
              className="absolute -top-2 -right-2 rounded-full bg-muted p-0.5 text-foreground shadow-sm hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-border/40 bg-background/80 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="hidden"
            onChange={void handleFileSelect}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-10 w-10 shrink-0 rounded-full"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ImageIcon className="h-4 w-4" />
            )}
          </Button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void sendMessage();
              }
            }}
            placeholder="Ketik pesan…"
            className="flex-1 rounded-full border border-border/40 bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary/50"
            maxLength={2000}
          />
          <Button
            size="icon"
            disabled={(!input.trim() && !imagePreview) || sending}
            onClick={() => void sendMessage()}
            className="h-10 w-10 rounded-full"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
