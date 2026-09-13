import test from "node:test";
import assert from "node:assert/strict";

import { buildQuotePdf } from "./pdf";
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
  clientAddress: "Santa Elena 941 B",
  createdByEmail: "ejecutivo@smartpro.cl",
  notes: "Incluye implementación inicial.",
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
      planName: "Plan Pro corporativo con nombre extendido para comprobar el ajuste de texto en la tabla",
      categoryName: "Marketing digital",
      subcategoryName: "Sitios web",
      quantity: 2,
      unitPrice: 50000,
      taxRate: 0.19,
      includedItems: ["Hosting anual", "Soporte"],
      subtotal: 100000,
      tax: 19000,
      total: 119000,
      sortOrder: 0,
    },
  ],
};

test("buildQuotePdf genera un PDF corporativo con datos de la cotización", async () => {
  const previousSecret = process.env.ADMIN_SESSION_SECRET;
  const previousUrl = process.env.APP_URL;
  process.env.ADMIN_SESSION_SECRET = "pdf-quote-secret";
  process.env.APP_URL = "https://smartpro.cl";

  try {
    const pdf = await buildQuotePdf(quote);
    const searchable = pdf.toString("latin1").replace(/\0/g, "");

    assert.equal(pdf.subarray(0, 5).toString(), "%PDF-");
    assert.ok(pdf.length > 1000);
    assert.match(searchable, /COT-2026-0001/);
    assert.match(searchable, /SmartPro/);
    assert.match(searchable, /\/URI\s*\(/);
    assert.match(searchable, /cotizacion\//);
    assert.match(searchable, /pago=webpay/);
    assert.match(searchable, /pago=mercadopago/);
    assert.match(searchable, /#datos-bancarios/);
    assert.doesNotMatch(searchable, /pago=webpay.*119000|119000.*pago=webpay/);
  } finally {
    if (previousSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = previousSecret;
    if (previousUrl === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previousUrl;
  }
});
