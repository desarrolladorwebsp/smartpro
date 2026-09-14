export const CAROUSEL_AUTOPLAY_INTERVAL_MS = 2000;
export const CAROUSEL_RESUME_MS = 5000;
export const CAROUSEL_SWIPE_THRESHOLD_PX = 48;
export const CAROUSEL_TRANSITION_DURATION_S = 0.6;
export const CAROUSEL_EASE = [0.22, 1, 0.36, 1] as const;

export type CarouselLoopSlot<T> = {
  item: T;
  slotIndex: number;
  realIndex: number;
  isClone: boolean;
};

export function carouselCanMove(itemCount: number, visibleCount: number) {
  return itemCount > Math.max(1, visibleCount);
}

export function getLoopCloneCount(visibleCount: number, itemCount: number) {
  if (!carouselCanMove(itemCount, visibleCount)) {
    return 0;
  }

  return Math.min(itemCount, Math.max(1, visibleCount));
}

export function getLoopStartIndex(cloneCount: number) {
  return Math.max(0, cloneCount);
}

export function buildLoopedItems<T>(items: readonly T[], cloneCount: number): T[] {
  if (items.length === 0 || cloneCount <= 0) {
    return [...items];
  }

  const safeCloneCount = Math.min(cloneCount, items.length);

  return [
    ...items.slice(-safeCloneCount),
    ...items,
    ...items.slice(0, safeCloneCount),
  ];
}

export function getLoopSlots<T>(
  items: readonly T[],
  cloneCount: number,
): CarouselLoopSlot<T>[] {
  const loopedItems = buildLoopedItems(items, cloneCount);

  return loopedItems.map((item, slotIndex) => {
    const realIndex =
      items.length === 0
        ? 0
        : (((slotIndex - cloneCount) % items.length) + items.length) % items.length;

    return {
      item,
      slotIndex,
      realIndex,
      isClone:
        cloneCount > 0 &&
        (slotIndex < cloneCount || slotIndex >= cloneCount + items.length),
    };
  });
}

export function getRealIndex(loopIndex: number, itemCount: number, cloneCount: number) {
  if (itemCount <= 0) {
    return 0;
  }

  return (((loopIndex - cloneCount) % itemCount) + itemCount) % itemCount;
}

export function getLoopIndexAfterSettle(
  index: number,
  itemCount: number,
  cloneCount: number,
): { index: number; shouldJump: boolean } {
  if (cloneCount <= 0 || itemCount <= 0) {
    return { index: Math.max(0, index), shouldJump: false };
  }

  if (index >= cloneCount + itemCount) {
    return { index: index - itemCount, shouldJump: true };
  }

  if (index < cloneCount) {
    return { index: index + itemCount, shouldJump: true };
  }

  return { index, shouldJump: false };
}

export function isCarouselSlideVisible(
  slotIndex: number,
  activeIndex: number,
  visibleCount: number,
) {
  const visible = Math.max(1, visibleCount);

  return slotIndex >= activeIndex && slotIndex < activeIndex + visible;
}
