import type { ReactNode } from "react";
import { requireServerRole } from "@/features/auth/server-guard";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireServerRole("admin");
  return <>{children}</>;
}
