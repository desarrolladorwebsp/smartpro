"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";

import { FaFacebookF, FaInstagram, FaXTwitter } from "react-icons/fa6";

/* ============================================================
   CONSTANTES
============================================================ */

const FOOTER_ASSETS = {
  logo: "/images/logo/logo-smartpro-01.png",
  payment: "/images/logo/webpay-plus.png",
} as const;

const CONTACT_INFO = [
  {
    id: "address",
    icon: MapPin,
    label: "Santa Elena 941 B, Santiago",
    href: "https://www.google.com/maps/search/?api=1&query=Santa+Elena+941+B+Santiago+Chile",
    external: true,
  },
  {
    id: "postal-code",
    icon: MapPin,
    label: "Código Postal: 7500000",
    href: null,
    external: false,
  },
  {
    id: "email",
    icon: Mail,
    label: "contacto@smartpro.cl",
    href: "mailto:contacto@smartpro.cl",
    external: false,
  },
  {
    id: "phone",
    icon: Phone,
    label: "(+56) 9 4977 3707",
    href: "tel:+56949773707",
    external: false,
  },
] as const;

const SITE_MAP = [
  {
    label: "Inicio",
    href: "#inicio",
  },
  {
    label: "Modelos",
    href: "#voceros",
  },
  {
    label: "Servicios",
    href: "#servicios",
  },
  {
    label: "Planes",
    href: "#planes",
  },
  {
    label: "Proyectos",
    href: "#proyectos",
  },
  {
    label: "Testimonios",
    href: "#testimonios",
  },
  {
    label: "Contacto",
    href: "#contacto",
  },
  {
    label: "Política de privacidad",
    href: "/politica-privacidad",
  },
] as const;

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61568563559545",
    icon: FaFacebookF,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/smartpro.chile/",
    icon: FaInstagram,
  },
  {
    label: "X",
    href: "https://x.com/smartpro2025",
    icon: FaXTwitter,
  },
 
] as const;

/* ============================================================
   FOOTER
============================================================ */

