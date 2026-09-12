"use client";

import {
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { motion } from "motion/react";
import { ArrowUpRight, ChevronDown, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";
import { PUBLIC_PORTFOLIO_FILTERS, type PublicPortfolioFilter } from "@/lib/portfolio/constants";
import type { PublicPortfolioProject } from "@/lib/portfolio/types";

type PortfolioSectionProps = {
  projects: PublicPortfolioProject[];
};

function isPortfolioFilter(value: string): value is PublicPortfolioFilter {
  return (PUBLIC_PORTFOLIO_FILTERS as readonly string[]).includes(value);
}

const SCROLL_EDGE_PX = 8;

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getCarouselStep(node: HTMLElement) {
  const card = node.querySelector<HTMLElement>("[data-portfolio-card]");

  if (!card) {
    return Math.max(node.clientWidth * 0.82, 240);
  }

  const gap = Number.parseFloat(getComputedStyle(node).columnGap || "0") || 0;

  return card.offsetWidth + gap;
}

function getCarouselScrollState(node: HTMLElement) {
  const maxScrollLeft = node.scrollWidth - node.clientWidth;
  const hasOverflow = maxScrollLeft > SCROLL_EDGE_PX;

  return {
    canScrollPrev: hasOverflow && node.scrollLeft > SCROLL_EDGE_PX,
    canScrollNext: hasOverflow && node.scrollLeft < maxScrollLeft - SCROLL_EDGE_PX,
  };
}

/* ============================================================
   PORTFOLIO SECTION
============================================================ */

export default function PortfolioSection({ projects }: PortfolioSectionProps) {
  const [activeFilter, setActiveFilter] = useState<PublicPortfolioFilter>("Todos");
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const portfolioTrackRef = useRef<HTMLDivElement | null>(null);

  const filteredProjects = useMemo(() => {
    if (activeFilter === "Todos") {
      return projects;
    }

    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter, projects]);

  const syncCarouselState = useCallback(() => {
    const node = portfolioTrackRef.current;

    if (!node) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const nextState = getCarouselScrollState(node);

    setCanScrollPrev(nextState.canScrollPrev);
    setCanScrollNext(nextState.canScrollNext);
  }, []);

  const scrollPortfolio = useCallback((direction: -1 | 1) => {
    const node = portfolioTrackRef.current;

    if (!node) return;

    node.scrollBy({
      left: direction * getCarouselStep(node),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  const handleFilterChange = (filter: PublicPortfolioFilter) => {
    setActiveFilter(filter);
  };

  const handleTrackKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      scrollPortfolio(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      scrollPortfolio(1);
    }
  };

  useLayoutEffect(() => {
    const node = portfolioTrackRef.current;

    if (!node) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    node.scrollTo({ left: 0, behavior: "auto" });
    syncCarouselState();

    const frame = window.requestAnimationFrame(syncCarouselState);
    const handleScroll = () => syncCarouselState();
    const observer = new ResizeObserver(() => syncCarouselState());

    observer.observe(node);

    for (const child of node.children) {
      if (child instanceof HTMLElement) {
        observer.observe(child);
      }
    }

    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [filteredProjects, syncCarouselState]);

  return (
    <section
      id="proyectos"
      className="section-shell bg-background"
    >
      {/* ======================================================
          DECORACIÓN
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[420px]
          w-[900px]
          -translate-x-1/2
          rounded-full
          bg-primary/5
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          top-1/3
          h-[300px]
          w-[300px]
          rounded-full
          bg-magenta/5
          blur-[110px]
        "
      />

      <div
        className="section-container"
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="section-header">
          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.5,
            }}
            transition={{
              duration: 0.5,
            }}
            className="eyebrow"
          >
            Portafolio
          </motion.p>

          <motion.h2
            initial={{
              opacity: 0,
              y: 18,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.4,
            }}
            transition={{
              duration: 0.6,
              delay: 0.05,
            }}
            className="section-title"
          >
            Proyectos que hablan
            <span className="block">
              por{" "}
              <span className="text-gradient-brand">
                nuestro trabajo.
              </span>
            </span>
          </motion.h2>

          <motion.div
            initial={{
              opacity: 0,
              scaleX: 0,
            }}
            whileInView={{
              opacity: 1,
              scaleX: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.15,
            }}
            className="accent-line"
          />

          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
            }}
            className="section-copy"
          >
            Diseñamos y desarrollamos soluciones digitales reales para empresas
            y marcas de distintas industrias.
          </motion.p>
        </div>

        {/* ====================================================
            FILTROS
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          transition={{
            duration: 0.5,
            delay: 0.2,
          }}
          className="mb-6 md:mb-8"
        >
          <div className="relative mx-auto w-full max-w-sm md:hidden">
            <label htmlFor="portfolio-filter" className="sr-only">
              Filtrar proyectos por categoría
            </label>
            <select
              id="portfolio-filter"
              value={activeFilter}
              aria-controls="portfolio-carousel"
              onChange={(event) => {
                const nextFilter = event.target.value;

                if (isPortfolioFilter(nextFilter)) {
                  handleFilterChange(nextFilter);
                }
              }}
              className="
                min-h-12
                w-full
                appearance-none
                rounded-full
                border
                border-primary/25
                bg-surface
                px-5
                pr-12
                text-sm
                font-medium
                text-foreground
                outline-none
                transition-colors
                duration-300
                focus:border-primary/50
              "
            >
              {PUBLIC_PORTFOLIO_FILTERS.map((filter) => (
                <option key={filter} value={filter}>
                  {filter}
                </option>
              ))}
            </select>
            <ChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 right-4 h-4 w-4 -translate-y-1/2 text-primary"
            />
          </div>

          <div className="hidden flex-wrap items-center justify-center gap-2.5 md:flex">
            {PUBLIC_PORTFOLIO_FILTERS.map((filter) => {
              const isActive = activeFilter === filter;

              return (
                <button
                  key={filter}
                  type="button"
                  aria-pressed={isActive}
                  aria-controls="portfolio-carousel"
                  onClick={() => handleFilterChange(filter)}
                  className={`
                    relative
                    min-h-11
                    overflow-hidden
                    rounded-full
                    border
                    px-5
                    text-sm
                    font-medium
                    transition-colors
                    duration-300

                    ${
                      isActive
                        ? "border-primary bg-primary text-white"
                        : "border-primary/25 bg-surface text-muted hover:border-primary/50 hover:text-primary"
                    }
                  `}
                >
                  {filter}
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* ====================================================
            CARRUSEL
        ==================================================== */}

        <div
          id="portfolio-carousel"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Proyectos del portafolio"
          className="relative min-w-0 max-w-full"
        >
          <p className="sr-only" aria-live="polite">
            {filteredProjects.length}{" "}
            {filteredProjects.length === 1 ? "proyecto" : "proyectos"} en {activeFilter}.
          </p>

          {filteredProjects.length === 0 ? (
            <div className="py-16 text-center text-muted">
              No hay proyectos en esta categoría todavía.
            </div>
          ) : (
            <>
            <div
              key={activeFilter}
              ref={portfolioTrackRef}
              tabIndex={0}
              onKeyDown={handleTrackKeyDown}
              className="
                no-scrollbar
                flex
                w-full
                min-w-0
                flex-nowrap
                items-stretch
                gap-5
                overflow-x-auto
                overflow-y-hidden
                overscroll-x-contain
                scroll-smooth
                pb-2
                snap-x
                snap-mandatory
                touch-pan-x
                outline-none
                focus-visible:ring-2
                focus-visible:ring-primary/40
                focus-visible:ring-offset-2
              "
            >
              {filteredProjects.map((project) => (
                <PortfolioCard key={project.id} project={project} />
              ))}
            </div>

            <button
              type="button"
              aria-label="Ver proyectos anteriores"
              aria-disabled={!canScrollPrev}
              disabled={!canScrollPrev}
              onClick={() => scrollPortfolio(-1)}
              className={`
                icon-button
                absolute
                top-1/2
                left-2
                z-10
                hidden
                h-11
                w-11
                -translate-y-1/2
                bg-surface/95
                shadow-[0_8px_24px_rgb(16_16_36_/_0.12)]
                backdrop-blur-md
                lg:flex
                disabled:pointer-events-none
                ${canScrollPrev ? "opacity-100" : "pointer-events-none opacity-0"}
              `}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <button
              type="button"
              aria-label="Ver proyectos siguientes"
              aria-disabled={!canScrollNext}
              disabled={!canScrollNext}
              onClick={() => scrollPortfolio(1)}
              className={`
                icon-button
                absolute
                top-1/2
                right-2
                z-10
                hidden
                h-11
                w-11
                -translate-y-1/2
                bg-surface/95
                shadow-[0_8px_24px_rgb(16_16_36_/_0.12)]
                backdrop-blur-md
                lg:flex
                disabled:pointer-events-none
                ${canScrollNext ? "opacity-100" : "pointer-events-none opacity-0"}
              `}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   PORTFOLIO CARD
============================================================ */

function PortfolioCard({ project }: { project: PublicPortfolioProject }) {
  const isExternal = project.url.startsWith("http");

  return (
    <motion.article
      data-portfolio-card
      initial={{
        opacity: 0,
        y: 20,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
      className="
        card-frame
        group
        h-full
        w-[min(82%,22rem)]
        shrink-0
        snap-start
        transition-shadow duration-500
        hover:-translate-y-px hover:shadow-[0_14px_40px_rgb(109_40_217_/_0.1)]
        md:w-[calc((100%-1.25rem)/2)]
        lg:w-[calc((100%-2.5rem)/3)]
      "
    >
      {/* ======================================================
          BROWSER CHROME
      ====================================================== */}

      <div
        className="
          flex
          h-11
          items-center
          gap-3
          border-b
          border-border
          bg-soft-background
          px-4
        "
      >
        {/* Browser dots */}

        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </div>

        {/* Fake URL */}

        <div
          className="
            min-w-0
            flex-1
            truncate
            rounded-full
            bg-white
            px-3
            py-1
            text-[11px]
            text-muted
          "
        >
          {project.url !== "#" ? project.url : "smartpro.cl/proyecto"}
        </div>
      </div>

      {/* ======================================================
          PROJECT IMAGE
      ====================================================== */}

      <div
        className="
          relative
          aspect-[5/4]
          overflow-hidden
          bg-soft-background
        "
      >
        <SmartImage
          key={project.image}
          src={project.image}
          alt={`Proyecto ${project.title}`}
          fill
          className="object-cover object-top transition-transform duration-700 ease-out group-hover:scale-[1.025]"
          sizes="(max-width: 767px) 82vw, (max-width: 1023px) 50vw, 33vw"
          containerClassName="absolute inset-0"
        />

        {/* Overlay hover */}

        <div
          className="
            absolute
            inset-0
            flex
            items-center
            justify-center
            bg-navy/0
            opacity-0
            transition-all
            duration-300
            group-hover:bg-navy/30
            group-hover:opacity-100
          "
        >
          {project.url !== "#" && (
            <a
              href={project.url}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                bg-surface
                text-primary
                shadow-[0_8px_20px_rgb(16_16_36_/_0.12)]
                transition-transform
                duration-300
              "
              aria-label={`Visitar ${project.title}`}
            >
              <ExternalLink size={20} strokeWidth={1.8} />
            </a>
          )}
        </div>
      </div>

      {/* ======================================================
          INFO
      ====================================================== */}

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3
              className="
                text-lg
                font-semibold
                tracking-[-0.025em]
                text-foreground
                sm:text-xl
              "
            >
              {project.title}
            </h3>

            <p
              className="
                mt-1
                text-sm
                font-semibold
                text-primary
              "
            >
              {project.category}
            </p>
            {project.summary ? (
              <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">{project.summary}</p>
            ) : null}
          </div>

          {project.url !== "#" && (
            <a
              href={project.url}
              target={isExternal ? "_blank" : undefined}
              rel={isExternal ? "noopener noreferrer" : undefined}
              aria-label={`Abrir ${project.title}`}
              className="
                flex
                h-11
                w-11
                shrink-0
                items-center
                justify-center
                rounded-full
                border
                border-primary/15
                text-primary
                transition-colors
                duration-300
                hover:border-primary
                hover:bg-primary
                hover:text-white
              "
            >
              <ArrowUpRight size={17} strokeWidth={1.8} />
            </a>
          )}
        </div>

        {/* Tags */}

        <div
          className="
            mt-4
            flex
            flex-wrap
            gap-2
          "
        >
          {project.tags.map((tag) => (
            <span
              key={tag}
              className="
                rounded-full
                bg-soft-background
                px-3
                py-1.5
                text-xs
                font-medium
                text-muted
              "
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </motion.article>
  );
}
