export {};

process.env.DB_NAME = process.env.TARGET_DB || process.env.DB_NAME || "smartpro_db";

async function main() {
  const { listPortfolioCategories, listPortfolioProjects, createPortfolioProject, deletePortfolioProject } =
    await import("../lib/portfolio/repository");

  const categories = await listPortfolioCategories();
  if (!Array.isArray(categories)) {
    throw new Error("listPortfolioCategories no devolvió un array.");
  }

  const before = await listPortfolioProjects({ status: "ALL" });
  if (!Array.isArray(before)) {
    throw new Error("listPortfolioProjects no devolvió un array.");
  }

  const subcategoryId = categories[0]?.subcategories[0]?.id;
  if (!subcategoryId) {
    throw new Error("No hay subcategoría de Desarrollo Web para crear un proyecto de prueba.");
  }

  const suffix = `${Date.now()}`;
  const created = await createPortfolioProject({
    subcategoryId,
    title: `Probe Portafolio ${suffix}`,
    summary: "Proyecto temporal de verificación.",
    url: "https://smartpro.cl",
    tags: ["Probe"],
    status: "DRAFT",
    sortOrder: 999,
    image: "/images/portfolio/isapres-premium.png",
  });

  const afterCreate = await listPortfolioProjects({ status: "ALL" });
  const appeared = afterCreate.some((project) => project.id === created.id);
  await deletePortfolioProject(created.id);
  const afterDelete = await listPortfolioProjects({ status: "ALL" });

  if (!appeared) {
    throw new Error("El proyecto creado no apareció en el listado.");
  }

  console.log(
    JSON.stringify(
      {
        database: process.env.TARGET_DB || process.env.DB_NAME,
        categories: categories.length,
        projects: before.length,
        emptyIsSuccess: true,
        createdAppearsInList: appeared,
        cleanedUp: afterDelete.every((project) => project.id !== created.id),
      },
      null,
      2,
    ),
  );
}

void main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
