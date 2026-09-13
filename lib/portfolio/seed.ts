import { promises as fs } from "node:fs";
import path from "node:path";

import type { PrismaClient } from "@prisma/client";

import { WEB_DEVELOPMENT_CATEGORY_SLUG } from "./constants";
import { getPortfolioMediaPath } from "./image";
import { ensurePortfolioProjectTable } from "./schema";
import { buildPortfolioSlug } from "./validation";

type SeedCategory = "sitio-web" | "landing-page" | "sistema" | "e-commerce";

type SeedProject = {
  title: string;
  category: SeedCategory;
  summary: string;
  sourceFile: string;
  url: string;
  tags: string[];
  sortOrder: number;
};

const SUBCATEGORY_ALIASES: Record<SeedCategory, readonly string[]> = {
  "sitio-web": ["sitio-web", "sitios-web", "website", "websites"],
  "landing-page": ["landing-page", "landing"],
  sistema: ["sistema", "sistemas", "system", "systems"],
  "e-commerce": ["e-commerce", "ecommerce"],
};

const SEED_PROJECTS: SeedProject[] = [
  {
    title: "AppsFly",
    category: "sistema",
    summary:
      "Sistema de ventas, inventario y reportes en un solo panel. Next.js, Prisma y dashboards responsivos para leer el negocio al instante.",
    sourceFile: "appsfly.png",
    url: "https://appsfly.cl",
    tags: ["Sistema", "Next.js", "Prisma", "Responsive"],
    sortOrder: 10,
  },
  {
    title: "Smart One",
    category: "sistema",
    summary:
      "Cartera digital de clientes para registrar prospectos y seguir oportunidades. Next.js, Prisma y flujo móvil para el equipo comercial.",
    sourceFile: "smart-one.png",
    url: "https://smartone.cl",
    tags: ["Sistema", "Next.js", "Prisma", "CRM"],
    sortOrder: 20,
  },
  {
    title: "Axessia",
    category: "sistema",
    summary:
      "Plataforma para cotizar medicamentos y dispositivos médicos con acceso inteligente. Next.js, Prisma y SEO técnico en salud.",
    sourceFile: "axessia.png",
    url: "https://axessia.cl",
    tags: ["Sistema", "Next.js", "Prisma", "SEO"],
    sortOrder: 30,
  },
  {
    title: "Cotizador Premium",
    category: "sistema",
    summary:
      "Motor de cotización de Isapres con comparación de coberturas en segundos. Next.js, Prisma y captación de leads con SEO avanzado.",
    sourceFile: "cotizador-premium.png",
    url: "https://cotizadorpremium.cl",
    tags: ["Sistema", "Next.js", "Prisma", "SEO"],
    sortOrder: 40,
  },
  {
    title: "Cotízalo Antes",
    category: "sitio-web",
    summary:
      "Sitio web para comparar Isapres, AFP y seguros antes de decidir. Next.js, SEO avanzado y experiencia responsiva de alto rendimiento.",
    sourceFile: "cotizalo-antes.png",
    url: "https://www.cotizaloantes.cl",
    tags: ["Sitio Web", "Next.js", "SEO", "Responsive"],
    sortOrder: 50,
  },
  {
    title: "Hotel Casa Paraíso",
    category: "sitio-web",
    summary:
      "Sitio hotelero con sedes, habitaciones y consulta de reservas. Next.js, SEO local y diseño responsivo orientado a conversión.",
    sourceFile: "hotel-casa-paraiso.png",
    url: "https://casaparaisohotel.cl",
    tags: ["Sitio Web", "Next.js", "SEO", "Responsive"],
    sortOrder: 60,
  },
  {
    title: "Isapres Premium",
    category: "sitio-web",
    summary:
      "Sitio web con cotizador digital de Isapres y captación de leads. Next.js, Prisma y SEO para asesoría previsional en Chile.",
    sourceFile: "isapres-premium.png",
    url: "https://www.isaprespremium.cl",
    tags: ["Sitio Web", "Next.js", "Prisma", "SEO"],
    sortOrder: 70,
  },
  {
    title: "Agente Protegido",
    category: "landing-page",
    summary:
      "Landing de defensa administrativa para ejecutivos de salud. Next.js, SEO local y CTAs claros para solicitar asesoría legal.",
    sourceFile: "agente-protegido.png",
    url: "https://agenteprotegido.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Conversión"],
    sortOrder: 80,
  },
  {
    title: "Experto en Salud",
    category: "landing-page",
    summary:
      "Landing de asesoría en Isapres con cotización y agendamiento. Next.js, SEO y experiencia mobile-first para convertir consultas.",
    sourceFile: "experto-en-salud.png",
    url: "https://expertoensalud.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Responsive"],
    sortOrder: 90,
  },
  {
    title: "Kitchen Solutions",
    category: "landing-page",
    summary:
      "Landing de cocinas 3D a medida, con prueba social y agendamiento. Next.js, SEO y diseño responsivo enfocado en conversión.",
    sourceFile: "kitchen-solution.png",
    url: "https://kitchensolutions.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Conversión"],
    sortOrder: 100,
  },
  {
    title: "Pollitos con Papas",
    category: "landing-page",
    summary:
      "Landing gastronómica para menú, locales y pedidos. Next.js, SEO local y experiencia mobile-first con sabor de marca.",
    sourceFile: "pollitos-con-papas.png",
    url: "https://pollitoconpapas.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Responsive"],
    sortOrder: 110,
  },
  {
    title: "Turismo Dabar",
    category: "landing-page",
    summary:
      "Landing de giras de estudio all inclusive al sur de Chile. Next.js, SEO turístico y llamados a cotizar viajes grupales.",
    sourceFile: "turismo-dabar.png",
    url: "https://turismodabar.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Conversión"],
    sortOrder: 120,
  },
  {
    title: "Tu Promesa",
    category: "landing-page",
    summary:
      "Landing para visibilizar incumplimientos inmobiliarios y denunciar casos. Next.js, SEO y formularios de alta conversión.",
    sourceFile: "tu-promesa.png",
    url: "https://www.tupromesa.cl",
    tags: ["Landing Page", "Next.js", "SEO", "Legal"],
    sortOrder: 130,
  },
  {
    title: "RealStock",
    category: "e-commerce",
    summary:
      "E-commerce de catálogo para gestionar y vender productos en línea. Next.js, Prisma y experiencia de compra responsiva.",
    sourceFile: "real-stock.png",
    url: "https://www.realstock.cl",
    tags: ["E-commerce", "Next.js", "Prisma", "Catálogo"],
    sortOrder: 140,
  },
];

