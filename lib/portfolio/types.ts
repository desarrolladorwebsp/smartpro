import type { PortfolioProjectStatus } from "@prisma/client";

import type { PublicPortfolioCategory } from "./constants";

export type { PortfolioProjectStatus };

export type PortfolioSubcategoryOption = {
  id: string;
  name: string;
  slug: string;
  publicLabel: PublicPortfolioCategory | null;
};

export type PortfolioCategorySummary = {
  id: string;
  name: string;
  slug: string;
  coverImage: string;
  enabled: boolean;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  subcategories: PortfolioSubcategoryOption[];
};

export type PortfolioProjectRecord = {
  id: string;
  categoryId: string;
  categoryName: string;
  categorySlug: string;
  subcategoryId: string;
  subcategoryName: string;
  subcategorySlug: string;
  publicCategory: PublicPortfolioCategory | null;
  title: string;
  slug: string;
  summary: string;
  image: string;
  url: string;
  tags: string[];
  status: PortfolioProjectStatus;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
};

export type PortfolioProjectInput = {
  categorySlug?: string;
  subcategoryId: string;
  title: string;
  summary?: string;
  url?: string;
  tags?: string[];
  status?: PortfolioProjectStatus;
  sortOrder?: number;
  image?: string;
};

export type PortfolioProjectListFilters = {
  categorySlug?: string;
  subcategoryId?: string;
  status?: PortfolioProjectStatus | "ALL";
  query?: string;
};

export type PublicPortfolioProject = {
  id: string;
  title: string;
  summary: string;
  category: PublicPortfolioCategory;
  image: string;
  url: string;
  tags: string[];
};

export function getPortfolioStatusLabel(status: PortfolioProjectStatus): string {
  if (status === "PUBLISHED") return "Publicado";
  if (status === "ARCHIVED") return "Archivado";
  return "Borrador";
}
