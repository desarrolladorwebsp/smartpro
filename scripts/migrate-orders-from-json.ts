import { promises as fs } from "node:fs";
import path from "node:path";

import { prisma } from "../lib/db";
import { createOrderRecord, getOrderRecord, type CustomerOrder } from "../lib/orders/repository";

function getOrdersPath() {
  const fileName = process.env.ORDERS_FILE?.trim() || "orders.json";

  if (fileName.includes("..") || fileName.includes("/") || fileName.includes("\\")) {
    throw new Error("ORDERS_FILE inválido.");
  }

  return path.join(process.cwd(), "data", fileName);
}

async function readLegacyOrders(): Promise<CustomerOrder[]> {
  const ordersPath = getOrdersPath();

  try {
    const file = await fs.readFile(ordersPath, "utf-8");
    if (!file.trim()) {
      return [];
    }

    const parsed = JSON.parse(file) as unknown;
    return Array.isArray(parsed) ? (parsed as CustomerOrder[]) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  const legacyOrders = await readLegacyOrders();

  if (!legacyOrders.length) {
    console.log("No hay órdenes legacy en data/orders.json.");
    await prisma.$disconnect();
    return;
  }

  let imported = 0;
  let skipped = 0;

  for (const order of legacyOrders) {
    const existing = await getOrderRecord(order.id);

    if (existing) {
      skipped += 1;
      continue;
    }

    await createOrderRecord({
      id: order.id,
      createdAt: order.createdAt,
      orderStatus: order.orderStatus ?? order.status ?? "pending",
      status: order.status ?? order.orderStatus ?? "pending",
      customer: order.customer,
      items: order.items ?? [],
      subtotal: order.subtotal,
      tax: order.tax,
      total: order.total,
      paymentStatus: order.paymentStatus ?? "pending",
      paymentMethod: order.paymentMethod ?? "transbank",
      preferenceId: order.preferenceId,
      mercadopagoPaymentId: order.mercadopagoPaymentId,
      processedPaymentKeys: order.processedPaymentKeys ?? [],
      notificationEmailSentAt: order.notificationEmailSentAt,
    });

    imported += 1;
  }

  console.log(`Migración completada: ${imported} importadas, ${skipped} omitidas (ya existían).`);
  await prisma.$disconnect();
}

void main();
