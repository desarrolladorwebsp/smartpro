export const WEB_DEVELOPMENT_CATEGORY_SLUG = "desarrollo-web";

export const PORTFOLIO_IMAGE_ASPECT = {
  width: 5,
  height: 3,
  tolerance: 0.08,
} as const;

export const PORTFOLIO_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PORTFOLIO_IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const PUBLIC_PORTFOLIO_FILTERS = ["Todos", "Sitio Web", "Landing Page", "Sistema", "E-commerce"] as const;

export type PublicPortfolioFilter = (typeof PUBLIC_PORTFOLIO_FILTERS)[number];
export type PublicPortfolioCategory = Exclude<PublicPortfolioFilter, "Todos">;

export const WEB_PORTFOLIO_SUBCATEGORY_ALIASES: Record<PublicPortfolioCategory, readonly string[]> = {
  "Sitio Web": ["sitio-web", "sitios-web", "website", "websites"],
  "Landing Page": ["landing-page", "landing"],
  Sistema: ["sistema", "sistemas", "system", "systems"],
  "E-commerce": ["e-commerce", "ecommerce"],
};

export function slugifyPortfolioValue(value: string): string {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function getPublicPortfolioCategory(
  subcategorySlug: string,
  subcategoryName = "",
): PublicPortfolioCategory | null {
  const slug = slugifyPortfolioValue(subcategorySlug || subcategoryName);

  for (const [label, aliases] of Object.entries(WEB_PORTFOLIO_SUBCATEGORY_ALIASES) as Array<
    [PublicPortfolioCategory, readonly string[]]
  >) {
    if (aliases.includes(slug)) {
      return label;
    }
  }

  return null;
}

export function isAllowedPortfolioAspect(width: number, height: number): boolean {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return false;
  }

  const actual = width / height;
  const expected = PORTFOLIO_IMAGE_ASPECT.width / PORTFOLIO_IMAGE_ASPECT.height;

  return Math.abs(actual - expected) <= expected * PORTFOLIO_IMAGE_ASPECT.tolerance;
}
