import type { PortfolioProject, PortfolioProjectStatus, ServiceCategory, ServiceSubcategory } from "@prisma/client";

import { getPrismaClient } from "../db";
import {
  getPublicPortfolioCategory,
  WEB_DEVELOPMENT_CATEGORY_SLUG,
  type PublicPortfolioCategory,
} from "./constants";
import {
  getPortfolioMediaPath,
  preparePortfolioImageUpload,
  removeManagedPortfolioImageFile,
  withPortfolioImageCache,
} from "./image";
import { ensurePortfolioProjectTable, withPortfolioTable } from "./schema";
import type {
  PortfolioCategorySummary,
  PortfolioProjectInput,
  PortfolioProjectListFilters,
  PortfolioProjectRecord,
  PortfolioSubcategoryOption,
} from "./types";
import { assertCanPublish, buildPortfolioSlug, parsePortfolioTags } from "./validation";

const ENABLED_CATEGORY_SLUGS = new Set([WEB_DEVELOPMENT_CATEGORY_SLUG]);

type ProjectWithRelations = Omit<PortfolioProject, "imageBytes" | "imageMime"> & {
  category: Pick<ServiceCategory, "id" | "name" | "slug">;
  subcategory: Pick<ServiceSubcategory, "id" | "name" | "slug">;
};

function getPrisma() {
  const client = getPrismaClient();
  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

function toIso(value: Date): string {
  return value.toISOString();
}

function mapTags(value: unknown): string[] {
  return parsePortfolioTags(value);
}

function publicLabelFor(subcategory: Pick<ServiceSubcategory, "name" | "slug">): PublicPortfolioCategory | null {
  return getPublicPortfolioCategory(subcategory.slug, subcategory.name);
}

function displaySubcategoryName(subcategory: Pick<ServiceSubcategory, "name" | "slug">): string {
  return publicLabelFor(subcategory) ?? subcategory.name;
}

function mapProject(row: ProjectWithRelations): PortfolioProjectRecord {
  return {
    id: row.id,
    categoryId: row.category.id,
    categoryName: row.category.name,
    categorySlug: row.category.slug,
    subcategoryId: row.subcategory.id,
    subcategoryName: displaySubcategoryName(row.subcategory),
    subcategorySlug: row.subcategory.slug,
    publicCategory: publicLabelFor(row.subcategory),
    title: row.title,
    slug: row.slug,
    summary: row.summary,
    image: withPortfolioImageCache(row.image, row.updatedAt),
    url: row.url,
    tags: mapTags(row.tags),
    status: row.status,
    sortOrder: row.sortOrder,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  };
}

const projectRead = {
  select: {
    id: true,
    categoryId: true,
    subcategoryId: true,
    title: true,
    slug: true,
    summary: true,
    image: true,
    url: true,
    tags: true,
    status: true,
    sortOrder: true,
    createdAt: true,
    updatedAt: true,
    category: { select: { id: true, name: true, slug: true } },
    subcategory: { select: { id: true, name: true, slug: true } },
  },
} as const;

export async function listPortfolioCategories(): Promise<PortfolioCategorySummary[]> {
  return withPortfolioTable(async () => {
  const prisma = getPrisma();
  const categories = await prisma.serviceCategory.findMany({
    where: { slug: { in: [...ENABLED_CATEGORY_SLUGS] } },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      coverImage: true,
      subcategories: {
        where: { status: "ACTIVE" },
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, slug: true },
      },
      _count: {
        select: {
          portfolioProjects: true,
        },
      },
    },
  });

  const counts = await prisma.portfolioProject.groupBy({
    by: ["categoryId", "status"],
    _count: { _all: true },
  });

  const countMap = new Map<string, { publishedCount: number; draftCount: number; archivedCount: number }>();

  for (const row of counts) {
    const current = countMap.get(row.categoryId) ?? { publishedCount: 0, draftCount: 0, archivedCount: 0 };
    if (row.status === "PUBLISHED") current.publishedCount = row._count._all;
    if (row.status === "DRAFT") current.draftCount = row._count._all;
    if (row.status === "ARCHIVED") current.archivedCount = row._count._all;
    countMap.set(row.categoryId, current);
  }

  return categories.map((category) => {
    const categoryCounts = countMap.get(category.id) ?? { publishedCount: 0, draftCount: 0, archivedCount: 0 };
    const subcategories: PortfolioSubcategoryOption[] = category.subcategories
      .map((subcategory) => ({
        id: subcategory.id,
        name: displaySubcategoryName(subcategory),
        slug: subcategory.slug,
        publicLabel: publicLabelFor(subcategory),
      }))
      .filter((subcategory) => subcategory.publicLabel);

    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      coverImage: category.coverImage,
      enabled: ENABLED_CATEGORY_SLUGS.has(category.slug),
      publishedCount: categoryCounts.publishedCount,
      draftCount: categoryCounts.draftCount,
      archivedCount: categoryCounts.archivedCount,
      subcategories,
    };
  });
  });
}

