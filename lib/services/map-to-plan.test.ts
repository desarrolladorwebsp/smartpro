import test from "node:test";
import assert from "node:assert/strict";

import {
  INQUIRY_PRICE_LABEL,
  getPlanInquiryHref,
  isInquiryPlan,
  mapServicePlanToPlan,
} from "./map-to-plan";
import { presentPlan } from "../api/v1/presenters";
import type { ServicePlanRecord } from "./types";

const emptyDates = {
  createdAt: "2026-09-13T00:00:00.000Z",
  updatedAt: "2026-09-13T00:00:00.000Z",
};

function planRecord(partial: Partial<ServicePlanRecord> = {}): ServicePlanRecord {
  return {
    id: "plan-1",
    subcategoryId: "sub-1",
    subcategoryName: "CRM",
    categoryId: "cat-1",
    categoryName: "Desarrollo sistemas",
    name: "CRM comercial",
    slug: "crm-comercial",
    price: 199000,
    pricePrefix: "desde",
    taxLabel: "+ IVA",
    taxRate: 0.19,
    summary: "CRM para el equipo comercial.",
    badge: "Comercial",
    note: "Ideal para equipos comerciales.",
    featureGroupTitle: "Incluye",
    highlighted: false,
    sortOrder: 0,
    status: "ACTIVE",
    icon: "",
    externalLink: "",
    items: [],
    ...emptyDates,
    ...partial,
  };
}

test("mapServicePlanToPlan muestra Consultar y enlace al formulario cuando el precio es 0", () => {
  const plan = mapServicePlanToPlan(
    planRecord({
      price: 0,
      externalLink: getPlanInquiryHref("CRM comercial"),
    }),
  );

  assert.equal(plan.price, INQUIRY_PRICE_LABEL);
  assert.equal(plan.tax, null);
  assert.equal(plan.oldPrice, null);
  assert.equal(plan.link, getPlanInquiryHref("CRM comercial"));
  assert.equal(isInquiryPlan(plan), true);
});

test("mapServicePlanToPlan conserva precio formateado en planes con valor", () => {
  const plan = mapServicePlanToPlan(planRecord());

  assert.match(plan.price, /199/);
  assert.equal(plan.tax, "+ IVA");
  assert.equal(isInquiryPlan(plan), false);
});

test("la imagen oficial se conserva en la tarjeta y se publica absoluta en la API", () => {
  const previous = process.env.APP_URL;
  process.env.APP_URL = "https://smartpro.cl";
  try {
    const coverImage = "/images/services/audiovisual/01-video-publicitario.webp";
    const record = planRecord({ coverImage });
    assert.equal(mapServicePlanToPlan(record).coverImage, coverImage);
    assert.equal(presentPlan(record).coverImage, `https://smartpro.cl${coverImage}`);
    assert.equal(presentPlan(planRecord()).coverImage, "");
  } finally {
    if (previous === undefined) delete process.env.APP_URL;
    else process.env.APP_URL = previous;
  }
});
