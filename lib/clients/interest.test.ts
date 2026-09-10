import test from "node:test";
import assert from "node:assert/strict";

import type { CatalogTree } from "../services/types";
import {
  formatClientInterestLabel,
  mapCatalogTreeToInterestCatalog,
  resolveClientInterest,
} from "./interest";

const dates = {
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
};

const tree: CatalogTree = [
  {
    id: "svc-web",
    name: "Desarrollo Web",
    slug: "desarrollo-web",
    description: "",
    coverImage: "",
    sortOrder: 1,
    status: "ACTIVE",
    ...dates,
    subcategories: [
      {
        id: "cat-landing",
        categoryId: "svc-web",
        categoryName: "Desarrollo Web",
        name: "Landing Page",
        slug: "landing-page",
        sortOrder: 1,
        status: "ACTIVE",
        ...dates,
        plans: [
          {
            id: "plan-pro",
            subcategoryId: "cat-landing",
            subcategoryName: "Landing Page",
            categoryId: "svc-web",
            categoryName: "Desarrollo Web",
            name: "SmartWeb Pro",
            slug: "smartweb-pro",
            price: 199000,
            pricePrefix: "",
            taxLabel: "+ IVA",
            taxRate: 0.19,
            summary: "",
            badge: "",
            note: "",
            featureGroupTitle: "",
            highlighted: false,
            sortOrder: 1,
            status: "ACTIVE",
            icon: "",
            externalLink: "",
            items: [],
            ...dates,
          },
        ],
      },
    ],
  },
  {
    id: "svc-marca",
    name: "Registro de Marca",
    slug: "registro-de-marca",
    description: "",
    coverImage: "",
    sortOrder: 2,
    status: "ACTIVE",
    ...dates,
    subcategories: [],
  },
];

test("resolveClientInterest acepta servicio, categoría o plan del catálogo", () => {
  assert.deepEqual(resolveClientInterest(tree, {}), {
    interestServiceId: null,
    interestServiceName: "",
    interestSubcategoryId: null,
    interestSubcategoryName: "",
    interestPlanId: null,
    interestPlanName: "",
  });

  const byService = resolveClientInterest(tree, { interestServiceId: "svc-marca" });
  assert.equal(byService.interestServiceName, "Registro de Marca");
  assert.equal(byService.interestSubcategoryId, null);
  assert.equal(byService.interestPlanId, null);

  const byCategory = resolveClientInterest(tree, { interestSubcategoryId: "cat-landing" });
  assert.equal(byCategory.interestServiceId, "svc-web");
  assert.equal(byCategory.interestSubcategoryName, "Landing Page");
  assert.equal(byCategory.interestPlanId, null);

  const byPlan = resolveClientInterest(tree, { interestPlanId: "plan-pro", interestServiceId: "otro" });
  assert.equal(byPlan.interestServiceName, "Desarrollo Web");
  assert.equal(byPlan.interestSubcategoryName, "Landing Page");
  assert.equal(byPlan.interestPlanName, "SmartWeb Pro");
  assert.equal(formatClientInterestLabel(byPlan), "Desarrollo Web / Landing Page / SmartWeb Pro");
});

test("mapCatalogTreeToInterestCatalog expone el árbol para el formulario", () => {
  const catalog = mapCatalogTreeToInterestCatalog(tree);
  assert.equal(catalog.length, 2);
  assert.equal(catalog[0]?.categories[0]?.plans[0]?.name, "SmartWeb Pro");
  assert.equal(catalog[1]?.categories.length, 0);
});
