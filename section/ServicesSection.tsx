"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";
import ViewServiceButton, {
  type ServicePlansKey,
} from "@/components/plans/ViewServiceButton";

const services = [
  {
    number: "01",
    title: "Desarrollo Web",
    image: "/images/services/service-01.png",
    planKey: "desarrolloWeb",
  },
  {
    number: "02",
    title: "Campañas Publicitarias",
    image: "/images/services/service-02.png",
    planKey: "campanaPublicitaria",
  },
  {
    number: "03",
    title: "Redes Sociales & Contenido",
    image: "/images/services/service-03.png",
    planKey: "redesSociales",
  },
  {
    number: "04",
    title: "Automatización & Conversión",
    image: "/images/services/service-04.png",
    planKey: "automatizacionBots",
  },
  {
    number: "05",
    title: "Producción Audiovisual",
    image: "/images/services/service-05.png",
    planKey: "produccionVisual",
  },
  {
    number: "06",
    title: "Membresías & Negocios",
    image: "/images/services/service-06.png",
    planKey: "membresias",
  },
];

export default function ServicesSection() {
  const servicesTrackRef = useRef<HTMLDivElement | null>(null);

  const scrollServices = (direction: number) => {
    const node = servicesTrackRef.current;

    if (!node) return;

    const cardWidth = node.clientWidth * 0.82;
    node.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  return (
    <section
      id="servicios"
      className="section-shell bg-background"
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

      <div className="section-container">
        {/* =====================================================
            HEADER
        ====================================================== */}

        <div className="section-header">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            Capacidades
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.35 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="section-title"
          >
            Todo lo que tu empresa necesita
            <span className="block">
              para{" "}
              <span className="text-gradient-brand">
                crecer en digital.
              </span>
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.15 }}
            className="accent-line"
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
            CARRUSEL DE SERVICIOS
        ====================================================== */}

        <div className="mb-4 flex items-center justify-end gap-2 md:hidden">
          <button
            type="button"
            aria-label="Ver servicios anteriores"
            onClick={() => scrollServices(-1)}
            className="icon-button h-10 w-10"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Ver servicios siguientes"
            onClick={() => scrollServices(1)}
            className="icon-button h-10 w-10"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div
          ref={servicesTrackRef}
          className="
            no-scrollbar
            flex
            gap-4
            overflow-x-auto
            pb-2
            snap-x
            snap-mandatory
            md:grid
            md:grid-cols-2
            md:gap-5
            lg:grid-cols-3
            lg:gap-5
          "
        >
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
                min-h-[320px]
                min-w-[78vw]
                snap-center
                overflow-hidden
                rounded-[1.25rem]
                bg-navy
                sm:min-h-[360px]
                md:min-w-0
                lg:min-h-[390px]
              "
            >
              {/* Imagen */}
              <SmartImage
                key={service.image}
                src={service.image}
                alt={service.title}
                fill
                className="object-cover transition-all duration-700 ease-out group-hover:scale-[1.045]"
                sizes="(max-width: 767px) 100vw, (max-width: 1023px) 50vw, 33vw"
                containerClassName="absolute inset-0"
              />

              {/* Overlay principal */}
              <div
                className="
                  absolute inset-0
                  bg-gradient-to-tr
                  from-ink/90
                  via-ink/45
                  to-ink/5
                "
              />

              {/* Overlay inferior */}
              <div
                className="
                  absolute inset-x-0 bottom-0
                  h-2/3
                  bg-gradient-to-t
                  from-ink/80
                  via-ink/20
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
              <div className="relative z-10 flex h-full min-h-[320px] flex-col p-6 sm:min-h-[360px] lg:min-h-[390px] lg:p-7">
                {/* Número */}
                <div>
                  <span
                    className="
                      block
                      text-2xl
                      font-semibold
                      tracking-[-0.03em]
                      text-on-dark-secondary
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
                    text-[1.5rem]
                    font-semibold
                    leading-[1.12]
                    tracking-[-0.035em]
                    text-on-dark
                    sm:text-[1.75rem]
                  "
                >
                  {service.title}
                </h3>

                {/* CTA */}
                <div className="mt-auto pt-10">
                  <ViewServiceButton
                    service={service.planKey as ServicePlansKey}
                  />
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
