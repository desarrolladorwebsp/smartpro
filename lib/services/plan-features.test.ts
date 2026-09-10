import test from "node:test";
import assert from "node:assert/strict";

import {
  PLAN_FEATURE_PREVIEW_COUNT,
  getVisiblePlanFeatures,
  shouldShowPlanFeaturesToggle,
} from "./plan-features";

test("getVisiblePlanFeatures muestra solo 7 ítems hasta expandir", () => {
  const features = ["a", "b", "c", "d", "e", "f", "g", "h", "i"];

  assert.equal(PLAN_FEATURE_PREVIEW_COUNT, 7);
  assert.deepEqual(getVisiblePlanFeatures(features, false), features.slice(0, 7));
  assert.deepEqual(getVisiblePlanFeatures(features, true), features);
  assert.equal(shouldShowPlanFeaturesToggle(features.length), true);
});

test("getVisiblePlanFeatures no recorta planes cortos", () => {
  const features = ["a", "b", "c"];

  assert.deepEqual(getVisiblePlanFeatures(features, false), features);
  assert.equal(shouldShowPlanFeaturesToggle(features.length), false);
});
