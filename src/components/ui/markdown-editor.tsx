"use client";

import { useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { parseMarkdown } from "@/lib/markdown";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  minHeight = "min-h-40",
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="overflow-hidden rounded-lg border border-input bg-background transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50">
      <div className="flex items-center gap-1 border-b border-border/60 bg-muted/40 px-2 py-1.5">
        <button
          type="button"
          onClick={() => setMode("write")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            mode === "write"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Pencil className="h-3 w-3" />
          Tulis
        </button>
        <button
          type="button"
          onClick={() => setMode("preview")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors",
            mode === "preview"
              ? "bg-background text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Eye className="h-3 w-3" />
          Pratinjau
        </button>
      </div>

      {mode === "write" ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "min-h-16 rounded-none border-0 shadow-none focus-visible:ring-0 dark:bg-transparent",
            minHeight,
          )}
        />
      ) : (
        <div
          className={cn(
            "prose prose-sm dark:prose-invert max-w-none break-words px-3 py-2.5 text-sm",
            minHeight,
          )}
          dangerouslySetInnerHTML={{ __html: parseMarkdown(value) }}
        />
      )}
    </div>
  );
}
