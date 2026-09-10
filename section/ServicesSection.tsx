"use client";

import { useRef } from "react";
import { motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { SmartImage } from "@/components/ui/SmartImage";
import ViewServiceButton from "@/components/plans/ViewServiceButton";
import type { PublicServiceView } from "@/lib/services/public";

type ServicesSectionProps = {
  catalog: PublicServiceView[];
};

export default function ServicesSection({ catalog }: ServicesSectionProps) {
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
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            className="eyebrow"
          >
            Capacidades
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.25 }}
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
            overflow-y-hidden
            pb-2
            snap-x
            snap-mandatory
            md:grid
            md:grid-cols-2
            md:gap-5
            md:overflow-visible
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {catalog.length === 0 ? (
            <div className="rounded-[1.25rem] border border-dashed border-border bg-white px-6 py-16 text-center">
              <p className="text-lg font-semibold text-foreground">Catálogo en preparación</p>
              <p className="mt-2 text-sm text-muted">Los planes públicos se cargan desde la base de datos de SmartPro.</p>
            </div>
          ) : (
            catalog.map((service, index) => (
            <motion.article
              key={service.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{
                duration: 0.5,
                delay: Math.min(index * 0.05, 0.2),
                ease: "easeOut",
              }}
              className="
                group
                relative
                aspect-[4/3]
                h-auto
                w-[min(78vw,22.5rem)]
                shrink-0
                snap-center
                overflow-hidden
                rounded-[1.25rem]
                bg-navy
                md:w-full
                md:min-w-0
                md:max-w-none
              "
            >
              {/* Imagen */}
              <SmartImage
                key={service.image}
                src={service.image}
                alt={service.name}
                fill
                className="object-cover object-center transition-all duration-700 ease-out group-hover:scale-[1.045]"
                sizes="(max-width: 767px) 78vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 25vw"
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
              <div className="relative z-10 flex h-full flex-col justify-between p-4 sm:p-5 xl:p-6">
                {/* Título */}
                <h3
                  className="
                    max-w-[16ch]
                    text-pretty
                    text-[1.15rem]
                    font-semibold
                    leading-[1.25]
                    tracking-[-0.035em]
                    text-on-dark
                    sm:text-[1.3rem]
                    xl:text-[1.35rem]
                  "
                >
                  {service.name}
                </h3>

                {/* CTA */}
                <div className="pt-3">
                  <ViewServiceButton
                    categorySlug={service.slug}
                    title={service.name}
                    initialPlans={service.plans}
                    initialCategories={service.categories}
                  />
                </div>
              </div>
            </motion.article>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
