"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Menu, X } from "lucide-react";

import CartButton from "@/components/cart/CartButton";

/* ============================================================
   CONSTANTES
============================================================ */

const LOGOS = {
  icon: "/images/logo/logo-smartpro-02.png",
  wordmark: "/images/logo/logo-smartpro-01.png",
} as const;

const NAV_ITEMS = [
  {
    label: "Inicio",
    href: "/",
  },
  {
    label: "Servicios",
    href: "#servicios",
  },
  {
    label: "Proyectos",
    href: "#proyectos",
  },
  {
    label: "Nosotros",
    href: "#nosotros",
  },
  {
    label: "Contacto",
    href: "#contacto",
  },
] as const;

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");

  /* ------------------------------------------------------------
     DETECTAR SCROLL
  ------------------------------------------------------------ */

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  /* ------------------------------------------------------------
     BLOQUEAR SCROLL CUANDO EL MENÚ MOBILE ESTÁ ABIERTO
  ------------------------------------------------------------ */

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileMenuOpen]);

  useEffect(() => {
    const sectionIds = ["inicio", "servicios", "proyectos", "nosotros", "contacto"]; 
    const sectionElements = sectionIds
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        root: null,
        threshold: [0.2, 0.4, 0.6],
        rootMargin: "-30% 0px -45% 0px",
      },
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  return (
    <>
      {/* ======================================================
          NAVBAR
      ====================================================== */}

      <motion.header
        initial={{
          opacity: 0,
          y: -20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          duration: 0.65,
          ease: "easeOut",
        }}
        className={`
          fixed inset-x-0 top-0 z-50
          transition-all duration-500
          ${
            scrolled
              ? "bg-surface/92 shadow-[0_8px_28px_rgb(16_16_36_/_0.06)] backdrop-blur-xl"
              : "bg-surface/80 backdrop-blur-lg"
          }
        `}
      >
        <div className="section-container py-0">
          <div
            className={`
              flex items-center justify-between
              transition-[height] duration-500
              ${scrolled ? "h-16" : "h-[72px]"}
            `}
          >
            {/* ==================================================
                BRANDING / LOGOS
            ================================================== */}

            <Link
              href="/"
              aria-label="Ir al inicio de SmartPro"
              className="group flex items-center gap-3"
            >
              {/* Logo SP dentro del card */}

              <motion.div
                whileHover={{
                  y: -1,
                }}
                whileTap={{
                  scale: 0.98,
                }}
                transition={{
                  type: "spring",
                  stiffness: 350,
                  damping: 22,
                }}
                className="
                  relative flex h-12 w-[54px] items-center justify-center
                  overflow-hidden rounded-2xl border border-primary/15 bg-surface
                  shadow-[0_8px_24px_rgb(109_40_217_/_0.1)]
                  transition-shadow duration-300
                  group-hover:shadow-[0_10px_28px_rgb(109_40_217_/_0.16)]
                  sm:h-14 sm:w-[58px]
                "
              >
                {/* Glow */}

                <div
                  aria-hidden="true"
                  className="
                    pointer-events-none
                    absolute
                    -bottom-7
                    -right-7
                    h-20
                    w-20
                    rounded-full
                    bg-primary/20
                    blur-2xl
                  "
                />

                <Image
                  src={LOGOS.icon}
                  alt="SmartPro"
                  width={48}
                  height={48}
                  priority
                  className="
                    relative
                    z-10
                    h-auto
                    w-[38px]
                    object-contain
                    transition-transform
                    duration-500
                    group-hover:scale-105
                    sm:w-[42px]
                  "
                />
              </motion.div>

              {/* Wordmark */}

              <div className="relative hidden sm:block">
                <Image
                  src={LOGOS.wordmark}
                  alt="SmartPro"
                  width={160}
                  height={50}
                  priority
                  className="
                    h-auto
                    w-[135px]
                    object-contain
                    transition-all
                    duration-300
                    lg:w-[150px]
                  "
                />
              </div>
            </Link>

            {/* ==================================================
                NAVEGACIÓN DESKTOP
            ================================================== */}

            <nav
              aria-label="Navegación principal"
              className="
                hidden
                items-center
                gap-1
                lg:flex
              "
            >
              {NAV_ITEMS.map((item) => {
                const isActive =
                  item.href === "/"
                    ? activeSection === "inicio"
                    : activeSection === item.href.replace("#", "");

                return (
                  <NavItem
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    active={isActive}
                  />
                );
              })}
            </nav>

            {/* ==================================================
                CTA DESKTOP
            ================================================== */}

            <div className="hidden items-center gap-3 lg:flex">
              <CartButton />

              <motion.a
                href="#contacto"
                whileHover={{
                  y: -2,
                }}
                whileTap={{
                  scale: 0.97,
                }}
                className="
                  group
                  relative
                  inline-flex
                  min-h-11
                  items-center
                  justify-center
                  overflow-hidden
                  rounded-full
                  bg-primary
                  px-6
                  text-sm
                  font-semibold
                  text-white
                  shadow-[0_8px_22px_rgb(109_40_217_/_0.18)]
                  transition-colors duration-300
                  hover:bg-primary-hover
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -left-10
                    top-0
                    h-full
                    w-8
                    rotate-12
                    bg-white/20
                    blur-md
                    transition-all
                    duration-700
                    group-hover:left-[120%]
                  "
                />

                <span className="relative z-10">Hablemos</span>
              </motion.a>
            </div>

            {/* ==================================================
                BOTÓN MOBILE
            ================================================== */}

            <div className="flex items-center gap-2 lg:hidden">
              <CartButton />

                <button
                type="button"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
                onClick={() => setMobileMenuOpen((current) => !current)}
                className="icon-button"
              >
                <AnimatePresence mode="wait" initial={false}>
                  {mobileMenuOpen ? (
                    <motion.div
                      key="close"
                      initial={{
                        opacity: 0,
                        rotate: -90,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        rotate: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        rotate: 90,
                        scale: 0.8,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                    >
                      <X size={21} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="menu"
                      initial={{
                        opacity: 0,
                        rotate: 90,
                        scale: 0.8,
                      }}
                      animate={{
                        opacity: 1,
                        rotate: 0,
                        scale: 1,
                      }}
                      exit={{
                        opacity: 0,
                        rotate: -90,
                        scale: 0.8,
                      }}
                      transition={{
                        duration: 0.2,
                      }}
                    >
                      <Menu size={22} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            </div>
          </div>
        </div>

        {/* ======================================================
            BORDE INFERIOR
        ====================================================== */}

        <motion.div
          animate={{
            opacity: scrolled ? 1 : 0.5,
          }}
          transition={{
            duration: 0.3,
          }}
          className="
            h-px
            w-full
            bg-gradient-to-r
            from-transparent
            via-primary/20
            to-transparent
          "
        />
      </motion.header>

      {/* ======================================================
          MENÚ MOBILE
      ====================================================== */}

      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            {/* Overlay */}

            <motion.button
              type="button"
              aria-label="Cerrar menú"
              initial={{
                opacity: 0,
              }}
              animate={{
                opacity: 1,
              }}
              exit={{
                opacity: 0,
              }}
              transition={{
                duration: 0.25,
              }}
              onClick={() => setMobileMenuOpen(false)}
              className="
                fixed
                inset-0
                z-40
                cursor-default
                bg-navy/30
                backdrop-blur-sm
                lg:hidden
              "
            />

            {/* Panel */}

            <motion.div
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: -20,
                scale: 0.98,
              }}
              transition={{
                duration: 0.3,
                ease: "easeOut",
              }}
              className="
                fixed
                left-4
                right-4
                top-[4.75rem]
                z-50
                overflow-hidden
                rounded-[1.25rem]
                border
                border-primary/10
                bg-surface/96
                p-3
                shadow-[0_16px_48px_rgb(16_16_36_/_0.12)]
                backdrop-blur-xl
                lg:hidden
              "
            >
              {/* Navegación */}

              <nav aria-label="Navegación móvil" className="flex flex-col">
                {NAV_ITEMS.map((item, index) => {
                  const isActive =
                    item.href === "/"
                      ? activeSection === "inicio"
                      : activeSection === item.href.replace("#", "");

                  return (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      initial={{
                        opacity: 0,
                        x: -10,
                      }}
                      animate={{
                        opacity: 1,
                        x: 0,
                      }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.04,
                      }}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`
                        group
                        flex
                        min-h-12
                        items-center
                        justify-between
                        rounded-xl
                        px-4
                        text-[15px]
                        font-medium
                        transition-all
                        duration-300
                        ${
                          isActive
                            ? "bg-primary/5 text-primary"
                            : "text-foreground hover:bg-primary/5 hover:text-primary"
                        }
                      `}
                    >
                      <span>{item.label}</span>

                      <span
                        aria-hidden="true"
                        className={`
                          h-1.5
                          w-1.5
                          rounded-full
                          bg-primary
                          transition-all
                          duration-300
                          ${isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"}
                        `}
                      />
                    </motion.a>
                  );
                })}
              </nav>

              {/* CTA mobile */}

              <div
                className="
                  mt-2
                  border-t
                  border-border
                  pt-3
                "
              >
                <motion.a
                  href="#contacto"
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={() => setMobileMenuOpen(false)}
                  className="
                    flex
                    min-h-12
                    w-full
                    items-center
                    justify-center
                    rounded-xl
                    bg-gradient-to-r
                    from-primary
                    to-magenta
                    px-5
                    text-sm
                    font-semibold
                    text-white
                  "
                >
                  Cuéntanos tu proyecto
                </motion.a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/* ============================================================
   NAV ITEM DESKTOP
============================================================ */

function NavItem({
  label,
  href,
  active,
}: {
  label: string;
  href: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`
        group
        relative
        flex
        h-11
        items-center
        px-4
        text-sm
        font-medium
        transition-colors
        duration-300
        ${active ? "text-primary" : "text-muted hover:text-primary"}
      `}
    >
      {label}

      <span
        aria-hidden="true"
        className={`
          absolute
          bottom-1.5
          left-1/2
          h-[2px]
          -translate-x-1/2
          rounded-full
          bg-gradient-to-r
          from-primary
          to-magenta
          transition-all
          duration-300
          ${active ? "w-5" : "w-0 group-hover:w-5"}
        `}
      />
    </Link>
  );
}
