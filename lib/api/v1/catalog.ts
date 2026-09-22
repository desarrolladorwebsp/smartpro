import { getPublicCatalogTree, getServicePlanById, listServiceCategories } from "../../services/repository";
import type { CatalogTree, ServicePlanRecord } from "../../services/types";
import { ApiError } from "./errors";
import type { ApiClientRecord } from "./types";

export function isServiceInScope(client: ApiClientRecord, serviceId: string): boolean {
  if (!client.allowedServiceIds.length) {
    return true;
  }

  return client.allowedServiceIds.includes(serviceId);
}

export function filterTreeForClient(tree: CatalogTree, client: ApiClientRecord): CatalogTree {
  return tree.filter((service) => isServiceInScope(client, service.id));
}

export async function getScopedCatalogTree(client: ApiClientRecord): Promise<CatalogTree> {
  return filterTreeForClient(await getPublicCatalogTree(), client);
}

export async function getScopedService(client: ApiClientRecord, slug: string) {
  const normalized = String(slug ?? "").trim().toLowerCase();

  if (!normalized) {
    throw new ApiError("invalid_request", "Falta el identificador del servicio.");
  }

  const tree = await getScopedCatalogTree(client);
  const service = tree.find((entry) => entry.slug === normalized);

  if (!service) {
    throw new ApiError("resource_not_found", "El servicio no existe o no está disponible para esta credencial.");
  }

  return service;
}

export async function listScopedPlans(
  client: ApiClientRecord,
  filters: { serviceSlug?: string | null; categorySlug?: string | null } = {},
): Promise<ServicePlanRecord[]> {
  const tree = await getScopedCatalogTree(client);
  const serviceSlug = filters.serviceSlug?.trim().toLowerCase();
  const categorySlug = filters.categorySlug?.trim().toLowerCase();

  return tree
    .filter((service) => !serviceSlug || service.slug === serviceSlug)
    .flatMap((service) =>
      service.subcategories
        .filter((category) => !categorySlug || category.slug === categorySlug)
        .flatMap((category) => category.plans),
    );
}

/// Un plan solo es utilizable por una credencial si pertenece a un servicio
/// dentro de su alcance y está activo en el catálogo.
export async function getScopedPlan(client: ApiClientRecord, planId: string): Promise<ServicePlanRecord> {
  const id = String(planId ?? "").trim();

  if (!id) {
    throw new ApiError("invalid_request", "Falta el identificador del plan.");
  }

  const plan = await getServicePlanById(id);

  if (!plan || plan.status !== "ACTIVE") {
    throw new ApiError("resource_not_found", `El plan "${id}" no existe o no está activo.`);
  }

  if (!isServiceInScope(client, plan.categoryId)) {
    throw new ApiError("insufficient_scope", `El plan "${id}" pertenece a un servicio fuera del alcance de esta credencial.`);
  }

  return plan;
}

export async function listScopedServiceSummaries(client: ApiClientRecord) {
  const categories = await listServiceCategories();

  return categories
    .filter((category) => category.status === "ACTIVE" && isServiceInScope(client, category.id))
    .map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      coverImage: category.coverImage,
      sortOrder: category.sortOrder,
    }));
}
