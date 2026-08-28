"use client";

import { createPortal } from "react-dom";
import { useEffect, useRef } from "react";

import { AnimatePresence, motion } from "motion/react";

import { X } from "lucide-react";

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

                  hover:
                  border-primary/30

                  hover:
                  text-primary
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
                sm:p-6
                lg:p-7
              "
            >
              {plans.length > 0 ? (
                <div
                  className={`
                    grid
                    items-stretch
                    gap-4
                    sm:gap-5

                    ${plans.length === 1 ? "mx-auto max-w-[440px]" : ""}

                    ${plans.length === 2 ? "md:grid-cols-2" : ""}

                    ${
                      plans.length >= 3
                        ? `
                          md:grid-cols-2
                          xl:grid-cols-3
                        `
                        : ""
                    }
                  `}
                >
                  {plans.map((plan, index) => (
                    <PlanCard
                      key={`${plan.name}-${index}`}
                      plan={plan}
                      index={index}
                    />
                  ))}
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