export default function Footer() {
  return (
    <footer
      id="contacto"
      className="
        relative
        overflow-hidden
        bg-navy
        text-white
      "
    >
      {/* ======================================================
          DECORACIÓN DE FONDO
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          -top-40
          h-[420px]
          w-[420px]
          rounded-full
          bg-primary/15
          blur-[130px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -bottom-44
          right-0
          h-[400px]
          w-[400px]
          rounded-full
          bg-magenta/10
          blur-[130px]
        "
      />

      {/* Línea superior */}

      <div
        className="
          h-px
          w-full
          bg-gradient-to-r
          from-transparent
          via-primary/70
          to-magenta/70
        "
      />

      {/* ======================================================
          CONTENIDO PRINCIPAL
      ====================================================== */}

      <div
        className="
          relative
          mx-auto
          max-w-[1500px]
          px-5
          py-16
          sm:px-6
          sm:py-20
          lg:px-8
          lg:py-24
        "
      >
        <div
          className="
            grid
            gap-12
            md:grid-cols-2
            lg:grid-cols-[1.4fr_0.8fr_0.9fr_1fr]
            lg:gap-10
            xl:gap-16
          "
        >
          {/* ==================================================
              MARCA + CONTACTO
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.55,
            }}
          >
            {/* Logo */}

            <Link
              href="/"
              aria-label="Ir al inicio de SmartPro"
              className="inline-flex"
            >
              <div
                className="
                  rounded-2xl
                  border
                  border-white/10
                  bg-white
                  px-4
                  py-3
                  shadow-[0_12px_40px_rgba(0,0,0,0.12)]
                  transition-transform
                  duration-300
                  hover:-translate-y-1
                "
              >
                <Image
                  src={FOOTER_ASSETS.logo}
                  alt="SmartPro"
                  width={180}
                  height={58}
                  className="
                    h-auto
                    w-[145px]
                    object-contain
                    sm:w-[165px]
                  "
                />
              </div>
            </Link>

            {/* Descripción */}

            <p
              className="
                mt-6
                max-w-sm
                text-sm
                leading-7
                text-white/60
              "
            >
              Estrategia, creatividad y tecnología para impulsar marcas,
              empresas y proyectos en el entorno digital.
            </p>

            {/* Datos contacto */}

            <div className="mt-7 space-y-4">
              {CONTACT_INFO.map((item) => {
                const Icon = item.icon;

                const content = (
                  <>
                    <span
                      className="
                        flex
                        h-9
                        w-9
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        border-primary/20
                        bg-primary/10
                        text-violet-300
                        transition-all
                        duration-300
                        group-hover:border-primary/40
                        group-hover:bg-primary/20
                      "
                    >
                      <Icon size={16} strokeWidth={1.8} />
                    </span>

                    <span
                      className="
                        text-sm
                        leading-6
                        text-white/65
                        transition-colors
                        duration-300
                        group-hover:text-white
                      "
                    >
                      {item.label}
                    </span>
                  </>
                );

                if (!item.href) {
                  return (
                    <div
                      key={item.id}
                      className="
                        flex
                        items-start
                        gap-3
                      "
                    >
                      {content}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.id}
                    href={item.href}
                    target={item.external ? "_blank" : undefined}
                    rel={item.external ? "noopener noreferrer" : undefined}
                    className="
                      group
                      flex
                      items-start
                      gap-3
                    "
                  >
                    {content}
                  </a>
                );
              })}
            </div>
          </motion.div>

          {/* ==================================================
              MAPA DEL SITIO
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.55,
              delay: 0.08,
            }}
          >
            <FooterTitle>Mapa del sitio</FooterTitle>

            <nav aria-label="Mapa del sitio" className="mt-6">
              <ul className="space-y-3">
                {SITE_MAP.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="
                        group
                        inline-flex
                        items-center
                        gap-2
                        text-sm
                        text-white/60
                        transition-colors
                        duration-300
                        hover:text-white
                      "
                    >
                      <span
                        className="
                          h-1
                          w-1
                          rounded-full
                          bg-primary
                          transition-all
                          duration-300
                          group-hover:w-3
                          group-hover:bg-magenta
                        "
                      />

                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </motion.div>

          {/* ==================================================
              FORMAS DE PAGO
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.55,
              delay: 0.14,
            }}
          >
            <FooterTitle>Formas de pago</FooterTitle>

            <p
              className="
                mt-6
                text-sm
                leading-6
                text-white/55
              "
            >
              Realiza tus pagos de forma segura mediante nuestros medios
              disponibles.
            </p>

            {/* Webpay */}

            <div
              className="
                mt-5
                inline-flex
                max-w-[210px]
                items-center
                justify-center
                rounded-2xl
                border
                border-white/10
                bg-white
                p-4
                transition-all
                duration-300
                hover:-translate-y-1
                hover:shadow-[0_15px_40px_rgba(109,40,217,0.15)]
              "
            >
              <Image
                src={FOOTER_ASSETS.payment}
                alt="Webpay"
                width={220}
                height={105}
                className="
                  h-auto
                  w-full
                  object-contain
                "
              />
            </div>
          </motion.div>

          {/* ==================================================
              REDES SOCIALES
          ================================================== */}

          <motion.div
            initial={{
              opacity: 0,
              y: 20,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.2,
            }}
            transition={{
              duration: 0.55,
              delay: 0.2,
            }}
          >
            <FooterTitle>Síguenos</FooterTitle>

            <p
              className="
                mt-6
                max-w-xs
                text-sm
                leading-6
                text-white/55
              "
            >
              Síguenos y conoce nuestras novedades, proyectos y contenido.
            </p>

            {/* Social icons */}

            <div
              className="
                mt-6
                flex
                flex-wrap
                gap-3
              "
            >
              {SOCIAL_LINKS.map((social) => {
                const Icon = social.icon;

                return (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`SmartPro en ${social.label}`}
                    whileHover={{
                      y: -3,
                    }}
                    whileTap={{
                      scale: 0.94,
                    }}
                    className="
                      group
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-white/10
                      bg-white/[0.05]
                      text-white/70
                      backdrop-blur-md
                      transition-all
                      duration-300
                      hover:border-primary/50
                      hover:bg-primary
                      hover:text-white
                      hover:shadow-[0_8px_25px_rgba(109,40,217,0.25)]
                    "
                  >
                    <Icon size={17} />
                  </motion.a>
                );
              })}
            </div>

            {/* CTA */}

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="#contacto"
                className="
                  group
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-violet-300
                  transition-colors
                  duration-300
                  hover:text-white
                "
              >
                Cuéntanos tu proyecto
                <ArrowUpRight
                  size={16}
                  className="
                    transition-transform
                    duration-300
                    group-hover:-translate-y-0.5
                    group-hover:translate-x-0.5
                  "
                />
              </Link>

              <Link
                href="/login"
                className="
                  inline-flex
                  items-center
                  gap-2
                  text-sm
                  font-semibold
                  text-white/80
                  transition-colors
                  duration-300
                  hover:text-white
                "
              >
                Ejecutivos
              </Link>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ======================================================
          BARRA LEGAL
      ====================================================== */}

      <div
        className="
          relative
          border-t
          border-white/[0.08]
          bg-black/10
        "
      >
        <div
          className="
            mx-auto
            flex
            max-w-[1500px]
            flex-col
            gap-4
            px-5
            py-6
            sm:px-6
            md:flex-row
            md:items-center
            md:justify-between
            lg:px-8
          "
        >
          <div>
            <p
              className="
                text-sm
                font-medium
                text-white/70
              "
            >
              Empresa Comercial LyV SpA
            </p>

            <p
              className="
                mt-1
                text-xs
                text-white/40
              "
            >
              RUT 78.206.607-2
            </p>
          </div>

          <div
            className="
              flex
              flex-col
              gap-2
              text-xs
              text-white/40
              sm:flex-row
              sm:items-center
              sm:gap-5
            "
          >
            <p>Copyright © 2025 SmartPro.cl</p>

            <Link
              href="/politica-privacidad"
              className="
                transition-colors
                duration-300
                hover:text-white
              "
            >
              Política de privacidad
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ============================================================
   TÍTULOS
============================================================ */

function FooterTitle({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <h2
        className="
          text-sm
          font-semibold
          uppercase
          tracking-[0.18em]
          text-white
        "
      >
        {children}
      </h2>

      <div
        className="
          mt-3
          h-[2px]
          w-8
          rounded-full
          bg-gradient-to-r
          from-primary
          to-magenta
        "
      />
    </div>
  );
}
