import test from "node:test";
import assert from "node:assert/strict";

import type { Plan } from "@/components/plans/PlanCard";

import {
  buildServiceCategoryCards,
  LANDING_PAGE_INTRO,
  WEBSITE_INTRO,
} from "./category-cards";

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
  assert.equal(cards[0]?.description, LANDING_PAGE_INTRO);
  assert.equal(cards[0]?.audience, "Ideal para emprendimientos que inician su presencia digital.");
  assert.equal(
    cards[1]?.description,
    "Un sitio para presentar tu empresa, organizar tus servicios y facilitar que tus clientes encuentren información y te contacten.",
  );
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

test("buildServiceCategoryCards no muestra precio cuando el plan es a cotizar", () => {
  const cards = buildServiceCategoryCards(
    [{ id: "crm", name: "CRM", slug: "crm" }],
    [
      plan({
        name: "CRM comercial",
        subcategory: "CRM",
        price: "Consultar",
        summary: "CRM para ordenar clientes y oportunidades.",
        link: "/?servicio=CRM%20comercial#contacto",
      }),
    ],
  );

  assert.equal(cards[0]?.description, "CRM para ordenar clientes y oportunidades.");
});

test("buildServiceCategoryCards usa el copy de Website con varias páginas cuando el alcance lo incluye", () => {
  const cards = buildServiceCategoryCards(
    [{ id: "web", name: "Website", slug: "website" }],
    [
      plan({
        name: "Website Start",
        subcategory: "Website",
        price: "$349.990",
        features: ["<strong>Hasta 5 páginas</strong>", "Formulario de contacto integrado"],
      }),
    ],
  );

  assert.equal(cards[0]?.description, WEBSITE_INTRO);
});
