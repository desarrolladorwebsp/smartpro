import { Suspense } from "react";
import { notFound } from "next/navigation";

import { DashboardDataError } from "@/components/admin/DashboardDataError";
import { PortfolioProjectsDashboard } from "@/components/admin/PortfolioProjectsDashboard";
import { PortfolioPageSkeleton } from "@/components/admin/dashboard-skeletons";
import { requireAdminSession } from "@/lib/auth";
import { getPortfolioCategoryBySlug, listPortfolioProjects } from "@/lib/portfolio/repository";
import type { PortfolioCategorySummary, PortfolioProjectRecord } from "@/lib/portfolio/types";

export const dynamic = "force-dynamic";

type PortfolioCategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export default function PortfolioCategoryPage({ params }: PortfolioCategoryPageProps) {
  return (
    <Suspense fallback={<PortfolioPageSkeleton />}>
      <PortfolioCategoryPageContent params={params} />
    </Suspense>
  );
}

async function PortfolioCategoryPageContent({ params }: PortfolioCategoryPageProps) {
  await requireAdminSession();
  const { slug } = await params;

  let category: PortfolioCategorySummary | null = null;
  let projects: PortfolioProjectRecord[] = [];
  let loadError = false;

  try {
    category = await getPortfolioCategoryBySlug(slug);
    projects = await listPortfolioProjects({ categorySlug: slug, status: "ALL" });
  } catch (error) {
    console.error("[smartpro:dashboard:portafolios:category]", error);
    if (error instanceof Error && error.message.includes("no existe")) {
      notFound();
    }
    loadError = true;
  }

  if (loadError || !category) {
    return (
      <DashboardDataError
        icon="portafolios"
        eyebrow="Portafolio"
        title="Proyectos"
      />
    );
  }

  return <PortfolioProjectsDashboard category={category} initialProjects={projects} />;
}
