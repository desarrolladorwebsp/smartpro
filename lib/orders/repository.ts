import type { Order, OrderItem, Prisma } from "@prisma/client";

import { getPrismaClient } from "../db";
import { buildOrderItems, buildOrderTotals, generateOrderId, TAX_RATE, type CartItemDraft } from "./service";

export type CustomerOrder = {
  id: string;
  createdAt: string;
  orderStatus: "pending" | "confirmed" | "cancelled";
  status: "pending" | "confirmed" | "cancelled";
  customer: {
    name: string;
    email: string;
    phone: string;
    company?: string;
  };
  items: CartItemDraft[];
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: "pending" | "paid" | "failed" | "cancelled";
  paymentMethod: "simulated" | "transbank" | "mercadopago";
  preferenceId?: string;
  mercadopagoPaymentId?: string;
  webpayToken?: string;
  processedPaymentKeys?: string[];
  notificationEmailSentAt?: string;
};

const ORDER_INCLUDE = {
  items: {
    orderBy: { id: "asc" as const },
  },
} as const;

type OrderWithItems = Order & { items: OrderItem[] };

function getPrisma() {
  const client = getPrismaClient();

  if (!client) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return client;
}

function decimalToNumber(value: Prisma.Decimal | number | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }

  if (value == null) {
    return 0;
  }

  return Number(value);
}

function parseProcessedPaymentKeys(value: Prisma.JsonValue | null | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is string => typeof entry === "string");
}

function normalizePaymentMethod(value: string | undefined | null): CustomerOrder["paymentMethod"] {
  if (value === "simulated" || value === "transbank" || value === "mercadopago") {
    return value;
  }

  return "transbank";
}

function normalizePaymentStatus(value: string | undefined | null): CustomerOrder["paymentStatus"] {
  if (value === "pending" || value === "paid" || value === "failed" || value === "cancelled") {
    return value;
  }

  return "pending";
}

function normalizeOrderStatus(value: string | undefined | null): CustomerOrder["orderStatus"] {
  if (value === "pending" || value === "confirmed" || value === "cancelled") {
    return value;
  }

  return "pending";
}

function buildItemCreateInput(items: CartItemDraft[]) {
  return buildOrderItems(items).map((item) => ({
    serviceId: item.id,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    priceDisplay: item.priceDisplay ?? null,
    taxRate: item.taxRate ?? TAX_RATE,
    source: item.source ?? null,
    subtotal: item.subtotal,
    tax: item.tax,
    total: item.total,
  }));
}

function rowToCustomerOrder(row: OrderWithItems): CustomerOrder {
  const orderStatus = row.orderStatus;

  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    orderStatus,
    status: orderStatus,
    customer: {
      name: row.customerName,
      email: row.customerEmail,
      phone: row.customerPhone,
      company: row.customerCompany ?? undefined,
    },
    items: row.items.map((item) => ({
      id: item.serviceId ?? item.id,
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      unitPrice: decimalToNumber(item.unitPrice),
      priceDisplay: item.priceDisplay ?? undefined,
      taxRate: decimalToNumber(item.taxRate),
      source: item.source ?? undefined,
    })),
    subtotal: decimalToNumber(row.subtotal),
    tax: decimalToNumber(row.tax),
    total: decimalToNumber(row.total),
    paymentStatus: row.paymentStatus,
    paymentMethod: row.paymentMethod,
    preferenceId: row.preferenceId ?? undefined,
    mercadopagoPaymentId: row.mercadopagoPaymentId ?? undefined,
    webpayToken: row.webpayToken ?? undefined,
    processedPaymentKeys: parseProcessedPaymentKeys(row.processedPaymentKeys),
    notificationEmailSentAt: row.notificationEmailSentAt?.toISOString(),
  };
}

export async function listOrders(): Promise<CustomerOrder[]> {
  const rows = await getPrisma().order.findMany({
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(rowToCustomerOrder);
}

export async function getOrderRecord(orderId: string): Promise<CustomerOrder | null> {
  const row = await getPrisma().order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });

  return row ? rowToCustomerOrder(row) : null;
}

export async function findOrderByPreferenceId(preferenceId: string): Promise<CustomerOrder | null> {
  const row = await getPrisma().order.findUnique({
    where: { preferenceId },
    include: ORDER_INCLUDE,
  });

  return row ? rowToCustomerOrder(row) : null;
}

export async function findOrderByMercadoPagoPaymentId(paymentId: string): Promise<CustomerOrder | null> {
  const row = await getPrisma().order.findUnique({
    where: { mercadopagoPaymentId: paymentId },
    include: ORDER_INCLUDE,
  });

  return row ? rowToCustomerOrder(row) : null;
}

export async function findOrderByWebpayToken(token: string): Promise<CustomerOrder | null> {
  const normalized = token.trim();
  if (!normalized) {
    return null;
  }

  const row = await getPrisma().order.findUnique({
    where: { webpayToken: normalized },
    include: ORDER_INCLUDE,
  });

  return row ? rowToCustomerOrder(row) : null;
}

