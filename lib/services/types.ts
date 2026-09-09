export type CatalogStatus = "ACTIVE" | "INACTIVE";

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServiceSubcategoryRecord = {
  id: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServicePlanItemRecord = {
  id: string;
  planId: string;
  label: string;
  slug: string;
  sortOrder: number;
  status: CatalogStatus;
  createdAt: string;
  updatedAt: string;
};

export type ServicePlanRecord = {
  id: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  name: string;
  slug: string;
  price: number;
  pricePrefix: string;
  taxLabel: string;
  taxRate: number;
  summary: string;
  badge: string;
  note: string;
  featureGroupTitle: string;
  highlighted: boolean;
  sortOrder: number;
  status: CatalogStatus;
  icon: string;
  externalLink: string;
  items: ServicePlanItemRecord[];
  createdAt: string;
  updatedAt: string;
};

export type CatalogTree = Array<
  ServiceCategoryRecord & {
    subcategories: Array<
      ServiceSubcategoryRecord & {
        plans: ServicePlanRecord[];
      }
    >;
  }
>;

export type ServiceCategoryPayload = {
  name?: string;
  description?: string;
  coverImage?: string | null;
  sortOrder?: number | string;
  status?: CatalogStatus;
};

export type ServiceSubcategoryPayload = {
  categoryId?: string;
  name?: string;
  sortOrder?: number | string;
  status?: CatalogStatus;
};

export type ServicePlanPayload = {
  subcategoryId?: string;
  name?: string;
  price?: number | string;
  pricePrefix?: string;
  taxLabel?: string;
  taxRate?: number | string;
  summary?: string;
  badge?: string;
  note?: string;
  featureGroupTitle?: string;
  highlighted?: boolean | string;
  sortOrder?: number | string;
  status?: CatalogStatus;
  icon?: string;
  externalLink?: string;
  items?: Array<{
    id?: string;
    label?: string;
    sortOrder?: number | string;
    status?: CatalogStatus;
  }>;
};

export function parseServicePlanPayload(body: Record<string, unknown>): ServicePlanPayload {
  return {
    subcategoryId: body.subcategoryId == null ? undefined : String(body.subcategoryId),
    name: body.name == null ? undefined : String(body.name),
    price: body.price as number | string | undefined,
    pricePrefix: body.pricePrefix == null ? undefined : String(body.pricePrefix),
    taxLabel: body.taxLabel == null ? undefined : String(body.taxLabel),
    taxRate: body.taxRate as number | string | undefined,
    summary: body.summary == null ? undefined : String(body.summary),
    badge: body.badge == null ? undefined : String(body.badge),
    note: body.note == null ? undefined : String(body.note),
    featureGroupTitle: body.featureGroupTitle == null ? undefined : String(body.featureGroupTitle),
    highlighted: body.highlighted == null ? undefined : Boolean(body.highlighted),
    sortOrder: body.sortOrder as number | string | undefined,
    status: body.status === "INACTIVE" ? "INACTIVE" : body.status === "ACTIVE" ? "ACTIVE" : undefined,
    icon: body.icon == null ? undefined : String(body.icon),
    externalLink: body.externalLink == null ? undefined : String(body.externalLink),
    items: Array.isArray(body.items)
      ? (body.items as Array<{ id?: string; label?: string; sortOrder?: number | string; status?: CatalogStatus }>)
      : undefined,
  };
}

export function getCatalogStatusLabel(status: CatalogStatus): string {
  return status === "ACTIVE" ? "Activo" : "Inactivo";
}
