import assert from "node:assert/strict";
import test from "node:test";

import {
  clientCreatedNotification,
  orderPaidNotification,
  paymentReceivedNotification,
  quoteAcceptedNotification,
  quoteCreatedNotification,
  quoteRejectedNotification,
  quoteSentNotification,
  saleRegisteredNotification,
} from "./copy";
import { isMissingAdminNotificationTableError } from "./schema";
import { collectionAlertDates, collectionAlertsForUser } from "../sales/collection-alerts";

test("los avisos de cobro corresponden a hoy y mañana en Chile, con saldo vigente y por responsable", () => {
  const now = new Date("2026-11-25T01:00:00.000Z");
  assert.deepEqual(collectionAlertDates(now), { today: "2026-11-24", tomorrow: "2026-11-25" });
  const due = { saleId: "s-1", saleNumber: "VEN-1", clientName: "Prueba", remaining: 60000 };
  const dues = [
    { ...due, id: "hoy", dueOn: "2026-11-24", executiveId: "owner" },
    { ...due, id: "mañana", dueOn: "2026-11-25", executiveId: "owner" },
    { ...due, id: "otro", dueOn: "2026-11-24", executiveId: "other" },
    { ...due, id: "pagado", dueOn: "2026-11-24", remaining: 0, executiveId: "owner" },
    { ...due, id: "vencido", dueOn: "2026-11-23", executiveId: "owner" },
    { ...due, id: "sin-asignar", dueOn: "2026-11-25", executiveId: null },
  ];
  const executive = { email: "responsable@example.test", role: "EXECUTIVE" as const };
  const reminders = collectionAlertsForUser(dues, executive, "owner", now);
  assert.deepEqual(reminders.map(({ title }) => title), ["Cobro que vence hoy", "Cobro que vence mañana"]);
  assert.match(reminders[0].body, /60\.000/);
  assert.equal(reminders[0].href, "/dashboard/ventas/s-1");
  assert.deepEqual(collectionAlertsForUser(dues, executive, "unknown", now), []);
  assert.equal(collectionAlertsForUser(dues, { email: "admin@example.test", role: "ADMIN" }, "admin", now).length, 1);
  assert.deepEqual(collectionAlertsForUser(dues, executive, "owner", new Date("2026-11-25T02:00:00.000Z")).map(({ id }) => id), reminders.map(({ id }) => id));
  const nextDay = collectionAlertsForUser(dues, executive, "owner", new Date("2026-11-25T15:00:00.000Z"));
  assert.equal(nextDay[0].title, "Cobro que vence hoy");
  assert.notEqual(nextDay[0].id, reminders[1].id);
});

test("arma avisos de cliente, cotización, pago y venta con enlace al dashboard", () => {
  const client = clientCreatedNotification({
    id: "cli_1",
    companyName: "Óptica & Cristal",
    contactFirstName: "Ana",
    contactLastName: "Soto",
  });
  assert.equal(client.type, "CLIENT_CREATED");
  assert.equal(client.href, "/dashboard/clientes/cli_1");
  assert.equal(client.dedupeKey, "CLIENT_CREATED:cli_1");

  const quote = quoteCreatedNotification({
    id: "q1",
    number: "COT-2026-0001",
    clientCompany: "Óptica & Cristal",
    total: 119000,
  });
  assert.match(quote.title, /COT-2026-0001/);
  assert.equal(quote.href, "/dashboard/cotizaciones/q1");

  const sent = quoteSentNotification({
    id: "q1",
    number: "COT-2026-0001",
    clientCompany: "Óptica & Cristal",
    clientEmail: "ana@example.com",
  });
  assert.match(sent.body, /ana@example.com/);

  const accepted = quoteAcceptedNotification({
    id: "q1",
    number: "COT-2026-0001",
    clientCompany: "Óptica & Cristal",
  });
  assert.equal(accepted.type, "QUOTE_ACCEPTED");

  const rejected = quoteRejectedNotification({
    id: "q1",
    number: "COT-2026-0001",
    clientCompany: "Óptica & Cristal",
  });
  assert.equal(rejected.type, "QUOTE_REJECTED");

  const paid = orderPaidNotification({
    id: "ord_1",
    customer: { name: "Ana Soto", company: "Óptica & Cristal" },
    total: 50000,
  });
  assert.equal(paid.href, "/dashboard/compras/ord_1");

  const sale = saleRegisteredNotification({
    id: "sale_1",
    number: "VEN-2026-0001",
    clientId: "cli_1",
    clientCompany: "Óptica & Cristal",
    total: 119000,
  });
  assert.equal(sale.href, "/dashboard/ventas?clientId=cli_1");

  const payment = paymentReceivedNotification({
    id: "pay_1",
    saleId: "sale_1",
    saleNumber: "VEN-2026-0001",
    clientId: "cli_1",
    clientCompany: "Óptica & Cristal",
    amount: 50000,
  });
  assert.equal(payment.dedupeKey, "PAYMENT_RECEIVED:pay_1");
});

test("detecta tabla AdminNotification ausente", () => {
  assert.equal(
    isMissingAdminNotificationTableError({
      code: "P2021",
      message: "The table `AdminNotification` does not exist in the current database.",
    }),
    true,
  );
  assert.equal(isMissingAdminNotificationTableError(new Error("No hay conexión a la base de datos.")), false);
});
