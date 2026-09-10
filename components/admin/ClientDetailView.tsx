"use client";

import Link from "next/link";
import { useCallback, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  BriefcaseBusiness,
  Building2,
  CalendarClock,
  ChevronRight,
  Globe,
  Mail,
  MapPin,
  Phone,
  UserRound,
  UserRoundPlus,
  X,
  type LucideIcon,
} from "lucide-react";

import { ClientQuickActions } from "@/components/admin/ClientQuickActions";
import { DashboardSuccessToast } from "@/components/admin/DashboardSuccessToast";
import { QuoteCreateModal } from "@/components/admin/QuoteCreateModal";
import type { ClientNoteRecord } from "@/lib/clients/repository";
import {
  CLIENT_COMMERCIAL_STATUSES,
  getAssignedExecutiveName,
  getClientCommercialStatusLabel,
  type ClientCommercialStatus,
  type ClientRecord,
} from "@/lib/clients/types";
import { getExecutiveDisplayName, type ExecutiveRecord } from "@/lib/executives/types";
import { formatCurrency } from "@/lib/orders/service";
import { getQuoteStatusLabel, type QuoteRecord, type QuoteStatus } from "@/lib/quotes/types";

const commercialStatusStyles: Record<ClientCommercialStatus, string> = {
  PROSPECTO: "bg-sky-100 text-sky-800 border-sky-200",
  EN_SEGUIMIENTO: "bg-amber-100 text-amber-800 border-amber-200",
  CERRADO_PERDIDO: "bg-rose-100 text-rose-800 border-rose-200",
};

const quoteStatusStyles: Record<QuoteStatus, string> = {
  DRAFT: "bg-slate-200 text-slate-700",
  CREATED: "bg-sky-100 text-sky-700",
  SENT: "bg-violet-100 text-violet-700",
  ACCEPTED: "bg-emerald-100 text-emerald-700",
  REJECTED: "bg-rose-100 text-rose-700",
};

type ClientDetailViewProps = {
  initialClient: ClientRecord;
  executives: ExecutiveRecord[];
  initialQuotes: QuoteRecord[];
  notes: ClientNoteRecord[];
};

function formatDate(value: string | null): string {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CL", { day: "2-digit", month: "2-digit", year: "numeric" }).format(date);
}

