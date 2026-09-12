import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getClosestPageIndex,
  getTeamCarouselLayout,
  getTeamPageStarts,
  TEAM_CARD_MIN_WIDTH,
  TEAM_CAROUSEL_GAP,
} from "./carousel-layout";

describe("getTeamCarouselLayout", () => {
  it("falls back to a single card when width is unknown", () => {
    const layout = getTeamCarouselLayout(0);

    assert.equal(layout.visibleCount, 1);
    assert.equal(layout.cardWidth, TEAM_CARD_MIN_WIDTH);
    assert.equal(layout.gap, TEAM_CAROUSEL_GAP);
  });

  it("keeps one peeked card on narrow phones", () => {
    const layout = getTeamCarouselLayout(390);

    assert.equal(layout.visibleCount, 1);
    assert.equal(layout.cardWidth, Math.round(390 * 0.82));
  });

  it("fits as many side-by-side cards as the row allows", () => {
    assert.equal(getTeamCarouselLayout(768).visibleCount, 3);
    assert.equal(getTeamCarouselLayout(1100).visibleCount, 4);
    assert.equal(getTeamCarouselLayout(1320).visibleCount, 5);
  });

  it("never exceeds the maximum visible cards", () => {
    assert.equal(getTeamCarouselLayout(2400).visibleCount, 5);
  });
});

describe("getTeamPageStarts", () => {
  it("returns a single page when everyone fits", () => {
    assert.deepEqual(getTeamPageStarts(3, 5), [0]);
  });

  it("aligns the last page to the end so the row stays full", () => {
    assert.deepEqual(getTeamPageStarts(8, 5), [0, 3]);
    assert.deepEqual(getTeamPageStarts(8, 3), [0, 3, 5]);
    assert.deepEqual(getTeamPageStarts(8, 4), [0, 4]);
  });

  it("creates one page per person when only one card fits", () => {
    assert.deepEqual(getTeamPageStarts(8, 1), [0, 1, 2, 3, 4, 5, 6, 7]);
  });
});

describe("getClosestPageIndex", () => {
  it("picks the nearest page offset", () => {
    assert.equal(getClosestPageIndex(10, [0, 400, 800]), 0);
    assert.equal(getClosestPageIndex(390, [0, 400, 800]), 1);
    assert.equal(getClosestPageIndex(900, [0, 400, 800]), 2);
  });
});
