import type { Plan } from "@/components/plans/PlanCard";

import { parseMoney } from "../orders/service";
import type { ServicePlanRecord } from "./types";

export const INQUIRY_PRICE_LABEL = "Consultar";

export function formatPlanPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

export function isInquiryPricedAmount(price: number): boolean {
  return !Number.isFinite(price) || price <= 0;
}

export function getPlanInquiryHref(planName: string): string {
  return `/?servicio=${encodeURIComponent(planName)}#contacto`;
}

export function isInquiryPlan(plan: Pick<Plan, "price" | "link">): boolean {
  const label = String(plan.price ?? "").trim().toLowerCase();
  if (label === INQUIRY_PRICE_LABEL.toLowerCase()) return true;
  if (plan.link && /#contacto/i.test(plan.link)) return true;
  return isInquiryPricedAmount(parseMoney(plan.price));
}

export function mapServicePlanToPlan(plan: ServicePlanRecord): Plan {
  const inquiry = isInquiryPricedAmount(plan.price);

  return {
    id: plan.id,
    category: plan.categoryName,
    subcategory: plan.subcategoryName || null,
    badge: plan.badge || null,
    icon: plan.icon || null,
    name: plan.name,
    oldPrice: inquiry ? null : plan.pricePrefix || null,
    price: inquiry ? INQUIRY_PRICE_LABEL : formatPlanPrice(plan.price),
    tax: inquiry ? null : plan.taxLabel || null,
    taxRate: plan.taxRate,
    summary: plan.summary || null,
    featureGroupTitle: plan.featureGroupTitle || null,
    features: plan.items
      .filter((item) => item.status === "ACTIVE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.label),
    note: plan.note || null,
    highlighted: plan.highlighted,
    link: inquiry ? plan.externalLink || getPlanInquiryHref(plan.name) : plan.externalLink || undefined,
  };
}

export function mapServicePlansToPlans(plans: ServicePlanRecord[]): Plan[] {
  return plans.map(mapServicePlanToPlan);
}
