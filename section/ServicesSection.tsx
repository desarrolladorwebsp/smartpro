"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const services = [
  {
    number: "01",
    title: "Desarrollo Web",
    image: "/images/services/service-01.png",
    href: "/servicios/desarrollo-web",
  },
  {
    number: "02",
    title: "Campañas Publicitarias",
    image: "/images/services/service-02.png",
    href: "/servicios/campanas-publicitarias",
  },
  {
    number: "03",
    title: "Redes Sociales & Contenido",
    image: "/images/services/service-03.png",
    href: "/servicios/redes-sociales",
  },
  {
    number: "04",
    title: "Automatización & Conversión",
    image: "/images/services/service-04.png",
    href: "/servicios/automatizacion",
  },
  {
    number: "05",
    title: "Producción Audiovisual",
    image: "/images/services/service-05.png",
    href: "/servicios/produccion-audiovisual",
  },
  {
    number: "06",
    title: "Membresías & Negocios",
    image: "/images/services/service-06.png",
    href: "/servicios/membresias",
  },
];

export default function ServicesSection() {
  return (
    <section
      id="servicios"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
    >
      {/* Decoración superior */}
      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute left-1/2 top-0
          h-72 w-[720px]
          -translate-x-1/2
          rounded-full
          bg-primary/5
          blur-[100px]
        "
      />

      <div className="relative mx-auto max-w-[1500px] px-5 sm:px-6 lg:px-8">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="mx-auto mb-12 max-w-4xl text-center lg:mb-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="
              mb-4
              text-xs font-semibold
              uppercase
              tracking-[0.35em]
              text-primary
              sm:text-sm
            "
          >
            Capacidades
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.05 }}
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
            Todo lo que tu empresa necesita
            <span className="block">
              para{" "}
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
                crecer en digital.
              </span>
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="
              mx-auto my-6
              h-[3px]
              w-14
              origin-center
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
            "
          />

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="
              flex flex-wrap
              items-center justify-center
              gap-x-4 gap-y-2
              text-sm
              font-medium
              text-muted
              sm:text-base
            "
          >
            {[
              "Estrategia",
              "Tecnología",
              "Automatización",
              "Contenido",
              "Ventas",
            ].map((item, index, items) => (
              <div key={item} className="flex items-center gap-4">
                <span>{item}</span>

                {index < items.length - 1 && (
                  <span className="text-primary">•</span>
                )}
              </div>
            ))}
          </motion.div>
        </div>

        {/* =====================================================
            GRID DE SERVICIOS
        ====================================================== */}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service, index) => (
            <motion.article
              key={service.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.55,
                delay: index * 0.06,
                ease: "easeOut",
              }}
              className="
                group
                relative
                min-h-[360px]
                overflow-hidden
                rounded-[22px]
                bg-navy
                sm:min-h-[390px]
                lg:min-h-[420px]
              "
            >
              {/* Imagen */}
              <Image
                src={service.image}
                alt={service.title}
                fill
                className="
                  object-cover
                  transition-transform
                  duration-700
                  ease-out
                  group-hover:scale-[1.045]
                "
                sizes="
                  (max-width: 767px) 100vw,
                  (max-width: 1023px) 50vw,
                  33vw
                "
              />

              {/* Overlay principal */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-tr
                  from-black/90
                  via-black/45
                  to-black/5
                "
              />

              {/* Overlay inferior */}
              <div
                className="
                  absolute inset-x-0 bottom-0
                  h-2/3
                  bg-gradient-to-t
                  from-black/80
                  via-black/20
                  to-transparent
                "
              />

              {/* Glow */}
              <div
                aria-hidden="true"
                className="
                  pointer-events-none
                  absolute -left-16 bottom-[-80px]
                  h-52 w-52
                  rounded-full
                  bg-primary/20
                  blur-[80px]
                  opacity-0
                  transition-opacity
                  duration-500
                  group-hover:opacity-100
                "
              />

              {/* Contenido */}
              <div className="relative z-10 flex h-full min-h-[360px] flex-col p-6 sm:min-h-[390px] lg:min-h-[420px] lg:p-7">
                {/* Número */}
                <div>
                  <span
                    className="
                      block
                      text-2xl
                      font-semibold
                      tracking-[-0.03em]
                      text-violet-300
                    "
                  >
                    {service.number}
                  </span>

                  <div
                    className="
                      mt-2
                      h-[2px]
                      w-7
                      rounded-full
                      bg-gradient-to-r
                      from-primary
                      to-magenta
                    "
                  />
                </div>

                {/* Título */}
                <h3
                  className="
                    mt-6
                    max-w-[280px]
                    text-[26px]
                    font-semibold
                    leading-[1.08]
                    tracking-[-0.035em]
                    text-white
                    sm:text-[28px]
                  "
                >
                  {service.title}
                </h3>

                {/* CTA */}
                <div className="mt-auto pt-10">
                  <Link
                    href={service.href}
                    className="
                      group/button
                      inline-flex
                      min-h-11
                      items-center
                      gap-8
                      rounded-full
                      border
                      border-primary/80
                      bg-black/10
                      px-5
                      text-sm
                      font-semibold
                      text-white
                      backdrop-blur-sm
                      transition-all
                      duration-300
                      hover:border-magenta
                      hover:bg-primary/15
                    "
                  >
                    Ver servicio
                    <ArrowRight
                      size={16}
                      strokeWidth={1.8}
                      className="
                        transition-transform
                        duration-300
                        group-hover/button:translate-x-1
                      "
                    />
                  </Link>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
