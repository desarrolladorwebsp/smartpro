import type { Plan } from "@/components/plans/PlanCard";

import { parseMoney } from "../orders/service";
import { formatPlanPrice } from "./map-to-plan";

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

function deriveDescription(plans: Plan[]): string {
  const summary = plans.map((plan) => stripHtml(plan.summary ?? "")).find(Boolean);
  if (summary) return summary;

  const prices = plans.map((plan) => parseMoney(plan.price)).filter((price) => Number.isFinite(price) && price > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const countLabel = `${plans.length} ${plans.length === 1 ? "plan" : "planes"}`;

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
        description: deriveDescription(categoryPlans),
        audience: deriveAudience(categoryPlans),
      };
    })
    .filter((card) => card.planCount > 0);
}
