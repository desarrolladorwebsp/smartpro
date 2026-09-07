import { Prisma, type CatalogStatus as PrismaCatalogStatus } from "@prisma/client";

import { getPrismaClient } from "../db";
import { parseMoney } from "../orders/service";
import type {
  CatalogStatus,
  CatalogTree,
  ServiceCategoryPayload,
  ServiceCategoryRecord,
  ServicePlanItemRecord,
  ServicePlanPayload,
  ServicePlanRecord,
  ServiceSubcategoryPayload,
  ServiceSubcategoryRecord,
} from "./types";

export type { CatalogTree, ServiceCategoryRecord, ServicePlanRecord, ServiceSubcategoryRecord } from "./types";
export { getCatalogStatusLabel } from "./types";

function getPrisma() {
  const client = getPrismaClient();
  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function slugify(value: string): string {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function toNumber(value: unknown, fallback = 0): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toStatus(value: unknown, fallback: CatalogStatus = "ACTIVE"): CatalogStatus {
  return value === "INACTIVE" ? "INACTIVE" : value === "ACTIVE" ? "ACTIVE" : fallback;
}

function toBoolean(value: unknown): boolean {
  return value === true || value === "true" || value === "1" || value === 1;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

function toIso(date: Date): string {
  return date.toISOString();
}

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  status: PrismaCatalogStatus;
  createdAt: Date;
  updatedAt: Date;
};

type SubcategoryRow = {
  id: string;
  categoryId: string;
  name: string;
  slug: string;
  sortOrder: number;
  status: PrismaCatalogStatus;
  createdAt: Date;
  updatedAt: Date;
  category?: { name: string } | null;
};

type ItemRow = {
  id: string;
  planId: string;
  label: string;
  slug: string;
  sortOrder: number;
  status: PrismaCatalogStatus;
  createdAt: Date;
  updatedAt: Date;
};

type PlanRow = {
  id: string;
  subcategoryId: string;
  name: string;
  slug: string;
  price: Prisma.Decimal | number;
  pricePrefix: string;
  taxLabel: string;
  taxRate: Prisma.Decimal | number;
  summary: string;
  badge: string;
  note: string;
  featureGroupTitle: string;
  highlighted: boolean;
  sortOrder: number;
  status: PrismaCatalogStatus;
  icon: string;
  externalLink: string;
  createdAt: Date;
  updatedAt: Date;
  items?: ItemRow[];
  subcategory?: {
    id: string;
    name: string;
    categoryId: string;
    category?: { id: string; name: string } | null;
  } | null;
};

function toCategoryRecord(row: CategoryRow): ServiceCategoryRecord {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toSubcategoryRecord(row: SubcategoryRow): ServiceSubcategoryRecord {
  return {
    id: row.id,
    categoryId: row.categoryId,
    categoryName: row.category?.name ?? "",
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toItemRecord(row: ItemRow): ServicePlanItemRecord {
  return {
    id: row.id,
    planId: row.planId,
    label: row.label,
    slug: row.slug,
    sortOrder: row.sortOrder,
    status: row.status,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

function toPlanRecord(row: PlanRow): ServicePlanRecord {
  return {
    id: row.id,
    subcategoryId: row.subcategoryId,
    subcategoryName: row.subcategory?.name ?? "",
    categoryId: row.subcategory?.categoryId ?? row.subcategory?.category?.id ?? "",
    categoryName: row.subcategory?.category?.name ?? "",
    name: row.name,
    slug: row.slug,
    price: decimalToNumber(row.price),
    pricePrefix: row.pricePrefix,
    taxLabel: row.taxLabel,
    taxRate: decimalToNumber(row.taxRate),
    summary: row.summary,
    badge: row.badge,
    note: row.note,
    featureGroupTitle: row.featureGroupTitle,
    highlighted: row.highlighted,
    sortOrder: row.sortOrder,
    status: row.status,
    icon: row.icon,
    externalLink: row.externalLink,
    items: (row.items ?? []).map(toItemRecord),
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

const planInclude = {
  items: { orderBy: { sortOrder: "asc" as const } },
  subcategory: {
    include: { category: true },
  },
};

export async function listServiceCategories(): Promise<ServiceCategoryRecord[]> {
  const rows = await getPrisma().serviceCategory.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toCategoryRecord);
}

export async function listServiceSubcategories(categoryId?: string): Promise<ServiceSubcategoryRecord[]> {
  const rows = await getPrisma().serviceSubcategory.findMany({
    where: categoryId ? { categoryId } : undefined,
    include: { category: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toSubcategoryRecord);
}

export async function listServicePlans(): Promise<ServicePlanRecord[]> {
  const rows = await getPrisma().servicePlan.findMany({
    include: planInclude,
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPlanRecord);
}

export async function getServicePlanById(id: string): Promise<ServicePlanRecord | null> {
  const row = await getPrisma().servicePlan.findUnique({
    where: { id },
    include: planInclude,
  });
  return row ? toPlanRecord(row) : null;
}

export async function getCatalogTree(): Promise<CatalogTree> {
  const categories = await getPrisma().serviceCategory.findMany({
    include: {
      subcategories: {
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
        include: {
          plans: {
            orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
            include: {
              items: { orderBy: { sortOrder: "asc" } },
              subcategory: { include: { category: true } },
            },
          },
        },
      },
    },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  return categories.map((category) => ({
    ...toCategoryRecord(category),
    subcategories: category.subcategories.map((subcategory) => ({
      ...toSubcategoryRecord({ ...subcategory, category: { name: category.name } }),
      plans: subcategory.plans.map(toPlanRecord),
    })),
  }));
}

export async function upsertServiceCategory(input: ServiceCategoryPayload & { slug?: string }): Promise<ServiceCategoryRecord> {
  const name = normalizeText(input.name);
  if (!name) throw new Error("El nombre de la categoría es obligatorio.");

  const slug = slugify(input.slug ?? name);
  if (!slug) throw new Error("No se pudo generar el identificador de la categoría.");

  const data = {
    name,
    slug,
    description: normalizeText(input.description),
    sortOrder: Math.max(0, Math.trunc(toNumber(input.sortOrder))),
    status: toStatus(input.status),
  };

  const existing = await getPrisma().serviceCategory.findUnique({ where: { slug } });
  const row = existing
    ? await getPrisma().serviceCategory.update({ where: { id: existing.id }, data })
    : await getPrisma().serviceCategory.create({ data });

  return toCategoryRecord(row);
}

export async function updateServiceCategory(id: string, input: ServiceCategoryPayload): Promise<ServiceCategoryRecord> {
  const existing = await getPrisma().serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("La categoría no existe.");

  const name = normalizeText(input.name ?? existing.name);
  if (!name) throw new Error("El nombre de la categoría es obligatorio.");

  const row = await getPrisma().serviceCategory.update({
    where: { id },
    data: {
      name,
      description: input.description == null ? existing.description : normalizeText(input.description),
      sortOrder: input.sortOrder == null ? existing.sortOrder : Math.max(0, Math.trunc(toNumber(input.sortOrder))),
      status: input.status ? toStatus(input.status) : existing.status,
    },
  });

  return toCategoryRecord(row);
}

export async function upsertServiceSubcategory(
  input: ServiceSubcategoryPayload & { slug?: string },
): Promise<ServiceSubcategoryRecord> {
  const categoryId = normalizeText(input.categoryId);
  const name = normalizeText(input.name);
  if (!categoryId) throw new Error("La categoría es obligatoria.");
  if (!name) throw new Error("El nombre de la subcategoría es obligatorio.");

  const category = await getPrisma().serviceCategory.findUnique({ where: { id: categoryId } });
  if (!category) throw new Error("La categoría no existe.");

  const slug = slugify(input.slug ?? name);
  const data = {
    categoryId,
    name,
    slug,
    sortOrder: Math.max(0, Math.trunc(toNumber(input.sortOrder))),
    status: toStatus(input.status),
  };

  const existing = await getPrisma().serviceSubcategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });

  const row = existing
    ? await getPrisma().serviceSubcategory.update({
        where: { id: existing.id },
        data,
        include: { category: true },
      })
    : await getPrisma().serviceSubcategory.create({ data, include: { category: true } });

  return toSubcategoryRecord(row);
}

export async function updateServiceSubcategory(
  id: string,
  input: ServiceSubcategoryPayload,
): Promise<ServiceSubcategoryRecord> {
  const existing = await getPrisma().serviceSubcategory.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!existing) throw new Error("La subcategoría no existe.");

  const name = normalizeText(input.name ?? existing.name);
  if (!name) throw new Error("El nombre de la subcategoría es obligatorio.");

  const row = await getPrisma().serviceSubcategory.update({
    where: { id },
    data: {
      name,
      sortOrder: input.sortOrder == null ? existing.sortOrder : Math.max(0, Math.trunc(toNumber(input.sortOrder))),
      status: input.status ? toStatus(input.status) : existing.status,
    },
    include: { category: true },
  });

  return toSubcategoryRecord(row);
}

async function syncPlanItems(
  planId: string,
  items: Array<{ id?: string; label?: string; sortOrder?: number | string; status?: CatalogStatus }>,
) {
  const db = getPrisma();
  const usedSlugs = new Set<string>();

  for (const [index, item] of items.entries()) {
    const label = stripHtml(normalizeText(item.label));
    if (!label) continue;

    let slug = slugify(label) || `item-${index + 1}`;
    if (usedSlugs.has(slug)) slug = `${slug}-${index + 1}`;
    usedSlugs.add(slug);

    const data = {
      label,
      slug,
      sortOrder: item.sortOrder == null ? index : Math.max(0, Math.trunc(toNumber(item.sortOrder, index))),
      status: toStatus(item.status),
    };

    const existingById = item.id
      ? await db.servicePlanItem.findFirst({ where: { id: item.id, planId } })
      : null;
    const existingBySlug = existingById
      ? null
      : await db.servicePlanItem.findUnique({ where: { planId_slug: { planId, slug } } });

    if (existingById) {
      await db.servicePlanItem.update({ where: { id: existingById.id }, data });
    } else if (existingBySlug) {
      await db.servicePlanItem.update({ where: { id: existingBySlug.id }, data });
    } else {
      await db.servicePlanItem.create({ data: { ...data, planId } });
    }
  }
}

export async function upsertServicePlan(input: ServicePlanPayload & { slug?: string }): Promise<ServicePlanRecord> {
  const subcategoryId = normalizeText(input.subcategoryId);
  const name = normalizeText(input.name);
  if (!subcategoryId) throw new Error("La subcategoría es obligatoria.");
  if (!name) throw new Error("El nombre del plan es obligatorio.");

  const subcategory = await getPrisma().serviceSubcategory.findUnique({ where: { id: subcategoryId } });
  if (!subcategory) throw new Error("La subcategoría no existe.");

  const price = parseMoney(input.price);
  if (!Number.isFinite(price) || price < 0) {
    throw new Error("El precio es inválido.");
  }

  const slug = slugify(input.slug ?? name);
  const data = {
    subcategoryId,
    name,
    slug,
    price,
    pricePrefix: normalizeText(input.pricePrefix),
    taxLabel: normalizeText(input.taxLabel) || "+ IVA",
    taxRate: Math.min(1, Math.max(0, toNumber(input.taxRate, 0.19))),
    summary: normalizeText(input.summary),
    badge: normalizeText(input.badge),
    note: normalizeText(input.note),
    featureGroupTitle: normalizeText(input.featureGroupTitle),
    highlighted: toBoolean(input.highlighted),
    sortOrder: Math.max(0, Math.trunc(toNumber(input.sortOrder))),
    status: toStatus(input.status),
    icon: normalizeText(input.icon),
    externalLink: normalizeText(input.externalLink),
  };

  const existing = await getPrisma().servicePlan.findUnique({
    where: { subcategoryId_slug: { subcategoryId, slug } },
  });

  const row = existing
    ? await getPrisma().servicePlan.update({ where: { id: existing.id }, data })
    : await getPrisma().servicePlan.create({ data });

  if (Array.isArray(input.items)) {
    await syncPlanItems(row.id, input.items);
  }

  const complete = await getServicePlanById(row.id);
  if (!complete) throw new Error("No se pudo guardar el plan.");
  return complete;
}

export async function updateServicePlan(id: string, input: ServicePlanPayload): Promise<ServicePlanRecord> {
  const existing = await getServicePlanById(id);
  if (!existing) throw new Error("El plan no existe.");

  return upsertServicePlan({
    ...existing,
    ...input,
    subcategoryId: input.subcategoryId ?? existing.subcategoryId,
    items: input.items ?? existing.items,
    slug: existing.slug,
  });
}

export async function updateServicePlanStatus(id: string, status: CatalogStatus): Promise<ServicePlanRecord> {
  const existing = await getPrisma().servicePlan.findUnique({ where: { id } });
  if (!existing) throw new Error("El plan no existe.");

  await getPrisma().servicePlan.update({
    where: { id },
    data: { status: toStatus(status) },
  });

  const complete = await getServicePlanById(id);
  if (!complete) throw new Error("No se pudo actualizar el estado.");
  return complete;
}

export async function updateServiceCategoryStatus(id: string, status: CatalogStatus): Promise<ServiceCategoryRecord> {
  const existing = await getPrisma().serviceCategory.findUnique({ where: { id } });
  if (!existing) throw new Error("La categoría no existe.");

  const row = await getPrisma().serviceCategory.update({
    where: { id },
    data: { status: toStatus(status) },
  });
  return toCategoryRecord(row);
}

export async function updateServiceSubcategoryStatus(id: string, status: CatalogStatus): Promise<ServiceSubcategoryRecord> {
  const existing = await getPrisma().serviceSubcategory.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!existing) throw new Error("La subcategoría no existe.");

  const row = await getPrisma().serviceSubcategory.update({
    where: { id },
    data: { status: toStatus(status) },
    include: { category: true },
  });
  return toSubcategoryRecord(row);
}
