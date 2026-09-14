"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import { useReducedMotion } from "motion/react";

import {
  CAROUSEL_AUTOPLAY_INTERVAL_MS,
  CAROUSEL_RESUME_MS,
  CAROUSEL_SWIPE_THRESHOLD_PX,
  getLoopCloneCount,
  getLoopIndexAfterSettle,
  getLoopStartIndex,
  getRealIndex,
} from "./loop";

type MoveSource = "auto" | "manual";

type UseLoopedCarouselOptions = {
  itemCount: number;
  visibleCount: number;
  extraPaused?: boolean;
  resetKey?: string | number;
  enabled?: boolean;
};

export function useLoopedCarousel({
  itemCount,
  visibleCount,
  extraPaused = false,
  resetKey,
  enabled = true,
}: UseLoopedCarouselOptions) {
  const shouldReduceMotion = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragStartX = useRef<number | null>(null);
  const didSwipeRef = useRef(false);
  const swipeResetTimeoutRef = useRef<number>(0);
  const animatingRef = useRef(false);
  const resumeTimeoutRef = useRef<number>(0);
  const indexRef = useRef(0);

  const cloneCount = enabled ? getLoopCloneCount(visibleCount, itemCount) : 0;
  const looping = cloneCount > 0;
  const canMove = looping;
  const identityKey = `${cloneCount}:${itemCount}:${resetKey ?? ""}`;

  const [identity, setIdentity] = useState(identityKey);
  const [index, setIndex] = useState(() => getLoopStartIndex(cloneCount));
  const [isJumping, setIsJumping] = useState(true);
  const [hovered, setHovered] = useState(false);
  const [focusPaused, setFocusPaused] = useState(false);
  const [interactionPaused, setInteractionPaused] = useState(false);
  const [inView, setInView] = useState(true);
  const [tabVisible, setTabVisible] = useState(true);

  if (identity !== identityKey) {
    setIdentity(identityKey);
    setIndex(getLoopStartIndex(cloneCount));
    setIsJumping(true);
  }

  const realIndex = getRealIndex(index, itemCount, cloneCount);

  const pauseForInteraction = useCallback(() => {
    setInteractionPaused(true);
    window.clearTimeout(resumeTimeoutRef.current);
    resumeTimeoutRef.current = window.setTimeout(() => {
      setInteractionPaused(false);
    }, CAROUSEL_RESUME_MS);
  }, []);

  const moveBy = useCallback(
    (direction: -1 | 1, source: MoveSource) => {
      if (!canMove) return;
      if (source === "auto" && animatingRef.current) return;
      if (source === "manual") pauseForInteraction();
      animatingRef.current = true;
      setIndex((current) => current + direction);
    },
    [canMove, pauseForInteraction],
  );

  const goNext = useCallback(
    (source: MoveSource = "manual") => moveBy(1, source),
    [moveBy],
  );

  const goPrev = useCallback(
    (source: MoveSource = "manual") => moveBy(-1, source),
    [moveBy],
  );

  const goToRealIndex = useCallback(
    (nextRealIndex: number) => {
      if (!canMove || itemCount <= 0) return;
      pauseForInteraction();
      animatingRef.current = true;
      const bounded = ((nextRealIndex % itemCount) + itemCount) % itemCount;
      setIndex(getLoopStartIndex(cloneCount) + bounded);
    },
    [canMove, cloneCount, itemCount, pauseForInteraction],
  );

  const settleLoop = useCallback(() => {
    const settled = getLoopIndexAfterSettle(indexRef.current, itemCount, cloneCount);
    animatingRef.current = false;

    if (!settled.shouldJump) return;

    setIsJumping(true);
    setIndex(settled.index);
  }, [cloneCount, itemCount]);

  useLayoutEffect(() => {
    indexRef.current = index;
  }, [index]);

  useLayoutEffect(() => {
    if (!isJumping) return;

    const frame = window.requestAnimationFrame(() => {
      setIsJumping(false);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [index, isJumping]);

  useEffect(() => {
    return () => {
      window.clearTimeout(resumeTimeoutRef.current);
      window.clearTimeout(swipeResetTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    const node = viewportRef.current;

    if (!node || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setInView(Boolean(entry?.isIntersecting));
      },
      { threshold: [0, 0.15, 0.4, 0.75] },
    );

    observer.observe(node);

    return () => observer.disconnect();
  }, [itemCount, resetKey]);

  useEffect(() => {
    const onVisibility = () => {
      setTabVisible(document.visibilityState === "visible");
    };

    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);

    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (isJumping) return;

    const timeout = window.setTimeout(() => {
      animatingRef.current = false;
    }, 900);

    return () => window.clearTimeout(timeout);
  }, [index, isJumping]);

  const autoplayEnabled =
    looping &&
    !shouldReduceMotion &&
    !hovered &&
    !focusPaused &&
    !interactionPaused &&
    !extraPaused &&
    inView &&
    tabVisible;

  const autoplayEnabledRef = useRef(autoplayEnabled);

  useLayoutEffect(() => {
    autoplayEnabledRef.current = autoplayEnabled;
  }, [autoplayEnabled]);

  useEffect(() => {
    if (!looping || shouldReduceMotion) return;

    const timer = window.setInterval(() => {
      if (!autoplayEnabledRef.current) return;
      goNext("auto");
    }, CAROUSEL_AUTOPLAY_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [goNext, looping, shouldReduceMotion]);

  const onTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      goPrev();
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      goNext();
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!canMove) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;
    dragStartX.current = event.clientX;
    didSwipeRef.current = false;
  };

  const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragStartX.current == null) return;

    const delta = event.clientX - dragStartX.current;
    dragStartX.current = null;

    if (Math.abs(delta) < CAROUSEL_SWIPE_THRESHOLD_PX) return;

    didSwipeRef.current = true;
    window.clearTimeout(swipeResetTimeoutRef.current);
    swipeResetTimeoutRef.current = window.setTimeout(() => {
      didSwipeRef.current = false;
    }, 400);

    if (delta < 0) {
      goNext();
      return;
    }

    goPrev();
  };

  const onPointerCancel = () => {
    dragStartX.current = null;
  };

  const onClickCapture = (event: MouseEvent<HTMLDivElement>) => {
    if (!didSwipeRef.current) return;
    event.preventDefault();
    event.stopPropagation();
    didSwipeRef.current = false;
  };

  return {
    viewportRef,
    index,
    realIndex,
    cloneCount,
    looping,
    canMove,
    isJumping,
    shouldReduceMotion: Boolean(shouldReduceMotion),
    goNext,
    goPrev,
    goToRealIndex,
    settleLoop,
    regionProps: {
      onPointerEnter: (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") {
          setHovered(true);
        }
      },
      onPointerLeave: (event: PointerEvent<HTMLDivElement>) => {
        if (event.pointerType !== "touch" && event.pointerType !== "pen") {
          setHovered(false);
        }
      },
      onMouseEnter: () => {
        if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
          setHovered(true);
        }
      },
      onMouseLeave: () => setHovered(false),
      onFocusCapture: (event: FocusEvent<HTMLDivElement>) => {
        if (event.target === event.currentTarget) return;
        setFocusPaused(true);
      },
      onBlurCapture: (event: FocusEvent<HTMLDivElement>) => {
        const next = event.relatedTarget;
        if (next instanceof Node && event.currentTarget.contains(next)) return;
        setFocusPaused(false);
      },
    },
    trackProps: {
      onKeyDown: onTrackKeyDown,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onClickCapture,
    },
  };
}
