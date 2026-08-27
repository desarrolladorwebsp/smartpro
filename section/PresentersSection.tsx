"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
} from "lucide-react";

/* ============================================================
   PRESENTADORES
============================================================ */

const PRESENTERS = [
  {
    id: 1,
    name: "Kolinka Gavrilovics",
    role: "Modelo / Presentadora",
    video: "/videos/presenters/presenter-01.mov",
  },
  {
    id: 2,
    name: "Nicole Silva",
    role: "Modelo / Presentadora",
    video: "/videos/presenters/presenter-02.mov",
  },
  {
    id: 3,
    name: "Maritza Zúñiga",
    role: "Modelo / Presentadora",
    video: "/videos/presenters/presenter-03.mov",
  },
  {
    id: 4,
    name: "Presentadora SmartPro",
    role: "Modelo / Presentadora",
    video: "/videos/presenters/presenter-04.mov",
  },
] as const;

const CAROUSEL_INTERVAL = 7000;

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function PresentersSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  /*
   * Solo este presentador puede estar reproduciéndose.
   * Comenzamos con el primero.
   */
  const [activePresenterId, setActivePresenterId] = useState<number | null>(
    PRESENTERS[0].id,
  );

  const [itemsPerView, setItemsPerView] = useState(3);
  const [carouselPaused, setCarouselPaused] = useState(false);

  /* ==========================================================
     RESPONSIVE
  ========================================================== */

  useEffect(() => {
    const updateItemsPerView = () => {
      const width = window.innerWidth;

      if (width < 768) {
        setItemsPerView(1);
      } else if (width < 1100) {
        setItemsPerView(2);
      } else {
        setItemsPerView(3);
      }
    };

    updateItemsPerView();

    window.addEventListener("resize", updateItemsPerView);

    return () => {
      window.removeEventListener("resize", updateItemsPerView);
    };
  }, []);

  const maxIndex = Math.max(0, PRESENTERS.length - itemsPerView);

  /* ==========================================================
     CAROUSEL
  ========================================================== */

  const nextSlide = useCallback(() => {
    setCurrentIndex((current) => (current >= maxIndex ? 0 : current + 1));
  }, [maxIndex]);

  const previousSlide = useCallback(() => {
    setCurrentIndex((current) => (current <= 0 ? maxIndex : current - 1));
  }, [maxIndex]);

  useEffect(() => {
    if (carouselPaused || maxIndex === 0) return;

    const timer = window.setInterval(() => {
      nextSlide();
    }, CAROUSEL_INTERVAL);

    return () => {
      window.clearInterval(timer);
    };
  }, [carouselPaused, maxIndex, nextSlide]);

  useEffect(() => {
    if (currentIndex > maxIndex) {
      setCurrentIndex(maxIndex);
    }
  }, [currentIndex, maxIndex]);

  /* ==========================================================
     REPRODUCCIÓN
  ========================================================== */

  const handlePlayPresenter = (id: number) => {
    /*
     * Al seleccionar otro video,
     * activePresenterId cambia.
     *
     * Cada card detectará el cambio y:
     * - pausará su video si no está activo
     * - reproducirá el video seleccionado
     */
    setActivePresenterId(id);
  };

  const handlePausePresenter = (id: number) => {
    if (activePresenterId === id) {
      setActivePresenterId(null);
    }
  };

  return (
    <section
      id="voceros"
      className="
        relative
        overflow-hidden
        bg-background
        py-20
        sm:py-24
        lg:py-28
      "
    >
      {/* ======================================================
          FONDO DECORATIVO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[360px]
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
          bottom-0
          right-0
          h-[300px]
          w-[300px]
          rounded-full
          bg-magenta/5
          blur-[100px]
        "
      />

      <div
        className="
          relative
          mx-auto
          max-w-[1400px]
          px-5
          sm:px-6
          lg:px-10
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mx-auto mb-12 max-w-4xl text-center">
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
            className="
              mb-4
              text-xs
              font-semibold
              uppercase
              tracking-[0.34em]
              text-primary
              sm:text-sm
            "
          >
            Voceros para tu marca
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
            className="
              text-balance
              text-4xl
              font-bold
              leading-[1.05]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              lg:text-[58px]
            "
          >
            El rostro de{" "}
            <span
              className="
                bg-gradient-to-r
                from-primary
                via-violet-500
                to-magenta
                bg-clip-text
                text-transparent
              "
            >
              tu marca
            </span>
            <span className="block">frente a la cámara.</span>
          </motion.h2>

          {/* Línea */}

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
            className="
              mx-auto
              my-6
              h-[3px]
              w-14
              origin-center
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
            "
          />

          {/* Descripción */}

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
            className="
              mx-auto
              max-w-3xl
              text-pretty
              text-base
              leading-7
              text-muted
              sm:text-lg
            "
          >
            Contamos con presentadores y modelos profesionales para representar
            tu empresa, producto o servicio en videos, comerciales y contenido
            para redes sociales.
          </motion.p>

          {/* CTA */}

          <motion.div
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
              delay: 0.22,
            }}
            className="mt-7"
          >
            <Link
              href="/voceros"
              className="
                group
                inline-flex
                min-h-12
                items-center
                justify-center
                gap-3
                rounded-full
                bg-primary
                px-7
                text-sm
                font-semibold
                text-white
                shadow-[0_10px_30px_rgba(109,40,217,0.20)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:bg-primary-hover
                hover:shadow-[0_15px_35px_rgba(109,40,217,0.28)]
              "
            >
              Conoce más
              <ArrowRight
                size={17}
                strokeWidth={1.8}
                className="
                  transition-transform
                  duration-300
                  group-hover:translate-x-1
                "
              />
            </Link>
          </motion.div>
        </div>

        {/* ====================================================
            CAROUSEL
        ==================================================== */}

        <div
          className="relative"
          onMouseEnter={() => setCarouselPaused(true)}
          onMouseLeave={() => setCarouselPaused(false)}
        >
          {/* Flecha izquierda */}

          <motion.button
            type="button"
            aria-label="Mostrar presentadores anteriores"
            onClick={previousSlide}
            whileTap={{
              scale: 0.92,
            }}
            className="
              absolute
              left-0
              top-[45%]
              z-20
              hidden
              h-12
              w-12
              -translate-x-1/2
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
              hover:scale-105
              hover:bg-primary
              hover:text-white
              md:flex
            "
          >
            <ChevronLeft size={23} strokeWidth={2} />
          </motion.button>

          {/* ==================================================
              VIEWPORT
          ================================================== */}

          <div className="overflow-hidden">
            <motion.div
              animate={{
                x: `-${currentIndex * (100 / itemsPerView)}%`,
              }}
              transition={{
                duration: 0.65,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="flex"
            >
              {PRESENTERS.map((presenter, index) => (
                <div
                  key={presenter.id}
                  className="
                      shrink-0
                      px-2.5
                    "
                  style={{
                    width: `${100 / itemsPerView}%`,
                  }}
                >
                  <PresenterVideoCard
                    presenter={presenter}
                    index={index}
                    isActive={activePresenterId === presenter.id}
                    onPlay={() => handlePlayPresenter(presenter.id)}
                    onPause={() => handlePausePresenter(presenter.id)}
                  />
                </div>
              ))}
            </motion.div>
          </div>

          {/* Flecha derecha */}

          <motion.button
            type="button"
            aria-label="Mostrar siguientes presentadores"
            onClick={nextSlide}
            whileTap={{
              scale: 0.92,
            }}
            className="
              absolute
              right-0
              top-[45%]
              z-20
              hidden
              h-12
              w-12
              translate-x-1/2
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
              hover:scale-105
              hover:bg-primary
              hover:text-white
              md:flex
            "
          >
            <ChevronRight size={23} strokeWidth={2} />
          </motion.button>

          {/* ==================================================
              MOBILE CONTROLS
          ================================================== */}

          <div
            className="
              mt-7
              flex
              items-center
              justify-center
              gap-3
              md:hidden
            "
          >
            <button
              type="button"
              aria-label="Presentador anterior"
              onClick={previousSlide}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-primary/15
                bg-white
                text-primary
                shadow-sm
              "
            >
              <ChevronLeft size={20} />
            </button>

            <button
              type="button"
              aria-label="Presentador siguiente"
              onClick={nextSlide}
              className="
                flex
                h-11
                w-11
                items-center
                justify-center
                rounded-full
                border
                border-primary/15
                bg-white
                text-primary
                shadow-sm
              "
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* ==================================================
              DOTS
          ================================================== */}

          {maxIndex > 0 && (
            <div
              className="
                mt-8
                flex
                items-center
                justify-center
                gap-2
              "
            >
              {Array.from({
                length: maxIndex + 1,
              }).map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`Ir al grupo ${index + 1}`}
                  onClick={() => setCurrentIndex(index)}
                  className="
                    flex
                    h-6
                    items-center
                    justify-center
                  "
                >
                  <span
                    className={`
                      block
                      h-2
                      rounded-full
                      transition-all
                      duration-300

                      ${
                        currentIndex === index
                          ? "w-7 bg-primary"
                          : "w-2 bg-primary/20 hover:bg-primary/40"
                      }
                    `}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   TIPOS
============================================================ */

type Presenter = (typeof PRESENTERS)[number];

type PresenterVideoCardProps = {
  presenter: Presenter;
  index: number;
  isActive: boolean;
  onPlay: () => void;
  onPause: () => void;
};

/* ============================================================
   VIDEO CARD
============================================================ */

function PresenterVideoCard({
  presenter,
  index,
  isActive,
  onPlay,
  onPause,
}: PresenterVideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isActuallyPlaying, setIsActuallyPlaying] = useState(false);

  /* ==========================================================
     CONTROL CENTRALIZADO DEL VIDEO
  ========================================================== */

  useEffect(() => {
    const video = videoRef.current;

    if (!video) return;

    if (isActive) {
      const playVideo = async () => {
        try {
          await video.play();
        } catch {
          /*
           * Algunos navegadores pueden bloquear autoplay.
           * En ese caso aparecerá el botón Play.
           */
          setIsActuallyPlaying(false);
        }
      };

      playVideo();
    } else {
      video.pause();
    }
  }, [isActive]);

  /* ==========================================================
     CLICK SOBRE EL VIDEO
  ========================================================== */

  const handleVideoClick = () => {
    if (isActive && isActuallyPlaying) {
      onPause();
      return;
    }

    /*
     * Cambiar activePresenterId hará que
     * automáticamente todos los demás
     * videos se pausen.
     */
    onPlay();
  };

  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 28,
      }}
      whileInView={{
        opacity: 1,
        y: 0,
      }}
      viewport={{
        once: true,
        amount: 0.15,
      }}
      transition={{
        duration: 0.55,
        delay: index * 0.06,
      }}
      className="group"
    >
      {/* ======================================================
          VIDEO VERTICAL
      ====================================================== */}

      <div
        className="
          relative
          mx-auto
          aspect-[9/16]
          w-full
          max-h-[610px]
          overflow-hidden
          rounded-[24px]
          bg-navy
          shadow-[0_12px_35px_rgba(16,16,36,0.09)]
          transition-all
          duration-500
          group-hover:
          shadow-[0_18px_45px_rgba(16,16,36,0.14)]
        "
      >
        <video
          ref={videoRef}
          src={presenter.video}
          muted
          loop
          playsInline
          preload={presenter.id === PRESENTERS[0].id ? "auto" : "metadata"}
          onClick={handleVideoClick}
          onPlay={() => setIsActuallyPlaying(true)}
          onPause={() => setIsActuallyPlaying(false)}
          className="
            h-full
            w-full
            cursor-pointer
            object-cover
            object-center
            transition-transform
            duration-700
            ease-out
            group-hover:scale-[1.015]
          "
        />

        {/* Overlay superior */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-black/35
            via-transparent
            to-black/5
          "
        />

        {/* ====================================================
            ESTADO DEL VIDEO
        ==================================================== */}

        {isActive && isActuallyPlaying && (
          <div
            className="
                pointer-events-none
                absolute
                right-4
                top-4
                z-10
                flex
                items-center
                gap-2
                rounded-full
                bg-black/35
                px-3
                py-1.5
                text-[11px]
                font-medium
                text-white
                backdrop-blur-md
              "
          >
            <span
              className="
                  relative
                  flex
                  h-2
                  w-2
                "
            >
              <span
                className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    animate-ping
                    rounded-full
                    bg-white/60
                  "
              />

              <span
                className="
                    relative
                    inline-flex
                    h-2
                    w-2
                    rounded-full
                    bg-white
                  "
              />
            </span>
            Reproduciendo
          </div>
        )}

        {/* ====================================================
            PLAY / PAUSE
        ==================================================== */}

        <motion.button
          type="button"
          aria-label={
            isActuallyPlaying
              ? `Pausar video de ${presenter.name}`
              : `Reproducir video de ${presenter.name}`
          }
          onClick={handleVideoClick}
          whileHover={{
            scale: 1.08,
          }}
          whileTap={{
            scale: 0.94,
          }}
          className="
            absolute
            bottom-5
            left-5
            z-20
            flex
            h-12
            w-12
            items-center
            justify-center
            rounded-full
            border
            border-white/70
            bg-black/30
            text-white
            shadow-lg
            backdrop-blur-md
            transition-all
            duration-300
            hover:border-primary
            hover:bg-primary
          "
        >
          {isActuallyPlaying ? (
            <Pause size={18} fill="currentColor" strokeWidth={1.5} />
          ) : (
            <Play
              size={18}
              fill="currentColor"
              strokeWidth={1.5}
              className="ml-0.5"
            />
          )}
        </motion.button>

        {/* ====================================================
            HOVER GRADIENT
        ==================================================== */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-x-0
            bottom-0
            h-40
            bg-gradient-to-t
            from-primary/15
            via-transparent
            to-transparent
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>

      {/* ======================================================
          INFORMACIÓN
      ====================================================== */}

      <div className="px-1 pt-4">
        <h3
          className="
            text-lg
            font-semibold
            tracking-[-0.025em]
            text-foreground
            transition-colors
            duration-300
            group-hover:text-primary
          "
        >
          {presenter.name}
        </h3>

        <p
          className="
            mt-1
            text-sm
            font-medium
            text-primary
            sm:text-[15px]
          "
        >
          {presenter.role}
        </p>
      </div>
    </motion.article>
  );
}
