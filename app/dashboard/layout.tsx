import { Suspense } from "react";
import type { Metadata } from "next";

import { DashboardSidebar, DashboardSidebarFallback } from "@/components/admin/DashboardSidebar";
import { requireAdminSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

async function DashboardAuthenticatedSidebar() {
  const session = await requireAdminSession();
  return <DashboardSidebar adminEmail={session.email} role={session.role} />;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7f7fb_0%,_#eef0fb_100%)] text-foreground">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Suspense fallback={<DashboardSidebarFallback />}>
          <DashboardAuthenticatedSidebar />
        </Suspense>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
