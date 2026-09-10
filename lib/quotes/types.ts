export const QUOTE_STATUSES = ["DRAFT", "CREATED", "SENT", "ACCEPTED", "REJECTED"] as const;

export type QuoteStatus = (typeof QUOTE_STATUSES)[number];

export const QUOTE_STATUS_LABELS: Record<QuoteStatus, string> = {
  DRAFT: "Borrador",
  CREATED: "Creada",
  SENT: "Enviada",
  ACCEPTED: "Aceptada",
  REJECTED: "Rechazada",
};

export type QuoteItemInput = {
  planId: string;
  quantity?: number;
};

export type QuoteItemRecord = {
  id: string;
  planId: string | null;
  planName: string;
  categoryName: string;
  subcategoryName: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
  includedItems: string[];
  subtotal: number;
  tax: number;
  total: number;
  sortOrder: number;
};

export type QuoteRecord = {
  id: string;
  number: string;
  status: QuoteStatus;
  clientId: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  clientPhone: string;
  clientRut: string;
  clientAddress: string;
  createdByEmail: string;
  notes: string;
  validUntil: string | null;
  deliveryBusinessDays: number;
  initialPaymentPercent: number;
  subtotal: number;
  tax: number;
  total: number;
  sentAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: QuoteItemRecord[];
};

export type QuoteListFilters = {
  query?: string;
  status?: QuoteStatus | "ALL";
  clientId?: string;
  from?: string;
  to?: string;
};

export type QuoteCatalogPlan = {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  price: number;
  taxRate: number;
  taxLabel: string;
  summary: string;
  items: string[];
};

export type QuoteCatalogGroup = {
  id: string;
  name: string;
  plans: QuoteCatalogPlan[];
};

export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return QUOTE_STATUSES.includes(value as QuoteStatus);
}

export function getQuoteStatusLabel(status: QuoteStatus): string {
  return QUOTE_STATUS_LABELS[status];
}
