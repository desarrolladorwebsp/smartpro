export const TEAM_CAROUSEL_GAP = 20;
export const TEAM_CARD_MIN_WIDTH = 236;
export const TEAM_CAROUSEL_MAX_VISIBLE = 5;

export type TeamCarouselLayout = {
  visibleCount: number;
  cardWidth: number;
  gap: number;
};

export function getTeamCarouselLayout(availableWidth: number): TeamCarouselLayout {
  const gap = TEAM_CAROUSEL_GAP;

  if (!Number.isFinite(availableWidth) || availableWidth <= 0) {
    return { visibleCount: 1, cardWidth: TEAM_CARD_MIN_WIDTH, gap };
  }

  const visibleCount = Math.max(
    1,
    Math.min(
      TEAM_CAROUSEL_MAX_VISIBLE,
      Math.floor((availableWidth + gap) / (TEAM_CARD_MIN_WIDTH + gap)),
    ),
  );

  if (visibleCount === 1) {
    const peekedWidth = Math.round(availableWidth * 0.82);
    return {
      visibleCount: 1,
      cardWidth: Math.max(180, Math.min(peekedWidth, availableWidth)),
      gap,
    };
  }

  const cardWidth = Math.floor((availableWidth - gap * (visibleCount - 1)) / visibleCount);

  return {
    visibleCount,
    cardWidth,
    gap,
  };
}

export function getTeamPageStarts(itemCount: number, visibleCount: number): number[] {
  const visible = Math.max(1, visibleCount);
  const count = Math.max(0, itemCount);

  if (count <= 0) return [0];
  if (count <= visible) return [0];

  const pageCount = Math.ceil(count / visible);
  const lastStart = count - visible;
  const starts: number[] = [];

  for (let index = 0; index < pageCount; index += 1) {
    const start = Math.min(index * visible, lastStart);

    if (starts.at(-1) !== start) {
      starts.push(start);
    }
  }

  return starts;
}

export function getClosestPageIndex(scrollLeft: number, pageOffsets: number[]): number {
  if (pageOffsets.length === 0) return 0;

  let closest = 0;
  let closestDistance = Number.POSITIVE_INFINITY;

  for (let index = 0; index < pageOffsets.length; index += 1) {
    const distance = Math.abs((pageOffsets[index] ?? 0) - scrollLeft);

    if (distance < closestDistance) {
      closestDistance = distance;
      closest = index;
    }
  }

  return closest;
}
