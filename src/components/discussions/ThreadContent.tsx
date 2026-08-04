import { parseMarkdown } from "@/lib/markdown";

export default function ThreadContent({ content }: { content: string }) {
  return (
    <div
      className="prose prose-sm dark:prose-invert max-w-none space-y-3 break-words"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
}
