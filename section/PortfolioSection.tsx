"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, ExternalLink } from "lucide-react";

/* ============================================================
   TIPOS
============================================================ */

type PortfolioCategory =
  | "Todos"
  | "Sitios Web"
  | "Landing Page"
  | "E-commerce"
  | "Sistemas";

type PortfolioItem = {
  id: number;
  title: string;
  category: Exclude<PortfolioCategory, "Todos">;
  image: string;
  url: string;
  tags: string[];
};

/* ============================================================
   FILTROS
============================================================ */

const FILTERS: PortfolioCategory[] = [
  "Todos",
  "Sitios Web",
  "Landing Page",
  "E-commerce",
  "Sistemas",
];

/* ============================================================
   PROYECTOS
============================================================ */

const PORTFOLIO_ITEMS: PortfolioItem[] = [
  {
    id: 1,
    title: "Isapres Premium",
    category: "Landing Page",
    image: "/images/portfolio/isapres-premium.png",
    url: "https://www.isaprespremium.cl",
    tags: ["Landing Page", "Responsive", "Conversión"],
  },
  {
    id: 2,
    title: "Tu Promesa",
    category: "Landing Page",
    image: "/images/portfolio/tu-promesa.png",
    url: "https://www.tupromesa.cl",
    tags: ["Landing Page", "UI/UX", "Legal"],
  },
  {
    id: 3,
    title: "RealStock",
    category: "E-commerce",
    image: "/images/portfolio/realstock.png",
    url: "https://www.realstock.cl",
    tags: ["E-commerce", "UI/UX", "Catálogo"],
  },
  {
    id: 4,
    title: "Sistema Comercial",
    category: "Sistemas",
    image: "/images/portfolio/sistema-comercial.png",
    url: "#",
    tags: ["Sistema", "Dashboard", "Automatización"],
  },
  {
    id: 5,
    title: "SmartPro",
    category: "Sitios Web",
    image: "/images/portfolio/smartpro.png",
    url: "https://smartpro.cl",
    tags: ["Website", "Next.js", "Responsive"],
  },
];

/* ============================================================
   PORTFOLIO SECTION
============================================================ */

export default function PortfolioSection() {
  const [activeFilter, setActiveFilter] = useState<PortfolioCategory>("Todos");

  const filteredProjects = useMemo(() => {
    if (activeFilter === "Todos") {
      return PORTFOLIO_ITEMS;
    }

    return PORTFOLIO_ITEMS.filter(
      (project) => project.category === activeFilter,
    );
  }, [activeFilter]);

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
          className="
            mb-10
            flex
            flex-wrap
            items-center
            justify-center
            gap-2.5
          "
        >
          {FILTERS.map((filter) => {
            const isActive = activeFilter === filter;

            return (
              <button
                key={filter}
                type="button"
                aria-pressed={isActive}
                onClick={() => setActiveFilter(filter)}
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
        </motion.div>

        {/* ====================================================
            GRID
        ==================================================== */}

        <motion.div
          layout
          className="
            grid
            gap-5
            md:grid-cols-2
            lg:grid-cols-3
          "
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <PortfolioCard key={project.id} project={project} />
            ))}
          </AnimatePresence>
        </motion.div>

        {/* ====================================================
            EMPTY STATE
        ==================================================== */}

        {filteredProjects.length === 0 && (
          <div
            className="
              py-16
              text-center
              text-muted
            "
          >
            No hay proyectos en esta categoría todavía.
          </div>
        )}
      </div>
    </section>
  );
}

/* ============================================================
   PORTFOLIO CARD
============================================================ */

function PortfolioCard({ project }: { project: PortfolioItem }) {
  const isExternal = project.url.startsWith("http");

  return (
    <motion.article
      layout
      initial={{
        opacity: 0,
        y: 25,
        scale: 0.98,
      }}
      animate={{
        opacity: 1,
        y: 0,
        scale: 1,
      }}
      exit={{
        opacity: 0,
        y: 15,
        scale: 0.98,
      }}
      transition={{
        duration: 0.4,
        ease: "easeOut",
      }}
        className="card-frame transition-shadow duration-500 hover:-translate-y-px hover:shadow-[0_14px_40px_rgb(109_40_217_/_0.1)]"
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
          aspect-[16/10]
          overflow-hidden
          bg-soft-background
        "
      >
        <Image
          src={project.image}
          alt={`Proyecto ${project.title}`}
          fill
          className="
            object-cover
            object-top
            transition-transform
            duration-700
            ease-out
            group-hover:scale-[1.025]
          "
          sizes="
            (max-width: 767px) 100vw,
            (max-width: 1023px) 50vw,
            33vw
          "
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
                text-xl
                font-semibold
                tracking-[-0.025em]
                text-foreground
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
