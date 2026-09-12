import type { PortfolioProjectStatus } from "@prisma/client";

import { slugifyPortfolioValue, WEB_DEVELOPMENT_CATEGORY_SLUG, type PublicPortfolioCategory } from "./constants";
import type { PortfolioProjectInput } from "./types";

const URL_PATTERN = /^(https?:\/\/|\/|#)/i;

function normalizeText(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

export function parsePortfolioTags(value: unknown): string[] {
  const raw = Array.isArray(value)
    ? value
    : String(value ?? "")
        .split(/[,\n]/)
        .map((entry) => entry.trim());

  const unique = new Set<string>();

  for (const entry of raw) {
    const tag = normalizeText(entry).slice(0, 40);
    if (tag) unique.add(tag);
    if (unique.size >= 8) break;
  }

  return [...unique];
}

export function parsePortfolioUrl(value: unknown): string {
  const url = normalizeText(value);
  if (!url) return "";
  if (URL_PATTERN.test(url)) {
    return url.slice(0, 300);
  }
  if (/^[\w.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(url)) {
    return `https://${url}`.slice(0, 300);
  }
  throw new Error("La URL debe comenzar con https://, http:// o /.");
}

export function parsePortfolioStatus(value: unknown, fallback: PortfolioProjectStatus = "DRAFT"): PortfolioProjectStatus {
  if (value === "PUBLISHED" || value === "DRAFT" || value === "ARCHIVED") {
    return value;
  }

  return fallback;
}

export function parsePortfolioProjectInput(body: Record<string, unknown>): PortfolioProjectInput {
  const title = normalizeText(body.title);
  const subcategoryId = normalizeText(body.subcategoryId);
  const summary = normalizeText(body.summary).slice(0, 280);
  const sortOrder = Number.parseInt(String(body.sortOrder ?? "0"), 10);

  if (!title) {
    throw new Error("El título es obligatorio.");
  }

  if (!subcategoryId) {
    throw new Error("Selecciona una subcategoría.");
  }

  return {
    categorySlug: normalizeText(body.categorySlug) || WEB_DEVELOPMENT_CATEGORY_SLUG,
    subcategoryId,
    title: title.slice(0, 120),
    summary,
    url: parsePortfolioUrl(body.url),
    tags: parsePortfolioTags(body.tags),
    status: parsePortfolioStatus(body.status),
    sortOrder: Number.isFinite(sortOrder) ? Math.max(0, Math.min(sortOrder, 9999)) : 0,
    image: typeof body.image === "string" ? body.image.trim() : undefined,
  };
}

export function assertCanPublish(input: { image: string; url: string; publicCategory: PublicPortfolioCategory | null }) {
  if (!input.image) {
    throw new Error("Agrega una imagen principal antes de publicar.");
  }

  if (!input.url) {
    throw new Error("Agrega el link del proyecto antes de publicar.");
  }

  if (!input.publicCategory) {
    throw new Error("La subcategoría no corresponde a Desarrollo Web (Sitio Web, Landing Page o E-commerce).");
  }
}

export function buildPortfolioSlug(title: string): string {
  const slug = slugifyPortfolioValue(title);
  if (!slug) {
    throw new Error("El título no genera un identificador válido.");
  }
  return slug;
}
