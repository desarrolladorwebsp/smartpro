import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";

export const metadata: Metadata = {
  title: "Política de privacidad",
  description:
    "Conoce cómo SmartPro recopila, usa y protege la información personal de clientes y contactos.",
  alternates: {
    canonical: "/politica-privacidad",
  },
  robots: {
    index: true,
    follow: true,
  },
};

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    {
      "@type": "ListItem",
      position: 1,
      name: "Inicio",
      item: "https://smartpro.cl/",
    },
    {
      "@type": "ListItem",
      position: 2,
      name: "Política de privacidad",
      item: "https://smartpro.cl/politica-privacidad",
    },
  ],
};

export default function PoliticaPrivacidadPage() {
  return (
    <>
      <JsonLd data={breadcrumbSchema} />
      <main className="mx-auto max-w-4xl px-5 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">SmartPro</p>
          <h1 className="mt-3 text-4xl font-bold tracking-[-0.05em] text-foreground">Política de privacidad</h1>
        </div>

        <div className="space-y-6 text-base leading-7 text-muted">
          <p>
            En SmartPro, valoramos la confianza de nuestros clientes, prospectos y contactos. Esta política explica
            cómo recopilamos, usamos y protegemos la información personal que compartes con nosotros a través de
            nuestra web, formularios de contacto, WhatsApp y otros canales de comunicación.
          </p>

          <section>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-foreground">Información que recopilamos</h2>
            <p className="mt-3">
              Podemos recolectar información como nombre, empresa, correo electrónico, teléfono, mensaje y otras
              referencias que nos proporciones al contactarnos con SmartPro.
            </p>
          </section>

          <section>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-foreground">Uso de la información</h2>
            <p className="mt-3">
              Usamos la información para responder consultas, gestionar proyectos, coordinar cotizaciones, atender
              solicitudes de servicio, comunicarnos por correo o WhatsApp y ofrecer una mejor experiencia digital.
            </p>
          </section>

          <section>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-foreground">Protección de datos</h2>
            <p className="mt-3">
              Adoptamos medidas razonables para proteger la información contra accesos no autorizados, uso indebido,
              pérdida o divulgación. Sin embargo, ninguna transmisión digital es 100% infalible.
            </p>
          </section>

          <section>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-foreground">Compartir información</h2>
            <p className="mt-3">
              No vendemos ni alquilamos tu información personal. La información se compartirá solo cuando sea
              necesario para brindar el servicio solicitado o cuando exista un requerimiento legal.
            </p>
          </section>

          <section>
            <h2 className="mt-6 text-2xl font-bold tracking-[-0.04em] text-foreground">Contacto</h2>
            <p className="mt-3">
              Si tienes dudas sobre esta política o quieres gestionar tus datos, puedes escribirnos a
              contacto@smartpro.cl o comunicarte con nosotros por WhatsApp.
            </p>
          </section>
        </div>
      </main>
    </>
  );
}
