import test from "node:test";
import assert from "node:assert/strict";

import { mapCatalogTreeToPublicServices } from "./public";
import type { CatalogTree } from "./types";

const emptyDates = {
  createdAt: "2026-09-09T00:00:00.000Z",
  updatedAt: "2026-09-09T00:00:00.000Z",
};

test("mapCatalogTreeToPublicServices muestra servicios activos aunque no tengan planes", () => {
  const tree: CatalogTree = [
    {
      id: "svc-web",
      name: "Desarrollo Web",
      slug: "desarrollo-web",
      description: "Sitios y landings",
      coverImage: "/images/services/service-01.png",
      sortOrder: 1,
      status: "ACTIVE",
      ...emptyDates,
      subcategories: [
        {
          id: "cat-sitios",
          categoryId: "svc-web",
          categoryName: "Desarrollo Web",
          name: "Sitios web",
          slug: "sitios-web",
          sortOrder: 1,
          status: "ACTIVE",
          ...emptyDates,
          plans: [
            {
              id: "plan-pro",
              subcategoryId: "cat-sitios",
              subcategoryName: "Sitios web",
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
              highlighted: true,
              sortOrder: 1,
              status: "ACTIVE",
              icon: "",
              externalLink: "",
              items: [],
              ...emptyDates,
            },
          ],
        },
      ],
    },
    {
      id: "svc-marca",
      name: "Registro de Marca",
      slug: "registro-de-marca",
      description: "Protección de marca",
      coverImage: "",
      sortOrder: 8,
      status: "ACTIVE",
      ...emptyDates,
      subcategories: [],
    },
  ];

  const catalog = mapCatalogTreeToPublicServices(tree);

  assert.equal(catalog.length, 2);
  assert.equal(catalog[0]?.name, "Desarrollo Web");
  assert.equal(catalog[0]?.plans.length, 1);
  assert.equal(catalog[1]?.name, "Registro de Marca");
  assert.equal(catalog[1]?.slug, "registro-de-marca");
  assert.equal(catalog[1]?.plans.length, 0);
  assert.equal(catalog[1]?.image, "/images/services/service-08.jpeg");
});
