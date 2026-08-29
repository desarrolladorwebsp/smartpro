"use client";

import Image from "next/image";
import { motion } from "motion/react";

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
    name: "Alfredo hurtado",
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
      id="equipo"
      className="
        relative
        overflow-hidden
        bg-background
        py-20
        sm:py-24
        lg:py-28
      "
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

      <div
        className="
          relative
          mx-auto
          max-w-[1600px]
          px-5
          sm:px-6
          lg:px-8
        "
      >
        {/* ====================================================
            HEADER
        ==================================================== */}

        <div className="mx-auto mb-12 max-w-4xl text-center lg:mb-14">
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
              amount: 0.5,
            }}
            transition={{
              duration: 0.5,
            }}
            className="
              mb-4
              text-xs
              font-semibold
              uppercase
              tracking-[0.34em]
              text-primary
              sm:text-sm
            "
          >
            Nuestro equipo
          </motion.p>

          <motion.h2
            initial={{
              opacity: 0,
              y: 18,
            }}
            whileInView={{
              opacity: 1,
              y: 0,
            }}
            viewport={{
              once: true,
              amount: 0.4,
            }}
            transition={{
              duration: 0.6,
              delay: 0.05,
            }}
            className="
              text-balance
              text-4xl
              font-bold
              leading-[1.05]
              tracking-[-0.04em]
              text-foreground
              sm:text-5xl
              lg:text-[58px]
            "
          >
            El talento detrás de cada{" "}
            <span
              className="
                bg-gradient-to-r
                from-primary
                via-violet-500
                to-magenta
                bg-clip-text
                text-transparent
              "
            >
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
            className="
              mx-auto
              my-6
              h-[3px]
              w-14
              origin-center
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
            "
          />

          {/* Description */}

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
            }}
            transition={{
              duration: 0.6,
              delay: 0.15,
            }}
            className="
              mx-auto
              max-w-3xl
              text-pretty
              text-base
              leading-7
              text-muted
              sm:text-lg
            "
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
              flex
              snap-x
              snap-mandatory
              gap-4
              overflow-x-auto
              pb-3
              [-ms-overflow-style:none]
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              md:overflow-visible
              md:flex-nowrap
              md:justify-start
              lg:gap-5
              xl:gap-6
            "
          >
            {TEAM_MEMBERS.map((member, index) => (
              <div
                key={member.id}
                className="
                  shrink-0
                  snap-start
                  w-[78%]
                  max-w-[290px]
                  sm:w-[46%]
                  sm:max-w-[300px]
                  md:w-[calc(20%-0.8rem)]
                  md:min-w-[220px]
                  md:max-w-[260px]
                  lg:w-[calc(20%-0.8rem)]
                  xl:w-[calc(20%-0.8rem)]
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
        y: -4,
      }}
      className="
        group
        relative
        flex
        h-full
        min-h-[500px]
        w-full
        flex-col
        overflow-hidden
        rounded-[22px]
        border
        border-white/5
        bg-navy
        shadow-[0_10px_28px_rgba(16,16,36,0.10)]
        transition-all
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
          aspect-[4/5]
          overflow-hidden
          bg-navy
        "
      >
        <Image
          src={member.image}
          alt={`${member.name} - ${member.role}`}
          fill
          className="
            object-cover
            object-center
            transition-transform
            duration-700
            ease-out
            group-hover:scale-[1.03]
          "
          sizes="
            (max-width: 639px) 100vw,
            (max-width: 1023px) 50vw,
            (max-width: 1279px) 33vw,
            17vw
          "
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
          pb-5
          pt-2
          sm:px-5
          sm:pb-6
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
            mt-4
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
            mt-4
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