export async function getPortfolioCategoryBySlug(slug: string) {
  const categories = await listPortfolioCategories();
  const category = categories.find((entry) => entry.slug === slug);

  if (!category) {
    throw new Error("El servicio de portafolio no existe o todavía no está habilitado.");
  }

  return category;
}

export async function listPortfolioProjects(filters: PortfolioProjectListFilters = {}): Promise<PortfolioProjectRecord[]> {
  return withPortfolioTable(async () => {
  const prisma = getPrisma();
  const categorySlug = filters.categorySlug || WEB_DEVELOPMENT_CATEGORY_SLUG;
  const query = String(filters.query ?? "").trim();

  const rows = await prisma.portfolioProject.findMany({
    where: {
      category: { slug: categorySlug },
      ...(filters.subcategoryId ? { subcategoryId: filters.subcategoryId } : {}),
      ...(filters.status === "ALL"
        ? {}
        : { status: filters.status ?? { not: "ARCHIVED" } }),
      ...(query
        ? {
            OR: [
              { title: { contains: query } },
              { summary: { contains: query } },
              { url: { contains: query } },
            ],
          }
        : {}),
    },
    ...projectRead,
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });

  return rows.map(mapProject);
  });
}

export async function getPortfolioProject(id: string): Promise<PortfolioProjectRecord> {
  return withPortfolioTable(async () => {
  const prisma = getPrisma();
  const row = await prisma.portfolioProject.findUnique({
    where: { id },
    ...projectRead,
  });

  if (!row) {
    throw new Error("El proyecto no existe.");
  }

  return mapProject(row);
  });
}

