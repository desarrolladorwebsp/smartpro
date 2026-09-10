import test from "node:test";
import assert from "node:assert/strict";

import { buildDeliveryIntro, buildPaymentConditionText, buildQuoteCommercialTerms, buildServiceScope } from "./terms";

test("buildPaymentConditionText cubre pago total y abono parcial", () => {
  assert.equal(buildPaymentConditionText(100), "Se requiere el 100% del pago para iniciar el proyecto.");
  assert.match(buildPaymentConditionText(50), /50% de abono inicial/);
  assert.match(buildPaymentConditionText(50), /50% restante/);
  assert.match(buildPaymentConditionText(30), /70% restante/);
});

test("buildDeliveryIntro usa los días hábiles configurados", () => {
  assert.match(buildDeliveryIntro(12), /12 días hábiles/);
});

test("buildServiceScope usa los ítems reales del plan y elimina vacíos", () => {
  const groups = buildServiceScope([
    { planName: "Plan Pro", includedItems: ["Hosting", "Hosting", " ", "WhatsApp"] },
    { planName: "Vacío", includedItems: [] },
  ]);

  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].items, ["Hosting", "WhatsApp"]);
});

test("buildQuoteCommercialTerms arma las condiciones en el orden comercial", () => {
  const terms = buildQuoteCommercialTerms({
    items: [{ planName: "Plan Pro", includedItems: ["Diseño personalizado", "Hosting"] }],
    deliveryBusinessDays: 20,
    initialPaymentPercent: 50,
    validUntilLabel: "24 de septiembre de 2026",
  });

  assert.equal(terms.scopeTitle, "Alcance del servicio");
  assert.equal(terms.scopeIntro, "El servicio contratado incluye:");
  assert.deepEqual(terms.scopeGroups[0].items, ["Diseño personalizado", "Hosting"]);
  assert.deepEqual(
    terms.sections.map((section) => section.title),
    ["Plazo estimado", "Condiciones de pago", "Vencimiento", "Medios de pago"],
  );
  assert.match(terms.sections[0].intro ?? "", /20 días hábiles/);
  assert.match(terms.sections[2].paragraphs?.[0] ?? "", /24 de septiembre de 2026/);
  assert.ok(terms.sections[3].items?.includes("Transferencia bancaria"));
  assert.ok(terms.sections[3].paragraphs?.some((line) => line.includes("97610224")));
  assert.ok(terms.sections[3].paragraphs?.some((line) => line.includes("Vicuña Mackenna 920")));
});
