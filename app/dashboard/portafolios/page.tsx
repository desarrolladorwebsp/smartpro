import { Suspense } from "react";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { PortfolioServicesDashboard } from "@/components/admin/PortfolioServicesDashboard";
import { PortfolioPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { listPortfolioCategories } from "@/lib/portfolio/repository";
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

  try {
    categories = await listPortfolioCategories();
  } catch (error) {
    console.error("[smartpro:dashboard:portafolios]", error);
    loadError = true;
  }

  if (loadError) {
    return (
      <DashboardDataError
        icon="portafolios"
        eyebrow="Sitio público"
        title="Portafolios"
      />
    );
  }

  return <PortfolioServicesDashboard categories={categories} />;
}
