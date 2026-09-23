import { Suspense } from "react";
import { redirect } from "next/navigation";

import { ApiConnectionsList, type ApiConnectionItem } from "@/components/admin/ApiConnectionsView";
import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { requireAdminSession } from "@/lib/auth";
import { listApiClients } from "@/lib/api/v1/repository";
import { inspectApiConnection } from "@/lib/api/v1/site-health";

export const dynamic = "force-dynamic";

export default function ApisPage() {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Comprobando las conexiones...</p>}>
      <ApisPageContent />
    </Suspense>
  );
}

async function ApisPageContent() {
  const session = await requireAdminSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  try {
    const clients = await listApiClients();
    const items: ApiConnectionItem[] = await Promise.all(
      clients.map(async (client) => ({
        client,
        report: await inspectApiConnection(client),
      })),
    );

    return <ApiConnectionsList items={items} />;
  } catch (error) {
    console.error("[smartpro:dashboard:apis]", error);

    return <DashboardDataError icon="apis" eyebrow="Conexiones" title="APIs" />;
  }
}
