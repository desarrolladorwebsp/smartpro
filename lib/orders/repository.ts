import { promises as fs } from "node:fs";
import path from "node:path";

import { buildOrderTotals, generateOrderId, type CartItemDraft } from "./service";

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
  paymentMethod: "simulated" | "transbank";
};

const ORDERS_PATH = path.join(process.cwd(), "data", "orders.json");

async function ensureOrdersFile() {
  const directory = path.dirname(ORDERS_PATH);

  await fs.mkdir(directory, { recursive: true });

  try {
    await fs.access(ORDERS_PATH);
  } catch {
    await fs.writeFile(ORDERS_PATH, "[]", "utf-8");
  }
}

export async function listOrders(): Promise<CustomerOrder[]> {
  await ensureOrdersFile();

  const file = await fs.readFile(ORDERS_PATH, "utf-8");

  if (!file.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getOrderRecord(orderId: string): Promise<CustomerOrder | null> {
  const orders = await listOrders();
  return orders.find((order) => order.id === orderId) ?? null;
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
  await ensureOrdersFile();

  const orders = await listOrders();
  const generatedId = orderInput.id ?? generateOrderId();

  const safeItems = Array.isArray(orderInput.items) ? orderInput.items : [];
  const totals = buildOrderTotals(safeItems);

  const orderStatus = orderInput.orderStatus ?? orderInput.status ?? "pending";
  const paymentStatus = orderInput.paymentStatus ?? "pending";

  const record: CustomerOrder = {
    id: generatedId,
    createdAt: orderInput.createdAt ?? new Date().toISOString(),
    orderStatus,
    status: orderStatus,
    customer: {
      name: String(orderInput.customer.name ?? "").trim(),
      email: String(orderInput.customer.email ?? "").trim(),
      phone: String(orderInput.customer.phone ?? "").trim(),
      company: orderInput.customer.company ? String(orderInput.customer.company).trim() : undefined,
    },
    items: safeItems,
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    paymentStatus,
    paymentMethod: orderInput.paymentMethod ?? "transbank",
  };

  orders.push(record);

  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf-8");

  return record;
}

export async function updateOrderStatus(
  orderId: string,
  updates: Partial<Pick<CustomerOrder, "orderStatus" | "status" | "paymentStatus" | "paymentMethod">>,
): Promise<CustomerOrder | null> {
  const orders = await listOrders();
  const index = orders.findIndex((order) => order.id === orderId);

  if (index === -1) {
    return null;
  }

  const current = orders[index];
  const nextOrder: CustomerOrder = {
    ...current,
    ...updates,
    status: updates.status ?? updates.orderStatus ?? current.status,
    orderStatus: updates.orderStatus ?? current.orderStatus,
    paymentStatus: updates.paymentStatus ?? current.paymentStatus,
    paymentMethod: updates.paymentMethod ?? current.paymentMethod,
  };

  orders[index] = nextOrder;
  await fs.writeFile(ORDERS_PATH, JSON.stringify(orders, null, 2), "utf-8");

  return nextOrder;
}
