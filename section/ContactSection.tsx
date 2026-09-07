"use client";

import { FormEvent, useState } from "react";
import { motion } from "motion/react";
import {
  CheckCircle2,
  Mail,
  MessageCircle,
  Send,
  AlertCircle,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaTiktok,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa6";

/* ============================================================
   CONSTANTES
============================================================ */

const CONTACT = {
  whatsapp: {
    label: "+56 9 4977 3707",
    href: "https://wa.me/56949773707",
  },
  email: {
    label: "contacto@smartpro.cl",
    href: "mailto:contacto@smartpro.cl",
  },
} as const;

/*
 * Agrega posteriormente las URLs reales de LinkedIn,
 * TikTok y YouTube cuando estén definidas.
 */
const SOCIAL_LINKS = [
  {
    label: "WhatsApp",
    href: "https://wa.me/56949773707",
    icon: FaWhatsapp,
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/smartpro.chile/",
    icon: FaInstagram,
  },
  {
    label: "LinkedIn",
    href: null,
    icon: FaLinkedinIn,
  },
  {
    label: "Facebook",
    href: "https://www.facebook.com/profile.php?id=61568563559545",
    icon: FaFacebookF,
  },
  {
    label: "TikTok",
    href: null,
    icon: FaTiktok,
  },
  {
    label: "YouTube",
    href: null,
    icon: FaYoutube,
  },
] as const;

/* ============================================================
   TYPES
============================================================ */

type FormData = {
  name: string;
  phone: string;
  email: string;
  company: string;
  message: string;
};

type FormErrors = Partial<Record<keyof FormData, string>>;

type FormStatus = "idle" | "sending" | "success" | "error";

/* ============================================================
   INITIAL STATE
============================================================ */

const INITIAL_FORM: FormData = {
  name: "",
  phone: "",
  email: "",
  company: "",
  message: "",
};

/* ============================================================
   COMPONENT
============================================================ */

export default function ContactSection() {
  const [formData, setFormData] = useState<FormData>(INITIAL_FORM);

  const [errors, setErrors] = useState<FormErrors>({});

  const [status, setStatus] = useState<FormStatus>("idle");

  /* ==========================================================
     FORM CHANGE
  ========================================================== */

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData((current) => ({
      ...current,
      [field]: value,
    }));

    /*
     * Elimina el error del campo
     * cuando el usuario comienza a corregirlo.
     */
    if (errors[field]) {
      setErrors((current) => ({
        ...current,
        [field]: undefined,
      }));
    }

    /*
     * Si hubo un error general previo,
     * lo limpiamos al volver a editar.
     */
    if (status === "error") {
      setStatus("idle");
    }
  };

  /* ==========================================================
     VALIDATION
  ========================================================== */

  const validateForm = () => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Ingresa tu nombre.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Ingresa tu teléfono o WhatsApp.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Ingresa tu correo electrónico.";
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailRegex.test(formData.email)) {
        newErrors.email = "Ingresa un correo electrónico válido.";
      }
    }

    if (!formData.message.trim()) {
      newErrors.message = "Cuéntanos brevemente sobre tu proyecto.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "El mensaje debe tener al menos 10 caracteres.";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  /* ==========================================================
     SUBMIT
  ========================================================== */

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValid = validateForm();

    if (!isValid) {
      return;
    }

    setStatus("sending");

    try {
      /*
       * ==============================================
       * CONEXIÓN BACKEND
       * ==============================================
       *
       * Cuando creemos /api/contact,
       * reemplaza el bloque temporal de abajo por:
       *
       * const response = await fetch("/api/contact", {
       *   method: "POST",
       *   headers: {
       *     "Content-Type": "application/json",
       *   },
       *   body: JSON.stringify(formData),
       * });
       *
       * if (!response.ok) {
       *   throw new Error("Error enviando formulario");
       * }
       */

      await new Promise((resolve) => window.setTimeout(resolve, 900));

      setStatus("success");
      setFormData(INITIAL_FORM);
      setErrors({});
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      id="contacto"
      className="
        relative
        isolate
        overflow-hidden
        bg-navy
        py-20
        sm:py-24
        lg:py-28
      "
    >
      {/* ======================================================
          OVERLAYS
      ====================================================== */}

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-20
          bg-navy/80
        "
      />

      <div
        aria-hidden="true"
        className="
          absolute
          inset-0
          -z-20
          bg-gradient-to-r
          from-navy
          via-navy/90
          to-navy/45
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          -left-40
          top-20
          -z-10
          h-[420px]
          w-[420px]
          rounded-full
          bg-primary/20
          blur-[150px]
        "
      />

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute
          bottom-0
          right-[15%]
          -z-10
          h-[380px]
          w-[380px]
          rounded-full
          bg-magenta/15
          blur-[150px]
        "
      />

      {/* ======================================================
          CONTENT
      ====================================================== */}

      <div
        className="
          relative
          mx-auto
          grid
          max-w-[1500px]
          gap-14
          px-5
          sm:px-6
          lg:grid-cols-[0.9fr_1.1fr]
          lg:items-center
          lg:gap-16
          lg:px-8
          xl:gap-24
        "
      >
        {/* ====================================================
            LEFT COLUMN
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: -24,
          }}
          whileInView={{
            opacity: 1,
            x: 0,
          }}
          viewport={{
            once: true,
            amount: 0.2,
          }}
          transition={{
            duration: 0.65,
            ease: "easeOut",
          }}
        >
          {/* EYEBROW */}

          <div
            className="
              mb-6
              flex
              items-center
              gap-4
            "
          >
            <span
              className="
                text-xs
                font-semibold
                uppercase
                tracking-[0.3em]
                text-magenta
                sm:text-sm
              "
            >
              Hablemos de tu proyecto
            </span>

            <span
              className="
                h-px
                w-10
                bg-gradient-to-r
                from-magenta
                to-primary
              "
            />
          </div>

          {/* TITLE */}

          <h2
            className="
              max-w-[670px]
              text-balance
              text-[42px]
              font-bold
              leading-[1.03]
              tracking-[-0.045em]
              text-white
              sm:text-5xl
              lg:text-[56px]
              xl:text-[62px]
            "
          >
            Cuéntanos tu idea
            <span className="block">y hagamos crecer</span>
            <span
              className="
                mt-1
                block
                bg-gradient-to-r
                from-primary
                via-violet-400
                to-magenta
                bg-clip-text
                text-transparent
              "
            >
              tu negocio juntos.
            </span>
          </h2>

          {/* DECORATIVE LINE */}

          <div
            className="
              my-7
              h-[2px]
              w-10
              rounded-full
              bg-gradient-to-r
              from-primary
              to-magenta
            "
          />

          {/* DESCRIPTION */}

          <p
            className="
              max-w-xl
              text-base
              leading-7
              text-white/65
              sm:text-lg
            "
          >
            Estamos listos para escuchar tu proyecto, entender tus objetivos y
            diseñar la mejor estrategia digital para alcanzarlos.
          </p>

          {/* ==================================================
              SOCIALS
          ================================================== */}

          <div className="mt-10">
            <div
              className="
                mb-5
                flex
                items-center
                gap-4
              "
            >
              <p
                className="
                  text-xs
                  font-semibold
                  uppercase
                  tracking-[0.24em]
                  text-magenta
                "
              >
                Escríbenos o síguenos
              </p>

              <span
                className="
                  h-px
                  w-10
                  bg-primary/70
                "
              />
            </div>

            <div
              className="
                flex
                flex-wrap
                gap-3
              "
            >
              {SOCIAL_LINKS.map((social, index) => (
                <SocialButton
                  key={social.label}
                  social={social}
                  index={index}
                />
              ))}
            </div>
          </div>

          {/* ==================================================
              QUICK CONTACT
          ================================================== */}

          <div
            className="
              mt-8
              grid
              gap-4
              sm:grid-cols-2
            "
          >
            <ContactCard
              href={CONTACT.whatsapp.href}
              icon={MessageCircle}
              title="WhatsApp"
              value={CONTACT.whatsapp.label}
              description="Te respondemos al instante."
              external
            />

            <ContactCard
              href={CONTACT.email.href}
              icon={Mail}
              title="Email"
              value={CONTACT.email.label}
              description="Te respondemos a la brevedad."
            />
          </div>
        </motion.div>

        {/* ====================================================
            FORM COLUMN
        ==================================================== */}

        <motion.div
          initial={{
            opacity: 0,
            x: 24,
          }}
          whileInView={{
            opacity: 1,
            x: 0,
          }}
          viewport={{
            once: true,
            amount: 0.15,
          }}
          transition={{
            duration: 0.65,
            delay: 0.08,
            ease: "easeOut",
          }}
          className="relative"
        >
          {/* FORM GLOW */}

          <div
            aria-hidden="true"
            className="
              pointer-events-none
              absolute
              -inset-6
              rounded-[40px]
              bg-primary/10
              blur-[60px]
            "
          />

          {/* CARD */}

          <div
            className="
              relative
              overflow-hidden
              rounded-[28px]
              border
              border-primary/35
              bg-navy/70
              p-6
              shadow-[0_30px_90px_rgba(0,0,0,0.28)]
              backdrop-blur-2xl
              sm:p-8
              lg:p-9
            "
          >
            {/* CARD DECORATION */}

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -right-20
                -top-20
                h-52
                w-52
                rounded-full
                bg-magenta/15
                blur-[80px]
              "
            />

            <div
              aria-hidden="true"
              className="
                pointer-events-none
                absolute
                -bottom-24
                left-1/4
                h-52
                w-52
                rounded-full
                bg-primary/20
                blur-[90px]
              "
            />

            {/* FORM HEADER */}

            <div className="relative">
              <h3
                className="
                  text-2xl
                  font-semibold
                  tracking-[-0.03em]
                  text-white
                  sm:text-[28px]
                "
              >
                Cuéntanos sobre tu proyecto
              </h3>

              <p
                className="
                  mt-2
                  text-sm
                  leading-6
                  text-white/60
                  sm:text-base
                "
              >
                Completa el formulario y nos pondremos en contacto contigo.
              </p>

              <div
                className="
                  mt-5
                  h-[2px]
                  w-10
                  rounded-full
                  bg-gradient-to-r
                  from-primary
                  to-magenta
                "
              />
            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              noValidate
              className="
                relative
                mt-7
                space-y-4
              "
            >
              {/* NAME + PHONE */}

              <div
                className="
                  grid
                  gap-4
                  sm:grid-cols-2
                "
              >
                <FormField
                  id="contact-name"
                  label="Nombre completo"
                  placeholder="Nombre completo"
                  value={formData.name}
                  error={errors.name}
                  autoComplete="name"
                  onChange={(value) => handleChange("name", value)}
                />

                <FormField
                  id="contact-phone"
                  label="Teléfono / WhatsApp"
                  placeholder="Teléfono / WhatsApp"
                  value={formData.phone}
                  error={errors.phone}
                  type="tel"
                  autoComplete="tel"
                  onChange={(value) => handleChange("phone", value)}
                />
              </div>

              {/* EMAIL */}

              <FormField
                id="contact-email"
                label="Correo electrónico"
                placeholder="Correo electrónico"
                value={formData.email}
                error={errors.email}
                type="email"
                autoComplete="email"
                onChange={(value) => handleChange("email", value)}
              />

              {/* COMPANY */}

              <FormField
                id="contact-company"
                label="Empresa"
                placeholder="Empresa"
                value={formData.company}
                error={errors.company}
                autoComplete="organization"
                onChange={(value) => handleChange("company", value)}
              />

              {/* MESSAGE */}

              <div>
                <label htmlFor="contact-message" className="sr-only">
                  Cuéntanos sobre tu proyecto
                </label>

                <div className="relative">
                  <textarea
                    id="contact-message"
                    name="message"
                    rows={5}
                    maxLength={500}
                    value={formData.message}
                    onChange={(event) =>
                      handleChange("message", event.target.value)
                    }
                    aria-invalid={Boolean(errors.message)}
                    aria-describedby={
                      errors.message ? "contact-message-error" : undefined
                    }
                    placeholder="Cuéntanos sobre tu proyecto..."
                    className={`
                      min-h-[150px]
                      w-full
                      resize-none
                      rounded-[14px]
                      border
                      bg-white/[0.035]
                      px-4
                      py-4
                      pr-16
                      text-[15px]
                      text-white
                      outline-none
                      transition-all
                      duration-300
                      placeholder:text-white/40
                      focus:bg-white/[0.055]
                      focus:ring-4
                      ${
                        errors.message
                          ? `
                            border-red-400/70
                            focus:border-red-400
                            focus:ring-red-400/10
                          `
                          : `
                            border-white/15
                            focus:border-primary/80
                            focus:ring-primary/10
                          `
                      }
                    `}
                  />

                  <span
                    className="
                      pointer-events-none
                      absolute
                      bottom-3
                      right-4
                      text-xs
                      text-white/40
                    "
                  >
                    {formData.message.length}/500
                  </span>
                </div>

                {errors.message && (
                  <FormError
                    id="contact-message-error"
                    message={errors.message}
                  />
                )}
              </div>

              {/* ==================================================
                  FORM STATUS
              ================================================== */}

              {status === "success" && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-emerald-400/20
                    bg-emerald-400/10
                    p-4
                  "
                >
                  <CheckCircle2
                    size={20}
                    className="
                      mt-0.5
                      shrink-0
                      text-emerald-400
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      ¡Mensaje enviado correctamente!
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-white/55
                      "
                    >
                      Nos pondremos en contacto contigo pronto.
                    </p>
                  </div>
                </motion.div>
              )}

              {status === "error" && (
                <motion.div
                  initial={{
                    opacity: 0,
                    y: 8,
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                  }}
                  className="
                    flex
                    items-start
                    gap-3
                    rounded-xl
                    border
                    border-red-400/20
                    bg-red-400/10
                    p-4
                  "
                >
                  <AlertCircle
                    size={20}
                    className="
                      mt-0.5
                      shrink-0
                      text-red-400
                    "
                  />

                  <div>
                    <p
                      className="
                        text-sm
                        font-semibold
                        text-white
                      "
                    >
                      No pudimos enviar tu mensaje.
                    </p>

                    <p
                      className="
                        mt-1
                        text-sm
                        text-white/55
                      "
                    >
                      Inténtalo nuevamente.
                    </p>
                  </div>
                </motion.div>
              )}

              {/* ==================================================
                  SUBMIT
              ================================================== */}

              <motion.button
                type="submit"
                disabled={status === "sending"}
                whileHover={status !== "sending" ? { y: -2 } : undefined}
                whileTap={status !== "sending" ? { scale: 0.985 } : undefined}
                className="
                  group
                  relative
                  flex
                  min-h-[56px]
                  w-full
                  items-center
                  justify-center
                  gap-3
                  overflow-hidden
                  rounded-[16px]
                  bg-gradient-to-r
                  from-primary
                  via-violet-600
                  to-magenta
                  px-6
                  text-base
                  font-semibold
                  text-white
                  shadow-[0_15px_40px_rgba(109,40,217,0.25)]
                  transition-all
                  duration-300
                  hover:shadow-[0_18px_50px_rgba(236,22,140,0.25)]
                  disabled:cursor-not-allowed
                  disabled:opacity-60
                "
              >
                {/* Shine */}

                <span
                  aria-hidden="true"
                  className="
                    absolute
                    -left-16
                    top-0
                    h-full
                    w-10
                    rotate-12
                    bg-white/20
                    blur-md
                    transition-all
                    duration-700
                    group-hover:left-[120%]
                  "
                />

                <Send
                  size={19}
                  strokeWidth={1.8}
                  className="
                    relative
                    z-10
                  "
                />

                <span className="relative z-10">
                  {status === "sending" ? "Enviando..." : "Enviar mensaje"}
                </span>
              </motion.button>
            </form>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================================================
   FORM FIELD
============================================================ */

type FormFieldProps = {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  error?: string;
  type?: "text" | "email" | "tel";
  autoComplete?: string;
  onChange: (value: string) => void;
};

function FormField({
  id,
  label,
  placeholder,
  value,
  error,
  type = "text",
  autoComplete,
  onChange,
}: FormFieldProps) {
  const errorId = `${id}-error`;

  return (
    <div>
      <label htmlFor={id} className="sr-only">
        {label}
      </label>

      <input
        id={id}
        name={id}
        type={type}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        className={`
          h-[52px]
          w-full
          rounded-[14px]
          border
          bg-white/[0.035]
          px-4
          text-[15px]
          text-white
          outline-none
          transition-all
          duration-300
          placeholder:text-white/40
          focus:bg-white/[0.055]
          focus:ring-4
          ${
            error
              ? `
                border-red-400/70
                focus:border-red-400
                focus:ring-red-400/10
              `
              : `
                border-white/15
                focus:border-primary/80
                focus:ring-primary/10
              `
          }
        `}
      />

      {error && <FormError id={errorId} message={error} />}
    </div>
  );
}

/* ============================================================
   FORM ERROR
============================================================ */

function FormError({ id, message }: { id: string; message: string }) {
  return (
    <motion.p
      id={id}
      initial={{
        opacity: 0,
        y: -3,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      className="
        mt-1.5
        text-xs
        text-red-300
      "
    >
      {message}
    </motion.p>
  );
}

/* ============================================================
   SOCIAL BUTTON
============================================================ */

type SocialItem = (typeof SOCIAL_LINKS)[number];

function SocialButton({
  social,
  index,
}: {
  social: SocialItem;
  index: number;
}) {
  const Icon = social.icon;

  /*
   * Redes cuya URL todavía
   * no ha sido definida.
   */
  if (!social.href) {
    return (
      <motion.span
        initial={{
          opacity: 0,
          scale: 0.9,
        }}
        whileInView={{
          opacity: 1,
          scale: 1,
        }}
        viewport={{ once: true }}
        transition={{
          duration: 0.35,
          delay: index * 0.04,
        }}
        aria-label={`${social.label} próximamente`}
        title={`${social.label} - próximamente`}
        className="
          flex
          h-12
          w-12
          cursor-not-allowed
          items-center
          justify-center
          rounded-full
          border
          border-white/10
          bg-white/[0.025]
          text-white/35
        "
      >
        <Icon size={19} />
      </motion.span>
    );
  }

  return (
    <motion.a
      href={social.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`SmartPro en ${social.label}`}
      initial={{
        opacity: 0,
        scale: 0.9,
      }}
      whileInView={{
        opacity: 1,
        scale: 1,
      }}
      viewport={{
        once: true,
      }}
      transition={{
        duration: 0.35,
        delay: index * 0.04,
      }}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.94,
      }}
      className="
        flex
        h-12
        w-12
        items-center
        justify-center
        rounded-full
        border
        border-magenta/40
        bg-white/[0.035]
        text-white
        backdrop-blur-sm
        transition-all
        duration-300
        hover:border-magenta
        hover:bg-primary
        hover:shadow-[0_10px_30px_rgba(109,40,217,0.30)]
      "
    >
      <Icon size={19} />
    </motion.a>
  );
}

/* ============================================================
   CONTACT CARD
============================================================ */

type ContactCardProps = {
  href: string;
  icon: typeof Mail;
  title: string;
  value: string;
  description: string;
  external?: boolean;
};

function ContactCard({
  href,
  icon: Icon,
  title,
  value,
  description,
  external = false,
}: ContactCardProps) {
  return (
    <motion.a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      whileHover={{
        y: -3,
      }}
      whileTap={{
        scale: 0.985,
      }}
      className="
        group
        flex
        min-w-0
        items-center
        gap-4
        rounded-[18px]
        border
        border-primary/35
        bg-white/[0.035]
        p-4
        backdrop-blur-md
        transition-all
        duration-300
        hover:border-magenta/60
        hover:bg-white/[0.06]
        hover:shadow-[0_12px_35px_rgba(109,40,217,0.14)]
      "
    >
      <div
        className="
          flex
          h-11
          w-11
          shrink-0
          items-center
          justify-center
          rounded-full
          border
          border-magenta/30
          bg-magenta/10
          text-magenta
          transition-all
          duration-300
          group-hover:bg-primary
          group-hover:text-white
        "
      >
        <Icon size={19} strokeWidth={1.8} />
      </div>

      <div className="min-w-0">
        <p
          className="
            text-xs
            font-medium
            text-white/55
          "
        >
          {title}
        </p>

        <p
          className="
            mt-0.5
            truncate
            text-sm
            font-semibold
            text-white
            sm:text-base
          "
        >
          {value}
        </p>

        <p
          className="
            mt-0.5
            text-xs
            text-white/40
          "
        >
          {description}
        </p>
      </div>
    </motion.a>
  );
}
