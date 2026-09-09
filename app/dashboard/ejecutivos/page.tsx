import { Suspense } from "react";
import { redirect } from "next/navigation";

import { requireAdminSession } from "@/lib/auth";
import { ExecutivesDashboard } from "@/components/admin/ExecutivesDashboard";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { ExecutivesPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { listExecutives } from "@/lib/executives/repository";
import type { ExecutiveRecord } from "@/lib/executives/types";

export const dynamic = "force-dynamic";

export default function ExecutivesPage() {
  return (
    <Suspense fallback={<ExecutivesPageSkeleton />}>
      <ExecutivesPageContent />
    </Suspense>
  );
}

async function ExecutivesPageContent() {
  const session = await requireAdminSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let executives: ExecutiveRecord[] = [];
  let loadError = false;

  try {
    executives = await listExecutives();
  } catch (error) {
    console.error("[smartpro:dashboard:ejecutivos] Error de conexión a la base de datos", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="ejecutivos"
        eyebrow="Gestión de ejecutivos"
        title="Ejecutivos"
      />
    );
  }

  return <ExecutivesDashboard initialExecutives={executives} />;
}