export function ClientDetailView({ initialClient, executives, initialQuotes, notes }: ClientDetailViewProps) {
  const [client, setClient] = useState(initialClient);
  const [quotes, setQuotes] = useState(initialQuotes);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [statusError, setStatusError] = useState("");
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const isSavingStatusRef = useRef(false);
  const dismissSuccess = useCallback(() => setSuccessMessage(""), []);

  const initials = useMemo(() => {
    return client.companyName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "C";
  }, [client.companyName]);

  const interest = [client.interestServiceName, client.interestSubcategoryName, client.interestPlanName]
    .filter(Boolean)
    .join(" / ") || "—";

  const infoItems: Array<{ label: string; value: string; icon: LucideIcon }> = [
    { label: "Empresa", value: client.companyName, icon: Building2 },
    { label: "RUT", value: client.rut || "—", icon: BriefcaseBusiness },
    { label: "Contacto", value: `${client.contactFirstName} ${client.contactLastName}`.trim() || "—", icon: UserRound },
    { label: "Email", value: client.email || "—", icon: Mail },
    { label: "Teléfono", value: client.phone || "—", icon: Phone },
    { label: "Sitio web", value: client.website || "—", icon: Globe },
    { label: "Interés", value: interest, icon: BriefcaseBusiness },
    ...(client.address ? [{ label: "Dirección", value: client.address, icon: MapPin }] : []),
    ...(client.commune ? [{ label: "Comuna", value: client.commune, icon: MapPin }] : []),
    ...([client.city, client.region].filter(Boolean).length
      ? [{ label: "Ciudad / Región", value: [client.city, client.region].filter(Boolean).join(" / "), icon: MapPin }]
      : []),
  ];

  async function handleCommercialStatusChange(nextStatus: ClientCommercialStatus) {
    if (isSavingStatusRef.current || nextStatus === client.commercialStatus) return;

    const previous = client;
    isSavingStatusRef.current = true;
    setIsSavingStatus(true);
    setStatusError("");
    setClient((current) => ({ ...current, commercialStatus: nextStatus }));

    try {
      const response = await fetch(`/api/clients/${client.id}/commercial-status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ commercialStatus: nextStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as { client?: ClientRecord; error?: string };

      if (!response.ok || !data.client) {
        setClient(previous);
        setStatusError(data.error ?? "No se pudo actualizar el estado comercial.");
        return;
      }

      setClient(data.client);
      setSuccessMessage(`Estado comercial actualizado a ${getClientCommercialStatusLabel(data.client.commercialStatus)}.`);
    } catch {
      setClient(previous);
      setStatusError("No se pudo actualizar el estado comercial.");
    } finally {
      isSavingStatusRef.current = false;
      setIsSavingStatus(false);
    }
  }

  return (
    <div className="space-y-5">
      <header className="rounded-[24px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 to-magenta/15 text-base font-bold text-primary ring-1 ring-primary/10">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
                <span>Clientes</span>
                <ChevronRight size={12} className="text-muted" />
                <span className="text-muted">Detalle</span>
              </div>
              <h1 className="truncate text-2xl font-bold tracking-[-0.05em] text-foreground sm:text-[1.85rem]">
                {client.contactFirstName} {client.contactLastName}
              </h1>
              <p className="mt-1 truncate text-sm text-muted">{client.companyName}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="flex min-w-[220px] flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Estado comercial</span>
              <select
                value={client.commercialStatus}
                disabled={isSavingStatus}
                onChange={(event) => void handleCommercialStatusChange(event.target.value as ClientCommercialStatus)}
                className={`dashboard-field h-10 py-0 text-sm font-semibold ${commercialStatusStyles[client.commercialStatus]}`}
                aria-label="Estado comercial"
              >
                {CLIENT_COMMERCIAL_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {getClientCommercialStatusLabel(status)}
                  </option>
                ))}
              </select>
            </label>
            <Link
              href="/dashboard/clientes"
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-border bg-white px-3.5 text-sm font-semibold text-foreground transition hover:border-primary/30 hover:text-primary"
            >
              <ArrowLeft size={14} />
              Volver
            </Link>
          </div>
        </div>

        {statusError ? (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">
            {statusError}
          </p>
        ) : null}
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.7fr_0.9fr]">
        <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Información</p>
              <h2 className="mt-1 text-xl font-bold tracking-[-0.05em] text-foreground">Datos generales</h2>
            </div>
          </div>

          <div className="grid gap-x-5 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
            {infoItems.map(({ label, value, icon: Icon }) => (
              <div key={label}>
                <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                  <Icon size={12} className="text-primary" />
                  {label}
                </div>
                <p className="mt-1 text-sm font-semibold leading-5 text-foreground">{value}</p>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Responsable</p>
            <h3 className="mt-1 text-lg font-bold tracking-[-0.05em] text-foreground">Ejecutivo asignado</h3>
            <p className="mt-3 text-base font-semibold text-foreground">{getAssignedExecutiveName(client.assignedExecutive)}</p>
            {client.assignedExecutive ? (
              <p className="mt-1 truncate text-sm text-muted">{client.assignedExecutive.email}</p>
            ) : (
              <p className="mt-1 text-sm text-muted">Asigna un ejecutivo responsable de este cliente.</p>
            )}
            <button
              type="button"
              onClick={() => setIsAssignOpen(true)}
              className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white"
            >
              <UserRoundPlus size={15} />
              {client.assignedExecutive ? "Cambiar ejecutivo" : "Asignar ejecutivo"}
            </button>
          </section>

          <section className="grid grid-cols-2 gap-3">
            <div className="rounded-[20px] border border-border bg-white p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Creado</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(client.createdAt)}</p>
            </div>
            <div className="rounded-[20px] border border-border bg-white p-3.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Actualizado</p>
              <p className="mt-2 text-sm font-semibold text-foreground">{formatDate(client.updatedAt)}</p>
            </div>
          </section>
        </aside>
      </div>

      <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Comercial</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.05em] text-foreground">Cotizaciones</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsQuoteOpen(true)}
              className="inline-flex min-h-10 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white"
            >
              Nueva cotización
            </button>
            <Link href={`/dashboard/cotizaciones?clientId=${client.id}`} className="inline-flex min-h-10 items-center justify-center rounded-full border border-border px-4 text-sm font-semibold">
              Ver todas
            </Link>
          </div>
        </div>

        {quotes.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-border bg-slate-50/80 px-4 py-5 text-sm text-muted">
            Aún no hay cotizaciones para este cliente.
          </p>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm text-foreground">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-muted">
                  <tr>
                    <th className="px-4 py-3 font-medium">Número</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium text-right">Total</th>
                    <th className="px-4 py-3 font-medium">Emisión</th>
                    <th className="px-4 py-3 font-medium" />
                  </tr>
                </thead>
                <tbody>
                  {quotes.map((quote) => (
                    <tr key={quote.id} className="border-t border-border bg-white">
                      <td className="px-4 py-3 font-semibold">{quote.number}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${quoteStatusStyles[quote.status]}`}>
                          {getQuoteStatusLabel(quote.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(quote.total)}</td>
                      <td className="px-4 py-3 text-muted">{formatDate(quote.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          href={`/dashboard/cotizaciones/${quote.id}`}
                          className="inline-flex min-h-9 items-center justify-center rounded-full border border-border px-3 text-xs font-semibold"
                        >
                          Ver
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[26px] border border-dashed border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-50 text-primary">
            <CalendarClock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Seguimiento</p>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.05em] text-foreground">Gestiones</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
              Aquí se registrarán llamadas, reuniones y seguimientos de este cliente. Esta sección está preparada y se habilitará en una próxima etapa.
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[26px] border border-border bg-white p-4 shadow-[0_12px_30px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Seguimiento</p>
          <h2 className="mt-1 text-xl font-bold tracking-[-0.05em] text-foreground">Notas</h2>
        </div>

        {notes.length === 0 ? (
          <p className="rounded-[20px] border border-dashed border-border bg-slate-50/80 px-4 py-5 text-sm text-muted">
            Aún no hay notas registradas para este cliente.
          </p>
        ) : (
          <div className="space-y-3">
            {notes.map((note) => (
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

      <ClientQuickActions
        client={client}
        onCotizar={() => setIsQuoteOpen(true)}
        onAssignExecutive={() => setIsAssignOpen(true)}
      />

      <QuoteCreateModal
        open={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        client={client}
        onCreated={(quote) => {
          setQuotes((current) => [quote, ...current.filter((entry) => entry.id !== quote.id)]);
          setSuccessMessage(`Cotización ${quote.number} creada correctamente.`);
        }}
      />

      {isAssignOpen ? (
        <AssignExecutiveModal
          client={client}
          executives={executives}
          onClose={() => setIsAssignOpen(false)}
          onAssigned={(nextClient) => {
            setClient(nextClient);
            setSuccessMessage(
              nextClient.assignedExecutive
                ? `Ejecutivo asignado: ${getAssignedExecutiveName(nextClient.assignedExecutive)}.`
                : "Se quitó el ejecutivo asignado.",
            );
          }}
        />
      ) : null}

      {successMessage ? <DashboardSuccessToast message={successMessage} onDismiss={dismissSuccess} /> : null}
    </div>
  );
}

type AssignExecutiveModalProps = {
  client: ClientRecord;
  executives: ExecutiveRecord[];
  onClose: () => void;
  onAssigned: (client: ClientRecord) => void;
};

function AssignExecutiveModal({ client, executives, onClose, onAssigned }: AssignExecutiveModalProps) {
  const [executiveId, setExecutiveId] = useState(client.assignedExecutiveId ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);

  const options = useMemo(() => {
    const list = [...executives];
    if (client.assignedExecutive && !list.some((entry) => entry.id === client.assignedExecutive?.id)) {
      list.unshift({
        id: client.assignedExecutive.id,
        firstName: client.assignedExecutive.firstName,
        lastName: client.assignedExecutive.lastName,
        email: client.assignedExecutive.email,
        phone: "",
        rut: "",
        role: "EXECUTIVE",
        status: "INACTIVE",
        createdAt: new Date(0).toISOString(),
      });
    }
    return list;
  }, [client.assignedExecutive, executives]);

  async function save() {
    if (isSavingRef.current) return;
    isSavingRef.current = true;
    setIsSaving(true);
    setError("");

    try {
      const response = await fetch(`/api/clients/${client.id}/assign-executive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ executiveId: executiveId || null }),
      });
      const data = (await response.json().catch(() => ({}))) as { client?: ClientRecord; error?: string };

      if (!response.ok || !data.client) {
        setError(data.error ?? "No se pudo asignar el ejecutivo.");
        return;
      }

      onAssigned(data.client);
      onClose();
    } catch {
      setError("No se pudo asignar el ejecutivo.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="assign-executive-title"
        className="w-full max-w-lg rounded-[26px] border border-border bg-white p-5 shadow-[0_24px_64px_rgba(16,16,36,0.20)] sm:p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Responsable comercial</p>
            <h2 id="assign-executive-title" className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">
              {client.assignedExecutive ? "Cambiar ejecutivo" : "Asignar ejecutivo"}
            </h2>
            <p className="mt-2 text-sm text-muted">El ejecutivo quedará visible en la ficha y se guardará en la base de datos.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            aria-label="Cerrar modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <label className="mt-5 block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Ejecutivo</span>
          <select
            value={executiveId}
            onChange={(event) => setExecutiveId(event.target.value)}
            className="dashboard-field"
            disabled={isSaving}
          >
            <option value="">Sin asignar</option>
            {options.map((executive) => (
              <option key={executive.id} value={executive.id}>
                {getExecutiveDisplayName(executive)} · {executive.email}
              </option>
            ))}
          </select>
        </label>

        {executives.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No hay ejecutivos activos para asignar.</p>
        ) : null}

        {error ? <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{error}</p> : null}

        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} disabled={isSaving} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void save()}
            disabled={isSaving}
            className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSaving ? "Guardando..." : "Guardar asignación"}
          </button>
        </div>
      </div>
    </div>
  );
}
