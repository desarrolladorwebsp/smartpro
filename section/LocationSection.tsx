"use client";

import Image from "next/image";
import { motion } from "motion/react";
import {
  MapPin,
  Clock3,
  CarFront,
  Navigation,
  Info,
  ArrowUpRight,
} from "lucide-react";

/* ============================================================
   CONSTANTES
============================================================ */

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const LOCATION = {
  address: "Santa Elena 941 B",
  commune: "Santiago, RM, Chile",
  postalCode: "7500000",

  mapUrl: `https://www.google.com/maps/search/?api=1&query=Santa+Elena+941+B+Santiago+Chile&key=${GOOGLE_MAPS_API_KEY}`,

  mapImage: "/images/location/map.png",
} as const;

const LOCATION_ITEMS = [
  {
    id: "address",
    icon: MapPin,
    title: "Dirección",
    lines: [LOCATION.address, LOCATION.commune],
  },
  {
    id: "connectivity",
    icon: Navigation,
    title: "Buena conectividad",
    lines: [
      "Ubicación estratégica en Providencia.",
      "Fácil acceso desde distintos puntos de Santiago.",
    ],
  },
  {
    id: "parking",
    icon: CarFront,
    title: "Estacionamientos",
    lines: [
      "Consulta disponibilidad de estacionamiento",
      "antes de tu visita.",
    ],
  },
  {
    id: "hours",
    icon: Clock3,
    title: "Horario de atención",
    lines: ["Lunes a Viernes", "09:00 a 18:30 hrs."],
  },
] as const;

/* ============================================================
   COMPONENTE
============================================================ */

export default function LocationSection() {
  return (
    <section
      id="ubicacion"
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
          DECORACIONES
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[380px]
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
          right-0
          top-1/3
          absolute
          h-[280px]
          w-[280px]
          rounded-full
          bg-magenta/5
          blur-[100px]
        "
      />

      <div
        className="
          relative
          mx-auto
          max-w-[1500px]
          px-5
          sm:px-6
          lg:px-8
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
            Dónde estamos
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
            Visítanos en{" "}
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
              nuestras oficinas
            </span>
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
              max-w-2xl
              text-pretty
              text-base
              leading-7
              text-muted
              sm:text-lg
            "
          >
            Estamos ubicados en Providencia, Santiago. Fácil acceso y
            conectividad para reunirnos contigo.
          </motion.p>
        </div>

        {/* ====================================================
            CONTENT GRID
        ==================================================== */}

        <div
          className="
            grid
            gap-6
            lg:grid-cols-[360px_1fr]
            lg:items-stretch
          "
        >
          {/* ==================================================
              INFO CARD
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: -24,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
            }}
            className="
              rounded-[24px]
              border
              border-border
              bg-white
              p-6
              shadow-[0_12px_40px_rgba(16,16,36,0.08)]
              sm:p-7
            "
          >
            <div>
              {LOCATION_ITEMS.map((item, index) => {
                const Icon = item.icon;

                return (
                  <div
                    key={item.id}
                    className={`
                      flex
                      gap-4
                      ${
                        index < LOCATION_ITEMS.length - 1
                          ? "border-b border-border pb-6 mb-6"
                          : ""
                      }
                    `}
                  >
                    {/* ICON */}

                    <div
                      className="
                        flex
                        h-12
                        w-12
                        shrink-0
                        items-center
                        justify-center
                        rounded-full
                        bg-gradient-to-br
                        from-primary
                        to-violet-500
                        text-white
                        shadow-[0_8px_22px_rgba(109,40,217,0.22)]
                      "
                    >
                      <Icon size={21} strokeWidth={1.8} />
                    </div>

                    {/* TEXT */}

                    <div>
                      <h3
                        className="
                          text-base
                          font-semibold
                          tracking-[-0.02em]
                          text-foreground
                        "
                      >
                        {item.title}
                      </h3>

                      <div
                        className="
                          mt-1.5
                          space-y-0.5
                          text-sm
                          leading-6
                          text-muted
                        "
                      >
                        {item.lines.map((line) => (
                          <p key={line}>{line}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Postal code */}

            <div
              className="
                mt-6
                rounded-xl
                bg-soft-background
                px-4
                py-3
                text-sm
                text-muted
              "
            >
              Código Postal:{" "}
              <span
                className="
                  font-semibold
                  text-foreground
                "
              >
                {LOCATION.postalCode}
              </span>
            </div>
          </motion.div>

          {/* ==================================================
              MAP
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              x: 24,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.6,
              delay: 0.08,
              ease: "easeOut",
            }}
            className="min-w-0"
          >
            <a
              href={LOCATION.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Abrir ubicación de SmartPro en Google Maps"
              className="
                group
                relative
                block
                h-full
                min-h-[420px]
                overflow-hidden
                rounded-[24px]
                border
                border-border
                bg-soft-background
                shadow-[0_12px_40px_rgba(16,16,36,0.08)]
                lg:min-h-[520px]
              "
            >
              {/* MAP IMAGE */}

              <Image
                src={LOCATION.mapImage}
                alt="Mapa referencial de la ubicación de SmartPro"
                fill
                className="
                  object-cover
                  object-center
                  transition-transform
                  duration-700
                  ease-out
                  group-hover:scale-[1.02]
                "
                sizes="
                  (max-width: 1023px) 100vw,
                  70vw
                "
              />

              {/* Light overlay */}

              <div
                aria-hidden="true"
                className="
                  absolute
                  inset-0
                  bg-white/5
                  transition-all
                  duration-300
                  group-hover:bg-transparent
                "
              />

              {/* ==================================================
                  OPEN MAP BUTTON
              ================================================== */}

              <div
                className="
                  absolute
                  bottom-5
                  right-5
                  z-20
                "
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-full
                    bg-white/95
                    px-4
                    py-2.5
                    text-sm
                    font-semibold
                    text-foreground
                    shadow-[0_8px_28px_rgba(16,16,36,0.14)]
                    backdrop-blur-md
                    transition-all
                    duration-300
                    group-hover:-translate-y-1
                    group-hover:text-primary
                  "
                >
                  Abrir en Maps
                  <ArrowUpRight size={16} strokeWidth={1.8} />
                </div>
              </div>
            </a>
          </motion.div>
        </div>

        {/* ====================================================
            MAP NOTE
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            y: 10,
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
            delay: 0.18,
          }}
          className="
            mt-6
            flex
            items-center
            justify-center
            gap-2
            text-center
            text-sm
            text-muted
          "
        >
          <Info size={17} className="shrink-0 text-primary" />

          <span>
            Ubicación referencial. Haz clic en el mapa para abrirla en Google
            Maps.
          </span>
        </motion.div>
      </div>
    </section>
  );
}
