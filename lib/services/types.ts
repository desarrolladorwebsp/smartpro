export type CatalogStatus = "ACTIVE" | "INACTIVE";

export type ServiceCategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
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

export function getCatalogStatusLabel(status: CatalogStatus): string {
  return status === "ACTIVE" ? "Activo" : "Inactivo";
}
