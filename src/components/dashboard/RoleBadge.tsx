import { cn } from "@/lib/utils";
import { ROLE_LABELS, type Role } from "@/features/auth/roles";

const roleStyles: Record<Role, string> = {
  sudo: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  admin: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
  mod: "border-sky-500/40 bg-sky-500/10 text-sky-600 dark:text-sky-400",
  warga: "border-border bg-muted text-muted-foreground",
};

export default function RoleBadge({ role }: { role: Role }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold",
        roleStyles[role],
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}