async function resolveUniqueSlug(categoryId: string, title: string, excludeId?: string) {
  const prisma = getPrisma();
  const base = buildPortfolioSlug(title);
  let slug = base;
  let suffix = 2;

  while (true) {
    const existing = await prisma.portfolioProject.findFirst({
      where: {
        categoryId,
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) return slug;
    slug = `${base}-${suffix}`.slice(0, 80);
    suffix += 1;
  }
}

async function resolveSubcategory(categoryId: string, subcategoryId: string) {
  const prisma = getPrisma();
  const subcategory = await prisma.serviceSubcategory.findFirst({
    where: { id: subcategoryId, categoryId, status: "ACTIVE" },
  });

  if (!subcategory) {
    throw new Error("La subcategoría no pertenece a este servicio.");
  }

  if (!publicLabelFor(subcategory)) {
    throw new Error("Solo se pueden registrar proyectos de Sitio Web, Landing Page, Sistema o E-commerce.");
  }

  return subcategory;
}

export async function createPortfolioProject(input: PortfolioProjectInput): Promise<PortfolioProjectRecord> {
  return withPortfolioTable(async () => {
  const prisma = getPrisma();
  const categorySlug = input.categorySlug || WEB_DEVELOPMENT_CATEGORY_SLUG;
  const category = await prisma.serviceCategory.findUnique({
    where: { slug: categorySlug },
    select: { id: true },
  });

  if (!category) {
    throw new Error("El servicio Desarrollo Web no está en el catálogo.");
  }

  const subcategory = await resolveSubcategory(category.id, input.subcategoryId);
  const status = input.status ?? "DRAFT";
  const image = input.image ?? "";
  const url = input.url ?? "";

  if (status === "PUBLISHED") {
    assertCanPublish({
      image,
      url,
      publicCategory: publicLabelFor(subcategory),
    });
  }

  const row = await prisma.portfolioProject.create({
    data: {
      categoryId: category.id,
      subcategoryId: subcategory.id,
      title: input.title,
      slug: await resolveUniqueSlug(category.id, input.title),
      summary: input.summary ?? "",
      image,
      url,
      tags: input.tags ?? [],
      status,
      sortOrder: input.sortOrder ?? 0,
    },
    ...projectRead,
  });

  return mapProject(row);
  });
}

export async function updatePortfolioProject(id: string, input: PortfolioProjectInput): Promise<PortfolioProjectRecord> {
  const current = await getPortfolioProject(id);
  const prisma = getPrisma();
  const subcategory = await resolveSubcategory(current.categoryId, input.subcategoryId);
  const nextImage = input.image !== undefined ? input.image : current.image;
  const nextUrl = input.url ?? current.url;
  const nextStatus = input.status ?? current.status;

  if (nextStatus === "PUBLISHED") {
    assertCanPublish({
      image: nextImage,
      url: nextUrl,
      publicCategory: publicLabelFor(subcategory),
    });
  }

  const row = await prisma.portfolioProject.update({
    where: { id },
    data: {
      subcategoryId: subcategory.id,
      title: input.title,
      slug: await resolveUniqueSlug(current.categoryId, input.title, id),
      summary: input.summary ?? "",
      image: nextImage,
      url: nextUrl,
      tags: input.tags ?? [],
      status: nextStatus,
      sortOrder: input.sortOrder ?? current.sortOrder,
    },
    ...projectRead,
  });

  return mapProject(row);
}

export async function persistPortfolioProjectImage(id: string, file: File): Promise<PortfolioProjectRecord> {
  return withPortfolioTable(async () => {
    await getPortfolioProject(id);
    const prepared = await preparePortfolioImageUpload(file);
    await ensurePortfolioProjectTable();

    const row = await getPrisma().portfolioProject.update({
      where: { id },
      data: {
        image: getPortfolioMediaPath(id),
        imageMime: prepared.mimeType,
        imageBytes: new Uint8Array(prepared.bytes),
      },
      ...projectRead,
    });

    return mapProject(row);
  });
}

export async function getPortfolioImageMedia(id: string) {
  return withPortfolioTable(async () => {
    const row = await getPrisma().portfolioProject.findUnique({
      where: { id },
      select: { image: true, imageMime: true, imageBytes: true },
    });

    if (!row?.imageBytes || row.imageBytes.length === 0) {
      return null;
    }

    return {
      mimeType: row.imageMime || "application/octet-stream",
      bytes: Buffer.from(row.imageBytes),
    };
  });
}

export async function setPortfolioProjectImage(id: string, image: string): Promise<PortfolioProjectRecord> {
  const current = await getPortfolioProject(id);
  const prisma = getPrisma();

  if (current.image && current.image !== image) {
    await removeManagedPortfolioImageFile(current.image);
  }

  const row = await prisma.portfolioProject.update({
    where: { id },
    data: {
      image,
      imageMime: "",
      imageBytes: null,
    },
    ...projectRead,
  });

  return mapProject(row);
}

export async function clearPortfolioProjectImage(id: string): Promise<PortfolioProjectRecord> {
  const current = await getPortfolioProject(id);

  if (current.status === "PUBLISHED") {
    throw new Error("No puedes quitar la imagen de un proyecto publicado.");
  }

  await removeManagedPortfolioImageFile(current.image);

  const prisma = getPrisma();
  const row = await prisma.portfolioProject.update({
    where: { id },
    data: { image: "", imageMime: "", imageBytes: null },
    ...projectRead,
  });

  return mapProject(row);
}

export async function setPortfolioProjectStatus(id: string, status: PortfolioProjectStatus): Promise<PortfolioProjectRecord> {
  const current = await getPortfolioProject(id);

  if (status === "PUBLISHED") {
    assertCanPublish({
      image: current.image,
      url: current.url,
      publicCategory: current.publicCategory,
    });
  }

  const prisma = getPrisma();
  const row = await prisma.portfolioProject.update({
    where: { id },
    data: { status },
    ...projectRead,
  });

  return mapProject(row);
}

export async function archivePortfolioProject(id: string): Promise<PortfolioProjectRecord> {
  return setPortfolioProjectStatus(id, "ARCHIVED");
}

export async function deletePortfolioProject(id: string): Promise<void> {
  const current = await getPortfolioProject(id);

  if (current.status === "PUBLISHED") {
    throw new Error("Archiva el proyecto antes de eliminarlo.");
  }

  await removeManagedPortfolioImageFile(current.image);
  await getPrisma().portfolioProject.delete({ where: { id } });
}