export async function createOrderRecord(
  orderInput: Omit<CustomerOrder, "id" | "createdAt" | "status" | "orderStatus"> & {
    id?: string;
    createdAt?: string;
    status?: CustomerOrder["status"];
    orderStatus?: CustomerOrder["orderStatus"];
    paymentMethod?: CustomerOrder["paymentMethod"];
  },
): Promise<CustomerOrder> {
  const safeItems = Array.isArray(orderInput.items) ? orderInput.items : [];
  const totals = buildOrderTotals(safeItems);
  const orderStatus = normalizeOrderStatus(orderInput.orderStatus ?? orderInput.status);
  const paymentStatus = normalizePaymentStatus(orderInput.paymentStatus);
  const createdAt = orderInput.createdAt ? new Date(orderInput.createdAt) : undefined;

  const row = await getPrisma().order.create({
    data: {
      id: orderInput.id ?? generateOrderId(),
      ...(createdAt ? { createdAt } : {}),
      orderStatus,
      customerName: String(orderInput.customer.name ?? "").trim(),
      customerEmail: String(orderInput.customer.email ?? "").trim(),
      customerPhone: String(orderInput.customer.phone ?? "").trim(),
      customerCompany: orderInput.customer.company ? String(orderInput.customer.company).trim() : null,
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total,
      paymentStatus,
      paymentMethod: normalizePaymentMethod(orderInput.paymentMethod),
      preferenceId: orderInput.preferenceId ?? null,
      mercadopagoPaymentId: orderInput.mercadopagoPaymentId ?? null,
      webpayToken: orderInput.webpayToken ?? null,
      processedPaymentKeys: orderInput.processedPaymentKeys ?? [],
      notificationEmailSentAt: orderInput.notificationEmailSentAt
        ? new Date(orderInput.notificationEmailSentAt)
        : null,
      items: {
        create: buildItemCreateInput(safeItems),
      },
    },
    include: ORDER_INCLUDE,
  });

  return rowToCustomerOrder(row);
}

export async function updateOrderRecord(
  orderId: string,
  updates: Partial<Omit<CustomerOrder, "id" | "customer" | "items">> & {
    customer?: CustomerOrder["customer"];
    items?: CartItemDraft[];
  },
): Promise<CustomerOrder | null> {
  const existing = await getPrisma().order.findUnique({
    where: { id: orderId },
    include: ORDER_INCLUDE,
  });

  if (!existing) {
    return null;
  }

  const nextOrderStatus = normalizeOrderStatus(updates.orderStatus ?? updates.status ?? existing.orderStatus);
  const data: Prisma.OrderUpdateInput = {
    orderStatus: nextOrderStatus,
    paymentStatus: normalizePaymentStatus(updates.paymentStatus ?? existing.paymentStatus),
    paymentMethod: normalizePaymentMethod(updates.paymentMethod ?? existing.paymentMethod),
    preferenceId: updates.preferenceId === undefined ? existing.preferenceId : updates.preferenceId,
    mercadopagoPaymentId:
      updates.mercadopagoPaymentId === undefined ? existing.mercadopagoPaymentId : updates.mercadopagoPaymentId,
    webpayToken: updates.webpayToken === undefined ? existing.webpayToken : updates.webpayToken,
    processedPaymentKeys: updates.processedPaymentKeys ?? parseProcessedPaymentKeys(existing.processedPaymentKeys),
    notificationEmailSentAt:
      updates.notificationEmailSentAt === undefined
        ? existing.notificationEmailSentAt
        : updates.notificationEmailSentAt
          ? new Date(updates.notificationEmailSentAt)
          : null,
  };

  if (updates.customer) {
    data.customerName = String(updates.customer.name ?? existing.customerName).trim();
    data.customerEmail = String(updates.customer.email ?? existing.customerEmail).trim();
    data.customerPhone = String(updates.customer.phone ?? existing.customerPhone).trim();
    data.customerCompany = updates.customer.company
      ? String(updates.customer.company).trim()
      : existing.customerCompany;
  }

  if (updates.items) {
    const totals = buildOrderTotals(updates.items);
    data.subtotal = totals.subtotal;
    data.tax = totals.tax;
    data.total = totals.total;
    data.items = {
      deleteMany: {},
      create: buildItemCreateInput(updates.items),
    };
  }

  const row = await getPrisma().order.update({
    where: { id: orderId },
    data,
    include: ORDER_INCLUDE,
  });

  return rowToCustomerOrder(row);
}

export async function updateOrderStatus(
  orderId: string,
  updates: Partial<Pick<CustomerOrder, "orderStatus" | "status" | "paymentStatus" | "paymentMethod">>,
): Promise<CustomerOrder | null> {
  return updateOrderRecord(orderId, updates);
}

export async function deleteOrderRecord(orderId: string): Promise<void> {
  await getPrisma().order.delete({ where: { id: orderId } }).catch(() => undefined);
}
