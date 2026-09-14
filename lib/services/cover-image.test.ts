import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultServiceCoverImage, resolveServiceCoverImage } from "./default-covers";
import { isManagedServiceCoverPath, withServiceCoverCache } from "./cover-image";

test("resolveServiceCoverImage usa la imagen de BD o el fallback por slug", () => {
  assert.equal(resolveServiceCoverImage("/uploads/services/abc.webp", "desarrollo-web", 0), "/uploads/services/abc.webp");
  assert.equal(
    resolveServiceCoverImage("/api/services/media/abc", "desarrollo-web", 0),
    "/api/services/media/abc",
  );
  assert.equal(
    resolveServiceCoverImage("", "registro-de-marca", 0),
    "/images/services/service-08.jpeg",
  );
  assert.equal(
    resolveServiceCoverImage("", "registro-de-marcas", 0),
    "/images/services/service-08.jpeg",
  );
  assert.equal(
    resolveServiceCoverImage("", "desarrollo-sistemas", 0),
    "/images/services/service-04.png",
  );
  assert.equal(getDefaultServiceCoverImage("otro-slug", 2), "/images/services/service-03.png");
});

test("isManagedServiceCoverPath solo reconoce uploads gestionados", () => {
  assert.equal(isManagedServiceCoverPath("/uploads/services/abc.webp"), true);
  assert.equal(isManagedServiceCoverPath("/api/services/media/abc"), true);
  assert.equal(isManagedServiceCoverPath("/api/services/media/abc?v=1"), true);
  assert.equal(isManagedServiceCoverPath("/images/services/service-01.png"), false);
  assert.equal(isManagedServiceCoverPath(""), false);
});

test("withServiceCoverCache versiona rutas de media y deja intactos uploads estáticos", () => {
  const updatedAt = new Date("2026-09-14T15:00:00.000Z");
  assert.equal(
    withServiceCoverCache("/api/services/media/abc", updatedAt),
    `/api/services/media/abc?v=${updatedAt.getTime()}`,
  );
  assert.equal(
    withServiceCoverCache("/uploads/services/abc.jpg", updatedAt),
    "/uploads/services/abc.jpg",
  );
  assert.equal(withServiceCoverCache("/images/services/service-01.png", updatedAt), "/images/services/service-01.png");
});
