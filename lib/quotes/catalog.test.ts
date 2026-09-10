import test from "node:test";
import assert from "node:assert/strict";

import { mapCatalogTreeToQuoteGroups } from "./catalog-map";
import type { CatalogTree } from "../services/types";

const now = "2026-09-09T12:00:00.000Z";

const tree: CatalogTree = [
  {
    id: "cat-1",
    name: "Marketing digital",
    slug: "marketing-digital",
    description: "",
    coverImage: "",
    sortOrder: 1,
    status: "ACTIVE",
    createdAt: now,
    updatedAt: now,
    subcategories: [
      {
        id: "sub-1",
        categoryId: "cat-1",
        categoryName: "Marketing digital",
        name: "Sitios web",
        slug: "sitios-web",
        sortOrder: 1,
        status: "ACTIVE",
        createdAt: now,
        updatedAt: now,
        plans: [
          {
            id: "plan-active",
            subcategoryId: "sub-1",
            subcategoryName: "Sitios web",
            categoryId: "cat-1",
            categoryName: "Marketing digital",
            name: "Plan Pro",
            slug: "plan-pro",
            price: 590000,
            pricePrefix: "$",
            taxLabel: "IVA incluido",
            taxRate: 0.19,
            summary: "Sitio corporativo",
            badge: "",
            note: "",
            featureGroupTitle: "",
            highlighted: false,
            sortOrder: 1,
            status: "ACTIVE",
            icon: "",
            externalLink: "",
            items: [
              {
                id: "item-1",
                planId: "plan-active",
                label: "Hosting anual",
                slug: "hosting-anual",
                sortOrder: 1,
                status: "ACTIVE",
                createdAt: now,
                updatedAt: now,
              },
              {
                id: "item-2",
                planId: "plan-active",
                label: "Ítem inactivo",
                slug: "item-inactivo",
                sortOrder: 2,
                status: "INACTIVE",
                createdAt: now,
                updatedAt: now,
              },
            ],
            createdAt: now,
            updatedAt: now,
          },
          {
            id: "plan-inactive",
            subcategoryId: "sub-1",
            subcategoryName: "Sitios web",
            categoryId: "cat-1",
            categoryName: "Marketing digital",
            name: "Plan archivado",
            slug: "plan-archivado",
            price: 100,
            pricePrefix: "$",
            taxLabel: "",
            taxRate: 0.19,
            summary: "",
            badge: "",
            note: "",
            featureGroupTitle: "",
            highlighted: false,
            sortOrder: 2,
            status: "INACTIVE",
            icon: "",
            externalLink: "",
            items: [],
            createdAt: now,
            updatedAt: now,
          },
        ],
      },
    ],
  },
];

test("mapCatalogTreeToQuoteGroups usa planes e ítems activos del catálogo real", () => {
  const groups = mapCatalogTreeToQuoteGroups(tree);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].plans.length, 1);
  assert.equal(groups[0].plans[0].id, "plan-active");
  assert.deepEqual(groups[0].plans[0].items, ["Hosting anual"]);
});
