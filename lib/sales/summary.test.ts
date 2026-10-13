import test from "node:test";
import assert from "node:assert/strict";

import { buildSalesSummary, summarizeFilteredSales } from "./summary";
import type { SaleRecord } from "./types";

function sale(overrides: Partial<SaleRecord>): SaleRecord {
  return {
    id: "sale-1",
    number: "VEN-2026-0001",
    status: "REGISTERED",
    source: "MANUAL",
    clientId: "client-1",
    clientCompany: "Empresa SpA",
    clientName: "Ana Pérez",
    quoteId: null,
    quoteNumber: null,
    orderId: null,
    paymentMethod: "transfer",
    executiveId: null,
    executiveName: "Sin asignar",
    apiClientId: null,
    externalReference: "",
    createdByEmail: "ejecutivo@smartpro.cl",
    soldAt: "2026-10-12T12:00:00.000Z",
    observation: "",
    receiptPath: "",
    receiptFileName: "",
    subtotal: 100000,
    tax: 19000,
    total: 119000,
    liorenInvoice: { status: "NOT_ISSUED", type: null, documentId: null, folio: null, issuedAt: null, error: "", draft: null },
    paidAmount: 0,
    balanceDue: 119000,
    collectionStatus: "UNPAID",
    payments: [],
    createdAt: "2026-10-12T12:00:00.000Z",
    updatedAt: "2026-10-12T12:00:00.000Z",
    ...overrides,
  };
}

test("buildSalesSummary separa vendido, cobrado y deuda", () => {
  const now = new Date("2026-10-12T15:00:00.000Z");
  const summary = buildSalesSummary(
    [
      sale({
        payments: [{ id: "p1", saleId: "sale-1", amount: 59500, method: "transbank", paidAt: "2026-10-12T12:00:00.000Z", receiptPath: "", receiptFileName: "", orderId: "o1", source: "ORDER_PAID", createdByEmail: "checkout@smartpro.cl", observation: "" }],
      }),
      sale({
        id: "sale-2",
        clientId: "client-2",
        clientCompany: "Otra SpA",
        status: "CANCELLED",
        total: 50000,
        payments: [{ id: "p2", saleId: "sale-2", amount: 50000, method: "cash", paidAt: "2026-10-12T12:00:00.000Z", receiptPath: "", receiptFileName: "", orderId: null, source: "MANUAL", createdByEmail: "a@b.cl", observation: "" }],
      }),
    ],
    now,
  );

  assert.equal(summary.soldTotal, 119000);
  assert.equal(summary.soldMonth, 119000);
  assert.equal(summary.collectedMonth, 59500);
  assert.equal(summary.receivableTotal, 59500);
  assert.equal(summary.collectedByMethod.transbank, 59500);
  assert.equal(summary.debtors.length, 1);
  assert.equal(summary.debtors[0]?.clientCompany, "Empresa SpA");
});

test("summarizeFilteredSales ignora canceladas", () => {
  const totals = summarizeFilteredSales([
    sale({ paidAmount: 0, payments: [] }),
    sale({ id: "c", status: "CANCELLED", total: 10, payments: [] }),
  ]);
  assert.equal(totals.sold, 119000);
  assert.equal(totals.collected, 0);
  assert.equal(totals.receivable, 119000);
});
