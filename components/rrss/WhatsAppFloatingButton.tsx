"use client";

import { motion } from "motion/react";
import { FaWhatsapp } from "react-icons/fa6";

const WHATSAPP_NUMBER = "56949773707";

const WHATSAPP_MESSAGE =
  "Hola SmartPro, quiero recibir más información sobre sus servicios.";

const WHATSAPP_URL = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
  WHATSAPP_MESSAGE
)}`;

export default function WhatsAppFloatingButton() {
  return (
    <motion.a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar a SmartPro por WhatsApp"
      title="Contactar por WhatsApp"
      initial={{
        opacity: 0,
        scale: 0.8,
        y: 16,
      }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
      }}
      transition={{
        duration: 0.45,
        delay: 0.6,
        ease: "easeOut",
      }}
      whileHover={{
        y: -4,
        scale: 1.06,
      }}
      whileTap={{
        scale: 0.92,
      }}
      className="
        group
        fixed
        bottom-5
        right-4
        z-[90]
        flex
        h-[54px]
        w-[54px]
        items-center
        justify-center
        rounded-full
        border
        border-white/30
        bg-[#25D366]
        text-white
        shadow-[0_12px_35px_rgba(37,211,102,0.30)]
        transition-shadow
        duration-300

        hover:
        shadow-[0_16px_42px_rgba(37,211,102,0.45)]

        sm:
        bottom-6
        sm:right-6
        sm:h-[58px]
        sm:w-[58px]

        lg:
        bottom-8
        lg:right-8
        lg:h-[62px]
        lg:w-[62px]
      "
    >
      {/* Glow exterior */}
      <span
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          rounded-full
          bg-[#25D366]
          opacity-25
          blur-xl
          transition-opacity
          duration-300
          group-hover:opacity-45
        "
      />

      {/* Pulso exterior sutil */}
      <motion.span
        aria-hidden="true"
        animate={{
          scale: [1, 1.22, 1],
          opacity: [0.22, 0, 0.22],
        }}
        transition={{
          duration: 2.6,
          repeat: Infinity,
          ease: "easeOut",
        }}
        className="
          pointer-events-none
          absolute
          inset-0
          -z-10
          rounded-full
          border
          border-[#25D366]
        "
      />

      {/* Ícono */}
      <FaWhatsapp
        className="
          relative
          z-10
          text-[27px]
          drop-shadow-sm
          transition-transform
          duration-300
          group-hover:scale-110

          sm:text-[30px]
          lg:text-[32px]
        "
      />

      {/* Notificación */}
      <span
        aria-hidden="true"
        className="
          absolute
          -right-0.5
          -top-0.5
          z-20
          flex
          h-[14px]
          w-[14px]
          items-center
          justify-center
        "
      >
        {/* Pulso rojo */}
        <span
          className="
            absolute
            inline-flex
            h-full
            w-full
            animate-ping
            rounded-full
            bg-red-500
            opacity-40
          "
        />

        {/* Punto rojo */}
        <span
          className="
            relative
            inline-flex
            h-[11px]
            w-[11px]
            rounded-full
            border-2
            border-white
            bg-red-500
            shadow-[0_2px_7px_rgba(239,68,68,0.5)]
          "
        />
      </span>
    </motion.a>
  );
}