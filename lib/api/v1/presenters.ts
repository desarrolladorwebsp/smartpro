import { formatCurrency, TAX_RATE } from "../../orders/service";
import type { CustomerOrder } from "../../orders/repository";
import type { PortfolioProjectRecord } from "../../portfolio/types";
import type { SaleRecord } from "../../sales/types";
import type { CatalogTree, ServiceCategoryRecord, ServicePlanRecord } from "../../services/types";
import { isInquiryPricedAmount } from "../../services/map-to-plan";

export const API_CURRENCY = "CLP" as const;

export type ApiMoney = {
  amount: number;
  currency: typeof API_CURRENCY;
  formatted: string;
};

export type ApiPlanPrice = {
  net: ApiMoney;
  tax: ApiMoney;
  gross: ApiMoney;
  taxRate: number;
  taxLabel: string;
  pricePrefix: string;
  /// `true` cuando el plan no tiene precio publicado y debe cotizarse.
  quoteOnly: boolean;
};

export type ApiPlan = {
  id: string;
  name: string;
  slug: string;
  summary: string;
  badge: string;
  note: string;
  icon: string;
  highlighted: boolean;
  sortOrder: number;
  externalLink: string;
  price: ApiPlanPrice;
  features: string[];
  featureGroupTitle: string;
  service: { id: string; name: string };
  category: { id: string; name: string };
  updatedAt: string;
};

export type ApiCategory = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  plans: ApiPlan[];
};

export type ApiService = {
  id: string;
  name: string;
  slug: string;
  description: string;
  coverImage: string;
  sortOrder: number;
  categories: ApiCategory[];
};

/// Las imágenes se guardan como rutas relativas a SmartPro, que no significan
/// nada para un sitio alojado en otro dominio. La API siempre las publica
/// absolutas para que la subpágina pueda mostrarlas tal cual.
export function absoluteMediaUrl(path: string): string {
  const trimmed = String(path ?? "").trim();

  if (!trimmed || /^https?:\/\//i.test(trimmed) || trimmed.startsWith("data:")) {
    return trimmed;
  }

  const base = (process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/$/, "");

  if (!base) {
    return trimmed;
  }

  return `${base}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

function money(amount: number): ApiMoney {
  const rounded = Math.round(amount);

  return {
    amount: rounded,
    currency: API_CURRENCY,
    formatted: formatCurrency(rounded),
  };
}

export function presentPlan(plan: ServicePlanRecord): ApiPlan {
  const quoteOnly = isInquiryPricedAmount(plan.price);
  const taxRate = plan.taxRate ?? TAX_RATE;
  const net = quoteOnly ? 0 : plan.price;
  const tax = net * taxRate;

  return {
    id: plan.id,
    name: plan.name,
    slug: plan.slug,
    summary: plan.summary,
    badge: plan.badge,
    note: plan.note,
    icon: plan.icon,
    highlighted: plan.highlighted,
    sortOrder: plan.sortOrder,
    externalLink: plan.externalLink,
    price: {
      net: money(net),
      tax: money(tax),
      gross: money(net + tax),
      taxRate,
      taxLabel: plan.taxLabel,
      pricePrefix: plan.pricePrefix,
      quoteOnly,
    },
    features: plan.items
      .filter((item) => item.status === "ACTIVE")
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((item) => item.label),
    featureGroupTitle: plan.featureGroupTitle,
    service: { id: plan.categoryId, name: plan.categoryName },
    category: { id: plan.subcategoryId, name: plan.subcategoryName },
    updatedAt: plan.updatedAt,
  };
}

export function presentServiceSummary(service: ServiceCategoryRecord) {
  return {
    id: service.id,
    name: service.name,
    slug: service.slug,
    description: service.description,
    coverImage: absoluteMediaUrl(service.coverImage),
    sortOrder: service.sortOrder,
  };
}

export function presentCatalogTree(tree: CatalogTree): ApiService[] {
  return tree.map((service) => ({
    ...presentServiceSummary(service),
    categories: service.subcategories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      sortOrder: category.sortOrder,
      plans: category.plans.map(presentPlan),
    })),
  }));
}

export type ApiCheckoutSession = {
  orderId: string;
  createdAt: string;
  paymentStatus: CustomerOrder["paymentStatus"];
  orderStatus: CustomerOrder["orderStatus"];
  paymentMethod: CustomerOrder["paymentMethod"];
  externalReference: string;
  returnUrl: string;
  amounts: { subtotal: ApiMoney; tax: ApiMoney; total: ApiMoney };
  customer: { name: string; email: string; phone: string; company: string };
  items: Array<{
    planId: string;
    name: string;
    category: string;
    quantity: number;
    unitPrice: ApiMoney;
    total: ApiMoney;
  }>;
};

export function presentCheckoutSession(
  order: CustomerOrder,
  extra: { returnUrl?: string; externalReference?: string } = {},
): ApiCheckoutSession {
  return {
    orderId: order.id,
    createdAt: order.createdAt,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    paymentMethod: order.paymentMethod,
    externalReference: extra.externalReference ?? order.apiExternalReference ?? "",
    returnUrl: extra.returnUrl ?? order.apiReturnUrl ?? "",
    amounts: {
      subtotal: money(order.subtotal),
      tax: money(order.tax),
      total: money(order.total),
    },
    customer: {
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      company: order.customer.company ?? "",
    },
    items: order.items.map((item) => ({
      planId: item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPrice: money(item.unitPrice),
      total: money(item.unitPrice * item.quantity * (1 + (item.taxRate ?? TAX_RATE))),
    })),
  };
}

export type ApiSale = {
  id: string;
  number: string;
  status: SaleRecord["status"];
  source: SaleRecord["source"];
  soldAt: string;
  paymentMethod: SaleRecord["paymentMethod"];
  externalReference: string;
  orderId: string | null;
  quoteNumber: string | null;
  observation: string;
  amounts: { subtotal: ApiMoney; tax: ApiMoney; total: ApiMoney };
  client: { id: string; company: string; contactName: string };
  createdAt: string;
};

export function presentSale(sale: SaleRecord): ApiSale {
  return {
    id: sale.id,
    number: sale.number,
    status: sale.status,
    source: sale.source,
    soldAt: sale.soldAt,
    paymentMethod: sale.paymentMethod,
    externalReference: sale.externalReference,
    orderId: sale.orderId,
    quoteNumber: sale.quoteNumber,
    observation: sale.observation,
    amounts: {
      subtotal: money(sale.subtotal),
      tax: money(sale.tax),
      total: money(sale.total),
    },
    client: {
      id: sale.clientId,
      company: sale.clientCompany,
      contactName: sale.clientName,
    },
    createdAt: sale.createdAt,
  };
}

export type ApiPortfolioProject = {
  id: string;
  title: string;
  slug: string;
  summary: string;
  image: string;
  url: string;
  tags: string[];
  service: { id: string; name: string; slug: string };
  category: { id: string; name: string; slug: string };
  sortOrder: number;
  updatedAt: string;
};

export function presentPortfolioProject(project: PortfolioProjectRecord): ApiPortfolioProject {
  return {
    id: project.id,
    title: project.title,
    slug: project.slug,
    summary: project.summary,
    image: absoluteMediaUrl(project.image),
    url: project.url,
    tags: project.tags,
    service: { id: project.categoryId, name: project.categoryName, slug: project.categorySlug },
    category: { id: project.subcategoryId, name: project.subcategoryName, slug: project.subcategorySlug },
    sortOrder: project.sortOrder,
    updatedAt: project.updatedAt,
  };
}
