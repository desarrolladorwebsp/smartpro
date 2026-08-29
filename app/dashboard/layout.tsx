import { DashboardSidebar } from "@/components/admin/DashboardSidebar";
import { requireAdminSession } from "@/lib/auth";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession();

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7f7fb_0%,_#eef0fb_100%)] text-foreground">
      <div className="flex min-h-screen">
        <DashboardSidebar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
