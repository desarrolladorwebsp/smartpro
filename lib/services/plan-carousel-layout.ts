export const PLAN_CAROUSEL_GAP = 16;
export const PLAN_CARD_MIN_WIDTH = 288;
export const PLAN_CAROUSEL_MAX_VISIBLE = 4;

export type PlanCarouselLayout = {
  visibleCount: number;
  cardWidth: number;
  gap: number;
};

export function getPlanCarouselLayout(availableWidth: number): PlanCarouselLayout {
  const gap = PLAN_CAROUSEL_GAP;

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return { visibleCount: 1, cardWidth: PLAN_CARD_MIN_WIDTH, gap };
  }

  const visibleCount = Math.max(
    1,
    Math.min(
      PLAN_CAROUSEL_MAX_VISIBLE,
      Math.floor((availableWidth + gap) / (PLAN_CARD_MIN_WIDTH + gap)),
    ),
  );

  const cardWidth = Math.floor(
    visibleCount === 1 ? availableWidth : (availableWidth - gap * (visibleCount - 1)) / visibleCount,
  );

  return {
    visibleCount,
    cardWidth,
    gap,
  };
}

export function getCarouselStride(layout: PlanCarouselLayout): number {
  return layout.cardWidth + layout.gap;
}

export function getClosestSlideIndex(scrollLeft: number, slideOffsets: number[]): number {
  if (slideOffsets.length === 0) return 0;

  let closest = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < slideOffsets.length; index += 1) {
    const distance = Math.abs((slideOffsets[index] ?? 0) - scrollLeft);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  }

  return closest;
}

export function getNextSlideIndex(
  currentIndex: number,
  direction: "prev" | "next",
  slideCount: number,
): number {
  const delta = direction === "next" ? 1 : -1;
  return Math.min(Math.max(slideCount - 1, 0), Math.max(0, currentIndex + delta));
}

export function getMaxSlideIndex(slideCount: number, visibleCount: number): number {
  return Math.max(0, slideCount - Math.max(1, visibleCount));
}
