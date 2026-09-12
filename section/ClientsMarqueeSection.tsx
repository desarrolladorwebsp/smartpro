"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

type ClientBrand = {
  name: string;
  logo: string;
  onDark?: boolean;
};

const CLIENTS: ClientBrand[] = [
  {
    name: "Axessia",
    logo: "/images/logo/logos-cinta/logo-axessia.png",
  },
  {
    name: "DesdeTu7",
    logo: "/images/logo/logos-cinta/logo-desdetu7.jpg",
  },
  {
    name: "Experto en Salud",
    logo: "/images/logo/logos-cinta/logo-experto-en-salud.png",
  },
  {
    name: "AppsFly",
    logo: "/images/logo/logos-cinta/logo_appsfly.png",
  },
  {
    name: "Cotízalo Antes",
    logo: "/images/logo/logos-cinta/logo-cotizalo-antes.avif",
  },
  {
    name: "López Vidal",
    logo: "/images/logo/logos-cinta/logo-lopez-y-vidal.png",
  },
  {
    name: "Kitchen Solutions",
    logo: "/images/logo/logos-cinta/logo-kitchen-solution.png",
  },
  {
    name: "Isapres Premium",
    logo: "/images/logo/logos-cinta/logo-isapres-premium.png",
  },
  {
    name: "Turismo Dabar",
    logo: "/images/logo/logos-cinta/logo-turismo-dabar.webp",
  },
];

function ClientLogo({
  name,
  logo,
  onDark = false,
}: {
  name: string;
  logo: string;
  onDark?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={`
        group
        flex h-[72px] w-[150px] shrink-0
        items-center justify-center
        rounded-lg
        px-5
        shadow-[0_6px_24px_rgba(16,16,36,0.035)]
        transition-[border-color,box-shadow,transform] duration-300 ease-out
        sm:h-[84px] sm:w-[176px]
        lg:h-[92px] lg:w-[196px]
        hover:-translate-y-0.5
        ${
          onDark
            ? "border border-white/10 bg-ink hover:border-primary/40 hover:shadow-[0_12px_30px_rgba(109,40,217,0.18)]"
            : "border border-black/[0.06] bg-white hover:border-primary/25 hover:shadow-[0_12px_30px_rgba(109,40,217,0.10)]"
        }
      `}
    >
      {failed ? (
        <span
          className={`px-1 text-center text-xs font-medium tracking-wide ${
            onDark ? "text-white/80" : "text-muted"
          }`}
        >
          {name}
        </span>
      ) : (
        <div className="relative h-[44px] w-full sm:h-[52px]">
          <Image
            src={logo}
            alt={`Logo de ${name}`}
            fill
            sizes="196px"
            onError={() => setFailed(true)}
            className="
              object-contain
              transition-transform duration-300 ease-out
              group-hover:scale-[1.02]
            "
          />
        </div>
      )}
    </div>
  );
}

export default function ClientsMarqueeSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="clients-title"
      className="relative overflow-hidden bg-[#F8F7FC] py-10 sm:py-12 lg:py-14"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55, ease: "easeOut" }}
    >
      {/* Detalle decorativo */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none absolute left-1/2 top-0
          h-px w-[80%] -translate-x-1/2
          bg-gradient-to-r
          from-transparent via-primary/20 to-transparent
        "
      />

    

      <h2 id="clients-title" className="sr-only">
        Marcas que confían en SmartPro
      </h2>

      {/* Carrusel */}
      <div className="clients-marquee relative w-full overflow-hidden">
        {/* Fade izquierdo */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-y-0 left-0 z-10
            w-12 bg-gradient-to-r from-[#F8F7FC] to-transparent
            sm:w-24 lg:w-36
          "
        />

        {/* Fade derecho */}
        <div
          aria-hidden="true"
          className="
            pointer-events-none absolute inset-y-0 right-0 z-10
            w-12 bg-gradient-to-l from-[#F8F7FC] to-transparent
            sm:w-24 lg:w-36
          "
        />

        <div className="clients-marquee-track flex w-max">
          {/* Grupo original */}
          <div className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5 lg:gap-6 lg:pr-6">
            {CLIENTS.map((client) => (
              <ClientLogo
                key={client.name}
                name={client.name}
                logo={client.logo}
                onDark={client.onDark}
              />
            ))}
          </div>

          {/* Duplicado para efecto infinito */}
          <div
            aria-hidden="true"
            className="flex shrink-0 gap-4 pr-4 sm:gap-5 sm:pr-5 lg:gap-6 lg:pr-6"
          >
            {CLIENTS.map((client) => (
              <ClientLogo
                key={`duplicate-${client.name}`}
                name={client.name}
                logo={client.logo}
                onDark={client.onDark}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}