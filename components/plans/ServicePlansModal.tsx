"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";

import { AnimatePresence, motion } from "motion/react";

import { ChevronLeft, ChevronRight, X } from "lucide-react";

import PlanCard, { Plan } from "./PlanCard";

/* ============================================================
   TYPES
============================================================ */

type ServicePlansModalProps = {
  open: boolean;

  title: string;

  plans: Plan[];

  onClose: () => void;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function ServicePlansModal({
  open,
  title,
  plans,
  onClose,
}: ServicePlansModalProps) {
  const modalRef = useRef<HTMLDivElement>(null);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [addedPlanName, setAddedPlanName] = useState<string | null>(null);

  const updateCarouselState = () => {
    const node = carouselRef.current;

    if (!node) {
      return;
    }

    const maxScrollLeft = node.scrollWidth - node.clientWidth;

    setCanScrollPrev(node.scrollLeft > 8);
    setCanScrollNext(node.scrollLeft < maxScrollLeft - 8);
  };

  const scrollCarousel = (direction: "prev" | "next") => {
    const node = carouselRef.current;

    if (!node) {
      return;
    }

    const amount = Math.max(node.clientWidth * 0.82, 260);

    node.scrollBy({
      left: direction === "next" ? amount : -amount,
      behavior: "smooth",
    });
  };

  /* ==========================================================
     ESC
  ========================================================== */

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    updateCarouselState();

    const node = carouselRef.current;

    if (!node) {
      return;
    }

    const handleScroll = () => updateCarouselState();

    node.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      node.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [open, plans.length]);

  /* ==========================================================
     BODY SCROLL LOCK
  ========================================================== */

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  /* ==========================================================
     AUTO FOCUS
  ========================================================== */

  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      modalRef.current?.focus();
    });
  }, [open]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="
            fixed
            inset-0
            z-[100]
            flex
            items-center
            justify-center
            p-3
            sm:p-5
            lg:p-8
          "
        >
          {/* ==================================================
              BACKDROP
          ================================================== */}

          <motion.button
            type="button"
            aria-label="Cerrar planes"
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
            onClick={onClose}
            className="
              absolute
              inset-0
              cursor-default
              bg-ink/70
              backdrop-blur-[5px]
            "
          />

          {/* ==================================================
              MODAL
          ================================================== */}

          <motion.div
            ref={modalRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="plans-modal-title"
            tabIndex={-1}
            initial={{
              opacity: 0,
              y: 20,
              scale: 0.98,
            }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              y: 15,
              scale: 0.985,
            }}
            transition={{
              duration: 0.35,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="
              relative
              z-10
              flex
              max-h-[92vh]
              w-full
              max-w-[1440px]
              flex-col
              overflow-hidden
              rounded-[26px]
              border
              border-primary/10
              bg-background
              shadow-[0_30px_100px_rgba(11,11,20,0.28)]
              outline-none
            "
          >
            {/* =================================================
                HEADER
            ================================================= */}

            <div
              className="
                flex
                shrink-0
                items-center
                justify-between
                gap-4
                border-b
                border-border
                bg-white/80
                px-5
                py-4
                backdrop-blur-xl
                sm:px-7
              "
            >
              <div>
                <p
                  className="
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-[0.26em]
                    text-primary
                  "
                >
                  Planes SmartPro
                </p>

                <h2
                  id="plans-modal-title"
                  className="
                    mt-1
                    text-xl
                    font-bold
                    tracking-[-0.03em]
                    text-foreground
                    sm:text-2xl
                  "
                >
                  {title}
                </h2>
              </div>

              <motion.button
                type="button"
                aria-label="Cerrar"
                onClick={onClose}
                whileHover={{
                  rotate: 5,
                  scale: 1.04,
                }}
                whileTap={{
                  scale: 0.92,
                }}
                className="
                  flex
                  h-11
                  w-11
                  shrink-0
                  items-center
                  justify-center
                  rounded-full
                  border
                  border-border
                  bg-white
                  text-muted
                  transition-all
                  duration-300
                  hover:-translate-y-0.5
                  hover:scale-[1.04]
                  hover:border-primary/40
                  hover:bg-primary/5
                  hover:text-primary
                  hover:shadow-[0_8px_20px_rgba(109,40,217,0.12)]
                "
              >
                <X size={19} strokeWidth={1.8} />
              </motion.button>
            </div>

            {/* =================================================
                BODY
            ================================================= */}

            <div
              className="
                overflow-y-auto
                overscroll-contain
                p-4
                sm:p-5
                lg:p-7
              "
            >
              {plans.length > 0 ? (
                <div className="relative">
                  <AnimatePresence>
                    {addedPlanName && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -8 }}
                        transition={{ duration: 0.22, ease: "easeOut" }}
                        className="fixed inset-0 z-30 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[2px]"
                      >
                        <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-border bg-white shadow-[0_26px_80px_rgba(16,24,40,0.18)]">
                          <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-5 pb-4 pt-5">
                            <div className="mb-3 inline-flex rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                              Plan agregado
                            </div>
                            <h3 className="text-xl font-bold tracking-[-0.04em] text-foreground">{addedPlanName}</h3>
                            <p className="mt-2 text-sm text-muted">Se añadió correctamente a tu carrito y ya puedes seguir con la contratación.</p>
                          </div>

                          <div className="flex flex-col gap-2 border-t border-border bg-slate-50 p-4 sm:flex-row sm:justify-end">
                            <button
                              type="button"
                              onClick={() => setAddedPlanName(null)}
                              className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-medium text-foreground transition-colors hover:border-slate-300 hover:bg-slate-100"
                            >
                              Seguir viendo
                            </button>

                            <Link
                              href="/checkout"
                              onClick={onClose}
                              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#4f46e5] px-4 text-sm font-semibold text-white transition-colors hover:bg-[#4338ca]"
                            >
                              Ir al carrito
                            </Link>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div
                    ref={carouselRef}
                    className="
                      flex
                      w-full
                      snap-x
                      snap-mandatory
                      gap-4
                      overflow-x-auto
                      overflow-y-visible
                      pb-3
                      pt-2
                      scroll-smooth
                      touch-pan-x
                      [-ms-overflow-style:none]
                      [scrollbar-width:none]
                      [&::-webkit-scrollbar]:hidden
                    "
                  >
                    {plans.map((plan, index) => (
                      <div
                        key={`${plan.name}-${index}`}
                        className="
                          mx-auto
                          flex
                          min-w-0
                          shrink-0
                          snap-center
                          scroll-ml-2
                          py-2
                          transition-all
                          duration-300
                          sm:scroll-ml-3
                          md:scroll-ml-1
                          w-[calc(100%-0.5rem)]
                          max-w-[360px]
                          sm:w-[72%]
                          sm:max-w-[380px]
                          md:w-[calc(50%-0.5rem)]
                          md:max-w-[360px]
                          xl:w-[calc(33.333%-0.75rem)]
                          xl:max-w-[360px]
                        "
                      >
                        <PlanCard
                          plan={plan}
                          index={index}
                          onAdded={setAddedPlanName}
                        />
                      </div>
                    ))}
                  </div>

                  {plans.length > 1 && (
                    <>
                      <motion.button
                        type="button"
                        aria-label="Ver planes anteriores"
                        onClick={() => scrollCarousel("prev")}
                        disabled={!canScrollPrev}
                        whileHover={canScrollPrev ? { scale: 1.04 } : undefined}
                        whileTap={canScrollPrev ? { scale: 0.96 } : undefined}
                        className="
                          absolute
                          left-2
                          top-1/2
                          z-10
                          hidden
                          h-11
                          w-11
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-primary/20
                          bg-white/95
                          text-primary
                          shadow-[0_8px_24px_rgba(16,16,36,0.12)]
                          backdrop-blur-md
                          transition-all
                          duration-300
                          md:flex
                        
                          disabled:cursor-not-allowed
                          disabled:opacity-40
                          disabled:shadow-none
                          
                          hover:border-primary/40
                          hover:text-primary
                        "
                        style={{ opacity: canScrollPrev ? 1 : 0.4 }}
                      >
                        <ChevronLeft size={18} strokeWidth={2.2} />
                      </motion.button>

                      <motion.button
                        type="button"
                        aria-label="Ver planes siguientes"
                        onClick={() => scrollCarousel("next")}
                        disabled={!canScrollNext}
                        whileHover={canScrollNext ? { scale: 1.04 } : undefined}
                        whileTap={canScrollNext ? { scale: 0.96 } : undefined}
                        className="
                          absolute
                          right-2
                          top-1/2
                          z-10
                          hidden
                          h-11
                          w-11
                          -translate-y-1/2
                          items-center
                          justify-center
                          rounded-full
                          border
                          border-primary/20
                          bg-white/95
                          text-primary
                          shadow-[0_8px_24px_rgba(16,16,36,0.12)]
                          backdrop-blur-md
                          transition-all
                          duration-300
                          md:flex

                          disabled:cursor-not-allowed
                          disabled:opacity-40
                          disabled:shadow-none

                          hover:border-primary/40
                          hover:text-primary
                        "
                        style={{ opacity: canScrollNext ? 1 : 0.4 }}
                      >
                        <ChevronRight size={18} strokeWidth={2.2} />
                      </motion.button>
                    </>
                  )}
                </div>
              ) : (
                <div
                  className="
                    flex
                    min-h-[300px]
                    items-center
                    justify-center
                    text-center
                  "
                >
                  <div>
                    <h3
                      className="
                        text-xl
                        font-semibold
                        text-foreground
                      "
                    >
                      Próximamente
                    </h3>

                    <p
                      className="
                        mt-2
                        text-sm
                        text-muted
                      "
                    >
                      Estamos preparando los planes para este servicio.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
