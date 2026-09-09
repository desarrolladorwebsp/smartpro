import test from "node:test";
import assert from "node:assert/strict";

import {
  filterCategories,
  filterPlans,
  filterServices,
  flattenCatalog,
  formatCatalogPrice,
  getCatalogCreateLabel,
  getCatalogEmptyMessage,
  getCatalogSearchPlaceholder,
  hasActiveCatalogFilters,
  parseCatalogView,
} from "./catalog-table";
import type { CatalogTree, ServicePlanRecord } from "./types";

function buildTree(): CatalogTree {
  return [
    {
      id: "svc-web",
      name: "Desarrollo Web",
      slug: "desarrollo-web",
      description: "Sitios y landings",
      sortOrder: 1,
      status: "ACTIVE",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      subcategories: [
        {
          id: "cat-sitios",
          categoryId: "svc-web",
          categoryName: "Desarrollo Web",
          name: "Sitios web",
          slug: "sitios-web",
          sortOrder: 1,
          status: "ACTIVE",
          createdAt: "2026-01-01T00:00:00.000Z",
          updatedAt: "2026-01-02T00:00:00.000Z",
          plans: [
            buildPlan({
              id: "plan-pro",
              name: "SmartWeb Pro",
              badge: "Más contratado",
              highlighted: true,
              status: "ACTIVE",
              price: 199000,
            }),
            buildPlan({
              id: "plan-basic",
              name: "SmartWeb Basic",
              highlighted: false,
              status: "INACTIVE",
              price: 99000,
            }),
          ],
        },
      ],
    },
    {
      id: "svc-ads",
      name: "Publicidad",
      slug: "publicidad",
      description: "",
      sortOrder: 2,
      status: "INACTIVE",
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-02T00:00:00.000Z",
      subcategories: [],
    },
  ];
}

function buildPlan(overrides: Partial<ServicePlanRecord> & Pick<ServicePlanRecord, "id" | "name">): ServicePlanRecord {
  return {
    subcategoryId: "cat-sitios",
    subcategoryName: "Sitios web",
    categoryId: "svc-web",
    categoryName: "Desarrollo Web",
    slug: overrides.id,
    price: 100000,
    pricePrefix: "",
    taxLabel: "+ IVA",
    taxRate: 19,
    summary: "Plan de sitios",
    badge: "",
    note: "",
    featureGroupTitle: "Incluye",
    highlighted: false,
    sortOrder: 1,
    status: "ACTIVE",
    icon: "",
    externalLink: "",
    items: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

test("parseCatalogView acepta vistas válidas y usa servicios por defecto", () => {
  assert.equal(parseCatalogView("categorias"), "categorias");
  assert.equal(parseCatalogView("planes"), "planes");
  assert.equal(parseCatalogView("servicios"), "servicios");
  assert.equal(parseCatalogView("otro"), "servicios");
  assert.equal(parseCatalogView(undefined), "servicios");
});

test("flattenCatalog deriva filas desde el árbol sin duplicar entidades", () => {
  const { services, categories, plans } = flattenCatalog(buildTree());

  assert.equal(services.length, 2);
  assert.equal(categories.length, 1);
  assert.equal(plans.length, 2);
  assert.equal(services[0]?.categoryCount, 1);
  assert.equal(services[0]?.planCount, 2);
  assert.equal(services[1]?.categoryCount, 0);
  assert.equal(services[1]?.planCount, 0);
  assert.equal(categories[0]?.planCount, 2);
  assert.equal(categories[0]?.categoryName, "Desarrollo Web");
});

test("filterServices busca por nombre y respeta el estado", () => {
  const { services } = flattenCatalog(buildTree());

  assert.equal(filterServices(services, { query: "web" }).length, 1);
  assert.equal(filterServices(services, { status: "INACTIVE" }).length, 1);
  assert.equal(filterServices(services, { query: "publicidad", status: "ACTIVE" }).length, 0);
});

test("filterCategories permite filtrar por servicio padre", () => {
  const { categories } = flattenCatalog(buildTree());

  assert.equal(filterCategories(categories, { serviceId: "svc-web" }).length, 1);
  assert.equal(filterCategories(categories, { serviceId: "svc-ads" }).length, 0);
  assert.equal(filterCategories(categories, { query: "desarrollo" }).length, 1);
});

test("filterPlans combina búsqueda, estado, padre y destacado", () => {
  const { plans } = flattenCatalog(buildTree());

  assert.equal(filterPlans(plans, { query: "pro" }).length, 1);
  assert.equal(filterPlans(plans, { status: "INACTIVE" }).length, 1);
  assert.equal(filterPlans(plans, { highlighted: "SI" }).length, 1);
  assert.equal(filterPlans(plans, { highlighted: "NO" }).length, 1);
  assert.equal(filterPlans(plans, { serviceId: "svc-ads" }).length, 0);
  assert.equal(filterPlans(plans, { categoryId: "cat-sitios", status: "ACTIVE" }).length, 1);
});

test("hasActiveCatalogFilters detecta filtros útiles", () => {
  assert.equal(hasActiveCatalogFilters({}), false);
  assert.equal(hasActiveCatalogFilters({ status: "TODOS", highlighted: "TODOS", query: "  " }), false);
  assert.equal(hasActiveCatalogFilters({ query: "web" }), true);
  assert.equal(hasActiveCatalogFilters({ serviceId: "svc-web" }), true);
});

test("etiquetas y vacíos dependen de la vista activa", () => {
  assert.equal(getCatalogCreateLabel("servicios"), "Nuevo servicio");
  assert.equal(getCatalogCreateLabel("categorias"), "Nueva categoría");
  assert.equal(getCatalogCreateLabel("planes"), "Nuevo plan");
  assert.equal(getCatalogSearchPlaceholder("planes"), "Buscar plan, servicio o categoría");
  assert.equal(getCatalogEmptyMessage("servicios", false), "Aún no hay servicios en el catálogo.");
  assert.equal(getCatalogEmptyMessage("planes", true), "No hay planes con esos filtros.");
});

test("formatCatalogPrice formatea CLP sin decimales", () => {
  const formatted = formatCatalogPrice(199000);
  assert.match(formatted, /199/);
  assert.equal(/\.\d{2}$/.test(formatted.replace(/\s/g, "")), false);
});
