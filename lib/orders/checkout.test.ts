import test from "node:test";
import assert from "node:assert/strict";

import { CheckoutValidationError, buildServerCheckoutOrder } from "./checkout";
import { getPrismaClient } from "../db";
import { buildOrderNotificationText } from "./email";
import { buildPreferenceItems } from "../mercadopago/preference";

test.after(async () => {
  await getPrismaClient()?.$disconnect().catch(() => undefined);
});

test("buildServerCheckoutOrder recalcula totales y no usa el total del frontend", async () => {
  const order = await buildServerCheckoutOrder({
    customer: {
      name: "Ana García",
      email: "Ana@SmartPro.cl",
      phone: "+56 9 1234 5678",
    },
    items: [
      { id: "plan-pro", name: "Plan Pro", category: "desarrolloWeb", quantity: 2, unitPrice: 100000 },
    ],
    total: 1,
    paymentStatus: "paid",
  });

  assert.equal(order.customer.email, "ana@smartpro.cl");
  assert.equal(order.subtotal, 200000);
  assert.equal(order.tax, 38000);
  assert.equal(order.total, 238000);
});

test("buildServerCheckoutOrder rechaza un payload incompleto", async () => {
  await assert.rejects(
    () =>
      buildServerCheckoutOrder({
        customer: { name: "Ana" },
        items: [{ id: "plan-pro", name: "Plan Pro", category: "desarrolloWeb", quantity: 1, unitPrice: 100000 }],
      }),
    CheckoutValidationError,
  );
});

test("el correo de orden incluye método, estado y servicios", () => {
  const text = buildOrderNotificationText({
    id: "SP-2026-100000",
    createdAt: "2026-09-09T12:00:00.000Z",
    customer: { name: "Ana García", email: "ana@smartpro.cl", phone: "+56912345678" },
    items: [{ name: "Plan Pro", quantity: 1, unitPrice: 100000 }],
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    paymentMethod: "mercadopago",
    paymentStatus: "paid",
  });

  assert.match(text, /SP-2026-100000/);
  assert.match(text, /Plan Pro/);
  assert.match(text, /Mercado Pago/);
  assert.match(text, /Pagada/);
});

test("los ítems de preferencia cobran el total con IVA en CLP entero", () => {
  const items = buildPreferenceItems({
    id: "SP-2026-1",
    total: 119000,
    items: [{ id: "plan-pro", name: "Plan Pro", category: "desarrolloWeb", quantity: 1, unitPrice: 100000, taxRate: 0.19 }],
  });

  assert.equal(items[0]?.unit_price, 119000);
  assert.equal(items[0]?.currency_id, "CLP");
  assert.equal(items[0]?.quantity, 1);
});
