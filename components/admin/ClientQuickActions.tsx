"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, CirclePlus, Pencil, StickyNote, X, ZoomIn } from "lucide-react";

import { CLIENT_ORIGINS, QUOTE_MOTIVES, type ClientOrigin, type QuoteMotive } from "@/lib/clients/contact-options";
import type { ClientRecord } from "@/lib/clients/types";

type ContactForm = {
  origin: ClientOrigin | "";
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  companyName: string;
  website: string;
  socialMedia: string;
  quoteMotive: QuoteMotive | "";
  observation: string;
};

type ContactField = keyof ContactForm;

type NoteForm = {
  title: string;
  content: string;
};

function buildForm(client: ClientRecord): ContactForm {
  return {
    origin: "",
    firstName: client.contactFirstName,
    lastName: client.contactLastName,
    phone: client.phone,
    email: client.email,
    companyName: client.companyName,
    website: client.website,
    socialMedia: "",
    quoteMotive: "",
    observation: "",
  };
}

export function ClientQuickActions({ client }: { client: ClientRecord }) {
  const router = useRouter();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const noteOpenButtonRef = useRef<HTMLButtonElement>(null);
  const noteCloseButtonRef = useRef<HTMLButtonElement>(null);
  const isSavingNoteRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isNoteOpen, setIsNoteOpen] = useState(false);
  const [form, setForm] = useState<ContactForm>(() => buildForm(client));
  const [noteForm, setNoteForm] = useState<NoteForm>({ title: "", content: "" });
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [noteError, setNoteError] = useState("");
  const [noteSubmitError, setNoteSubmitError] = useState("");
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = openButtonRef.current;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSubmitting) {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isOpen, isSubmitting]);

  useEffect(() => {
    if (!isNoteOpen) return;

    const previousOverflow = document.body.style.overflow;
    const trigger = noteOpenButtonRef.current;
    document.body.style.overflow = "hidden";
    noteCloseButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSavingNote) {
        setIsNoteOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      trigger?.focus();
    };
  }, [isNoteOpen, isSavingNote]);

  function openModal() {
    setForm(buildForm(client));
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setIsOpen(true);
  }

  function updateField(field: ContactField, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
  }

  function openNoteModal() {
    setNoteForm({ title: "", content: "" });
    setNoteError("");
    setNoteSubmitError("");
    setIsNoteOpen(true);
  }

  function updateNoteField(field: keyof NoteForm, value: string) {
    setNoteForm((current) => ({ ...current, [field]: value }));
    if (field === "content") setNoteError("");
    setNoteSubmitError("");
  }

  function validate(): boolean {
    const nextErrors: Partial<Record<ContactField, string>> = {};

    if (!form.origin) nextErrors.origin = "Selecciona el origen del cliente.";
    if (!form.firstName.trim()) nextErrors.firstName = "El nombre es obligatorio.";
    if (!form.lastName.trim()) nextErrors.lastName = "El apellido es obligatorio.";
    if (!form.companyName.trim()) nextErrors.companyName = "El nombre de la empresa es obligatorio.";
    if (!form.quoteMotive) nextErrors.quoteMotive = "Selecciona el motivo de cotización.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Ingresa un correo válido.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!validate() || isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`/api/clients/${client.id}/initial-contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo registrar el contacto inicial.");
        return;
      }

      setSuccessMessage("Contacto inicial registrado correctamente.");
      setIsOpen(false);
      router.refresh();
    } catch {
      setSubmitError("No se pudo registrar el contacto inicial.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleNoteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = noteForm.content.trim();

    if (!content) {
      setNoteError("El contenido de la nota es obligatorio.");
      return;
    }

    if (isSavingNoteRef.current) return;
    isSavingNoteRef.current = true;
    setIsSavingNote(true);
    setNoteSubmitError("");

    try {
      const response = await fetch(`/api/clients/${client.id}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: noteForm.title.trim(), content }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setNoteSubmitError(data.error ?? "No se pudo guardar la nota.");
        return;
      }

      setSuccessMessage("Nota registrada correctamente.");
      setIsNoteOpen(false);
      router.refresh();
    } catch {
      setNoteSubmitError("No se pudo guardar la nota.");
    } finally {
      isSavingNoteRef.current = false;
      setIsSavingNote(false);
    }
  }

  const otherActions = [
    { label: "Editar", icon: Pencil },
    { label: "Recordatorio", icon: BellRing },
    { label: "Zoom", icon: ZoomIn },
    { label: "Nota", icon: StickyNote },
  ];

  return (
    <>
      <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Acciones</p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Acciones rápidas</h3>
        </div>

        {successMessage && (
          <p className="mb-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700" role="status">
            {successMessage}
          </p>
        )}

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <button
            ref={openButtonRef}
            type="button"
            onClick={openModal}
            className="group flex items-center gap-3 rounded-[20px] border border-primary/20 bg-gradient-to-r from-primary/5 to-magenta/5 p-3 text-left transition hover:border-primary/40 hover:shadow-[0_10px_24px_rgba(109,40,217,0.12)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-magenta text-white">
              <CirclePlus size={17} />
            </span>
            <span className="text-sm font-semibold text-foreground">Contacto inicial</span>
          </button>

          {otherActions.map(({ label, icon: Icon }) => (
            <button
              key={label}
              type="button"
              ref={label === "Nota" ? noteOpenButtonRef : undefined}
              onClick={label === "Nota" ? openNoteModal : undefined}
              className="group flex items-center gap-3 rounded-[20px] border border-border bg-slate-50/80 p-3 text-left transition hover:border-primary/30 hover:bg-gradient-to-r hover:from-primary/5 hover:to-magenta/5 hover:shadow-[0_10px_24px_rgba(109,40,217,0.10)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-magenta/10 text-primary transition group-hover:from-primary group-hover:to-magenta group-hover:text-white">
                <Icon size={17} />
              </span>
              <span className="text-sm font-semibold text-foreground">{label}</span>
            </button>
          ))}
        </div>
      </section>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="initial-contact-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto rounded-[26px] border border-border bg-white p-5 shadow-[0_24px_64px_rgba(16,16,36,0.20)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Gestión comercial</p>
                <h2 id="initial-contact-title" className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">
                  Registrar contacto inicial
                </h2>
                <p className="mt-2 max-w-xl text-sm text-muted">
                  Registra los datos básicos obtenidos durante el primer contacto comercial con este cliente.
                </p>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isSubmitting}
                aria-label="Cerrar modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/30 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleSubmit} noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Origen" error={errors.origin} required>
                  <select value={form.origin} onChange={(event) => updateField("origin", event.target.value)} className="dashboard-field">
                    <option value="">Selecciona un origen</option>
                    {CLIENT_ORIGINS.map((origin) => <option key={origin} value={origin}>{origin}</option>)}
                  </select>
                </Field>
                <Field label="Motivo de la cotización" error={errors.quoteMotive} required>
                  <select value={form.quoteMotive} onChange={(event) => updateField("quoteMotive", event.target.value)} className="dashboard-field">
                    <option value="">Selecciona un motivo</option>
                    {QUOTE_MOTIVES.map((motive) => <option key={motive} value={motive}>{motive}</option>)}
                  </select>
                </Field>
                <Field label="Nombre" error={errors.firstName} required>
                  <input value={form.firstName} onChange={(event) => updateField("firstName", event.target.value)} className="dashboard-field" />
                </Field>
                <Field label="Apellido" error={errors.lastName} required>
                  <input value={form.lastName} onChange={(event) => updateField("lastName", event.target.value)} className="dashboard-field" />
                </Field>
                <Field label="Teléfono de contacto" error={errors.phone}>
                  <input value={form.phone} onChange={(event) => updateField("phone", event.target.value)} className="dashboard-field" />
                </Field>
                <Field label="Correo electrónico" error={errors.email}>
                  <input type="email" value={form.email} onChange={(event) => updateField("email", event.target.value)} className="dashboard-field" />
                </Field>
                <Field label="Nombre de la empresa" error={errors.companyName} required>
                  <input value={form.companyName} onChange={(event) => updateField("companyName", event.target.value)} className="dashboard-field" />
                </Field>
                <Field label="Dominio / sitio web" error={errors.website}>
                  <input value={form.website} onChange={(event) => updateField("website", event.target.value)} className="dashboard-field" placeholder="www.empresa.cl" />
                </Field>
                <Field label="Red social" error={errors.socialMedia}>
                  <input value={form.socialMedia} onChange={(event) => updateField("socialMedia", event.target.value)} className="dashboard-field" placeholder="LinkedIn, Instagram..." />
                </Field>
                <Field label="Nota" error={errors.observation} className="md:col-span-2">
                  <textarea value={form.observation} onChange={(event) => updateField("observation", event.target.value)} className="dashboard-field min-h-24 resize-y" placeholder="El cliente necesita renovar su sitio web y solicita una propuesta esta semana." />
                </Field>
              </div>

              {submitError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</p>}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsOpen(false)} disabled={isSubmitting} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)] transition hover:shadow-[0_14px_28px_rgba(109,40,217,0.25)] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSubmitting ? "Registrando..." : "Registrar contacto"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="client-note-title"
            className="max-h-[calc(100vh-2rem)] w-full max-w-xl overflow-y-auto rounded-[26px] border border-border bg-white p-5 shadow-[0_24px_64px_rgba(16,16,36,0.20)] sm:p-6"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Seguimiento comercial</p>
                <h2 id="client-note-title" className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">Nueva nota</h2>
                <p className="mt-2 text-sm text-muted">La fecha, hora y ejecutivo se registran automáticamente.</p>
              </div>
              <button
                ref={noteCloseButtonRef}
                type="button"
                onClick={() => setIsNoteOpen(false)}
                disabled={isSavingNote}
                aria-label="Cerrar modal"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/30 hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50"
              >
                <X size={18} />
              </button>
            </div>

            <form className="mt-5 space-y-5" onSubmit={handleNoteSubmit} noValidate>
              <Field label="Título">
                <input
                  value={noteForm.title}
                  onChange={(event) => updateNoteField("title", event.target.value)}
                  className="dashboard-field"
                  placeholder="Ej. Seguimiento de propuesta"
                />
              </Field>
              <Field label="Contenido" error={noteError} required>
                <textarea
                  value={noteForm.content}
                  onChange={(event) => updateNoteField("content", event.target.value)}
                  className="dashboard-field min-h-32 resize-y"
                  placeholder="Escribe la nota del cliente..."
                  autoFocus
                />
              </Field>

              {noteSubmitError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{noteSubmitError}</p>}

              <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setIsNoteOpen(false)} disabled={isSavingNote} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold text-foreground transition hover:border-primary/30 disabled:opacity-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSavingNote} className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(109,40,217,0.18)] transition hover:shadow-[0_14px_28px_rgba(109,40,217,0.25)] disabled:cursor-not-allowed disabled:opacity-60">
                  {isSavingNote ? "Guardando..." : "Guardar nota"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, error, required, className = "", children }: { label: string; error?: string; required?: boolean; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}{required && <span className="ml-1 text-magenta" aria-hidden="true">*</span>}
      </span>
      {children}
      {error && <span className="mt-1.5 block text-xs font-medium text-red-600">{error}</span>}
    </label>
  );
}
