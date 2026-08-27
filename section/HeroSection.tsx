"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";

const HERO_IMAGES = [
  {
    src: "/images/hero/hero-01.png",
    alt: "Equipo creativo de SmartPro trabajando en estrategia y diseño",
  },
  {
    src: "/images/hero/hero-02.png",
    alt: "Equipo de SmartPro desarrollando soluciones digitales",
  },
  {
    src: "/images/hero/hero-03.png",
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
    if (isPaused) return;

    const timer = window.setInterval(() => {
      nextSlide();
    }, AUTOPLAY_INTERVAL);

    return () => window.clearInterval(timer);
  }, [isPaused, nextSlide]);

  return (
    <section className="relative overflow-hidden bg-background">
      {/* ======================================================
          SLIDER DE IMÁGENES
      ====================================================== */}

      <div
        className="
          relative h-[330px] w-full overflow-hidden
          sm:h-[400px]
          md:h-[460px]
          lg:h-[500px]
          xl:h-[560px]
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
            <Image
              src={HERO_IMAGES[currentSlide].src}
              alt={HERO_IMAGES[currentSlide].alt}
              fill
              priority={currentSlide === 0}
              className="object-cover object-center"
              sizes="100vw"
            />

            {/* Overlay */}
            <div
              className="
                absolute inset-0
                bg-gradient-to-t
                from-black/15
                via-transparent
                to-black/[0.03]
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
            flex h-11 w-11 -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-white/40
            bg-white/90
            text-foreground
            shadow-lg
            backdrop-blur-md
            transition-all duration-300
            hover:scale-105
            hover:bg-white
            hover:text-primary
            sm:left-6
            lg:left-8
            lg:h-12
            lg:w-12
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
            flex h-11 w-11 -translate-y-1/2
            items-center justify-center
            rounded-full
            border border-white/40
            bg-white/90
            text-foreground
            shadow-lg
            backdrop-blur-md
            transition-all duration-300
            hover:scale-105
            hover:bg-white
            hover:text-primary
            sm:right-6
            lg:right-8
            lg:h-12
            lg:w-12
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
            flex -translate-x-1/2 items-center
            gap-2 rounded-full
            bg-black/20 px-3 py-2
            backdrop-blur-md
          "
        >
          {HERO_IMAGES.map((image, index) => (
            <button
              key={image.src}
              type="button"
              aria-label={`Ir a imagen ${index + 1}`}
              aria-current={currentSlide === index ? "true" : undefined}
              onClick={() => goToSlide(index)}
              className="
                flex h-5 items-center
                justify-center
              "
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
            flex max-w-5xl
            flex-col items-center
            px-6
            py-12
            text-center
            sm:py-14
            lg:py-16
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
            className="
              mb-4
              text-xs font-semibold
              uppercase
              tracking-[0.24em]
              text-magenta
              sm:text-sm
            "
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
              text-[2.6rem]
              font-bold
              leading-[0.98]
              tracking-[-0.045em]
              text-foreground
              sm:text-5xl
              md:text-6xl
              lg:text-[64px]
            "
          >
            Llevamos tu marca
            <span
              className="
                mt-1 block
                bg-gradient-to-r
                from-primary
                via-violet-500
                to-magenta
                bg-clip-text
                text-transparent
              "
            >
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
            className="
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
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              delay: 0.18,
            }}
            className="
              max-w-2xl
              text-pretty
              text-base
              leading-7
              text-muted
              sm:text-lg
            "
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
              href="#contacto"
              className="
                group
                inline-flex min-h-12
                items-center justify-center
                gap-3
                rounded-full
                bg-gradient-to-r
                from-primary
                to-magenta
                px-7 py-3.5
                text-sm
                font-semibold
                text-white
                shadow-[0_12px_35px_rgba(109,40,217,0.22)]
                transition-all
                duration-300
                hover:-translate-y-0.5
                hover:shadow-[0_16px_40px_rgba(109,40,217,0.3)]
                sm:text-base
              "
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
