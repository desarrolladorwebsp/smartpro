import test from "node:test";
import assert from "node:assert/strict";

import type { Plan } from "@/components/plans/PlanCard";

import { buildServiceCategoryCards } from "./category-cards";

function plan(partial: Partial<Plan> & Pick<Plan, "name" | "price">): Plan {
  return {
    features: [],
    ...partial,
  };
}

test("buildServiceCategoryCards usa categorías reales y deriva copy desde los planes", () => {
  const cards = buildServiceCategoryCards(
    [
      { id: "landing", name: "Landing Page", slug: "landing-page" },
      { id: "web", name: "Website", slug: "website" },
      { id: "empty", name: "Sin planes", slug: "sin-planes" },
    ],
    [
      plan({
        name: "Landing Page Start",
        subcategory: "Landing Page",
        price: "$199.990",
        summary: null,
        note: "Ideal para emprendimientos que inician su presencia digital.",
      }),
      plan({
        name: "Landing Page Pro",
        subcategory: "Landing Page",
        price: "$299.990",
        summary: null,
        note: "Ideal para emprendimientos que inician su presencia digital.",
      }),
      plan({
        name: "Website Start",
        subcategory: "Website",
        price: "$399.990",
        summary: "Sitio institucional para presentar la marca.",
        note: "Dirigido a empresas que necesitan una web corporativa.",
      }),
      plan({
        name: "E-commerce Start",
        subcategory: "E-commerce",
        price: "$499.990",
        summary: null,
        note: "Ideal para emprendimientos que inician su tienda online.",
      }),
    ],
  );

  assert.deepEqual(
    cards.map((card) => card.name),
    ["Landing Page", "Website", "E-commerce"],
  );
  assert.equal(cards[0]?.planCount, 2);
  assert.equal(cards[0]?.description, "2 planes desde $199.990");
  assert.equal(cards[0]?.audience, "Ideal para emprendimientos que inician su presencia digital.");
  assert.equal(cards[1]?.description, "Sitio institucional para presentar la marca.");
  assert.equal(cards[1]?.audience, "Dirigido a empresas que necesitan una web corporativa.");
  assert.equal(cards[2]?.id, "E-commerce");
  assert.equal(cards[2]?.audience, "Ideal para emprendimientos que inician su tienda online.");
});

test("buildServiceCategoryCards no inventa audiencia si la nota no es de público objetivo", () => {
  const cards = buildServiceCategoryCards(
    [{ id: "ads", name: "Campañas", slug: "campanas" }],
    [
      plan({
        name: "Campaña Start",
        subcategory: "Campañas",
        price: "$100.000",
        note: "Desde 50 Leads",
      }),
    ],
  );

  assert.equal(cards[0]?.audience, null);
  assert.equal(cards[0]?.description, "1 plan desde $100.000");
});