function portfolioImagePath(fileName: string) {
  return path.join(process.cwd(), "public", "images", "portfolio", fileName);
}

async function resolveUniqueSlug(
  prisma: PrismaClient,
  categoryId: string,
  title: string,
  excludeId?: string,
) {
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

async function ensureSistemaSubcategory(prisma: PrismaClient, categoryId: string) {
  const slug = "sistemas";
  const existing = await prisma.serviceSubcategory.findUnique({
    where: { categoryId_slug: { categoryId, slug } },
  });

  if (existing) {
    if (existing.name !== "Sistema" || existing.status !== "ACTIVE") {
      await prisma.serviceSubcategory.update({
        where: { id: existing.id },
        data: { name: "Sistema", status: "ACTIVE" },
      });
    }
    return;
  }

  await prisma.serviceSubcategory.create({
    data: {
      categoryId,
      name: "Sistema",
      slug,
      sortOrder: 90,
      status: "ACTIVE",
    },
  });
}

export async function seedWebDevelopmentPortfolio(prisma: PrismaClient) {
  await ensurePortfolioProjectTable(prisma);
  await prisma.$connect();

  const category = await prisma.serviceCategory.findUnique({
    where: { slug: WEB_DEVELOPMENT_CATEGORY_SLUG },
    include: { subcategories: true },
  });

  if (!category) {
    throw new Error("Primero debes sembrar el catálogo de servicios (Desarrollo Web).");
  }

  await ensureSistemaSubcategory(prisma, category.id);

  const categoryWithSubs = await prisma.serviceCategory.findUnique({
    where: { id: category.id },
    include: { subcategories: true },
  });

  if (!categoryWithSubs) {
    throw new Error("No se pudo cargar Desarrollo Web.");
  }

  const existing = await prisma.portfolioProject.findMany({
    where: { categoryId: categoryWithSubs.id },
    select: { id: true, title: true, slug: true, status: true },
  });

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const project of SEED_PROJECTS) {
    const aliases = SUBCATEGORY_ALIASES[project.category];
    const subcategory = categoryWithSubs.subcategories.find((entry) => aliases.includes(entry.slug));

    if (!subcategory) {
      skipped += 1;
      continue;
    }

    const imagePath = portfolioImagePath(project.sourceFile);
    const bytes = await fs.readFile(imagePath);
    const slugHint = buildPortfolioSlug(project.title);
    const already = existing.find(
      (entry) =>
        entry.title.toLowerCase() === project.title.toLowerCase() || entry.slug === slugHint,
    );

    if (already) {
      await prisma.portfolioProject.update({
        where: { id: already.id },
        data: {
          subcategoryId: subcategory.id,
          title: project.title,
          slug: await resolveUniqueSlug(prisma, categoryWithSubs.id, project.title, already.id),
          summary: project.summary,
          url: project.url,
          tags: [...project.tags],
          status: already.status === "ARCHIVED" ? "ARCHIVED" : "PUBLISHED",
          sortOrder: project.sortOrder,
          image: getPortfolioMediaPath(already.id),
          imageMime: "image/png",
          imageBytes: bytes,
        },
      });
      updated += 1;
      continue;
    }

    const row = await prisma.portfolioProject.create({
      data: {
        categoryId: categoryWithSubs.id,
        subcategoryId: subcategory.id,
        title: project.title,
        slug: await resolveUniqueSlug(prisma, categoryWithSubs.id, project.title),
        summary: project.summary,
        image: "",
        url: project.url,
        tags: [...project.tags],
        status: "PUBLISHED",
        sortOrder: project.sortOrder,
      },
    });

    await prisma.portfolioProject.update({
      where: { id: row.id },
      data: {
        image: getPortfolioMediaPath(row.id),
        imageMime: "image/png",
        imageBytes: bytes,
      },
    });

    created += 1;
  }

  return { created, updated, skipped };
}
