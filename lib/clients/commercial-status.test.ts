import test from "node:test";
import assert from "node:assert/strict";
import type { Prisma } from "@prisma/client";
import { advanceCrmForQuote, historicalQuoteDestination, summarizeCrmQuotes } from "./quote-crm";

import {
  CRM_COLUMNS,
  getAssignedExecutiveName,
  getClientCommercialStatusLabel,
  parseAssignedExecutiveId,
  parseClientCommercialStatus,
} from "./types";

test("parseClientCommercialStatus acepta los estados comerciales iniciales", () => {
  assert.equal(parseClientCommercialStatus("PROSPECTO"), "PROSPECTO");
  assert.equal(parseClientCommercialStatus("EN_SEGUIMIENTO"), "EN_SEGUIMIENTO");
  assert.equal(parseClientCommercialStatus("CERRADO_PERDIDO"), "CERRADO_PERDIDO");
});

test("parseClientCommercialStatus rechaza estados inválidos", () => {
  assert.throws(() => parseClientCommercialStatus("ACTIVO"), /Estado comercial inválido/);
  assert.throws(() => parseClientCommercialStatus(""), /Estado comercial inválido/);
});

test("getClientCommercialStatusLabel usa nombres comerciales", () => {
  assert.equal(getClientCommercialStatusLabel("PROSPECTO"), "Prospecto");
  assert.equal(getClientCommercialStatusLabel("EN_SEGUIMIENTO"), "En seguimiento");
  assert.equal(getClientCommercialStatusLabel("CERRADO_PERDIDO"), "Cerrado perdido");
});

test("parseAssignedExecutiveId normaliza vacío a null", () => {
  assert.equal(parseAssignedExecutiveId(null), null);
  assert.equal(parseAssignedExecutiveId(""), null);
  assert.equal(parseAssignedExecutiveId("  exec_1  "), "exec_1");
});

test("getAssignedExecutiveName muestra el responsable o Sin asignar", () => {
  assert.equal(getAssignedExecutiveName(null), "Sin asignar");
  assert.equal(
    getAssignedExecutiveName({ id: "1", firstName: "Ana", lastName: "Rojas", email: "ana@smartpro.cl" }),
    "Ana Rojas",
  );
});

test("el tablero prioriza cotizaciones vigentes, vencidas y rechazadas por cliente comercial", () => {
  const now = new Date("2026-11-24T15:00:00Z");
  const expired = new Date("2026-11-23T23:59:59Z");
  const current = new Date("2026-12-01T23:59:59Z");
  const summaries = summarizeCrmQuotes([
    { clientId: "contacto1", businessId: "empresa1", status: "REJECTED", validUntil: null },
    { clientId: "contacto2", businessId: "empresa1", status: "SENT", validUntil: expired },
    { clientId: "contacto3", businessId: "empresa1", status: "SENT", validUntil: null },
    { clientId: "persona1", businessId: null, status: "SENT", validUntil: expired },
    { clientId: "persona1", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "persona2", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "persona3", businessId: null, status: "CREATED", validUntil: expired },
    { clientId: "persona3", businessId: null, status: "REJECTED", validUntil: current },
    { clientId: "contacto4", businessId: "empresa2", status: "CREATED", validUntil: current },
    { clientId: "contacto5", businessId: "empresa2", status: "REJECTED", validUntil: current },
    { clientId: "persona4", businessId: null, status: "CREATED", validUntil: null },
    { clientId: "persona5", businessId: null, status: "DRAFT", validUntil: current },
    { clientId: "persona5", businessId: null, status: "REJECTED", validUntil: current },
    { clientId: "persona6", businessId: null, status: "ACCEPTED", validUntil: expired },
    { clientId: "persona6", businessId: null, status: "CREATED", validUntil: current },
  ], now);

  assert.equal(summaries.get("business:empresa1")?.indicator, "CURRENT");
  assert.equal(summaries.get("person:persona1")?.indicator, "EXPIRED");
  assert.equal(summaries.get("person:persona2")?.indicator, "REJECTED");
  assert.equal(summaries.get("person:persona3")?.indicator, "EXPIRED");
  assert.equal(summaries.get("business:empresa2")?.indicator, "CURRENT");
  assert.equal(summaries.get("person:persona4")?.indicator, "CURRENT");
  assert.equal(summaries.get("person:persona5")?.indicator, "REJECTED");
  assert.equal(summaries.get("person:persona6")?.indicator, "ACCEPTED");
  assert.equal(summaries.has("person:contacto1"), false);
});

test("la regularización mueve nuevos con cotización finalizada y rechazos sin otra propuesta finalizada", () => {
  const summaries = summarizeCrmQuotes([
    { clientId: "borrador", businessId: null, status: "DRAFT", validUntil: null },
    { clientId: "creada", businessId: null, status: "CREATED", validUntil: null },
    { clientId: "rechazada", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "ambas", businessId: null, status: "REJECTED", validUntil: null },
    { clientId: "ambas", businessId: null, status: "SENT", validUntil: new Date("2026-11-23") },
  ]);

  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:borrador")), undefined);
  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:creada")), "QUOTED");
  assert.equal(historicalQuoteDestination("CONTACTED", summaries.get("person:creada")), undefined);
  assert.equal(historicalQuoteDestination("QUOTED", summaries.get("person:rechazada")), "PROPOSAL_REJECTED");
  assert.equal(historicalQuoteDestination("NEGOTIATION", summaries.get("person:rechazada")), undefined);
  assert.equal(historicalQuoteDestination("NEW", summaries.get("person:ambas")), "QUOTED");
  assert.equal(historicalQuoteDestination("QUOTED", summaries.get("person:ambas")), undefined);
});

