import { listPortfolioProjects } from "../../portfolio/repository";
import type { PortfolioProjectRecord } from "../../portfolio/types";
import { getScopedService, listScopedServiceSummaries } from "./catalog";
import type { ApiClientRecord } from "./types";

export const MAX_PORTFOLIO_SERVICES = 10;

/// Lista los proyectos publicados de los servicios dentro del alcance de la
/// credencial. Sin filtro explícito recorre todos sus servicios.
export async function listScopedPortfolioProjects(
  client: ApiClientRecord,
  filters: { serviceSlug?: string | null } = {},
): Promise<PortfolioProjectRecord[]> {
  const requested = filters.serviceSlug?.trim().toLowerCase();

  if (requested) {
    const service = await getScopedService(client, requested);
    return listPortfolioProjects({ categorySlug: service.slug, status: "PUBLISHED" });
  }

  const services = (await listScopedServiceSummaries(client)).slice(0, MAX_PORTFOLIO_SERVICES);
  const results = await Promise.all(
    services.map((service) => listPortfolioProjects({ categorySlug: service.slug, status: "PUBLISHED" })),
  );

  return results.flat().sort((a, b) => a.sortOrder - b.sortOrder);
}
