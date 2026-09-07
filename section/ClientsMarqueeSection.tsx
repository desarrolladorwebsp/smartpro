"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

const CLIENTS = [
  {
    name: "Cliente 01",
    logo: "/images/clients/client-01.png",
  },
  {
    name: "Cliente 02",
    logo: "/images/clients/client-02.png",
  },
  {
    name: "Cliente 03",
    logo: "/images/clients/client-03.png",
  },
  {
    name: "Cliente 04",
    logo: "/images/clients/client-04.png",
  },
  {
    name: "Cliente 05",
    logo: "/images/clients/client-05.png",
  },
  {
    name: "Cliente 06",
    logo: "/images/clients/client-06.png",
  },
] as const;

function ClientLogo({
  name,
  logo,
}: {
  name: string;
  logo: string;
}) {
  return (
    <div
      className="
        group
        flex h-[88px] w-[170px] shrink-0
        items-center justify-center
        rounded-lg
        border border-black/[0.06]
        bg-white
        px-6
        shadow-[0_6px_24px_rgba(16,16,36,0.035)]
        transition-[border-color,box-shadow,transform] duration-300 ease-out
        sm:h-[96px] sm:w-[190px]
        lg:h-[104px] lg:w-[210px]
        hover:-translate-y-0.5
        hover:scale-[1.015]
        hover:border-primary/25
        hover:shadow-[0_12px_30px_rgba(109,40,217,0.10)]
      "
    >
      <div className="relative h-[52px] w-full sm:h-[58px]">
        <Image
          src={logo}
          alt={`Logo de ${name}`}
          fill
          sizes="210px"
          className="
            object-contain
            opacity-65
            grayscale
            transition-[filter,opacity,transform] duration-300 ease-out
            group-hover:opacity-100
            group-hover:grayscale-0
            group-hover:scale-[1.025]
          "
        />
      </div>
    </div>
  );
}

export default function ClientsMarqueeSection() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="clients-title"
      className="relative overflow-hidden bg-[#F8F7FC] py-16 sm:py-20 lg:py-24"
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
              />
            ))}
          </div>
        </div>
      </div>
    </motion.section>
  );
}