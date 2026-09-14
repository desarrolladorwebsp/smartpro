import test from "node:test";
import assert from "node:assert/strict";

import { createClientRecord, deleteClientRecord, findClientByEmail } from "../clients/repository";
import { getPrismaClient } from "../db";
import { createOrderRecord, deleteOrderRecord, updateOrderRecord } from "../orders/repository";
import { getSaleByOrderId } from "./repository";
import { registerSaleFromPaidOrder, tryRegisterSaleFromPaidOrder } from "./register-paid-order";

const created = {
  orderIds: [] as string[],
  clientIds: [] as string[],
  saleIds: [] as string[],
};

test.afterEach(async () => {
  const prisma = getPrismaClient();
  while (created.saleIds.length) {
    const id = created.saleIds.pop();
    if (id) await prisma?.sale.delete({ where: { id } }).catch(() => undefined);
  }
  while (created.orderIds.length) {
    const id = created.orderIds.pop();
    if (id) await deleteOrderRecord(id).catch(() => undefined);
  }
  while (created.clientIds.length) {
    const id = created.clientIds.pop();
    if (id) await deleteClientRecord(id).catch(() => undefined);
  }
});

test.after(async () => {
  await getPrismaClient()?.$disconnect().catch(() => undefined);
});

async function createPaidOrder(email: string, company = "SmartPro Studio") {
  const pending = await createOrderRecord({
    customer: {
      name: "Ana García",
      email,
      phone: "+56912345678",
      company,
    },
    items: [{ id: "plan-pro", name: "Plan Pro", category: "desarrolloWeb", quantity: 1, unitPrice: 100000 }],
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    paymentStatus: "pending",
    paymentMethod: "mercadopago",
  });
  created.orderIds.push(pending.id);

  const paid = await updateOrderRecord(pending.id, {
    paymentStatus: "paid",
    orderStatus: "confirmed",
    status: "confirmed",
  });
  assert.ok(paid);
  return paid;
}

test("registra venta y crea cliente nuevo desde una orden pagada", async () => {
  const email = `venta.nueva.${Date.now()}@smartpro.cl`;
  const order = await createPaidOrder(email);
  const result = await registerSaleFromPaidOrder(order);

  assert.equal(result.duplicate, false);
  assert.ok(result.sale);
  assert.equal(result.sale?.orderId, order.id);
  assert.equal(result.sale?.clientId, result.client?.id);
  assert.equal(result.sale?.paymentMethod, "mercadopago");
  assert.equal(result.sale?.total, 119000);
  assert.equal(result.sale?.source, "ORDER_PAID");
  assert.ok(result.client?.id);
  created.clientIds.push(result.client.id);
  created.saleIds.push(result.sale.id);

  const stored = await getSaleByOrderId(order.id);
  assert.equal(stored?.id, result.sale.id);
  assert.equal(stored?.clientId, result.client.id);
});

test("reutiliza un cliente existente por email y no duplica la venta", async () => {
  const email = `venta.existente.${Date.now()}@smartpro.cl`;
  const client = await createClientRecord({
    companyName: "Cliente Previo",
    contactFirstName: "Ana",
    contactLastName: "García",
    email,
    phone: "+56912345678",
    status: "ACTIVO",
  });
  created.clientIds.push(client.id);

  const order = await createPaidOrder(email, "Otra Razón Social");
  const first = await registerSaleFromPaidOrder(order);
  assert.equal(first.duplicate, false);
  assert.equal(first.sale?.clientId, client.id);
  assert.ok(first.sale?.id);
  created.saleIds.push(first.sale.id);

  const second = await registerSaleFromPaidOrder(order);
  assert.equal(second.duplicate, true);
  assert.equal(second.sale?.id, first.sale.id);

  const listed = await findClientByEmail(email);
  assert.equal(listed?.id, client.id);
});

test("tryRegisterSaleFromPaidOrder ignora órdenes no pagadas y no crea venta", async () => {
  const skipped = await tryRegisterSaleFromPaidOrder({
    id: "SP-2026-skip",
    createdAt: new Date().toISOString(),
    orderStatus: "pending",
    status: "pending",
    customer: { name: "Ana García", email: "skip@smartpro.cl", phone: "+56912345678" },
    items: [],
    subtotal: 0,
    tax: 0,
    total: 0,
    paymentStatus: "pending",
    paymentMethod: "mercadopago",
  });
  assert.equal(skipped.skipped, true);
  assert.equal(skipped.sale, null);
});
