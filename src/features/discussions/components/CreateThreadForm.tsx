"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MarkdownEditor } from "@/components/ui/markdown-editor";
import { TagsInput } from "@/components/ui/tags-input";
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentGroup,
  AttachmentMedia,
  AttachmentTitle,
} from "@/components/ui/attachment";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Edit3,
  FileImage,
  List as ListIcon,
  Loader2,
  Send,
  Sparkles,
  X,
} from "lucide-react";

interface CategoryOption {
  id: string;
  name: string;
  slug: string;
  threadCount: number;
}

interface PendingAttachment {
  id: string;
  name: string;
  size: number;
  state: "uploading" | "error" | "done";
  url: string | null;
  previewUrl: string | null;
  fileBlob: File;
}

const TAG_MAX = 5;
const LABEL_PRESETS = ["Official", "Verified", "Solved", "Featured", "Hot", "Important"];
const DRAFT_KEY = "unikai:create-draft";
const FALLBACK_TAG_SUGGESTIONS = [
  "vue", "typescript", "react", "rust", "docker", "anime", "gaming", "ai", "design", "linux",
];

export default function CreateThreadForm() {
  const router = useRouter();

  const [communities, setCommunities] = useState<CategoryOption[]>([]);
  const [communityLoading, setCommunityLoading] = useState(true);
  const [communityError, setCommunityError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [communitySlug, setCommunitySlug] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const [tagSuggestions, setTagSuggestions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const anyUploading = attachments.some((a) => a.state === "uploading");

  const titleRules = useMemo(() => {
    const v = title.length;
    if (v < 10) return { valid: false, msg: `Judul minimal 10 karakter (saat ini ${v})` };
    if (v > 150) return { valid: false, msg: "Judul maksimal 150 karakter" };
    return { valid: true, msg: "" };
  }, [title]);

  const contentRules = useMemo(() => {
    const v = content.trim().length;
    return v < 10 ? { valid: false, msg: "Konten minimal 10 karakter" } : { valid: true, msg: "" };
  }, [content]);

  const canPublish = titleRules.valid && contentRules.valid && !isPublishing && !anyUploading;

  useEffect(() => {
    let cancelled = false;

    const loadCommunities = async () => {
      setCommunityLoading(true);
      setCommunityError(null);
      try {
        const res = await fetch("/api/communities", { credentials: "include" });
        if (!res.ok) throw new Error("Gagal memuat komunitas");
        const data = (await res.json()) as CategoryOption[];
        if (!cancelled) setCommunities(data);
      } catch (e) {
        if (!cancelled)
          setCommunityError(e instanceof Error ? e.message : "Gagal memuat komunitas");
      } finally {
        if (!cancelled) setCommunityLoading(false);
      }
    };

    const loadTagSuggestions = async () => {
      try {
        const res = await fetch("/api/tags", { credentials: "include" });
        if (!res.ok) throw new Error("no api");
        const data = (await res.json()) as { name: string }[];
        if (!cancelled) setTagSuggestions(data.map((t) => t.name));
      } catch {
        if (!cancelled) setTagSuggestions(FALLBACK_TAG_SUGGESTIONS);
      }
    };

    const restoreDraft = () => {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      try {
        const data = JSON.parse(raw) as Partial<{
          title: string;
          content: string;
          communitySlug: string;
          tags: string[];
          labels: string[];
        }>;
        setTitle(data.title ?? "");
        setContent(data.content ?? "");
        setCommunitySlug(data.communitySlug ?? "");
        setTags(data.tags ?? []);
        setLabels(data.labels ?? []);
      } catch {
        /* draft korup - abaikan */
      }
    };

    restoreDraft();
    void loadCommunities();
    void loadTagSuggestions();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, content, communitySlug, tags, labels }),
      );
    }, 300);
    return () => window.clearTimeout(id);
  }, [title, content, communitySlug, tags, labels]);

  const flashSaved = () => {
    setIsSaved(true);
    window.setTimeout(() => setIsSaved(false), 2000);
  };

  const clearDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    setTitle("");
    setContent("");
    setCommunitySlug("");
    setTags([]);
    setLabels([]);
  };

  const uploadAttachment = async (att: PendingAttachment) => {
    const form = new FormData();
    form.append("file", att.fileBlob);

    try {
      const res = await fetch("/api/uploads", {
        method: "POST",
        credentials: "include",
        body: form,
      });
      const data = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;

      if (!res.ok || !data?.url) {
        throw new Error(typeof data?.error === "string" ? data.error : "Gagal mengunggah");
      }

      setAttachments((prev) =>
        prev.map((a) =>
          a.id === att.id ? { ...a, state: "done", url: data.url ?? null } : a,
        ),
      );
    } catch {
      setAttachments((prev) =>
        prev.map((a) => (a.id === att.id ? { ...a, state: "error" } : a)),
      );
    }
  };

  const handleFilesSelected = (files: FileList | null) => {
    if (!files?.length) return;
    const next: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const att: PendingAttachment = {
        id: `${file.name}-${file.lastModified}-${Math.random().toString(36).slice(2, 8)}`,
        name: file.name,
        size: file.size,
        state: "uploading",
        url: null,
        previewUrl: URL.createObjectURL(file),
        fileBlob: file,
      };
      next.push(att);
      void uploadAttachment(att);
    }
    setAttachments((prev) => [...prev, ...next]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeAttachment = async (att: PendingAttachment) => {
    if (att.previewUrl) URL.revokeObjectURL(att.previewUrl);
    setAttachments((prev) => prev.filter((a) => a.id !== att.id));
    if (att.url) {
      const name = att.url.split("/").pop();
      if (name) {
        fetch(`/api/uploads/${name}`, {
          method: "DELETE",
          credentials: "include",
        }).catch(() => {});
      }
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const validate = (): boolean => {
    const next: Record<string, string | undefined> = {};
    let ok = true;
    if (!titleRules.valid) {
      next.title = titleRules.msg;
      ok = false;
    }
    if (!contentRules.valid) {
      next.content = contentRules.msg;
      ok = false;
    }
    if (!communitySlug) {
      next.communitySlug = "Pilih komunitas";
      ok = false;
    }
    setErrors(next);
    return ok;
  };

  const publish = async () => {
    if (!validate()) return;
    setIsPublishing(true);

    const imageMarkdown = attachments
      .filter((a) => a.state === "done" && a.url)
      .map((a) => `![${a.name.replace(/[[\]]/g, "")}](${a.url})`)
      .join("\n");
    const finalContent =
      content.trim() && imageMarkdown ? `${content.trim()}\n\n${imageMarkdown}` : content;

    try {
      const res = await fetch("/api/discussions/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: title.trim(),
          content: finalContent,
          categorySlug: communitySlug,
          tags,
        }),
      });

      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        throw new Error(
          typeof data?.error === "string" ? data.error : "Gagal memublikasikan diskusi",
        );
      }

      const created = (await res.json()) as { slug: string };
      clearDraft();
      router.push(`/thread/${created.slug}`);
    } catch (e) {
      setErrors((prev) => ({
        ...prev,
        submit: e instanceof Error ? e.message : "Gagal memublikasikan diskusi",
      }));
    } finally {
      setIsPublishing(false);
    }
  };

  const selectedCommunity = communities.find((c) => c.slug === communitySlug);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 lg:max-w-3xl">
      <header className="mb-8 flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Edit3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight">
              Buat Diskusi Baru
            </h1>
            <p className="text-sm text-muted-foreground">
              Bagikan pertanyaan, pandangan, atau temuan dengan komunitas.
            </p>
          </div>
        </div>
      </header>

      <form
        className="space-y-8"
        onSubmit={(e) => {
          e.preventDefault();
          void publish();
        }}
      >
        <div className="space-y-2">
          <Label>
            Judul <span className="text-destructive">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Cara mengoptimalkan performa React.js?"
            maxLength={150}
            aria-invalid={!!errors.title}
          />
          <p
            className={cn(
              "text-xs",
              !titleRules.valid ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {title.length}/150 — {titleRules.msg || "OK"}
          </p>
          {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
        </div>

        <div className="space-y-2">
          <Label>
            Komunitas <span className="text-destructive">*</span>
          </Label>
          {selectedCommunity && (
            <button
              type="button"
              onClick={() => setCommunitySlug("")}
              className="mb-2 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Hapus pilihan
            </button>
          )}
          {communityLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ListIcon className="h-4 w-4 animate-pulse" /> Memuat komunitas…
            </div>
          ) : communityError ? (
            <p className="text-sm text-destructive">{communityError}</p>
          ) : communities.length ? (
            <div className="flex flex-wrap gap-2">
              {communities.map((c) => {
                const active = communitySlug === c.slug;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => {
                      setCommunitySlug(c.slug);
                      setErrors((prev) => ({ ...prev, communitySlug: undefined }));
                    }}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left transition-colors",
                      active
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border bg-card hover:bg-accent",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium">{c.name}</span>
                      {active && <CheckCircle className="h-4 w-4" />}
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {c.threadCount} diskusi
                    </p>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Belum ada komunitas tersedia.</p>
          )}
          {errors.communitySlug && (
            <p className="text-sm text-destructive">{errors.communitySlug}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>
            Konten <span className="text-destructive">*</span>
          </Label>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            placeholder="Tulis dengan Markdown… #heading, **bold**, - list, ```code```"
          />
          {errors.content && <p className="text-sm text-destructive">{errors.content}</p>}

          {attachments.length > 0 && (
            <AttachmentGroup className="mt-2">
              {attachments.map((att) => (
                <Attachment
                  key={att.id}
                  state={att.state}
                  size="sm"
                  orientation="horizontal"
                >
                  <AttachmentMedia variant="image">
                    {att.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={att.previewUrl}
                        alt={att.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <FileImage className="size-4" />
                    )}
                  </AttachmentMedia>
                  <AttachmentContent>
                    <AttachmentTitle>{att.name}</AttachmentTitle>
                    <AttachmentDescription>
                      {att.state === "uploading" && (
                        <span className="inline-flex items-center gap-1.5">
                          <Loader2 className="size-3 animate-spin" />
                          Mengunggah…
                        </span>
                      )}
                      {att.state === "error" && "Gagal mengunggah, coba lagi"}
                      {att.state === "done" && formatBytes(att.size)}
                    </AttachmentDescription>
                  </AttachmentContent>
                  <AttachmentActions>
                    <AttachmentAction
                      aria-label={`Hapus ${att.name}`}
                      onClick={() => void removeAttachment(att)}
                    >
                      <X />
                    </AttachmentAction>
                  </AttachmentActions>
                </Attachment>
              ))}
            </AttachmentGroup>
          )}

          <div className="flex items-center gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileImage className="h-4 w-4" />
              Tambah Gambar
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => handleFilesSelected(e.target.files)}
            />
            <p className="text-xs text-muted-foreground">
              PNG/JPG/WebP/GIF, maks 5MB per file
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Tag (opsional, maks {TAG_MAX})</Label>
          <TagsInput
            value={tags}
            onChange={setTags}
            placeholder="Ketik & tekan Enter/spasi…"
            max={TAG_MAX}
            suggestions={tagSuggestions}
          />
          <p className="text-xs text-muted-foreground">
            {tags.length}/{TAG_MAX} tag dipilih. Saran:{" "}
            {tagSuggestions.length ? tagSuggestions.join(", ") : "belum ada saran"}
          </p>
        </div>

        <div className="space-y-2">
          <Label>Label (read-only)</Label>
          <TagsInput
            value={labels}
            onChange={setLabels}
            placeholder="Label dikelola moderator…"
            suggestions={LABEL_PRESETS}
            max={10}
            disabled
          />
          <p className="text-xs text-muted-foreground">
            Label dikelola moderator/admin. Ini hanya pratinjau; label akan diterapkan oleh
            moderator setelah review.
          </p>
        </div>

        {errors.submit && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {errors.submit}
          </div>
        )}

        <footer className="flex items-center justify-between gap-3 border-t pt-6">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span
              className={cn(
                "inline-flex items-center gap-1 font-medium transition-colors",
                isSaved ? "text-amber-500" : "",
              )}
              onClick={flashSaved}
            >
              <Sparkles className={cn("h-3 w-3", isSaved && "animate-pulse")} />
              {isSaved ? "Draft berhasil disimpan…" : "Draft disimpan otomatis"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={clearDraft}
              title="Hapus draft lokal"
            >
              <X className="h-4 w-4" />
            </Button>
            <Button type="submit" disabled={!canPublish}>
              <Send className="h-4 w-4" />
              {isPublishing ? "Menerbitkan..." : "Publikasikan"}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  );
}
