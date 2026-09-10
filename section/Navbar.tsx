"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Menu, User, X } from "lucide-react";

import CartButton from "@/components/cart/CartButton";

/* ============================================================
   CONSTANTES
============================================================ */

const SCROLL_COMPACT_AT = 20;
const SCROLL_SHOW_AT_TOP = 48;
const SCROLL_DIRECTION_DELTA = 12;

const LOGOS = {
  icon: "/images/logo/logo-smartpro-02.png",
  wordmark: "/images/logo/logo-smartpro-01.png",
} as const;

const NAV_ITEMS = [
  {
    label: "Inicio",
    href: "/#inicio",
    sectionId: "inicio",
  },
  {
    label: "Servicios",
    href: "/#servicios",
    sectionId: "servicios",
  },
  {
    label: "Proyectos",
    href: "/#proyectos",
    sectionId: "proyectos",
  },
  {
    label: "Nosotros",
    href: "/#nosotros",
    sectionId: "nosotros",
  },
  {
    label: "Contacto",
    href: "/#contacto",
    sectionId: "contacto",
  },
] as const;

const SECTION_IDS = NAV_ITEMS.map((item) => item.sectionId);

/* ============================================================
   COMPONENTE PRINCIPAL
============================================================ */

export default function Navbar() {
  const router = useRouter();
  const shouldReduceMotion = useReducedMotion();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("inicio");
  const mobileMenuOpenRef = useRef(false);
  const ignoreScrollSpyUntilRef = useRef(0);

  /* ------------------------------------------------------------
     DETECTAR SCROLL (dirección + compacto, con rAF)
  ------------------------------------------------------------ */

  useEffect(() => {
    mobileMenuOpenRef.current = mobileMenuOpen;
  }, [mobileMenuOpen]);

  useEffect(() => {
    let lastY = Math.max(0, window.scrollY);
    let frame = 0;
    let initialized = false;

    const syncFromScroll = () => {
      frame = 0;

      const currentY = Math.max(0, window.scrollY);
      const compact = currentY > SCROLL_COMPACT_AT;

      setScrolled((previous) => (previous === compact ? previous : compact));

      if (currentY <= SCROLL_SHOW_AT_TOP) {
        if (Date.now() >= ignoreScrollSpyUntilRef.current) {
          setActiveSection((previous) => (previous === "inicio" ? previous : "inicio"));
        }
      } else {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        if (maxScroll > 0 && currentY >= maxScroll - 32 && Date.now() >= ignoreScrollSpyUntilRef.current) {
          setActiveSection((previous) => (previous === "contacto" ? previous : "contacto"));
        }
      }

      if (!initialized) {
        initialized = true;
        lastY = currentY;
        setHidden(false);
        return;
      }

      if (mobileMenuOpenRef.current || currentY <= SCROLL_SHOW_AT_TOP) {
        lastY = currentY;
        setHidden(false);
        return;
      }

      const delta = currentY - lastY;

      if (Math.abs(delta) < SCROLL_DIRECTION_DELTA) {
        return;
      }

      setHidden(delta > 0);
      lastY = currentY;
    };

    const handleScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(syncFromScroll);
    };

    syncFromScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (frame) window.cancelAnimationFrame(frame);
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
    if (typeof IntersectionObserver === "undefined") return;

    const sectionElements = SECTION_IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    if (sectionElements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntry = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (visibleEntry && Date.now() >= ignoreScrollSpyUntilRef.current) {
          setActiveSection(visibleEntry.target.id);
        }
      },
      {
        root: null,
        threshold: [0.15, 0.35, 0.55, 0.75],
        rootMargin: "-28% 0px -48% 0px",
      },
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const scrollToHash = () => {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash || !(SECTION_IDS as readonly string[]).includes(hash)) return;

      const element = document.getElementById(hash);
      if (!element) return;

      setActiveSection(hash);
      element.scrollIntoView({
        behavior: "auto",
        block: "start",
      });
    };

    const timeout = window.setTimeout(scrollToHash, 0);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, []);

  const handleSectionNavigate = (
    event: MouseEvent<HTMLAnchorElement>,
    sectionId: string,
  ) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const onHome = window.location.pathname === "/";
    const element = document.getElementById(sectionId);

    if (!onHome || !element) {
      setMobileMenuOpen(false);
      return;
    }

    event.preventDefault();
    setMobileMenuOpen(false);
    setHidden(false);
    setActiveSection(sectionId);
    ignoreScrollSpyUntilRef.current = Date.now() + 900;
    element.scrollIntoView({
      behavior: shouldReduceMotion ? "auto" : "smooth",
      block: "start",
    });

    try {
      window.history.replaceState(null, "", `/#${sectionId}`);
    } catch {
      window.location.hash = sectionId;
    }
  };

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
          y: hidden ? "-110%" : 0,
        }}
        transition={
          shouldReduceMotion
            ? { duration: 0 }
            : {
                opacity: { duration: 0.45, ease: "easeOut" },
                y: {
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                },
              }
        }
        onFocusCapture={() => setHidden(false)}
        className={`
          fixed inset-x-0 top-0 z-50
          transition-[background-color,box-shadow,backdrop-filter] duration-500
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
              href="/#inicio"
              scroll={false}
              aria-label="Ir al inicio de SmartPro"
              onClick={(event) => handleSectionNavigate(event, "inicio")}
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
                  duration: 0.25,
                  ease: "easeOut",
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
                    w-[32px]
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
              {NAV_ITEMS.map((item) => (
                  <NavItem
                    key={item.label}
                    href={item.href}
                    label={item.label}
                    active={activeSection === item.sectionId}
                    onNavigate={(event) => handleSectionNavigate(event, item.sectionId)}
                  />
                ))}
            </nav>

            {/* ==================================================
                CTA DESKTOP
            ================================================== */}

            <div className="hidden items-center gap-3 lg:flex">
              <CartButton />

              <motion.button
                type="button"
                aria-label="Iniciar sesión"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => router.push("/login")}
                className="
                  relative
                  inline-flex
                  h-11
                  w-11
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-primary/15
                  bg-surface
                  text-magenta
                  shadow-[0_8px_24px_rgba(236,22,140,0.10)]
                  transition-all
                  duration-300
                  hover:border-magenta/45
                  hover:text-pink
                  lg:h-12
                  lg:w-12
                "
              >
                <User size={18} strokeWidth={2.1} />
              </motion.button>

              <motion.a
                href="/#contacto"
                onClick={(event) => handleSectionNavigate(event, "contacto")}
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
                aria-label="Iniciar sesión"
                onClick={() => router.push("/login")}
                className="
                  relative
                  inline-flex
                  h-10
                  w-10
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-primary/15
                  bg-surface
                  text-magenta
                  shadow-[0_8px_24px_rgba(236,22,140,0.10)]
                  transition-all
                  duration-300
                  hover:border-magenta/45
                  hover:text-pink
                "
              >
                <User size={17} strokeWidth={2.1} />
              </button>

              <button
                type="button"
                aria-label={mobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
                aria-expanded={mobileMenuOpen}
                onClick={() => {
                  setHidden(false);
                  setMobileMenuOpen((current) => !current);
                }}
                className="icon-button text-magenta hover:border-magenta/45 hover:text-pink"
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
                  const isActive = activeSection === item.sectionId;

                  return (
                    <motion.a
                      key={item.label}
                      href={item.href}
                      aria-current={isActive ? "true" : undefined}
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
                      onClick={(event) => handleSectionNavigate(event, item.sectionId)}
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
                  href="/#contacto"
                  whileTap={{
                    scale: 0.98,
                  }}
                  onClick={(event) => handleSectionNavigate(event, "contacto")}
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
  onNavigate,
}: {
  label: string;
  href: string;
  active: boolean;
  onNavigate: (event: MouseEvent<HTMLAnchorElement>) => void;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      aria-current={active ? "true" : undefined}
      onClick={onNavigate}
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
