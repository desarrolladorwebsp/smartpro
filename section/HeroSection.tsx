"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";

const HERO_IMAGES = [
  {
    src: "/images/hero/hero-01.webp",
    alt: "Equipo creativo de SmartPro trabajando en estrategia y diseño",
  },
  {
    src: "/images/hero/hero-02.webp",
    alt: "Equipo de SmartPro desarrollando soluciones digitales",
  },
  {
    src: "/images/hero/hero-03.webp",
    alt: "Producción y creatividad digital de SmartPro",
  },
];

const AUTOPLAY_INTERVAL = 6000;

export default function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [direction, setDirection] = useState(1);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = useCallback(() => {
    setDirection(1);

    setCurrentSlide((current) =>
      current === HERO_IMAGES.length - 1 ? 0 : current + 1,
    );
  }, []);

  const previousSlide = useCallback(() => {
    setDirection(-1);

    setCurrentSlide((current) =>
      current === 0 ? HERO_IMAGES.length - 1 : current - 1,
    );
  }, []);

  const goToSlide = (index: number) => {
    if (index === currentSlide) return;

    setDirection(index > currentSlide ? 1 : -1);
    setCurrentSlide(index);
  };

  useEffect(() => {
    if (
      isPaused ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timer = window.setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused, nextSlide]);

  // Precarga silenciosa del resto de slides una vez el navegador está libre,
  // para que el cambio de slide sea instantáneo cuando el usuario llegue a él.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const preload = () => {
      HERO_IMAGES.slice(1).forEach(({ src }) => {
        const img = new window.Image();
        img.src = src;
      });
    };

    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void) => number;
      cancelIdleCallback?: (handle: number) => void;
    };

    if (idleWindow.requestIdleCallback) {
      const id = idleWindow.requestIdleCallback(preload);
      return () => idleWindow.cancelIdleCallback?.(id);
    }

    const id = window.setTimeout(preload, 1500);
    return () => window.clearTimeout(id);
  }, []);

  return (
    <section id="inicio" className="relative overflow-hidden bg-background pt-[72px]">
      {/* ======================================================
          SLIDER DE IMÁGENES
      ====================================================== */}

      <div
        className="
          relative
          h-[260px]
          w-full
          overflow-hidden
          sm:h-[340px]
          md:h-[400px]
          xl:h-[900px]
        "
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={currentSlide}
            custom={direction}
            initial={{
              opacity: 0,
              scale: 1.025,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 1.01,
            }}
            transition={{
              opacity: {
                duration: 0.8,
                ease: "easeInOut",
              },
              scale: {
                duration: 1.2,
                ease: "easeOut",
              },
            }}
            className="absolute inset-0"
          >
            <SmartImage
              key={HERO_IMAGES[currentSlide].src}
              src={HERO_IMAGES[currentSlide].src}
              alt={HERO_IMAGES[currentSlide].alt}
              fill
              priority={currentSlide === 0}
              sizes="100vw"
              className="object-cover object-center"
              containerClassName="absolute inset-0"
            />

            {/* Overlay */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-t
                from-ink/20
                via-transparent
                to-ink/[0.04]
              "
            />
          </motion.div>
        </AnimatePresence>

        {/* ======================================================
            BOTÓN ANTERIOR
        ====================================================== */}

        <motion.button
          type="button"
          aria-label="Mostrar imagen anterior"
          onClick={previousSlide}
          whileTap={{ scale: 0.92 }}
          className="
            group absolute left-4 top-1/2 z-20
            hidden h-11 w-11 -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-white/40
            bg-surface/90
            text-foreground
            shadow-[0_8px_24px_rgb(16_16_36_/_0.12)]
            backdrop-blur-md
            transition-colors duration-300
            hover:bg-surface
            hover:text-primary
            sm:flex
            sm:left-6
            lg:left-8
          "
        >
          <ChevronLeft
            size={22}
            strokeWidth={1.8}
            className="
              transition-transform duration-300
              group-hover:-translate-x-0.5
            "
          />
        </motion.button>

        {/* ======================================================
            BOTÓN SIGUIENTE
        ====================================================== */}

        <motion.button
          type="button"
          aria-label="Mostrar imagen siguiente"
          onClick={nextSlide}
          whileTap={{ scale: 0.92 }}
          className="
            group absolute right-4 top-1/2 z-20
            hidden h-11 w-11 -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-white/40
            bg-surface/90
            text-foreground
            shadow-[0_8px_24px_rgb(16_16_36_/_0.12)]
            backdrop-blur-md
            transition-colors duration-300
            hover:bg-surface
            hover:text-primary
            sm:flex
            sm:right-6
            lg:right-8
          "
        >
          <ChevronRight
            size={22}
            strokeWidth={1.8}
            className="
              transition-transform duration-300
              group-hover:translate-x-0.5
            "
          />
        </motion.button>

        {/* ======================================================
            INDICADORES
        ====================================================== */}

        <div
          className="
            absolute bottom-5 left-1/2 z-20
            hidden -translate-x-1/2 items-center
            gap-2 rounded-full
            bg-ink/25 px-3 py-2
            backdrop-blur-md
            sm:flex
          "
        >
          {HERO_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={currentSlide === index ? "true" : undefined}
              onClick={() => goToSlide(index)}
              className="flex min-h-11 min-w-11 items-center justify-center"
            >
              <span
                className={`
                  block h-1.5 rounded-full
                  transition-all duration-500
                  ${
                    currentSlide === index
                      ? "w-7 bg-white"
                      : "w-1.5 bg-white/55 hover:bg-white/80"
                  }
                `}
              />
            </button>
          ))}
        </div>
      </div>

      {/* ======================================================
          CONTENIDO DEL HERO
      ====================================================== */}

      <div className="relative overflow-hidden">
        {/* Glow central */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute left-1/2 top-8
            h-56 w-[500px]
            -translate-x-1/2
            rounded-full
            bg-primary/10
            blur-[90px]
          "
        />

        {/* Decoración izquierda */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute bottom-0 left-0
            h-56 w-56 opacity-20
            [background-image:radial-gradient(circle,var(--color-primary)_1px,transparent_1px)]
            [background-size:10px_10px]
            [mask-image:linear-gradient(to_right,black,transparent)]
          "
        />

        {/* Decoración derecha */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute bottom-0 right-0
            h-56 w-56 opacity-20
            [background-image:radial-gradient(circle,var(--color-magenta)_1px,transparent_1px)]
            [background-size:10px_10px]
            [mask-image:linear-gradient(to_left,black,transparent)]
          "
        />

        <div
          className="
            relative mx-auto
            flex max-w-4xl
            flex-col items-center
            px-5
            py-10
            text-center
            sm:px-6
            sm:py-12
            lg:py-14
          "
        >
          {/* Etiqueta */}

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.5,
              ease: "easeOut",
            }}
            className="eyebrow text-magenta"
          >
            Agencia de marketing digital
          </motion.p>

          {/* Título */}

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              delay: 0.08,
              ease: "easeOut",
            }}
            className="
              max-w-4xl
              text-balance
              text-[2rem]
              font-bold
              leading-[1.08]
              tracking-[-0.045em]
              text-foreground
              sm:text-5xl
              lg:text-6xl
            "
          >
            Llevamos tu marca
            <span className="mt-1 block text-gradient-brand">
              al siguiente nivel
            </span>
          </motion.h1>

          {/* Línea */}

          <motion.div
            initial={{
              opacity: 0,
              scaleX: 0,
            }}
            animate={{
              opacity: 1,
              scaleX: 1,
            }}
            transition={{
              duration: 0.5,
              delay: 0.2,
            }}
            className="accent-line"
          />

          {/* Descripción */}

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.18,
            }}
            className="section-copy max-w-2xl"
          >
            Estrategia, creatividad y tecnología para generar resultados reales
            y hacer crecer tu negocio.
          </motion.p>

          {/* CTA */}

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.28,
            }}
            className="mt-8"
          >
            <a
              href="https://calendly.com/agencia-smartpro/online?month=2026-08"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-gradient group shadow-[0_10px_28px_rgb(109_40_217_/_0.2)]"
            >
              <CalendarDays
                size={18}
                strokeWidth={1.8}
                className="
                  transition-transform
                  duration-300
                  group-hover:scale-110
                "
              />
              Agendar reunión
            </a>
          </motion.div>
        </div>
      </div>

      {/* Borde inferior */}

      <div
        className="
          h-px w-full
          bg-gradient-to-r
          from-transparent
          via-primary/40
          to-magenta/40
        "
      />
    </section>
  );
}
