import test from "node:test";
import assert from "node:assert/strict";

import { getCarouselStride, getClosestSlideIndex, getMaxSlideIndex, getNextSlideIndex, getPlanCarouselLayout } from "./plan-carousel-layout";

test("getPlanCarouselLayout muestra solo cards completas según el ancho", () => {
  const mobile = getPlanCarouselLayout(326);
  assert.equal(mobile.visibleCount, 1);
  assert.equal(mobile.cardWidth, 326);

  const tablet = getPlanCarouselLayout(596);
  assert.equal(tablet.visibleCount, 2);
  assert.equal(tablet.cardWidth, 290);

  const desktop = getPlanCarouselLayout(1136);
  assert.equal(desktop.visibleCount, 3);
  assert.equal(desktop.cardWidth, (1136 - 32) / 3);

  const wide = getPlanCarouselLayout(1400);
  assert.equal(wide.visibleCount, 4);
  assert.equal(wide.cardWidth, (1400 - 48) / 4);
});

test("getPlanCarouselLayout nunca deja un recorte parcial", () => {
  for (const width of [280, 400, 720, 980, 1200]) {
    const layout = getPlanCarouselLayout(width);
    const occupied = layout.visibleCount * layout.cardWidth + (layout.visibleCount - 1) * layout.gap;
    assert.ok(occupied <= width + 0.01);
    assert.equal(getCarouselStride(layout), layout.cardWidth + layout.gap);
  }
});

test("getNextSlideIndex avanza y retrocede dentro del rango", () => {
  assert.equal(getClosestSlideIndex(0, [0, 304, 608]), 0);
  assert.equal(getClosestSlideIndex(300, [0, 304, 608]), 1);
  assert.equal(getNextSlideIndex(0, "next", 5), 1);
  assert.equal(getNextSlideIndex(4, "next", 5), 4);
  assert.equal(getNextSlideIndex(0, "prev", 5), 0);
  assert.equal(getMaxSlideIndex(5, 3), 2);
  assert.equal(getMaxSlideIndex(2, 3), 0);
  assert.equal(getNextSlideIndex(0, "next", getMaxSlideIndex(5, 3) + 1), 1);
  assert.equal(getNextSlideIndex(2, "next", getMaxSlideIndex(5, 3) + 1), 2);
  assert.equal(getNextSlideIndex(2, "prev", getMaxSlideIndex(5, 3) + 1), 1);
});
