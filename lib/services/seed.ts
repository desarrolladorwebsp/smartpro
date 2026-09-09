import { prisma } from "../db";
import { getCatalogSource } from "./catalog-source";
import { upsertServiceCategory, upsertServicePlan, upsertServiceSubcategory } from "./repository";

export async function seedServiceCatalog() {
  const source = getCatalogSource();
  const categories = new Map<string, Awaited<ReturnType<typeof upsertServiceCategory>>>();
  const subcategories = new Map<string, Awaited<ReturnType<typeof upsertServiceSubcategory>>>();
  let plans = 0;
  let items = 0;

  console.log(`Sembrando ${source.length} planes de forma idempotente...`);

  for (const [index, entry] of source.entries()) {
    let category = categories.get(entry.categorySlug);
    if (!category) {
      category = await upsertServiceCategory({
        name: entry.categoryName,
        slug: entry.categorySlug,
        sortOrder: entry.categoryOrder,
        status: "ACTIVE",
      });
      categories.set(entry.categorySlug, category);
    }

    const subcategoryKey = `${category.id}:${entry.subcategorySlug}`;
    let subcategory = subcategories.get(subcategoryKey);
    if (!subcategory) {
      subcategory = await upsertServiceSubcategory({
        categoryId: category.id,
        name: entry.subcategoryName,
        slug: entry.subcategorySlug,
        sortOrder: entry.subcategoryOrder,
        status: "ACTIVE",
      });
      subcategories.set(subcategoryKey, subcategory);
    }

    const plan = await upsertServicePlan({
      subcategoryId: subcategory.id,
      slug: entry.planSlug,
      name: entry.planName,
      price: entry.price,
      pricePrefix: entry.pricePrefix,
      taxLabel: entry.taxLabel,
      summary: entry.summary,
      badge: entry.badge,
      note: entry.note,
      featureGroupTitle: entry.featureGroupTitle,
      highlighted: entry.highlighted,
      sortOrder: entry.planOrder,
      status: "ACTIVE",
      icon: entry.icon,
      externalLink: entry.externalLink,
      items: entry.items.map((label, itemIndex) => ({ label, sortOrder: itemIndex, status: "ACTIVE" as const })),
    });

    plans += 1;
    items += plan.items.length;
    console.log(`[${index + 1}/${source.length}] ${entry.categoryName} / ${entry.subcategoryName} / ${entry.planName}`);
  }

  return {
    categories: categories.size,
    subcategories: subcategories.size,
    plans,
    items,
  };
}

export async function disconnectCatalogSeed() {
  await prisma?.$disconnect();
}