test("el envío mueve la empresa contactada y registra el cambio a nombre del ejecutivo que envió", async () => {
  const findFirst = test.mock.fn<(query: unknown) => Promise<unknown>>(async () => ({
    crmStage: "CONTACTED", crmArchiveState: null, crmReactivateOn: null,
  }));
  const updateMany = test.mock.fn<(query: unknown) => Promise<{ count: number }>>(async () => ({ count: 1 }));
  const create = test.mock.fn();
  const db = { business: { findFirst, updateMany }, clientCrmHistory: { create } } as unknown as Prisma.TransactionClient;

  assert.equal(await advanceCrmForQuote(db, { clientId: "contacto", businessId: "empresa", number: "COT-42" }, "SENT", "envia@example.test"), true);
  const active = { id: "empresa", deletedAt: null };
  assert.deepEqual(findFirst.mock.calls[0].arguments[0], {
    where: active,
    select: { crmStage: true, crmArchiveState: true, crmReactivateOn: true },
  });
  assert.deepEqual(updateMany.mock.calls[0].arguments[0], {
    where: { ...active, crmStage: "CONTACTED", crmArchiveState: null, crmReactivateOn: null },
    data: { crmStage: "QUOTED", crmPosition: null },
  });
  assert.deepEqual(create.mock.calls[0].arguments[0], { data: {
    accountId: "empresa", event: "STAGE", fromState: "CONTACTED", toState: "QUOTED",
    actorEmail: "envia@example.test", note: "Cotización COT-42 enviada.",
  } });
});

test("una cotización creada o enviada mueve al cliente desde cualquier etapa, incluidas las archivadas", async () => {
  for (const [event, nextStage] of [["FINALIZED", "CONTACTED"], ["SENT", "QUOTED"]] as const) {
    for (const { id: previousStage } of CRM_COLUMNS) {
      const archiveState = previousStage === "PAUSED" || previousStage === "LOST" ? previousStage : null;
      const reactivateOn = archiveState === "PAUSED" ? new Date("2026-12-01T00:00:00Z") : null;
      const account = {
        crmStage: archiveState ? nextStage : previousStage,
        crmArchiveState: archiveState,
        crmReactivateOn: reactivateOn,
      };
      const findFirst = test.mock.fn<(query: unknown) => Promise<typeof account>>(async () => account);
      const updateMany = test.mock.fn<(query: unknown) => Promise<{ count: number }>>(async () => ({ count: 1 }));
      const create = test.mock.fn();
      const db = { client: { findFirst, updateMany }, clientCrmHistory: { create } } as unknown as Prisma.TransactionClient;
      const quote = { clientId: "persona", businessId: null, number: "COT-42" };
      const identity = { id: quote.clientId, businessId: null, deletedAt: null };

      assert.equal(await advanceCrmForQuote(db, quote, event, "ejecutivo@example.test"), previousStage !== nextStage);
      assert.deepEqual(findFirst.mock.calls[0].arguments[0], {
        where: identity,
        select: { crmStage: true, crmArchiveState: true, crmReactivateOn: true },
      });
      if (previousStage === nextStage) {
        assert.equal(updateMany.mock.callCount(), 0);
        assert.equal(create.mock.callCount(), 0);
        continue;
      }
      assert.deepEqual(updateMany.mock.calls[0].arguments[0], {
        where: { ...identity, ...account },
        data: {
          crmStage: nextStage,
          ...(archiveState ? { crmArchiveState: null, crmReactivateOn: null } : {}),
        },
      });
      assert.deepEqual(create.mock.calls[0].arguments[0], { data: {
        clientId: quote.clientId,
        event: archiveState ? "REACTIVATION" : "STAGE",
        fromState: previousStage,
        toState: nextStage,
        actorEmail: "ejecutivo@example.test",
        note: event === "FINALIZED" ? "Cotización COT-42 creada." : "Cotización COT-42 enviada.",
        ...(reactivateOn ? { reactivateOn } : {}),
      } });
    }
  }
});

test("el envío no pisa un cambio de etapa concurrente ni duplica el historial", async () => {
  const findFirst = async () => ({ crmStage: "NEW", crmArchiveState: null, crmReactivateOn: null });
  const updateMany = test.mock.fn<(query: unknown) => Promise<{ count: number }>>(async () => ({ count: 0 }));
  const create = test.mock.fn();
  const db = { client: { findFirst, updateMany }, clientCrmHistory: { create } } as unknown as Prisma.TransactionClient;

  assert.equal(await advanceCrmForQuote(db, { clientId: "persona", businessId: null, number: "COT-42" }, "SENT", "envia@example.test"), false);
  assert.deepEqual(updateMany.mock.calls[0].arguments[0], {
    where: { id: "persona", businessId: null, deletedAt: null, crmArchiveState: null, crmReactivateOn: null, crmStage: "NEW" },
    data: { crmStage: "QUOTED" },
  });
  assert.equal(create.mock.callCount(), 0);
});
