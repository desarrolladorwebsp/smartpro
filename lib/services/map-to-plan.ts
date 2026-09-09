import type { Plan } from "@/components/plans/PlanCard";

import type { ServicePlanRecord } from "./types";

export function formatPlanPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function mapServicePlanToPlan(plan: ServicePlanRecord): Plan {
  return {
    id: plan.id,
    category: plan.categoryName,
    subcategory: plan.subcategoryName || null,
    badge: plan.badge || null,
    icon: plan.icon || null,
    name: plan.name,
    oldPrice: plan.pricePrefix || null,
    price: formatPlanPrice(plan.price),
    tax: plan.taxLabel || null,
    taxRate: plan.taxRate,
    summary: plan.summary || null,
    featureGroupTitle: plan.featureGroupTitle || null,
    features: plan.items
      .filter((item) => item.status === "ACTIVE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.label),
    note: plan.note || null,
    highlighted: plan.highlighted,
    link: plan.externalLink || undefined,
  };
}

export function mapServicePlansToPlans(plans: ServicePlanRecord[]): Plan[] {
  return plans.map(mapServicePlanToPlan);
}
