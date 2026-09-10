export const PLAN_FEATURE_PREVIEW_COUNT = 7;

export function getVisiblePlanFeatures<T>(
  features: T[],
  expanded: boolean,
  previewCount = PLAN_FEATURE_PREVIEW_COUNT,
): T[] {
  if (expanded || features.length <= previewCount) return features;
  return features.slice(0, previewCount);
}

export function shouldShowPlanFeaturesToggle(
  featureCount: number,
  previewCount = PLAN_FEATURE_PREVIEW_COUNT,
): boolean {
  return featureCount > previewCount;
}
