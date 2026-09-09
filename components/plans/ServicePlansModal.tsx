"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";

import PlanCard, { Plan } from "./PlanCard";
import ServiceCategoryCard from "./ServiceCategoryCard";
import {
  buildServiceCategoryCards,
  type ServiceCategoryOption,
} from "@/lib/services/category-cards";
import { getClosestSlideIndex, getMaxSlideIndex, getNextSlideIndex, getPlanCarouselLayout, type PlanCarouselLayout } from "@/lib/services/plan-carousel-layout";

type ServicePlansModalProps = {
  open: boolean;
  title: string;
  plans: Plan[];
  categories?: ServiceCategoryOption[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
};

export default function ServicePlansModal({
  open,
  title,
  plans,
  categories = [],
  isLoading = false,
  error = null,
  onClose,
}: ServicePlansModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const programmaticScrollRef = useRef(false);
  const slideIndexRef = useRef(0);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const scrollTokenRef = useRef(0);
  const filterId = useId();
  const [addedPlanName, setAddedPlanName] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | "all">("all");
  const [carouselLayout, setCarouselLayout] = useState<PlanCarouselLayout>(() => getPlanCarouselLayout(0));
  const [slideIndex, setSlideIndex] = useState(0);

  const categoryCards = useMemo(() => buildServiceCategoryCards(categories, plans), [categories, plans]);

  const selectedCategory =
    activeCategory === "all" || categoryCards.some((category) => category.name === activeCategory)
      ? activeCategory
      : "all";

  const isCategoryOverview = selectedCategory === "all" && categoryCards.length > 0;

  const visiblePlans = useMemo(() => {
    if (isCategoryOverview) return [];
    if (selectedCategory === "all") return plans;
    return plans.filter((plan) => plan.subcategory === selectedCategory);
  }, [isCategoryOverview, selectedCategory, plans]);

  const showFilter = categoryCards.length > 0;
  const showPlans = !isCategoryOverview && visiblePlans.length > 0;
  const showCarousel = plans.length > 0;
  const showError = Boolean(error) && !showCarousel;
  const showEmpty = !isLoading && !error && !showCarousel;
  const maxSlideIndex = getMaxSlideIndex(visiblePlans.length, carouselLayout.visibleCount);
  const activeSlideIndex = Math.min(slideIndex, maxSlideIndex);
  const canScrollPrev = activeSlideIndex > 0;
  const canScrollNext = activeSlideIndex < maxSlideIndex;

  const handleClose = useCallback(() => {
    setActiveCategory("all");
    setAddedPlanName(null);
    slideIndexRef.current = 0;
    setSlideIndex(0);
    onClose();
  }, [onClose]);

  const measureCarousel = useCallback(() => {
    const node = carouselRef.current;
    if (!node) return;

    const styles = window.getComputedStyle(node);
    const available =
      node.clientWidth - (Number.parseFloat(styles.paddingLeft) || 0) - (Number.parseFloat(styles.paddingRight) || 0);
    const nextLayout = getPlanCarouselLayout(available);

    setCarouselLayout((current) => {
      if (
        current.visibleCount === nextLayout.visibleCount &&
        current.cardWidth === nextLayout.cardWidth &&
        current.gap === nextLayout.gap
      ) {
        return current;
      }

      return nextLayout;
    });
  }, []);

  const scrollToSlide = useCallback((index: number) => {
    const node = carouselRef.current;
    if (!node) return;

    const slides = [...node.querySelectorAll<HTMLElement>("[data-plan-slide]")];
    const target = slides[index];
    if (!target) return;

    const token = scrollTokenRef.current + 1;
    scrollTokenRef.current = token;

    const finish = () => {
      if (scrollTokenRef.current !== token) return;
      window.clearTimeout(scrollTimeoutRef.current);
      node.removeEventListener("scrollend", finish);
      node.style.scrollSnapType = "";
      programmaticScrollRef.current = false;
    };

    programmaticScrollRef.current = true;
    node.style.scrollSnapType = "none";
    window.clearTimeout(scrollTimeoutRef.current);

    const targetLeft = Math.max(
      0,
      target.getBoundingClientRect().left - node.getBoundingClientRect().left + node.scrollLeft,
    );

    window.requestAnimationFrame(() => {
      if (scrollTokenRef.current !== token) return;
      node.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    });

    node.addEventListener("scrollend", finish);
    scrollTimeoutRef.current = setTimeout(finish, 700);
  }, []);

  const scrollCarousel = useCallback(
    (direction: "prev" | "next") => {
      const current = Math.min(slideIndexRef.current, maxSlideIndex);
      const nextIndex = getNextSlideIndex(current, direction, maxSlideIndex + 1);
      if (nextIndex === current) return;

      slideIndexRef.current = nextIndex;
      setSlideIndex(nextIndex);
      scrollToSlide(nextIndex);
    },
    [maxSlideIndex, scrollToSlide],
  );

  const handleCategoryChange = (value: string) => {
    setActiveCategory(value === "all" ? "all" : value);
    slideIndexRef.current = 0;
    setSlideIndex(0);
  };

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleClose();
        return;
      }

      const activeTag = (event.target as HTMLElement | null)?.tagName;
      const isEditingField = activeTag === "SELECT" || activeTag === "INPUT" || activeTag === "TEXTAREA";

      if (!isEditingField && !isCategoryOverview && event.key === "ArrowLeft") {
        event.preventDefault();
        scrollCarousel("prev");
        return;
      }

      if (!isEditingField && !isCategoryOverview && event.key === "ArrowRight") {
        event.preventDefault();
        scrollCarousel("next");
        return;
      }

      if (event.key !== "Tab") return;

      const node = modalRef.current;
      if (!node) return;

      const focusable = node.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), select:not([disabled]), textarea, input, [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, handleClose, scrollCarousel, isCategoryOverview]);

  useEffect(() => {
    if (!open || isCategoryOverview) return;

    const node = carouselRef.current;
    if (!node) return;

    const handleScroll = () => {
      if (programmaticScrollRef.current) return;

      const slides = [...node.querySelectorAll<HTMLElement>("[data-plan-slide]")];
      if (slides.length === 0) return;

      const containerLeft = node.getBoundingClientRect().left;
      const offsets = slides.map((slide) =>
        Math.max(0, slide.getBoundingClientRect().left - containerLeft + node.scrollLeft),
      );
      const closest = Math.min(maxSlideIndex, getClosestSlideIndex(node.scrollLeft, offsets));
      if (closest === slideIndexRef.current) return;

      slideIndexRef.current = closest;
      setSlideIndex(closest);
    };

    const observer = new ResizeObserver(() => {
      measureCarousel();
    });

    observer.observe(node);
    node.addEventListener("scroll", handleScroll, { passive: true });
    measureCarousel();

    return () => {
      observer.disconnect();
      node.removeEventListener("scroll", handleScroll);
    };
  }, [open, isCategoryOverview, visiblePlans.length, selectedCategory, measureCarousel, maxSlideIndex]);

  useEffect(() => {
    slideIndexRef.current = activeSlideIndex;
  }, [activeSlideIndex]);

  useEffect(() => {
    if (!open || isCategoryOverview) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToSlide(Math.min(slideIndexRef.current, getMaxSlideIndex(visiblePlans.length, carouselLayout.visibleCount)));
    });

    return () => window.cancelAnimationFrame(frame);
  }, [
    open,
    isCategoryOverview,
    selectedCategory,
    carouselLayout.cardWidth,
    carouselLayout.visibleCount,
    visiblePlans.length,
    scrollToSlide,
  ]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    requestAnimationFrame(() => {
      modalRef.current?.focus();
    });
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 lg:p-8">
          <motion.button
            type="button"
            aria-label="Cerrar planes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={handleClose}
            className="absolute inset-0 cursor-default bg-ink/70 backdrop-blur-[5px]"
          />

          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plans-modal-title"
            aria-busy={isLoading || undefined}
            tabIndex={-1}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 15, scale: 0.985 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="
              relative z-10 flex max-h-[92vh] w-full max-w-[1280px]
              flex-col overflow-hidden rounded-[22px] border border-primary/10
              bg-background shadow-[0_30px_100px_rgba(11,11,20,0.28)] outline-none
            "
          >
            {isLoading ? (
              <div className="absolute inset-x-0 top-0 z-20 h-0.5 overflow-hidden bg-primary/10">
                <div className="h-full w-1/3 animate-pulse bg-primary" />
              </div>
            ) : null}

            <div className="shrink-0 border-b border-border bg-white/85 px-4 py-3 backdrop-blur-xl sm:px-6">
              <div
                className={`
                  grid items-center gap-x-3 gap-y-2.5
                  ${showFilter ? "grid-cols-[minmax(0,1fr)_auto] sm:grid-cols-[minmax(0,1fr)_minmax(13.75rem,16.5rem)_auto]" : "grid-cols-[minmax(0,1fr)_auto]"}
                `}
              >
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                    {isCategoryOverview ? "Categorías SmartPro" : "Planes SmartPro"}
                  </p>
                  <h2
                    id="plans-modal-title"
                    className="mt-0.5 truncate text-lg font-semibold tracking-[-0.03em] text-foreground sm:text-xl"
                  >
                    {title}
                  </h2>
                </div>

                {showFilter ? (
                  <div className="relative col-span-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                    <label htmlFor={filterId} className="sr-only">
                      Cambiar de categoría
                    </label>
                    <select
                      id={filterId}
                      value={selectedCategory}
                      aria-controls={isCategoryOverview ? "service-categories" : "plans-carousel"}
                      onChange={(event) => handleCategoryChange(event.target.value)}
                      className="
                        min-h-10 w-full appearance-none rounded-full border border-primary/25
                        bg-white px-4 pr-10 text-sm font-medium text-foreground outline-none
                        transition-colors duration-300 focus:border-primary/50
                      "
                    >
                      <option value="all">Todas / Categorías</option>
                      {categoryCards.map((category) => (
                        <option key={category.id} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <ChevronDown
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1/2 right-3.5 h-4 w-4 -translate-y-1/2 text-primary"
                    />
                  </div>
                ) : null}

                <motion.button
                  type="button"
                  aria-label="Cerrar"
                  onClick={handleClose}
                  whileHover={{ rotate: 5, scale: 1.04 }}
                  whileTap={{ scale: 0.92 }}
                  className={`
                    col-start-2 row-start-1 flex h-10 w-10 shrink-0 items-center justify-center
                    justify-self-end rounded-full border border-border bg-white text-muted
                    transition-all duration-300 hover:border-primary/40 hover:bg-primary/5
                    hover:text-primary
                    ${showFilter ? "sm:col-start-3" : ""}
                  `}
                >
                  <X size={17} strokeWidth={1.8} />
                </motion.button>
              </div>
            </div>

            <div
              className={`min-h-0 flex-1 overscroll-contain ${isCategoryOverview ? "overflow-y-auto px-4 py-5 sm:px-5 lg:px-6" : "overflow-hidden px-3 py-2 sm:px-4 sm:py-3 lg:px-5"}`}
              aria-live="polite"
            >
              {showError ? (
                <div className="flex min-h-[240px] items-center justify-center px-4 text-center">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">No se pudieron cargar los planes</h3>
                    <p className="mt-1.5 text-sm text-muted" role="alert">
                      {error}
                    </p>
                  </div>
                </div>
              ) : null}

              {showEmpty ? (
                <div className="flex min-h-[240px] items-center justify-center px-4 text-center">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">Próximamente</h3>
                    <p className="mt-1.5 text-sm text-muted">Estamos preparando los planes para este servicio.</p>
                  </div>
                </div>
              ) : null}

              {isLoading && !showCarousel ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={`category-skeleton-${index}`}
                      className="h-[13.5rem] animate-pulse rounded-[18px] border border-border bg-white p-4"
                    >
                      <div className="h-4 w-16 rounded-full bg-slate-200/90" />
                      <div className="mt-4 h-5 w-36 rounded-full bg-slate-200/90" />
                      <div className="mt-3 h-3 w-full rounded-full bg-slate-100" />
                      <div className="mt-2 h-3 w-[80%] rounded-full bg-slate-100" />
                      <div className="mt-8 h-10 rounded-xl bg-slate-200/80" />
                    </div>
                  ))}
                </div>
              ) : null}

              {showCarousel ? (
                <AnimatePresence mode="wait">
                  {isCategoryOverview ? (
                    <motion.div
                      key="categories"
                      id="service-categories"
                      role="region"
                      aria-label={`Categorías de ${title}`}
                      initial={{ opacity: 0, x: -18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -12 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="grid grid-cols-1 gap-4 p-1 sm:grid-cols-2 sm:p-2 lg:grid-cols-3"
                    >
                      {categoryCards.map((category, index) => (
                        <ServiceCategoryCard
                          key={category.id}
                          category={category}
                          index={index}
                          onSelect={handleCategoryChange}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      key={`plans-${selectedCategory}`}
                      initial={{ opacity: 0, x: 18 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 12 }}
                      transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                      className="flex h-full min-h-0 items-stretch gap-3"
                    >
                      {visiblePlans.length > carouselLayout.visibleCount ? (
                        <button
                          type="button"
                          aria-label="Ver planes anteriores"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            scrollCarousel("prev");
                          }}
                          disabled={!canScrollPrev}
                          className="
                            relative z-20 hidden h-10 w-10 shrink-0 self-center items-center justify-center
                            rounded-full border border-primary/20 bg-white text-primary
                            shadow-[0_8px_20px_rgba(16,16,36,0.08)] transition-all duration-300
                            hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 md:flex
                          "
                        >
                          <ChevronLeft size={18} strokeWidth={2.2} className="pointer-events-none" />
                        </button>
                      ) : null}

                      <div
                        ref={carouselRef}
                        id="plans-carousel"
                        role="region"
                        aria-roledescription="carrusel"
                        aria-label={`Planes de ${selectedCategory === "all" ? title : selectedCategory}`}
                        style={{ gap: carouselLayout.gap }}
                        className="
                          no-scrollbar flex min-w-0 flex-1 snap-x snap-mandatory items-stretch
                          overflow-x-auto scroll-px-2 touch-pan-x px-2 py-4
                        "
                      >
                        {showPlans
                          ? visiblePlans.map((plan, index) => (
                              <div
                                key={plan.id ?? `${plan.name}-${index}`}
                                data-plan-slide
                                style={{
                                  width: carouselLayout.cardWidth,
                                  flex: `0 0 ${carouselLayout.cardWidth}px`,
                                }}
                                className="isolate flex h-auto min-w-0 snap-start flex-col"
                              >
                                <PlanCard plan={plan} index={index} onAdded={setAddedPlanName} />
                              </div>
                            ))
                          : (
                              <div className="flex min-h-[240px] w-full items-center justify-center px-4 text-center">
                                <p className="text-sm text-muted">No hay planes activos en esta categoría.</p>
                              </div>
                            )}
                      </div>

                      {visiblePlans.length > carouselLayout.visibleCount ? (
                        <button
                          type="button"
                          aria-label="Ver planes siguientes"
                          onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            scrollCarousel("next");
                          }}
                          disabled={!canScrollNext}
                          className="
                            relative z-20 hidden h-10 w-10 shrink-0 self-center items-center justify-center
                            rounded-full border border-primary/20 bg-white text-primary
                            shadow-[0_8px_20px_rgba(16,16,36,0.08)] transition-all duration-300
                            hover:border-primary/40 disabled:cursor-not-allowed disabled:opacity-40 md:flex
                          "
                        >
                          <ChevronRight size={18} strokeWidth={2.2} className="pointer-events-none" />
                        </button>
                      ) : null}
                    </motion.div>
                  )}
                </AnimatePresence>
              ) : null}

              <AnimatePresence>
                {addedPlanName && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96, y: 12 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: -8 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
                  >
                    <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_26px_80px_rgba(16,24,40,0.18)]">
                      <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 pb-4 pt-5">
                        <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                          Plan agregado
                        </div>
                        <h3 className="text-xl font-bold tracking-[-0.04em] text-foreground">{addedPlanName}</h3>
                        <p className="mt-2 text-sm text-muted">
                          Se añadió correctamente a tu carrito y ya puedes seguir con la contratación.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 border-t border-border bg-slate-50 p-4 sm:flex-row sm:justify-end">
                        <button
                          type="button"
                          onClick={() => setAddedPlanName(null)}
                          className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-slate-300 hover:bg-slate-100"
                        >
                          Seguir viendo
                        </button>

                        <Link
                          href="/checkout"
                          onClick={handleClose}
                          className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#4f46e5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca]"
                        >
                          Ir al carrito
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
