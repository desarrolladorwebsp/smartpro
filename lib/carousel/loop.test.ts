import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  buildLoopedItems,
  carouselCanMove,
  getLoopCloneCount,
  getLoopIndexAfterSettle,
  getLoopSlots,
  getLoopStartIndex,
  getRealIndex,
  isCarouselSlideVisible,
} from "./loop";

describe("carouselCanMove", () => {
  it("stays still when every item already fits", () => {
    assert.equal(carouselCanMove(3, 5), false);
    assert.equal(carouselCanMove(4, 4), false);
    assert.equal(carouselCanMove(1, 1), false);
  });

  it("enables motion only when there is overflow", () => {
    assert.equal(carouselCanMove(8, 5), true);
    assert.equal(carouselCanMove(4, 3), true);
    assert.equal(carouselCanMove(2, 1), true);
  });
});

describe("getLoopCloneCount", () => {
  it("returns no clones when the row is not overflowing", () => {
    assert.equal(getLoopCloneCount(5, 3), 0);
    assert.equal(getLoopCloneCount(1, 1), 0);
  });

  it("clones a full viewport so the wrap never shows a gap", () => {
    assert.equal(getLoopCloneCount(5, 8), 5);
    assert.equal(getLoopCloneCount(3, 4), 3);
    assert.equal(getLoopCloneCount(1, 8), 1);
  });
});

describe("buildLoopedItems", () => {
  it("keeps the original list when looping is disabled", () => {
    assert.deepEqual(buildLoopedItems(["a", "b"], 0), ["a", "b"]);
  });

  it("mirrors items on both sides for a seamless wrap", () => {
    assert.deepEqual(buildLoopedItems(["a", "b", "c", "d"], 3), [
      "b",
      "c",
      "d",
      "a",
      "b",
      "c",
      "d",
      "a",
      "b",
      "c",
    ]);
  });
});

describe("getLoopSlots", () => {
  it("marks only the mirrored edges as clones", () => {
    const slots = getLoopSlots(["a", "b", "c", "d"], 2);

    assert.equal(slots.length, 8);
    assert.deepEqual(
      slots.map((slot) => [slot.item, slot.realIndex, slot.isClone]),
      [
        ["c", 2, true],
        ["d", 3, true],
        ["a", 0, false],
        ["b", 1, false],
        ["c", 2, false],
        ["d", 3, false],
        ["a", 0, true],
        ["b", 1, true],
      ],
    );
  });
});

describe("getLoopIndexAfterSettle", () => {
  it("jumps from the trailing clones back to the real start", () => {
    assert.deepEqual(getLoopIndexAfterSettle(7, 4, 3), { index: 3, shouldJump: true });
    assert.equal(getRealIndex(3, 4, 3), 0);
    assert.equal(getLoopStartIndex(3), 3);
  });

  it("jumps from the leading clones back to the real end", () => {
    assert.deepEqual(getLoopIndexAfterSettle(2, 4, 3), { index: 6, shouldJump: true });
    assert.equal(getRealIndex(6, 4, 3), 3);
  });

  it("leaves a real-range index untouched", () => {
    assert.deepEqual(getLoopIndexAfterSettle(4, 4, 3), { index: 4, shouldJump: false });
    assert.equal(getRealIndex(4, 4, 3), 1);
  });
});

describe("isCarouselSlideVisible", () => {
  it("keeps a full uncut row in view", () => {
    assert.equal(isCarouselSlideVisible(3, 3, 3), true);
    assert.equal(isCarouselSlideVisible(5, 3, 3), true);
    assert.equal(isCarouselSlideVisible(6, 3, 3), false);
    assert.equal(isCarouselSlideVisible(2, 3, 3), false);
  });
});
