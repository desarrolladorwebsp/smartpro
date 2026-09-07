import Link from "next/link";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronRight,
  FileText,
  FolderOpen,
  Globe,
  Mail,
  MapPin,
  NotebookPen,
  Phone,
  Sparkles,
  StickyNote,
  UserRound,
  Users,
} from "lucide-react";

import { ClientQuickActions } from "@/components/admin/ClientQuickActions";
import { requireAdminSession } from "@/lib/auth";
import { getClientById, getClientStatusLabel, getInitialContactByClientId, listClientNotes } from "@/lib/clients/repository";

const statusClasses: Record<string, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700 border border-emerald-200",
  POTENCIAL: "bg-amber-100 text-amber-700 border border-amber-200",
  INACTIVO: "bg-slate-200 text-slate-700 border border-slate-300",
};

export default async function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const client = await getClientById(id);

  if (!client) {
    return (
      <div className="space-y-5">
        <Link href="/dashboard/clientes" className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <ArrowLeft size={15} />
          Volver a clientes
        </Link>
        <div className="rounded-[24px] border border-dashed border-border bg-white p-8 text-center text-sm text-muted shadow-[0_14px_36px_rgba(16,16,36,0.04)]">
          Cliente no encontrado.
        </div>
      </div>
    );
  }

  const initialContact = await getInitialContactByClientId(client.id);
  const clientNotes = await listClientNotes(client.id);

  const summaryCards = [
    { label: "Cotizaciones", value: 3, icon: FileText },
    { label: "Notas", value: clientNotes.length, icon: StickyNote },
    { label: "Gestiones", value: 12, icon: CalendarClock },
    { label: "Documentos", value: 4, icon: FolderOpen },
  ];

  const infoItems = [
    { label: "Empresa", value: client.companyName, icon: Building2 },
    { label: "RUT", value: client.rut || "—", icon: BriefcaseBusiness },
    { label: "Contacto", value: `${client.contactFirstName} ${client.contactLastName}`.trim() || "—", icon: UserRound },
    { label: "Email", value: client.email || "—", icon: Mail },
    { label: "Teléfono", value: client.phone || "—", icon: Phone },
    { label: "Sitio web", value: client.website || "—", icon: Globe },
    { label: "Dirección", value: client.address || "—", icon: MapPin },
    { label: "Comuna", value: client.commune || "—", icon: MapPin },
    { label: "Ciudad / Región", value: [client.city, client.region].filter(Boolean).join(" / ") || "—", icon: MapPin },
    { label: "Origen", value: "Dashboard interno", icon: Sparkles },
    { label: "Estado", value: getClientStatusLabel(client.status), icon: Users },
    { label: "Ejecutivo asignado", value: "No asignado", icon: UserRound },
  ];

  const moduleCards = [
    {
      title: "Cotizaciones",
      description: "Sin cotizaciones registradas",
      icon: FileText,
      tone: "violet",
    },
    {
      title: "Notas",
      description: clientNotes.length ? `${clientNotes.length} nota${clientNotes.length === 1 ? "" : "s"} registrada${clientNotes.length === 1 ? "" : "s"}` : "Sin notas internas registradas",
      icon: NotebookPen,
      tone: "magenta",
    },
    {
      title: "Historial",
      description: initialContact
        ? `Contacto inicial registrado: ${new Date(initialContact.createdAt).toLocaleDateString("es-CL")}`
        : "Sin actividades recientes",
      icon: CalendarClock,
      tone: "slate",
    },
    {
      title: "Documentos",
      description: "No hay documentos adjuntos",
      icon: FolderOpen,
      tone: "purple",
    },
  ];

  const initials = `${client.companyName}`
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "C";

  return (
    <div className="space-y-5">
      <header className="rounded-[24px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-magenta/15 text-base font-bold text-primary ring-1 ring-primary/10">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                <span>Clientes</span>
                <ChevronRight size={12} className="text-muted" />
                <span className="text-muted">Detalle</span>
              </div>
              <h1 className="truncate text-2xl font-bold tracking-[-0.05em] text-foreground sm:text-[2rem]">
                {client.contactFirstName} {client.contactLastName}
              </h1>
              <p className="mt-1 text-sm text-muted">{client.companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start lg:self-auto">
            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusClasses[client.status] ?? statusClasses.ACTIVO}`}>
              {getClientStatusLabel(client.status)}
            </span>
            <Link
              href="/dashboard/clientes"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-white px-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
            >
              <ArrowLeft size={14} />
              Volver
            </Link>
          </div>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-[22px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(68,33,103,0.08)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted">{label}</p>
                <p className="mt-2 text-3xl font-bold tracking-[-0.06em] text-foreground">{value}</p>
              </div>
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/10 to-magenta/10 text-primary">
                <Icon size={18} />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Información</p>
              <h2 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Ficha comercial</h2>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-muted">
              <Sparkles size={12} className="text-primary" />
              CRM Interno
            </span>
          </div>

          <div className="space-y-2 lg:grid lg:grid-cols-3 lg:gap-x-5 lg:gap-y-1 lg:space-y-0">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="rounded-[20px] border border-border bg-slate-50/80 px-3 py-3 sm:rounded-[18px] lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:py-3"
              >
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  <Icon size={12} className="text-primary" />
                  {label}
                </div>
                <p className="mt-1 text-base font-semibold leading-5 text-foreground sm:text-sm">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4 rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Resumen</p>
            <h3 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Último seguimiento</h3>
          </div>

          <div className="rounded-[20px] border border-border bg-slate-50/80 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Última actualización</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {new Date(client.updatedAt).toLocaleDateString("es-CL")}
            </p>
          </div>

          <div className="rounded-[20px] border border-border bg-slate-50/80 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Creado</p>
            <p className="mt-2 text-sm font-semibold text-foreground">
              {new Date(client.createdAt).toLocaleDateString("es-CL")}
            </p>
          </div>

          <div className="rounded-[20px] border border-border bg-slate-50/80 p-3.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Ejecutivo</p>
            <p className="mt-2 text-sm font-semibold text-foreground">No asignado</p>
          </div>
        </aside>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {moduleCards.map(({ title, description, icon: Icon, tone }) => (
          <div
            key={title}
            className={[
              "rounded-[24px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)]",
              tone === "violet" && "bg-gradient-to-br from-violet-50 to-white",
              tone === "magenta" && "bg-gradient-to-br from-fuchsia-50 to-white",
              tone === "slate" && "bg-gradient-to-br from-slate-50 to-white",
              tone === "purple" && "bg-gradient-to-br from-violet-50 to-white",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-primary ring-1 ring-primary/10">
                <Icon size={17} />
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">{title}</span>
            </div>
            <p className="mt-4 text-base font-semibold text-foreground">{title}</p>
            <p className="mt-2 text-sm text-muted">{description}</p>
          </div>
        ))}
      </section>

      <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Seguimiento</p>
          <h2 className="mt-2 text-xl font-bold tracking-[-0.05em] text-foreground">Notas</h2>
        </div>

        {clientNotes.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-border bg-slate-50/80 px-4 py-5 text-sm text-muted">Aún no hay notas registradas para este cliente.</p>
        ) : (
          <div className="space-y-3">
            {clientNotes.map((note) => (
              <article key={note.id} className="rounded-[20px] border border-border bg-slate-50/80 p-4">
                <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <h3 className="text-sm font-semibold text-foreground">{note.title || "Nota sin título"}</h3>
                  <time dateTime={note.createdAt} className="shrink-0 text-xs text-muted">
                    {new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeStyle: "short" }).format(new Date(note.createdAt))}
                  </time>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-foreground">{note.content}</p>
                <p className="mt-3 text-xs font-medium text-muted">{note.executiveEmail || "Ejecutivo no identificado"}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <ClientQuickActions client={client} />
    </div>
  );
}
