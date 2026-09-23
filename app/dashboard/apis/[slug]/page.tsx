import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";

import { ApiConnectionDetail } from "@/components/admin/ApiConnectionsView";
import { requireAdminSession } from "@/lib/auth";
import { getPrismaClient } from "@/lib/db";
import { listApiClients } from "@/lib/api/v1/repository";
import { inspectApiConnection } from "@/lib/api/v1/site-health";

export const dynamic = "force-dynamic";

type ApiConnectionPageProps = {
  params: Promise<{ slug: string }>;
};

export default function ApiConnectionPage({ params }: ApiConnectionPageProps) {
  return (
    <Suspense fallback={<p className="text-sm text-muted">Comprobando la conexión...</p>}>
      <ApiConnectionPageContent params={params} />
    </Suspense>
  );
}

async function ApiConnectionPageContent({ params }: ApiConnectionPageProps) {
  const session = await requireAdminSession();

  if (session.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { slug } = await params;
  const client = (await listApiClients()).find((item) => item.slug === slug);

  if (!client) {
    notFound();
  }

  const prisma = getPrismaClient();
  const [report, services, logs] = await Promise.all([
    inspectApiConnection(client),
    prisma && client.allowedServiceIds.length
      ? prisma.serviceCategory.findMany({
          where: { id: { in: client.allowedServiceIds } },
          select: { name: true, slug: true },
        })
      : Promise.resolve([]),
    prisma
      ? prisma.apiRequestLog.findMany({
          where: { apiClientId: client.id },
          orderBy: { createdAt: "desc" },
          take: 8,
          select: { id: true, method: true, path: true, status: true, errorCode: true, createdAt: true },
        })
      : Promise.resolve([]),
  ]);

  return (
    <ApiConnectionDetail
      client={client}
      report={report}
      services={services}
      logs={logs.map((log) => ({ ...log, createdAt: log.createdAt.toISOString() }))}
    />
  );
}
