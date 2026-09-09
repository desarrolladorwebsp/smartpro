import test from "node:test";
import assert from "node:assert/strict";

import { getDefaultServiceCoverImage, resolveServiceCoverImage } from "./default-covers";
import { isManagedServiceCoverPath } from "./cover-image";

test("resolveServiceCoverImage usa la imagen de BD o el fallback por slug", () => {
  assert.equal(resolveServiceCoverImage("/uploads/services/abc.webp", "desarrollo-web", 0), "/uploads/services/abc.webp");
  assert.equal(
    resolveServiceCoverImage("", "registro-de-marcas", 0),
    "/images/services/service-08.jpeg",
  );
  assert.equal(getDefaultServiceCoverImage("otro-slug", 2), "/images/services/service-03.png");
});

test("isManagedServiceCoverPath solo reconoce uploads gestionados", () => {
  assert.equal(isManagedServiceCoverPath("/uploads/services/abc.webp"), true);
  assert.equal(isManagedServiceCoverPath("/images/services/service-01.png"), false);
  assert.equal(isManagedServiceCoverPath(""), false);
});
