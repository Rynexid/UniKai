import type { ThreadComment } from "@/types";

export function countAllComments(comments: ThreadComment[]): number {
  return comments.reduce((n, c) => n + 1 + countAllComments(c.replies), 0);
}
