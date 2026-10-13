import test from "node:test";
import assert from "node:assert/strict";

import { CheckoutValidationError } from "../orders/checkout";
import { buildQuoteCheckoutOrder, getQuotePaymentBlockReason } from "./checkout";
import type { QuoteRecord } from "./types";

function makeQuote(overrides: Partial<QuoteRecord> = {}): QuoteRecord {
  return {
    id: "quote-1",
    number: "COT-2026-0001",
    status: "CREATED",
    clientId: "client-1",
    clientName: "Ana Pérez",
    clientCompany: "Empresa Demo SpA",
    clientEmail: "ana@empresa.cl",
    clientPhone: "+56 9 1111 1111",
    clientRut: "76.123.456-7",
    clientAddress: "Santa Elena 941 B",
    createdByEmail: "ejecutivo@smartpro.cl",
    notes: "",
    validUntil: "2027-09-24T23:59:59.000Z",
    deliveryBusinessDays: 15,
    initialPaymentPercent: 50,
    discountType: "NONE",
    discountValue: 0,
    discountAmount: 0,
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    sentAt: null,
    createdAt: "2026-09-09T12:00:00.000Z",
    updatedAt: "2026-09-09T12:00:00.000Z",
    items: [
      {
        id: "item-1",
        planId: "plan-1",
        planName: "Plan Pro",
        categoryName: "Marketing digital",
        subcategoryName: "Sitios web",
        quantity: 1,
        unitPrice: 100000,
        taxRate: 0.19,
        includedItems: ["Hosting anual"],
        subtotal: 100000,
        tax: 19000,
        total: 119000,
        sortOrder: 0,
      },
    ],
    ...overrides,
  };
}

test("buildQuoteCheckoutOrder cobra solo el abono inicial de la cotización", () => {
  const checkout = buildQuoteCheckoutOrder(makeQuote());

  assert.equal(checkout.customer.email, "ana@empresa.cl");
  assert.equal(checkout.total, 59500);
  assert.equal(checkout.subtotal, 50000);
  assert.equal(checkout.items[0]?.name.includes("Abono inicial 50%"), true);
  assert.equal(checkout.items[0]?.source, "quote-abono");
});

test("buildQuoteCheckoutOrder cobra el total si el abono es 100%", () => {
  const checkout = buildQuoteCheckoutOrder(makeQuote({ initialPaymentPercent: 100 }));

  assert.equal(checkout.total, 119000);
  assert.equal(checkout.items[0]?.unitPrice, 100000);
  assert.equal(checkout.items[0]?.source, "quote");
});

test("buildQuoteCheckoutOrder acepta un servicio único sin plan de catálogo", () => {
  const checkout = buildQuoteCheckoutOrder(
    makeQuote({
      initialPaymentPercent: 100,
      items: [
        {
          ...makeQuote().items[0],
          planId: null,
          planName: "Campaña a medida",
          categoryName: "Servicio único",
          subcategoryName: "",
          includedItems: ["Piezas gráficas"],
        },
      ],
    }),
  );

  assert.equal(checkout.items[0]?.id, "item-1");
  assert.equal(checkout.items[0]?.name, "Campaña a medida");
  assert.equal(checkout.items[0]?.category, "Servicio único");
});

test("buildQuoteCheckoutOrder aplica el descuento al validar y cobrar el total", () => {
  const checkout = buildQuoteCheckoutOrder(
    makeQuote({
      initialPaymentPercent: 100,
      discountType: "PERCENT",
      discountValue: 10,
      discountAmount: 10000,
      subtotal: 90000,
      tax: 17100,
      total: 107100,
    }),
  );

  assert.equal(checkout.total, 107100);
  assert.equal(checkout.subtotal, 90000);
});

test("buildQuoteCheckoutOrder rechaza si el total no coincide con los ítems", () => {
  assert.throws(
    () => buildQuoteCheckoutOrder(makeQuote({ total: 1 })),
    CheckoutValidationError,
  );
});

test("getQuotePaymentBlockReason cubre vencida, borrador, rechazada y vendida", () => {
  assert.equal(getQuotePaymentBlockReason(makeQuote({ status: "CREATED" })), null);
  assert.match(getQuotePaymentBlockReason(makeQuote({ status: "DRAFT" })) ?? "", /aún no está disponible/);
  assert.match(getQuotePaymentBlockReason(makeQuote({ status: "REJECTED" })) ?? "", /ya no está disponible/);
  assert.match(getQuotePaymentBlockReason(makeQuote(), true) ?? "", /venta/);
  assert.match(
    getQuotePaymentBlockReason(makeQuote({ validUntil: "2020-01-01T00:00:00.000Z" })) ?? "",
    /venció/,
  );
});
