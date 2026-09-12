"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Globe } from "lucide-react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { resolveServiceCoverImage } from "@/lib/services/default-covers";
import type { PortfolioCategorySummary } from "@/lib/portfolio/types";

type PortfolioServicesDashboardProps = {
  categories: PortfolioCategorySummary[];
};

export function PortfolioServicesDashboard({ categories }: PortfolioServicesDashboardProps) {
  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="portafolios"
        eyebrow="Sitio público"
        title="Portafolios"
      />

      <p className="max-w-3xl text-sm text-muted">
        Administra los proyectos que se muestran en la sección pública. Por ahora está habilitado Desarrollo Web:
        Sitio Web, Landing Page y E-commerce.
      </p>

      {categories.length === 0 ? (
        <div className="rounded-[24px] border border-dashed border-border bg-white p-10 text-center">
          <p className="text-sm font-semibold text-foreground">Desarrollo Web no está en el catálogo</p>
          <p className="mt-2 text-sm text-muted">Siembra los servicios y vuelve a intentar.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              href={`/dashboard/portafolios/${category.slug}`}
              className="group overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)] transition hover:-translate-y-0.5 hover:border-primary/30"
            >
              <div className="relative aspect-[5/4] bg-slate-100">
                <Image
                  src={resolveServiceCoverImage(category.coverImage, category.slug, index)}
                  alt={category.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/80">Servicio</p>
                  <h2 className="mt-1 text-xl font-bold tracking-[-0.04em]">{category.name}</h2>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3 p-4">
                <div className="text-sm text-muted">
                  <span className="font-semibold text-foreground">{category.publishedCount}</span> publicados
                  <span className="mx-1.5 text-border">·</span>
                  {category.draftCount} borradores
                </div>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  Administrar
                  <ArrowRight size={16} className="transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="flex items-start gap-3 rounded-[20px] border border-border bg-white p-4 text-sm text-muted">
        <Globe size={18} className="mt-0.5 shrink-0 text-primary" />
        Solo los proyectos publicados aparecen en smartpro.cl. Los borradores y archivados quedan ocultos.
      </div>
    </div>
  );
}
