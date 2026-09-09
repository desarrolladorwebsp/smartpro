import { prisma } from "../lib/db";
import { getPublicServicesForHome } from "../lib/services/public";
import { getServicePlanById, updateServicePlan, upsertServicePlan } from "../lib/services/repository";

async function main() {
  if (!prisma) throw new Error("Prisma client is not available.");

  const before = {
    services: await prisma.serviceCategory.count(),
    categories: await prisma.serviceSubcategory.count(),
    plans: await prisma.servicePlan.count(),
    items: await prisma.servicePlanItem.count(),
  };

  const publicCatalog = await getPublicServicesForHome();
  const web = publicCatalog.find((service) => service.slug === "desarrollo-web");
  if (!web) throw new Error("No está el servicio Desarrollo Web en el catálogo público.");

  const landingPlans = web.plans.filter((plan) => plan.subcategory === "Landing Page");
  if (landingPlans.length < 2) throw new Error("Faltan planes de Landing Page.");

  const highlighted = web.plans.find((plan) => plan.highlighted);
  if (!highlighted?.id) throw new Error("No hay un plan destacado de Desarrollo Web.");

  const original = await getServicePlanById(highlighted.id);
  if (!original) throw new Error("No se pudo leer el plan destacado.");

  const updatedBadge = "TEST PERSISTENCIA";
  await updateServicePlan(original.id, { badge: updatedBadge });
  const afterUpdate = await getServicePlanById(original.id);
  if (afterUpdate?.badge !== updatedBadge) {
    throw new Error("La edición del plan no persistió en la base de datos.");
  }

  await upsertServicePlan({
    id: original.id,
    slug: original.slug,
    subcategoryId: original.subcategoryId,
    name: original.name,
    price: original.price,
    badge: original.badge,
    items: original.items,
  });

  const restored = await getServicePlanById(original.id);
  if (restored?.badge !== original.badge) {
    throw new Error("No se pudo restaurar el badge original.");
  }

  const after = {
    services: await prisma.serviceCategory.count(),
    categories: await prisma.serviceSubcategory.count(),
    plans: await prisma.servicePlan.count(),
    items: await prisma.servicePlanItem.count(),
  };

  console.log("Persistencia OK", {
    before,
    after,
    publicServices: publicCatalog.map((service) => ({
      name: service.name,
      categories: service.categories.map((category) => category.name),
      plans: service.plans.length,
    })),
  });

  await prisma.$disconnect();
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
