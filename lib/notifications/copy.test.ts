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
