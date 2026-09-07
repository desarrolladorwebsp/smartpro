import * as plansData from "../../public/js/plans.js";
import { parseMoney } from "../orders/service";
import { slugify } from "./repository";

export type CatalogSourceItem = {
  categoryName: string;
  categorySlug: string;
  categoryOrder: number;
  subcategoryName: string;
  subcategorySlug: string;
  subcategoryOrder: number;
  planName: string;
  planSlug: string;
  planOrder: number;
  price: number;
  pricePrefix: string;
  taxLabel: string;
  summary: string;
  badge: string;
  note: string;
  featureGroupTitle: string;
  highlighted: boolean;
  icon: string;
  externalLink: string;
  items: string[];
};

type RawPlan = {
  name?: string;
  price?: string | number | null;
  oldPrice?: string | null;
  tax?: string | null;
  summary?: string | null;
  badge?: string | null;
  note?: string | null;
  featureGroupTitle?: string | null;
  highlighted?: boolean;
  icon?: string | null;
  link?: string | null;
  link2?: string | null;
  features?: string[];
  isIsapre?: boolean;
  isConsalud?: boolean;
  isCotizalo?: boolean;
};

type CatalogGroup = {
  key: keyof typeof plansData;
  categoryName: string;
  defaultSubcategory: string;
};

const GROUPS: CatalogGroup[] = [
  { key: "desarrolloWeb", categoryName: "Desarrollo Web", defaultSubcategory: "Sitios web" },
  { key: "campanaPublicitaria", categoryName: "Campañas Publicitarias", defaultSubcategory: "Campañas Publicitarias" },
  { key: "redesSociales", categoryName: "Redes Sociales & Contenido", defaultSubcategory: "Redes Sociales" },
  { key: "produccionVisual", categoryName: "Producción Audiovisual", defaultSubcategory: "Producción Audiovisual" },
  { key: "automatizacionBots", categoryName: "Automatización & Conversión", defaultSubcategory: "Automatización" },
  { key: "membresias", categoryName: "Membresías & Negocios", defaultSubcategory: "Membresías" },
  { key: "negocioCompleto", categoryName: "Negocio Completo", defaultSubcategory: "Packs digitales" },
];

function stripHtml(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function subcategoryForPlan(group: CatalogGroup, plan: RawPlan): string {
  const name = String(plan.name ?? "").toLowerCase();

  if (group.key === "desarrolloWeb") {
    if (name.includes("sitio")) return "Website";
    if (name.includes("smartweb")) return "Landing Page";
    return "Desarrollo Web";
  }

  if (group.key === "redesSociales") {
    if (name.includes("pieza")) return "Piezas gráficas";
    if (name.includes("linkedin")) return "LinkedIn";
    return "Redes Sociales";
  }

  if (group.key === "automatizacionBots") {
    if (name.includes("agenda")) return "Agenda electrónica";
    return "Chatbots";
  }

  if (group.key === "membresias") {
    if (plan.isConsalud || name.includes("consalud")) return "Consalud";
    if (plan.isCotizalo || name.includes("smart access") || name.includes("smart team") || name.includes("smart growth") || name.includes("smart corporate")) {
      return "Cotízalo Antes";
    }
    if (plan.isIsapre || name.includes("smart flow")) return "Smart Flow";
    return "Membresías";
  }

  return group.defaultSubcategory;
}

export function getCatalogSource(): CatalogSourceItem[] {
  const items: CatalogSourceItem[] = [];

  GROUPS.forEach((group, categoryOrder) => {
    const plans = plansData[group.key];
    if (!Array.isArray(plans)) return;

    const subcategoryOrders = new Map<string, number>();

    plans.forEach((plan, planIndex) => {
      const raw = plan as RawPlan;
      const planName = String(raw.name ?? "").trim();
      if (!planName) return;

      const subcategoryName = subcategoryForPlan(group, raw);
      if (!subcategoryOrders.has(subcategoryName)) {
        subcategoryOrders.set(subcategoryName, subcategoryOrders.size);
      }

      items.push({
        categoryName: group.categoryName,
        categorySlug: slugify(group.categoryName),
        categoryOrder,
        subcategoryName,
        subcategorySlug: slugify(subcategoryName),
        subcategoryOrder: subcategoryOrders.get(subcategoryName) ?? 0,
        planName,
        planSlug: slugify(planName),
        planOrder: planIndex,
        price: parseMoney(raw.price),
        pricePrefix: raw.oldPrice === "desde" ? "desde" : "",
        taxLabel: String(raw.tax ?? "+ IVA").trim() || "+ IVA",
        summary: stripHtml(String(raw.summary ?? "")),
        badge: String(raw.badge ?? "").trim(),
        note: stripHtml(String(raw.note ?? "")),
        featureGroupTitle: String(raw.featureGroupTitle ?? "").trim(),
        highlighted: Boolean(raw.highlighted),
        icon: String(raw.icon ?? "").trim(),
        externalLink: String(raw.link ?? raw.link2 ?? "").trim(),
        items: Array.isArray(raw.features) ? raw.features.map((feature) => stripHtml(String(feature))).filter(Boolean) : [],
      });
    });
  });

  return items;
}
