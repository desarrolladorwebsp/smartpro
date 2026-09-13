import test from "node:test";
import assert from "node:assert/strict";

import { buildQuoteEmail } from "./email";
import type { QuoteRecord } from "./types";

const quote: QuoteRecord = {
  id: "quote-1",
  number: "COT-2026-0001",
  status: "CREATED",
  clientId: "client-1",
  clientName: "Ana Pérez",
  clientCompany: "Empresa Demo SpA",
  clientEmail: "ana@empresa.cl",
  clientPhone: "+56 9 1111 1111",
  clientRut: "76.123.456-7",
  clientAddress: "Santiago",
  createdByEmail: "ejecutivo@smartpro.cl",
  notes: "Propuesta válida por 15 días.",
  validUntil: "2026-09-24T23:59:59.000Z",
  deliveryBusinessDays: 15,
  initialPaymentPercent: 50,
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
};

test("buildQuoteEmail reutiliza la plantilla corporativa y el número de cotización", () => {
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  process.env.ADMIN_SESSION_SECRET = "email-quote-secret";

  try {
    const { html, text } = buildQuoteEmail(quote, "https://smartpro.cl");

    assert.match(html, /Cotización COT-2026-0001/);
    assert.match(html, /logo-smartpro-01\.png/);
    assert.match(html, /#6D28D9/);
    assert.match(html, /Equipo SmartPro/);
    assert.match(html, /Empresa Demo SpA/);
    assert.match(html, /Ver cotización y pagar/);
    assert.match(html, /\/cotizacion\//);
    assert.doesNotMatch(html, /localhost/);
    assert.match(text, /COT-2026-0001/);
    assert.match(text, /https:\/\/smartpro\.cl/);
  } finally {
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
  }
});
