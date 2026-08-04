import type { ReactNode } from "react";
import SiteNav from "@/components/layout/SiteNav";
import SiteFooter from "@/components/layout/SiteFooter";
import SiteSidebar from "@/components/layout/SiteSidebar";
import SiteBottomNav from "@/components/layout/SiteBottomNav";
import RealtimeSync from "@/components/RealtimeSync";

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteNav />
      <RealtimeSync />
      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-6 px-4 xl:max-w-7xl">
        <SiteSidebar />
        <main className="min-w-0 flex-1 pb-20 lg:pb-8">{children}</main>
      </div>
      <SiteFooter />
      <SiteBottomNav />
    </div>
  );
}
