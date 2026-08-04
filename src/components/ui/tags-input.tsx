"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface TagsInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  max?: number;
  suggestions?: string[];
  disabled?: boolean;
}

export function TagsInput({
  value,
  onChange,
  placeholder,
  max = 10,
  suggestions = [],
  disabled = false,
}: TagsInputProps) {
  const [draft, setDraft] = useState("");

  const addTag = (raw: string) => {
    const tag = raw.trim().toLowerCase().replace(/^#/, "");
    if (!tag || value.includes(tag) || value.length >= max || disabled) return;
    onChange([...value, tag]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === " ") {
      e.preventDefault();
      if (draft.trim()) {
        addTag(draft);
        setDraft("");
      }
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const filtered = suggestions.filter(
    (s) => !value.includes(s) && s.toLowerCase().includes(draft.toLowerCase()),
  );

  return (
    <div
      className={cn(
        "relative flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-input bg-background px-2 py-1.5 transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50",
        disabled && "opacity-60",
      )}
    >
      {value.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium text-foreground/85"
        >
          #{tag}
          {!disabled && (
            <button
              type="button"
              aria-label={`Hapus tag ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </span>
      ))}

      {!disabled && (
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (draft.trim()) addTag(draft);
            setDraft("");
          }}
          placeholder={value.length ? "" : placeholder}
          className="min-w-[120px] flex-1 bg-transparent px-1 py-0.5 text-sm outline-none placeholder:text-muted-foreground"
        />
      )}

      {draft && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 max-h-40 w-56 overflow-auto rounded-lg border border-border bg-popover p-1 shadow-lg">
          {filtered.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                addTag(s);
                setDraft("");
              }}
              className="block w-full rounded-md px-2 py-1 text-left text-xs text-foreground/85 transition-colors hover:bg-accent"
            >
              #{s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
