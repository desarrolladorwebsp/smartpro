"use client";

import { motion, useReducedMotion } from "motion/react";
import { FaWhatsapp } from "react-icons/fa6";

const WHATSAPP_NUMBER = "56949773707";

const WHATSAPP_MESSAGE =
  "Hola SmartPro, quiero recibir más información sobre sus servicios.";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

export default function WhatsAppFloatingButton() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a SmartPro por WhatsApp"
      title="Contactar por WhatsApp"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: shouldReduceMotion ? 0 : 0.4,
        delay: shouldReduceMotion ? 0 : 0.45,
        ease: "easeOut",
      }}
      whileHover={shouldReduceMotion ? undefined : { y: -2 }}
      whileTap={shouldReduceMotion ? undefined : { scale: 0.96 }}
      className="
        group
        fixed
        bottom-4
        right-4
        z-[90]
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border
        border-white/30
        bg-[#25D366]
        text-white
        shadow-[0_12px_28px_rgba(37,211,102,0.28)]
        transition-shadow
        duration-300
        hover:shadow-[0_16px_36px_rgba(37,211,102,0.4)]
        sm:bottom-6
        sm:right-6
        sm:h-14
        sm:w-14
        lg:bottom-8
        lg:right-8
      "
    >
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          rounded-full
          bg-[#25D366]
          opacity-20
          blur-xl
          transition-opacity
          duration-300
          group-hover:opacity-35
        "
      />

      <FaWhatsapp
        className="
          relative
          z-10
          text-[26px]
          drop-shadow-sm
          transition-transform
          duration-300
          group-hover:scale-[1.04]
          sm:text-[28px]
        "
      />
    </motion.a>
  );
}
