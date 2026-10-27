"use client";

import { useRef, useState, type FormEvent } from "react";
import { ArrowDown, ArrowUpRight, Check, Clock3, FileCheck2, MessageCircle } from "lucide-react";
import { tariffConditions, tariffGroups } from "@/lib/tarifario";

const services = tariffGroups.flatMap((group) => group.services);
const formatUf = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const fieldClass = "mt-2 min-h-12 w-full rounded-xl border border-border bg-white px-4 py-3 text-base text-foreground focus:border-primary";

export default function TariffExperience() {
  const [selectedService, setSelectedService] = useState("");
  const [summary, setSummary] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const serviceSelect = useRef<HTMLSelectElement>(null);
  const summaryRef = useRef<HTMLTextAreaElement>(null);

  function selectService(name: string) {
    setSelectedService(name);
    setSummary("");
    setCopyStatus("");
    serviceSelect.current?.focus({ preventScroll: true });
  }

  function prepareRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setSummary([
      "Hola SmartPro, quiero solicitar una cotización formal.",
      `Servicio: ${selectedService || "Necesito asesoría"}`,
      `Nombre: ${String(form.get("name") ?? "").trim()}`,
      `Correo: ${String(form.get("email") ?? "").trim()}`,
      `Teléfono: ${String(form.get("phone") ?? "").trim()}`,
      form.get("company") ? `Empresa: ${String(form.get("company")).trim()}` : "",
      `Solicitud: ${String(form.get("message") ?? "").trim()}`,
    ].filter(Boolean).join("\n"));
    setCopyStatus("");
  }

  async function copyRequest() {
    try {
      await navigator.clipboard.writeText(summary);
      setCopyStatus("Solicitud copiada. Pégala y envíala al ejecutivo por WhatsApp o correo.");
    } catch {
      summaryRef.current?.focus();
      summaryRef.current?.select();
      setCopyStatus("Seleccionamos tu solicitud para que puedas copiarla manualmente.");
    }
  }

  return <>
    <header className="relative overflow-hidden px-5 pb-12 sm:px-8 sm:pb-16">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-0 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative mx-auto max-w-6xl">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">Tarifario SmartPro</p>
        <h1 className="mt-5 max-w-4xl text-4xl font-bold leading-[1.08] tracking-[-0.05em] text-navy sm:text-6xl">Tu sitio puede<br /><span className="bg-brand-gradient bg-clip-text text-transparent">seguir creciendo.</span></h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">Modificaciones, nuevas secciones e integraciones para dar el siguiente paso. Encuentra el servicio que necesitas y solicita tu cotización.</p>
        <a href="#contenido" className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-white transition-colors hover:bg-primary-hover">Explorar servicios <ArrowDown size={17} aria-hidden="true" /></a>
        <div className="mt-10 flex max-w-3xl items-start gap-4 rounded-2xl border border-primary/20 bg-white p-5 sm:p-6">
          <FileCheck2 className="mt-0.5 shrink-0 text-primary" size={24} aria-hidden="true" />
          <div><h2 className="font-bold text-navy">Precios sujetos a cotización formal</h2><p className="mt-2 text-sm leading-6 text-muted">Todos los precios son referenciales, en UF netas + IVA, y deben ser confirmados con un ejecutivo mediante una cotización formal. El alcance y el plazo final se acuerdan antes de comenzar.</p></div>
        </div>
        <nav aria-label="Categorías del tarifario" className="mt-8 flex flex-wrap gap-2">{tariffGroups.map((group) => <a key={group.id} href={`#${group.id}`} className="inline-flex min-h-11 items-center rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-navy transition-colors hover:border-primary hover:text-primary">{group.title}</a>)}</nav>
      </div>
    </header>

    <div className="mx-auto max-w-6xl space-y-16 px-5 pb-16 sm:px-8 sm:pb-24">
      {tariffGroups.map((group, index) => <section key={group.id} id={group.id} aria-labelledby={`${group.id}-title`} className="scroll-mt-28">
        <div className="mb-6 flex items-start gap-4"><span aria-hidden="true" className="mt-1 font-mono text-sm text-primary">0{index + 1}</span><div><h2 id={`${group.id}-title`} className="text-2xl font-bold tracking-tight text-navy sm:text-3xl">{group.title}</h2><p className="mt-2 leading-7 text-muted">{group.description}</p></div></div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">{group.services.map(([name, price, delivery, scope, note, from]) => <article key={name} className="flex min-w-0 flex-col rounded-2xl border border-border bg-white p-6 transition-shadow hover:shadow-lg hover:shadow-primary/5">
          <h3 className="text-lg font-bold leading-6 text-navy">{name}</h3>
          <p className="mt-4 text-sm leading-6 text-muted">{scope}</p>
          {note ? <p className="mt-3 text-xs leading-5 text-muted">{note}</p> : null}
          <div className="mt-auto pt-7"><p className="text-xs font-medium text-muted">{from ? "Desde" : "Precio referencial"}</p><p className="mt-1 text-3xl font-bold tracking-tight text-primary">{formatUf.format(price)} <span className="text-xl">UF</span><span className="ml-2 text-xs font-medium tracking-normal text-muted">+ IVA</span></p>
            <p className="mt-3 flex items-center gap-2 text-xs text-muted"><Clock3 size={15} aria-hidden="true" />Entrega estimada: {delivery}</p>
            <a href="#contacto" onClick={() => selectService(name)} aria-label={`Solicitar cotización de ${name}`} className="mt-6 flex min-h-12 items-center justify-between gap-2 rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm font-semibold text-primary transition-colors hover:bg-primary hover:text-white">Solicitar cotización <ArrowUpRight size={17} aria-hidden="true" /></a>
          </div>
        </article>)}</div>
      </section>)}

      <section aria-labelledby="condiciones-title" className="rounded-3xl border border-border bg-white p-6 sm:p-9">
        <h2 id="condiciones-title" className="text-2xl font-bold tracking-tight text-navy">Antes de solicitar tu modificación</h2>
        <div className="mt-7 grid gap-7 sm:grid-cols-2">{tariffConditions.map(([title, text]) => <div key={title} className="flex gap-3"><Check size={19} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" /><div><h3 className="text-sm font-bold text-navy">{title}</h3><p className="mt-2 text-sm leading-6 text-muted">{text}</p></div></div>)}</div>
      </section>
    </div>

    <section id="contacto" aria-labelledby="tariff-contact-title" className="scroll-mt-24 bg-navy px-5 py-14 text-white sm:px-8 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div><p className="text-xs font-bold uppercase tracking-[0.2em] text-violet-300">Hablemos de tu proyecto</p><h2 id="tariff-contact-title" className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">Confirma tu servicio<br />con un ejecutivo.</h2><p className="mt-5 leading-7 text-white/75">Cuéntanos qué necesitas para preparar una cotización formal.</p><p className="mt-6 text-sm leading-6 text-white/75">Completa el formulario para preparar tu solicitud. Podrás revisar y copiar el resumen, y enviarlo al ejecutivo por WhatsApp o correo.</p><a href="mailto:contacto@smartpro.cl" className="mt-6 inline-flex min-h-11 items-center text-sm font-semibold text-violet-300 underline underline-offset-4">contacto@smartpro.cl</a></div>
        <div className="min-w-0">
          <form onSubmit={prepareRequest} onChange={() => { setSummary(""); setCopyStatus(""); }} className="grid gap-5 sm:grid-cols-2">
            <label className="text-sm font-medium">Nombre completo<input className={fieldClass} name="name" autoComplete="name" maxLength={100} required /></label>
            <label className="text-sm font-medium">Teléfono / WhatsApp<input className={fieldClass} name="phone" type="tel" autoComplete="tel" maxLength={30} required /></label>
            <label className="text-sm font-medium">Correo electrónico<input className={fieldClass} name="email" type="email" autoComplete="email" maxLength={150} required /></label>
            <label className="text-sm font-medium">Empresa <span className="font-normal text-white/60">(opcional)</span><input className={fieldClass} name="company" autoComplete="organization" maxLength={120} /></label>
            <label className="text-sm font-medium sm:col-span-2">Servicio a cotizar<select ref={serviceSelect} className={fieldClass} value={selectedService} onChange={(event) => setSelectedService(event.target.value)}><option value="">Necesito asesoría para elegir</option>{services.map(([name]) => <option key={name} value={name}>{name}</option>)}</select></label>
            <label className="text-sm font-medium sm:col-span-2">Cuéntanos qué deseas agregar o modificar<textarea className={`${fieldClass} min-h-32 resize-y`} name="message" rows={4} maxLength={1000} minLength={10} required /></label>
            <p className="text-xs leading-5 text-white/65 sm:col-span-2">El formulario prepara un resumen; no envía tus datos automáticamente. Consulta nuestra <a href="/politica-privacidad" className="underline underline-offset-2">política de privacidad</a>.</p>
            <button type="submit" className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 font-semibold text-white sm:col-span-2">Preparar solicitud <ArrowUpRight size={18} aria-hidden="true" /></button>
          </form>
          {summary ? <div className="mt-6 rounded-2xl border border-white/20 p-5"><label htmlFor="tariff-summary" className="text-sm font-semibold">Resumen de tu solicitud</label><textarea id="tariff-summary" ref={summaryRef} className={`${fieldClass} min-h-56`} value={summary} readOnly rows={8} /><p className="mt-3 text-sm leading-6 text-white/75">Copia este resumen y envíalo al ejecutivo para solicitar tu cotización formal.</p><div className="mt-4 flex flex-wrap gap-3"><button type="button" onClick={copyRequest} className="min-h-11 rounded-xl bg-white px-4 py-3 text-sm font-bold text-navy">Copiar solicitud</button><a href="https://wa.me/56949773707" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/30 px-4 py-3 text-sm font-semibold">Abrir WhatsApp <MessageCircle size={17} aria-hidden="true" /></a></div><p role="status" className="mt-3 text-sm text-violet-200">{copyStatus || "Resumen preparado. Aún no se ha enviado."}</p></div> : null}
        </div>
      </div>
    </section>
  </>;
}
