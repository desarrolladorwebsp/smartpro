import type {
  CatalogStatus,
  CatalogTree,
  ServiceCategoryRecord,
  ServicePlanRecord,
  ServiceSubcategoryRecord,
} from "./types";

export type CatalogView = "servicios" | "categorias" | "planes";
export type CatalogStatusFilter = CatalogStatus | "TODOS";
export type CatalogHighlightedFilter = "TODOS" | "SI" | "NO";

export const CATALOG_VIEWS: Array<{ id: CatalogView; label: string }> = [
  { id: "servicios", label: "Servicios" },
  { id: "categorias", label: "Categorías" },
  { id: "planes", label: "Planes" },
];

export type CatalogServiceRow = ServiceCategoryRecord & {
  categoryCount: number;
  planCount: number;
};

export type CatalogCategoryRow = ServiceSubcategoryRecord & {
  planCount: number;
};

export type CatalogTableFilters = {
  query?: string;
  status?: CatalogStatusFilter;
  serviceId?: string;
  categoryId?: string;
  highlighted?: CatalogHighlightedFilter;
};

export function parseCatalogView(value: string | null | undefined): CatalogView {
  if (value === "categorias" || value === "planes" || value === "servicios") {
    return value;
  }

  return "servicios";
}

export function getCatalogCreateLabel(view: CatalogView): string {
  if (view === "categorias") return "Nueva categoría";
  if (view === "planes") return "Nuevo plan";
  return "Nuevo servicio";
}

export function getCatalogSearchPlaceholder(view: CatalogView): string {
  if (view === "categorias") return "Buscar categoría o servicio";
  if (view === "planes") return "Buscar plan, servicio o categoría";
  return "Buscar servicio";
}

export function flattenCatalog(tree: CatalogTree): {
  services: CatalogServiceRow[];
  categories: CatalogCategoryRow[];
  plans: ServicePlanRecord[];
} {
  const services = tree.map((category) => {
    const { subcategories, ...record } = category;

    return {
      ...record,
      categoryCount: subcategories.length,
      planCount: subcategories.reduce((total, subcategory) => total + subcategory.plans.length, 0),
    };
  });

  const categories = tree.flatMap((category) =>
    category.subcategories.map(({ plans, ...subcategory }) => ({
      ...subcategory,
      planCount: plans.length,
    })),
  );

  const plans = tree.flatMap((category) =>
    category.subcategories.flatMap((subcategory) => subcategory.plans),
  );

  return { services, categories, plans };
}

function normalizeQuery(value: string | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function matchesQuery(haystack: Array<string | number | boolean | null | undefined>, query: string): boolean {
  if (!query) return true;
  return haystack
    .filter((part) => part !== null && part !== undefined && part !== "")
    .join(" ")
    .toLowerCase()
    .includes(query);
}

function matchesStatus(status: CatalogStatus, filter: CatalogStatusFilter | undefined): boolean {
  return !filter || filter === "TODOS" || status === filter;
}

export function filterServices(
  services: CatalogServiceRow[],
  filters: CatalogTableFilters = {},
): CatalogServiceRow[] {
  const query = normalizeQuery(filters.query);

  return services.filter(
    (service) =>
      matchesQuery([service.name, service.slug, service.description], query) &&
      matchesStatus(service.status, filters.status),
  );
}

export function filterCategories(
  categories: CatalogCategoryRow[],
  filters: CatalogTableFilters = {},
): CatalogCategoryRow[] {
  const query = normalizeQuery(filters.query);

  return categories.filter(
    (category) =>
      matchesQuery([category.name, category.slug, category.categoryName], query) &&
      matchesStatus(category.status, filters.status) &&
      (!filters.serviceId || category.categoryId === filters.serviceId),
  );
}

export function filterPlans(
  plans: ServicePlanRecord[],
  filters: CatalogTableFilters = {},
): ServicePlanRecord[] {
  const query = normalizeQuery(filters.query);
  const highlighted = filters.highlighted ?? "TODOS";

  return plans.filter((plan) => {
    const matchesHighlighted =
      highlighted === "TODOS" || (highlighted === "SI" ? plan.highlighted : !plan.highlighted);

    return (
      matchesQuery(
        [plan.name, plan.categoryName, plan.subcategoryName, plan.badge, plan.summary, plan.note],
        query,
      ) &&
      matchesStatus(plan.status, filters.status) &&
      (!filters.serviceId || plan.categoryId === filters.serviceId) &&
      (!filters.categoryId || plan.subcategoryId === filters.categoryId) &&
      matchesHighlighted
    );
  });
}

export function hasActiveCatalogFilters(filters: CatalogTableFilters): boolean {
  return Boolean(
    normalizeQuery(filters.query) ||
      (filters.status && filters.status !== "TODOS") ||
      filters.serviceId ||
      filters.categoryId ||
      (filters.highlighted && filters.highlighted !== "TODOS"),
  );
}

export function getCatalogEmptyMessage(view: CatalogView, filtered: boolean): string {
  if (filtered) {
    if (view === "categorias") return "No hay categorías con esos filtros.";
    if (view === "planes") return "No hay planes con esos filtros.";
    return "No hay servicios con esos filtros.";
  }

  if (view === "categorias") return "Aún no hay categorías en el catálogo.";
  if (view === "planes") return "Aún no hay planes en el catálogo.";
  return "Aún no hay servicios en el catálogo.";
}

export function formatCatalogPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCatalogDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}
