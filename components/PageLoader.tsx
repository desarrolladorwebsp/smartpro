"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState } from "react";

const SHAPES = [
  { id: "s1", x: -110, y: -70, size: 14, delay: 0 },
  { id: "s2", x: 98, y: -60, size: 18, delay: 0.18 },
  { id: "s3", x: -120, y: 80, size: 16, delay: 0.28 },
  { id: "s4", x: 108, y: 82, size: 12, delay: 0.1 },
  { id: "s5", x: 0, y: -118, size: 10, delay: 0.05 },
  { id: "s6", x: 0, y: 118, size: 10, delay: 0.2 },
] as const;

// Debe coincidir con la primera imagen del Hero (recurso crítico above-the-fold).
const CRITICAL_IMAGE_SRC = "/images/hero/hero-01.webp";
const MIN_VISIBLE_MS = 1100;
const MAX_WAIT_MS = 2200;

export default function PageLoader() {
  const [isVisible, setIsVisible] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const startedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    startedAtRef.current = window.performance.now();

    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const updatePreference = () => setReducedMotion(mediaQuery.matches);
    updatePreference();

    mediaQuery.addEventListener("change", updatePreference);

    let cancelled = false;

    // Recurso real: la imagen crítica del Hero (no espera al resto de la página).
    const criticalImageReady = new Promise<void>((resolve) => {
      const img = new window.Image();
      img.onload = () => resolve();
      img.onerror = () => resolve();
      img.src = CRITICAL_IMAGE_SRC;
      if (img.complete) resolve();
    });

    const fontsReady = document.fonts?.ready ?? Promise.resolve();

    // Seguridad: nunca dejar el loader bloqueado si un recurso tarda demasiado.
    const safetyTimeout = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MAX_WAIT_MS);
    });

    Promise.race([
      Promise.all([criticalImageReady, fontsReady]),
      safetyTimeout,
    ]).then(() => {
      if (cancelled) return;

      const elapsed = startedAtRef.current
        ? window.performance.now() - startedAtRef.current
        : 0;
      const remaining = Math.max(0, MIN_VISIBLE_MS - elapsed);

      window.setTimeout(() => {
        requestAnimationFrame(() => {
          if (!cancelled) setIsVisible(false);
        });
      }, remaining);
    });

    return () => {
      cancelled = true;
      mediaQuery.removeEventListener("change", updatePreference);
    };
  }, []);

  const shapes = useMemo(() => SHAPES, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 1, scale: 1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02, y: -8 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.42, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden bg-[#0b0b14]"
          aria-live="polite"
          aria-busy="true"
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(109,40,217,0.14),_transparent_45%,_rgba(11,11,20,0.96)_88%)]" aria-hidden="true" />

          <div className="relative flex h-44 w-44 items-center justify-center sm:h-52 sm:w-52" aria-hidden="true">
            {!reducedMotion &&
              shapes.map(({ id, x, y, size, delay }) => (
                <motion.span
                  key={id}
                  className="absolute rounded-full border border-white/20 bg-white/5"
                  style={{
                    width: size,
                    height: size,
                    left: `calc(50% + ${x}px)`,
                    top: `calc(50% + ${y}px)`,
                    boxShadow:
                      id === "s1" || id === "s2" ? "0 0 0 1px rgba(255,255,255,0.1)" : undefined,
                  }}
                  animate={
                    reducedMotion
                      ? undefined
                      : {
                          x: [0, 6, -6, 0],
                          y: [0, -8, 8, 0],
                          opacity: [0.6, 1, 0.7, 0.6],
                          rotate: [0, 180, 360],
                        }
                  }
                  transition={{
                    duration: 2.6,
                    ease: "easeInOut",
                    repeat: Number.POSITIVE_INFINITY,
                    delay,
                  }}
                />
              ))}

            <motion.div
              animate={
                reducedMotion
                  ? undefined
                  : {
                      scale: [1, 1.06, 1],
                      rotate: [0, 4, -4, 0],
                    }
              }
              transition={{
                duration: 2.8,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
              }}
              className="relative z-10 flex h-20 w-20 items-center justify-center rounded-[22px] border border-white/15 bg-white/5 shadow-[0_16px_40px_rgba(109,40,217,0.18)] backdrop-blur-sm sm:h-24 sm:w-24"
            >
              <Image
                src="/images/logo/logo-smartpro-02.png"
                alt="SmartPro"
                width={72}
                height={72}
                priority
                className="h-auto w-[54px] object-contain sm:w-[60px]"
              />
            </motion.div>
          </div>

          {!reducedMotion && (
            <motion.div
              className="absolute inset-x-0 bottom-10 flex justify-center"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
            >
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.34em] text-white/55">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                <span>SmartPro</span>
                <span className="h-1.5 w-1.5 rounded-full bg-magenta" />
              </div>
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
