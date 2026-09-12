import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { PortfolioServicesDashboard } from "@/components/admin/PortfolioServicesDashboard";
import { PortfolioPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { listPortfolioCategories } from "@/lib/portfolio/repository";
import { isPortfolioConnectionError } from "@/lib/portfolio/schema";
import type { PortfolioCategorySummary } from "@/lib/portfolio/types";

export const dynamic = "force-dynamic";

export default function PortfoliosPage() {
  return (
    <Suspense fallback={<PortfolioPageSkeleton />}>
      <PortfoliosPageContent />
    </Suspense>
  );
}

async function PortfoliosPageContent() {
  await requireAdminSession();

  let categories: PortfolioCategorySummary[] = [];
  let loadError = false;
  let errorMessage: string | undefined;

  try {
    categories = await listPortfolioCategories();
  } catch (error) {
    console.error("[smartpro:dashboard:portafolios]", error);
    loadError = true;
    errorMessage = isPortfolioConnectionError(error)
      ? "No se pudo conectar a la base de datos."
      : "No se pudo cargar el portafolio desde MySQL.";
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="portafolios"
        eyebrow="Sitio público"
        title="Portafolios"
        message={errorMessage}
      />
    );
  }

  return <PortfolioServicesDashboard categories={categories} />;
}
