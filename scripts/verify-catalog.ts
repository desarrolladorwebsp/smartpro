import { prisma } from "../lib/db";

async function main() {
  if (!prisma) throw new Error("Prisma client is not available.");

  const [categories, subcategories, plans, items] = await Promise.all([
    prisma.serviceCategory.count(),
    prisma.serviceSubcategory.count(),
    prisma.servicePlan.count(),
    prisma.servicePlanItem.count(),
  ]);

  const duplicateCategories = await prisma.$queryRawUnsafe<Array<{ slug: string; c: bigint }>>(
    "SELECT slug, COUNT(*) as c FROM `ServiceCategory` GROUP BY slug HAVING c > 1",
  );
  const duplicateSubcategories = await prisma.$queryRawUnsafe<Array<{ slug: string; c: bigint }>>(
    "SELECT categoryId, slug, COUNT(*) as c FROM `ServiceSubcategory` GROUP BY categoryId, slug HAVING c > 1",
  );
  const duplicatePlans = await prisma.$queryRawUnsafe<Array<{ slug: string; c: bigint }>>(
    "SELECT subcategoryId, slug, COUNT(*) as c FROM `ServicePlan` GROUP BY subcategoryId, slug HAVING c > 1",
  );

  const sample = await prisma.servicePlan.findMany({
    take: 5,
    include: { subcategory: { include: { category: true } }, items: true },
    orderBy: { sortOrder: "asc" },
  });

  console.log({ categories, subcategories, plans, items });
  console.log({
    duplicateCategories: duplicateCategories.length,
    duplicateSubcategories: duplicateSubcategories.length,
    duplicatePlans: duplicatePlans.length,
  });
  console.log(
    sample.map((plan) => ({
      category: plan.subcategory.category.name,
      subcategory: plan.subcategory.name,
      plan: plan.name,
      items: plan.items.length,
      price: Number(plan.price),
    })),
  );

  await prisma.$disconnect();
}

void main();
