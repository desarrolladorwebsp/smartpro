"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";
import {
  CAROUSEL_EASE,
  CAROUSEL_TRANSITION_DURATION_S,
  getLoopSlots,
  isCarouselSlideVisible,
} from "@/lib/carousel/loop";
import { useLoopedCarousel } from "@/lib/carousel/use-looped-carousel";
import {
  getTeamCarouselLayout,
  type TeamCarouselLayout,
} from "@/lib/team/carousel-layout";

/* ============================================================
   TEAM DATA
============================================================ */

const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Andrea Vidal",
    role: "Directora ejecutiva",
    description:
      "Estratega comercial con enfoque en automatización, captación y crecimiento digital.",
    image: "/images/team/andrea-vidal.png",
  },
  {
    id: 2,
    name: "Alfredo Hurtado",
    role: "Desarrollador Full Stack",
    description:
      "Convierte ideas en soluciones digitales robustas, escalables y de alto rendimiento.",
    image: "/images/team/alfredo-hurtado.png",
  },
  {
    id: 3,
    name: "Nicolas Campos",
    role: "Soporte Tecnico",
    description: "Encargado de la atención técnica y soporte informatico.",
    image: "/images/team/nicolas-campos.png",
  },
  {
    id: 4,
    name: "Javiera vega",
    role: "Publicista",
    description: "Encargada del diseño grafico y creacion de estrategias publicitarias",
    image: "/images/team/javiera-vega.png",
  },
  {
    id: 5,
    name: "Javier Sanhueza",
    role: "Productor Audiovisual",
    description: "Encargado de la producción de videos y fotografía para redes sociales y campañas publicitarias.",
    image: "/images/team/javier-sanhueza.png",
  },
  {
    id: 6,
    name: "Ariana de la Fuente",
    role: "Ejecutiva Comercial",
    description:
      "Asesora a clientes en la elección de servicios y acompaña el seguimiento de sus propuestas comerciales.",
    image: "/images/team/ariana.png",
  },
  {
    id: 7,
    name: "Catalina Saravia",
    role: "Audiovisual",
    description: "Encargada de la producción de videos y fotografía para redes sociales y campañas publicitarias.",
    image: "/images/team/catalina-saravia.png",
  },
  {
    id: 8,
    name: "Isabel Uribe",
    role: "Office Manager",
    description: "Encargada de la gestión administrativa y operativa de la empresa.",
    image: "/images/team/isabel-uribe.png",
  },
] as const;

const INITIAL_LAYOUT = getTeamCarouselLayout(0);

/* ============================================================
   TEAM SECTION
============================================================ */

