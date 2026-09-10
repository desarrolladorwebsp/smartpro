"use client";

import { motion } from "motion/react";

import { SmartImage } from "@/components/ui/SmartImage";

/* ============================================================
   TEAM DATA
============================================================ */

const TEAM_MEMBERS = [
  {
    id: 1,
    name: "Andrea Vidal",
    role: "Gerente General",
    description:
      "Estratega comercial con enfoque en automatización, captación y crecimiento digital.",
    image: "/images/team/andrea-vidal.png",
  },
  {
    id: 2,
    name: "Ariana De La Fuente",
    role: "Ejecutiva Comercial",
    description: "Encargada del Area comercial y equipos.",
    image: "/images/team/ariana-de-la-fuente.png",
  },
  {
    id: 3,
    name: "Isabel Uribe",
    role: "Office Manager",
    description: "Encargada de la administración y gestión de proyectos.",
    image: "/images/team/isabel-uribe.png",
  },
  {
    id: 4,
    name: "Juan Lorca",
    role: "Ejecutivo Comercial",
    description: "Encargado de la atención comercial y equipos.",
    image: "/images/team/juan-lorca.png",
  },
  {
    id: 5,
    name: "Alfredo Hurtado",
    role: "Desarrollador Full Stack",
    description:
      "Convierte ideas en soluciones digitales robustas, escalables y de alto rendimiento.",
    image: "/images/team/alfredo-hurtado.png",
  },
] as const;

/* ============================================================
   TEAM SECTION
============================================================ */

export default function TeamSection() {
  return (
    <section
      id="nosotros"
      className="section-shell bg-background"
    >
      {/* ======================================================
          BACKGROUND DECORATION
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          left-1/2
          top-0
          h-[420px]
          w-[900px]
          -translate-x-1/2
          rounded-full
          bg-primary/5
          blur-[120px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          right-0
          top-1/3
          h-[320px]
          w-[320px]
          rounded-full
          bg-magenta/5
          blur-[110px]
        "
      />

      <div className="section-container max-w-[1600px]">
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="section-header">
          <motion.p
            initial={{
              opacity: 0,
              y: 12,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.5,
            }}
            className="eyebrow"
          >
            Nuestro equipo
          </motion.p>

          <motion.h2
            initial={{
              opacity: 0,
              y: 16,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.3,
            }}
            transition={{
              duration: 0.55,
              delay: 0.05,
            }}
            className="section-title"
          >
            El talento detrás de cada{" "}
            <span className="text-gradient-brand">
              gran resultado.
            </span>
          </motion.h2>

          {/* Línea */}

          <motion.div
            initial={{
              opacity: 0,
              scaleX: 0,
            }}
            whileInView={{
              opacity: 1,
              scaleX: 1,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.15,
            }}
            className="accent-line"
          />

          {/* Description */}

          <motion.p
            initial={{
              opacity: 0,
              y: 10,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
            }}
            transition={{
              duration: 0.5,
              delay: 0.15,
            }}
            className="section-copy"
          >
            Somos un equipo multidisciplinario de estrategas, creativos y
            especialistas en tecnología que trabajamos para impulsar tu marca y
            alcanzar tus objetivos.
          </motion.p>
        </div>

        {/* ====================================================
            TEAM CAROUSEL
        ==================================================== */}

        <div className="mx-auto max-w-[1320px]">
          <div
            className="
              no-scrollbar
              flex
              snap-x
              snap-mandatory
              gap-4
              overflow-x-auto
              pb-2
              md:grid
              md:grid-cols-3
              md:overflow-visible
              md:pb-0
              lg:gap-5
              xl:grid-cols-5
              xl:gap-5
            "
          >
            {TEAM_MEMBERS.map((member, index) => (
              <div
                key={member.id}
                className="
                  w-[76%]
                  max-w-[270px]
                  shrink-0
                  snap-start
                  md:w-auto
                  md:max-w-none
                  md:min-w-0
                "
              >
                <TeamCard member={member} index={index} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ======================================================
          BOTTOM LINE
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          bottom-0
          left-1/2
          h-px
          w-[85%]
          -translate-x-1/2
          bg-gradient-to-r
          from-transparent
          via-primary/20
          to-transparent
        "
      />
    </section>
  );
}

/* ============================================================
   TYPES
============================================================ */

type TeamMember = (typeof TEAM_MEMBERS)[number];

type TeamCardProps = {
  member: TeamMember;
  index: number;
};

/* ============================================================
   TEAM CARD
============================================================ */

function TeamCard({ member, index }: TeamCardProps) {
  return (
    <motion.article
      initial={{
        opacity: 0,
        y: 22,
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
        duration: 0.5,
        delay: index * 0.05,
        ease: "easeOut",
      }}
      whileHover={{
        y: -3,
      }}
      className="
        group
        relative
        flex
        h-full
        w-full
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-white/5
        bg-navy
        shadow-[0_10px_28px_rgba(16,16,36,0.10)]
        transition-shadow
        duration-500
        hover:shadow-[0_22px_54px_rgba(109,40,217,0.18)]
      "
    >
      {/* ======================================================
          PHOTO
      ====================================================== */}

      <div
        className="
          relative
          aspect-[3/4]
          overflow-hidden
          bg-navy
        "
      >
        <SmartImage
          key={member.image}
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, (max-width: 1279px) 33vw, 17vw"
          containerClassName="absolute inset-0"
        />

        {/* Top overlay */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            inset-0
            bg-gradient-to-t
            from-navy
            via-navy/10
            to-transparent
          "
        />

        {/* Purple ambient light */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            -bottom-12
            left-1/2
            h-32
            w-40
            -translate-x-1/2
            rounded-full
            bg-primary/25
            blur-[65px]
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          z-10
          flex
          flex-1
          flex-col
          px-4
          pb-4
          pt-2
          sm:px-5
          sm:pb-5
        "
      >
        {/* Name */}

        <h3
          className="
            text-[18px]
            font-semibold
            tracking-[-0.025em]
            text-white
          "
        >
          {member.name}
        </h3>

        {/* Role */}

        <p
          className="
            mt-1
            text-sm
            font-medium
            text-violet-300
          "
        >
          {member.role}
        </p>

        {/* Accent line */}

        <div
          className="
            mt-3
            h-[2px]
            w-8
            rounded-full
            bg-gradient-to-r
            from-primary
            to-magenta
            transition-all
            duration-500
            group-hover:w-14
          "
        />

        {/* Description */}

        <p
          className="
            mt-3
            text-sm
            leading-6
            text-white/60
          "
        >
          {member.description}
        </p>

        {/* Decorative bottom glow */}

        <div
          aria-hidden="true"
          className="
            pointer-events-none
            absolute
            bottom-[-80px]
            left-1/2
            h-32
            w-32
            -translate-x-1/2
            rounded-full
            bg-magenta/10
            blur-[70px]
            opacity-0
            transition-opacity
            duration-500
            group-hover:opacity-100
          "
        />
      </div>
    </motion.article>
  );
}
