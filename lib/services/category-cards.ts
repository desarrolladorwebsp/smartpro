import type { Plan } from "@/components/plans/PlanCard";

import { parseMoney } from "../orders/service";
import { formatPlanPrice, isInquiryPlan } from "./map-to-plan";

export type ServiceCategoryOption = {
  id: string;
  name: string;
  slug: string;
};

export type ServiceCategoryCardModel = ServiceCategoryOption & {
  planCount: number;
  description: string;
  audience: string | null;
};

export const LANDING_PAGE_INTRO =
  "Una página enfocada en presentar una oferta y convertir visitas en consultas. Ideal para campañas, lanzamientos o un servicio específico.";

export const WEBSITE_INTRO =
  "Un sitio con varias páginas para presentar tu empresa, organizar tus servicios y facilitar que tus clientes encuentren información y te contacten.";

const WEBSITE_INTRO_WITHOUT_MULTI_PAGE =
  "Un sitio para presentar tu empresa, organizar tus servicios y facilitar que tus clientes encuentren información y te contacten.";

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function uniqueCategories(categories: ServiceCategoryOption[], plans: Plan[]): ServiceCategoryOption[] {
  const byName = new Map<string, ServiceCategoryOption>();

  for (const category of categories) {
    const name = category.name.trim();
    if (!name) continue;

    byName.set(name, {
      id: category.id || category.slug || name,
      name,
      slug: category.slug || "",
    });
  }

  for (const plan of plans) {
    const name = plan.subcategory?.trim();
    if (!name || byName.has(name)) continue;

    byName.set(name, {
      id: name,
      name,
      slug: "",
    });
  }

  return [...byName.values()];
}

function deriveAudience(plans: Plan[]): string | null {
  const notes = plans.map((plan) => stripHtml(plan.note ?? "")).filter(Boolean);
  const labeled = notes.find((note) => /ideal para|dirigido a|pensado para/i.test(note));

  if (!labeled) return null;

  return labeled.replace(/^[🔥🚀⭐★]+\s*/u, "").trim();
}

function planMentionsMultiplePages(plans: Plan[]): boolean {
  return plans.some((plan) =>
    plan.features.some((feature) => /\d+\s+páginas|varias páginas/i.test(stripHtml(feature))),
  );
}

function introForCategory(categoryName: string, plans: Plan[]): string | null {
  if (categoryName === "Landing Page") return LANDING_PAGE_INTRO;
  if (categoryName === "Website") {
    return planMentionsMultiplePages(plans) ? WEBSITE_INTRO : WEBSITE_INTRO_WITHOUT_MULTI_PAGE;
  }
  return null;
}

function deriveDescription(categoryName: string, plans: Plan[]): string {
  const intro = introForCategory(categoryName, plans);
  if (intro) return intro;

  const summary = plans.map((plan) => stripHtml(plan.summary ?? "")).find(Boolean);
  if (summary) return summary;

  const countLabel = `${plans.length} ${plans.length === 1 ? "plan" : "planes"}`;
  if (plans.every((plan) => isInquiryPlan(plan))) {
    return `${countLabel} a cotizar`;
  }

  const prices = plans.map((plan) => parseMoney(plan.price)).filter((price) => Number.isFinite(price) && price > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;

  if (minPrice > 0) {
    return `${countLabel} desde ${formatPlanPrice(minPrice)}`;
  }

  return `${countLabel} disponibles`;
}

export function buildServiceCategoryCards(
  categories: ServiceCategoryOption[],
  plans: Plan[],
): ServiceCategoryCardModel[] {
  return uniqueCategories(categories, plans)
    .map((category) => {
      const categoryPlans = plans.filter((plan) => plan.subcategory?.trim() === category.name);

      return {
        ...category,
        planCount: categoryPlans.length,
        description: deriveDescription(category.name, categoryPlans),
        audience: deriveAudience(categoryPlans),
      };
    })
    .filter((card) => card.planCount > 0);
}