export default function TeamSection() {
  const [layout, setLayout] = useState<TeamCarouselLayout>(INITIAL_LAYOUT);
  const [hasMeasured, setHasMeasured] = useState(false);

  const {
    viewportRef,
    index,
    realIndex,
    cloneCount,
    canMove,
    isJumping,
    shouldReduceMotion,
    goNext,
    goPrev,
    goToRealIndex,
    settleLoop,
    regionProps,
    trackProps,
  } = useLoopedCarousel({
    itemCount: TEAM_MEMBERS.length,
    visibleCount: layout.visibleCount,
    enabled: hasMeasured,
  });

  const loopSlots = useMemo(
    () => getLoopSlots(TEAM_MEMBERS, cloneCount),
    [cloneCount],
  );
  const visibleMembers = TEAM_MEMBERS.slice(
    realIndex,
    realIndex + layout.visibleCount,
  );
  const trackOffset = index * (layout.cardWidth + layout.gap);

  useEffect(() => {
    const node = viewportRef.current;
    if (!node) return;

    const measure = () => {
      const nextLayout = getTeamCarouselLayout(node.clientWidth);

      setLayout((current) => {
        if (
          current.visibleCount === nextLayout.visibleCount &&
          current.cardWidth === nextLayout.cardWidth &&
          current.gap === nextLayout.gap
        ) {
          return current;
        }

        return nextLayout;
      });
      setHasMeasured(true);
    };

    const observer = new ResizeObserver(measure);
    observer.observe(node);
    measure();

    return () => observer.disconnect();
  }, [viewportRef]);

  return (
    <section
      id="nosotros"
      className="section-shell bg-background"
    >
      {/* ======================================================
          BACKGROUND DECORATION
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
          h-[320px]
          w-[320px]
          rounded-full
          bg-magenta/5
          blur-[110px]
        "
      />

      <div className="section-container max-w-[1600px]">
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
              amount: 0.3,
            }}
            transition={{
              duration: 0.5,
            }}
            className="eyebrow"
          >
            Nuestro equipo
          </motion.p>

          <motion.h2
            initial={{
              opacity: 0,
              y: 16,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.55,
              delay: 0.05,
            }}
            className="section-title"
          >
            El talento detrás de cada{" "}
            <span className="text-gradient-brand">
              gran resultado.
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
        </div>

        {/* ====================================================
            TEAM CAROUSEL
        ==================================================== */}

        <div
          className="relative mx-auto max-w-[1320px] md:px-14"
          role="region"
          aria-roledescription="carrusel"
          aria-label="Equipo SmartPro"
          {...regionProps}
        >
          <p className="sr-only">
            {visibleMembers.length === 1
              ? visibleMembers[0]?.name
              : `${visibleMembers[0]?.name} a ${visibleMembers.at(-1)?.name}`}
            .
          </p>

          {canMove ? (
            <button
              type="button"
              aria-label="Mostrar ejecutivos anteriores"
              aria-controls="team-carousel"
              aria-disabled={!canMove}
              disabled={!canMove}
              onClick={() => goPrev()}
              className="
                absolute
                left-0
                top-[42%]
                z-20
                hidden
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-primary/10
                bg-white/95
                text-primary
                shadow-[0_8px_28px_rgba(16,16,36,0.10)]
                backdrop-blur-md
                transition-all
                duration-300
                hover:bg-primary
                hover:text-white
                md:flex
                disabled:pointer-events-none
                disabled:opacity-35
              "
            >
              <ChevronLeft size={23} strokeWidth={2} />
            </button>
          ) : null}

          <div
            ref={viewportRef}
            id="team-carousel"
            tabIndex={canMove ? 0 : -1}
            {...trackProps}
            className="
              overflow-hidden
              outline-none
              touch-pan-y
              focus-visible:ring-2
              focus-visible:ring-primary/40
              focus-visible:ring-offset-2
            "
          >
            <motion.div
              initial={false}
              animate={{ x: -trackOffset }}
              transition={{
                duration:
                  isJumping || shouldReduceMotion
                    ? 0
                    : CAROUSEL_TRANSITION_DURATION_S,
                ease: CAROUSEL_EASE,
              }}
              onAnimationComplete={settleLoop}
              style={{ gap: layout.gap }}
              className="flex flex-nowrap items-stretch"
            >
              {loopSlots.map((slot) => {
                const isVisible = isCarouselSlideVisible(
                  slot.slotIndex,
                  index,
                  layout.visibleCount,
                );

                return (
                  <div
                    key={`${slot.item.id}-${slot.slotIndex}`}
                    data-team-slide
                    style={{
                      width: layout.cardWidth,
                      flex: `0 0 ${layout.cardWidth}px`,
                    }}
                    className="min-w-0"
                    aria-hidden={!isVisible}
                    inert={isVisible ? undefined : true}
                  >
                    <TeamCard member={slot.item} index={slot.realIndex} />
                  </div>
                );
              })}
            </motion.div>
          </div>

          {canMove ? (
            <button
              type="button"
              aria-label="Mostrar siguientes ejecutivos"
              aria-controls="team-carousel"
              aria-disabled={!canMove}
              disabled={!canMove}
              onClick={() => goNext()}
              className="
                absolute
                right-0
                top-[42%]
                z-20
                hidden
                h-12
                w-12
                -translate-y-1/2
                items-center
                justify-center
                rounded-full
                border
                border-primary/10
                bg-white/95
                text-primary
                shadow-[0_8px_28px_rgba(16,16,36,0.10)]
                backdrop-blur-md
                transition-all
                duration-300
                hover:bg-primary
                hover:text-white
                md:flex
                disabled:pointer-events-none
                disabled:opacity-35
              "
            >
              <ChevronRight size={23} strokeWidth={2} />
            </button>
          ) : null}

          {canMove ? (
            <div
              className="mt-6 flex items-center justify-center gap-2"
              role="tablist"
              aria-label="Vistas del equipo"
            >
              {TEAM_MEMBERS.map((member, memberIndex) => {
                const isActive = realIndex === memberIndex;

                return (
                  <button
                    key={`team-page-${member.id}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-current={isActive ? "true" : undefined}
                    aria-label={`Ir a ${member.name}`}
                    aria-controls="team-carousel"
                    onClick={() => goToRealIndex(memberIndex)}
                    className="flex h-8 items-center justify-center px-1"
                  >
                    <span
                      className={`
                        block
                        h-2
                        rounded-full
                        transition-all
                        duration-300
                        ${
                          isActive
                            ? "w-7 bg-primary"
                            : "w-2 bg-primary/20 hover:bg-primary/40"
                        }
                      `}
                    />
                  </button>
                );
              })}
            </div>
          ) : null}
        </div>
      </div>

      {/* ======================================================
          BOTTOM LINE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          bottom-0
          left-1/2
          h-px
          w-[85%]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-primary/20
          to-transparent
        "
      />
    </section>
  );
}

/* ============================================================
   TYPES
============================================================ */

type TeamMember = (typeof TEAM_MEMBERS)[number];

type TeamCardProps = {
  member: TeamMember;
  index: number;
};

/* ============================================================
   TEAM CARD
============================================================ */

function TeamCard({ member, index }: TeamCardProps) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 22,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.2,
      }}
      transition={{
        duration: 0.5,
        delay: Math.min(index * 0.05, 0.2),
        ease: "easeOut",
      }}
      whileHover={{
        y: -3,
      }}
      className="
        group
        relative
        flex
        h-full
        w-full
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-white/5
        bg-navy
        shadow-[0_10px_28px_rgba(16,16,36,0.10)]
        transition-shadow
        duration-500
        hover:shadow-[0_22px_54px_rgba(109,40,217,0.18)]
      "
    >
      <div
        className="
          relative
          aspect-[3/4]
          overflow-hidden
          bg-navy
        "
      >
        <SmartImage
          key={member.image}
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 82vw, (max-width: 767px) 50vw, (max-width: 1023px) 33vw, (max-width: 1279px) 25vw, 20vw"
          containerClassName="absolute inset-0"
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-navy
            via-navy/10
            to-transparent
          "
        />

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-12
            left-1/2
            h-32
            w-40
            -translate-x-1/2
            rounded-full
            bg-primary/25
            blur-[65px]
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>

      <div
        className="
          relative
          z-10
          flex
          flex-1
          flex-col
          px-4
          pb-4
          pt-2
          sm:px-5
          sm:pb-5
        "
      >
        <h3
          className="
            text-[18px]
            font-semibold
            tracking-[-0.025em]
            text-white
          "
        >
          {member.name}
        </h3>

        <p
          className="
            mt-1
            text-sm
            font-medium
            text-violet-300
          "
        >
          {member.role}
        </p>

        <div
          className="
            mt-3
            h-[2px]
            w-8
            rounded-full
            bg-gradient-to-r
            from-primary
            to-magenta
            transition-all
            duration-500
            group-hover:w-14
          "
        />

        <p
          className="
            mt-3
            text-sm
            leading-6
            text-white/60
          "
        >
          {member.description}
        </p>

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-[-80px]
            left-1/2
            h-32
            w-32
            -translate-x-1/2
            rounded-full
            bg-magenta/10
            blur-[70px]
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>
    </motion.article>
  );
}
