"use client";

import { useState } from "react";

import { motion } from "motion/react";

import { ArrowRight } from "lucide-react";

import ServicePlansModal from "./ServicePlansModal";

import type { Plan } from "./PlanCard";
import * as plansData from "@/public/js/plans";

/* ============================================================
   SERVICIOS DISPONIBLES

   Deben corresponder exactamente a los exports
   existentes dentro de public/js/planes.js
============================================================ */

export type ServicePlansKey =
  | "desarrolloWeb"
  | "campanaPublicitaria"
  | "redesSociales"
  | "produccionVisual"
  | "automatizacionBots"
  | "membresias"
  | "negocioCompleto";

/* ============================================================
   TITLES
============================================================ */

const SERVICE_TITLES: Record<ServicePlansKey, string> = {
  desarrolloWeb: "Desarrollo Web",

  campanaPublicitaria: "Campañas Publicitarias",

  redesSociales: "Redes Sociales & Contenido",

  produccionVisual: "Producción Audiovisual",

  automatizacionBots: "Automatización & Conversión",

  membresias: "Membresías",

  negocioCompleto: "Negocio Completo",
};

/* ============================================================
   TYPES
============================================================ */

type ViewServiceButtonProps = {
  service: ServicePlansKey;

  label?: string;

  className?: string;
};

/* ============================================================
   COMPONENT
============================================================ */

export default function ViewServiceButton({
  service,
  label = "Ver servicio",
  className = "",
}: ViewServiceButtonProps) {
  const [open, setOpen] = useState(false);

  const [plans, setPlans] = useState<Plan[]>([]);

  const [error, setError] = useState<string | null>(null);

  /* ==========================================================
     LOAD PLANS
  ========================================================== */

  const handleOpen = () => {
    /*
     * Si ya fueron cargados anteriormente,
     * no los volvemos a descargar.
     */

    if (plans.length > 0) {
      setOpen(true);
      return;
    }

    const selectedPlans = plansData[service];

    if (!Array.isArray(selectedPlans)) {
      setError(`No existe el grupo de planes: ${service}`);
      return;
    }

    setError(null);
    setPlans(selectedPlans);
    setOpen(true);
  };

  return (
    <>
      <motion.button
        type="button"
        onClick={handleOpen}
        whileTap={{ scale: 0.97 }}
        className={`
          group/button
          inline-flex
          min-h-11
          items-center
          justify-center
          gap-7
          rounded-full
          border
          border-primary/70
          bg-black/10
          px-5
          text-sm
          font-semibold
          text-white
          backdrop-blur-sm
          transition-all
          duration-300
          hover:border-magenta
          hover:bg-primary/20
          ${className}
        `}
      >
        {label}

        <ArrowRight
          size={16}
          strokeWidth={1.8}
          className="transition-transform duration-300 group-hover/button:translate-x-1"
        />
      </motion.button>

      {/* Error */}

      {error && (
        <p
          className="
            mt-2
            text-xs
            text-red-300
          "
        >
          {error}
        </p>
      )}

      {/* Modal */}

      <ServicePlansModal
        open={open}
        title={SERVICE_TITLES[service]}
        plans={plans}
        onClose={() => setOpen(false)}
      />
    </>
  );
}
