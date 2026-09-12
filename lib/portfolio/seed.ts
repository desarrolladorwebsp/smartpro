import { WEB_DEVELOPMENT_CATEGORY_SLUG } from "./constants";
import { createPortfolioProject, listPortfolioProjects, updatePortfolioProject } from "./repository";

const SEED_PROJECTS = [
  {
    title: "Isapres Premium",
    subcategoryAliases: ["landing-page", "landing"],
    summary: "Landing page de conversión para asesoría previsional.",
    image: "/images/portfolio/isapres-premium.png",
    url: "https://www.isaprespremium.cl",
    tags: ["Landing Page", "Responsive", "Conversión"],
    sortOrder: 10,
  },
  {
    title: "Tu Promesa",
    subcategoryAliases: ["landing-page", "landing"],
    summary: "Sitio de captación con foco en experiencia legal y confianza.",
    image: "/images/portfolio/tu-promesa.png",
    url: "https://www.tupromesa.cl",
    tags: ["Landing Page", "UI/UX", "Legal"],
    sortOrder: 20,
  },
  {
    title: "RealStock",
    subcategoryAliases: ["e-commerce", "ecommerce"],
    summary: "E-commerce de catálogo para gestión y venta de productos.",
    image: "/images/portfolio/real-stock.png",
    url: "https://www.realstock.cl",
    tags: ["E-commerce", "UI/UX", "Catálogo"],
    sortOrder: 30,
  },
  {
    title: "Turismo Dabar",
    subcategoryAliases: ["sitio-web", "sitios-web", "website", "websites"],
    summary: "Sitio web institucional para experiencias de turismo.",
    image: "/images/portfolio/turismo-dabar.png",
    url: "https://turismodabar.cl",
    tags: ["Sitio Web", "Next.js", "Responsive"],
    sortOrder: 40,
  },
] as const;

export async function seedWebDevelopmentPortfolio() {
  const { getPrismaClient } = await import("../db");
  const prisma = getPrismaClient();
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  const category = await prisma.serviceCategory.findUnique({
    where: { slug: WEB_DEVELOPMENT_CATEGORY_SLUG },
    include: { subcategories: true },
  });

  if (!category) {
    throw new Error("Primero debes sembrar el catálogo de servicios (Desarrollo Web).");
  }

  const existing = await listPortfolioProjects({ categorySlug: WEB_DEVELOPMENT_CATEGORY_SLUG, status: "ALL" });
  let created = 0;
  let updated = 0;

  for (const project of SEED_PROJECTS) {
    const subcategory = category.subcategories.find((entry) =>
      (project.subcategoryAliases as readonly string[]).includes(entry.slug),
    );
    if (!subcategory) continue;

    const already = existing.find((entry) => entry.title.toLowerCase() === project.title.toLowerCase());

    if (already) {
      await updatePortfolioProject(already.id, {
        categorySlug: WEB_DEVELOPMENT_CATEGORY_SLUG,
        subcategoryId: subcategory.id,
        title: project.title,
        summary: project.summary,
        url: project.url,
        tags: [...project.tags],
        status: already.status === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED",
        sortOrder: project.sortOrder,
        image: already.image || project.image,
      });
      updated += 1;
      continue;
    }

    await createPortfolioProject({
      categorySlug: WEB_DEVELOPMENT_CATEGORY_SLUG,
      subcategoryId: subcategory.id,
      title: project.title,
      summary: project.summary,
      url: project.url,
      tags: [...project.tags],
      status: "PUBLISHED",
      sortOrder: project.sortOrder,
      image: project.image,
    });
    created += 1;
  }

  return { created, updated };
}
