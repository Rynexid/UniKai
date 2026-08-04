"use client";

import { useEffect, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { MarkdownEditor } from "@/components/ui/markdown-editor";

interface CreateThreadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categorySlug?: string;
  onCreated: () => void;
}

export default function CreateThreadDialog({
  open,
  onOpenChange,
  categorySlug,
  onCreated,
}: CreateThreadDialogProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitProgress, setSubmitProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setTitle("");
      setContent("");
      setErrorMessage(null);
      setSubmitProgress(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startProgress = () => {
    setSubmitProgress(0);
    timerRef.current = setInterval(() => {
      setSubmitProgress((p) => Math.min(90, p + 7));
    }, 160);
  };

  const stopProgress = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleSubmit = async () => {
    if (title.trim().length < 5 || content.trim().length < 10) {
      setErrorMessage("Judul minimal 5 karakter, isi minimal 10 karakter.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);
    startProgress();

    try {
      const res = await fetch("/api/discussions/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          content,
          categorySlug,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal membuat thread.",
        );
      }

      setSubmitProgress(100);
      onCreated();
    } catch (e) {
      stopProgress();
      setErrorMessage(e instanceof Error ? e.message : "Terjadi kesalahan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Buat Thread Baru</DialogTitle>
          <DialogDescription>
            Mulai diskusi baru. Pastikan judul jelas dan sesuai kategori yang dipilih.
            Konten mendukung Markdown.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label htmlFor="thread-title">Judul</Label>
            <Input
              id="thread-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Judul thread"
              maxLength={150}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="thread-content">Isi</Label>
            <MarkdownEditor
              id="thread-content"
              value={content}
              onChange={setContent}
              placeholder="Tulis isi diskusi di sini... Dukung **Markdown**."
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-destructive">{errorMessage}</p>
          )}
        </div>

        <DialogFooter className="flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            {isSubmitting && (
              <span className="text-xs text-muted-foreground">
                Mengirim {submitProgress}%
              </span>
            )}
            {isSubmitting && <Progress value={submitProgress} className="w-36" />}
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              disabled={isSubmitting}
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button disabled={isSubmitting} onClick={handleSubmit}>
              {isSubmitting ? "Mengirim..." : "Kirim"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
