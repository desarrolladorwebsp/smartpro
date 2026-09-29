import test from "node:test";
import assert from "node:assert/strict";

import { buildServiceScope } from "./terms";
import { buildCustomQuoteItemRecord, parseQuoteItemInputs } from "./custom-item";

test("parseQuoteItemInputs conserva un plan de catálogo e ignora precio o ítems enviados aparte", () => {
  assert.deepEqual(
    parseQuoteItemInputs([
      {
        planId: "plan-1",
        quantity: 2,
        name: "No debe usarse",
        unitPrice: 1,
        includedItems: ["Tampoco"],
      },
    ]),
    [{ kind: "catalog", planId: "plan-1", quantity: 2 }],
  );
});

test("parseQuoteItemInputs arma un servicio único con precio neto e ítems", () => {
  assert.deepEqual(
    parseQuoteItemInputs([
      {
        name: "  Landing a medida  ",
        unitPrice: "150.000",
        includedItems: [" Hosting ", "", "Hosting", "Piezas gráficas"],
      },
    ]),
    [
      {
        kind: "custom",
        name: "Landing a medida",
        unitPrice: 150000,
        quantity: 1,
        includedItems: ["Hosting", "Piezas gráficas"],
      },
    ],
  );
});

test("parseQuoteItemInputs exige nombre, precio e ítems del servicio único", () => {
  assert.throws(() => parseQuoteItemInputs([{ name: " ", unitPrice: 1000, includedItems: ["Ítem"] }]), /nombre/);
  assert.throws(() => parseQuoteItemInputs([{ name: "Campaña", unitPrice: 0, includedItems: ["Ítem"] }]), /precio/);
  assert.throws(() => parseQuoteItemInputs([{ name: "Campaña", unitPrice: 1000, includedItems: [" ", ""] }]), /ítem/);
  assert.throws(() => parseQuoteItemInputs([]), /al menos un plan o servicio/);
});

test("los ítems del servicio único quedan en el alcance igual que los de un plan", () => {
  const line = buildCustomQuoteItemRecord(
    {
      kind: "custom",
      name: "Campaña a medida",
      unitPrice: 200000,
      quantity: 2,
      includedItems: ["Piezas gráficas", "Informe mensual"],
    },
    0,
  );

  assert.equal(line.planId, null);
  assert.equal(line.categoryName, "Servicio único");
  assert.equal(line.subtotal, 400000);
  assert.equal(line.tax, 76000);
  assert.equal(line.total, 476000);

  const groups = buildServiceScope([line]);
  assert.equal(groups[0]?.planName, "Campaña a medida");
  assert.deepEqual(groups[0]?.items, ["Piezas gráficas", "Informe mensual"]);
});
