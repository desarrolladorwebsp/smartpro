"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { getClientStatusLabel, type ClientRecord, type ClientStatus } from "@/lib/clients/types";

type FormState = {
  companyName: string;
  rut: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  region: string;
  website: string;
  notes: string;
  status: ClientStatus;
};

const emptyForm: FormState = {
  companyName: "",
  rut: "",
  contactFirstName: "",
  contactLastName: "",
  email: "",
  phone: "",
  address: "",
  commune: "",
  city: "",
  region: "",
  website: "",
  notes: "",
  status: "ACTIVO",
};

const statusStyles: Record<ClientStatus, string> = {
  ACTIVO: "bg-emerald-100 text-emerald-700",
  POTENCIAL: "bg-amber-100 text-amber-700",
  INACTIVO: "bg-slate-200 text-slate-700",
};

function normalizeRut(value: string): string {
  const digits = value.replace(/[^0-9kK]/g, "");
  if (!digits) return "";

  const body = digits.slice(0, -1);
  const verifier = digits.slice(-1).toUpperCase();

  if (!body || !verifier) return "";

  return `${body}-${verifier}`;
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "C";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false;

  return Boolean(
    target.closest(
      "a, button, select, input, textarea, label, [role='button'], [data-row-stop-navigation='true']",
    ),
  );
}

const clientRowInteractiveClassName =
  "cursor-pointer border-t border-border align-top transition-[background-color,box-shadow] duration-200 hover:bg-primary/[0.04] hover:shadow-[inset_3px_0_0_0_rgba(109,40,217,0.18)] focus-visible:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/25";

const clientCardInteractiveClassName =
  "cursor-pointer rounded-[20px] border border-border bg-soft-background p-4 transition-[background-color,border-color,box-shadow] duration-200 hover:border-primary/20 hover:bg-primary/[0.04] hover:shadow-[0_8px_24px_rgba(109,40,217,0.06)] focus-visible:border-primary/25 focus-visible:bg-primary/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25";

type ClientsDashboardProps = {
  initialClients?: ClientRecord[];
};

export function ClientsDashboard({ initialClients = [] }: ClientsDashboardProps) {
  const router = useRouter();
  const [clients, setClients] = useState<ClientRecord[]>(initialClients);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ClientStatus | "TODOS">("TODOS");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  function openClientDetail(clientId: string) {
    router.push(`/dashboard/clientes/${clientId}`);
  }

  function handleClientRowActivate(
    clientId: string,
    event: React.MouseEvent<HTMLElement> | React.KeyboardEvent<HTMLElement>,
  ) {
    if (isInteractiveTarget(event.target)) return;

    if ("key" in event) {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
    }

    openClientDetail(clientId);
  }

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/clients", { method: "GET", cache: "no-store" });
      const data = (await response.json().catch(() => ({ clients: [] as ClientRecord[] }))) as {
        clients?: ClientRecord[];
      };

      setClients(Array.isArray(data.clients) ? data.clients : []);
      router.refresh();
    } catch {
      setClients([]);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase();

    return clients.filter((client) => {
      const matchesSearch =
        !query ||
        [
          client.companyName,
          client.rut,
          `${client.contactFirstName} ${client.contactLastName}`,
          client.email,
          client.phone,
          client.city,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesStatus = statusFilter === "TODOS" || client.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clients, search, statusFilter]);

  function handleFieldChange(field: keyof FormState, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError("");
    setSuccessMessage("");
  }

  function openCreateModal() {
    setEditingId(null);
    setForm(emptyForm);
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setIsModalOpen(true);
  }

  function openEditModal(client: ClientRecord) {
    setEditingId(client.id);
    setForm({
      companyName: client.companyName,
      rut: client.rut,
      contactFirstName: client.contactFirstName,
      contactLastName: client.contactLastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      commune: client.commune,
      city: client.city,
      region: client.region,
      website: client.website,
      notes: client.notes,
      status: client.status,
    });
    setErrors({});
    setSubmitError("");
    setSuccessMessage("");
    setIsModalOpen(true);
  }

  function validateForm(): Partial<Record<keyof FormState, string>> {
    const nextErrors: Partial<Record<keyof FormState, string>> = {};

    if (!form.companyName.trim()) nextErrors.companyName = "La empresa es obligatoria.";
    if (!form.rut.trim()) nextErrors.rut = "El RUT es obligatorio.";
    else if (!/^\d{7,8}-?[0-9Kk]$/.test(normalizeRut(form.rut).replace(/\s+/g, ""))) {
      nextErrors.rut = "RUT inválido.";
    }
    if (!form.contactFirstName.trim()) nextErrors.contactFirstName = "El nombre del contacto es obligatorio.";
    if (!form.contactLastName.trim()) nextErrors.contactLastName = "El apellido del contacto es obligatorio.";
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "El email no tiene un formato válido.";
    }

    setErrors(nextErrors);
    return nextErrors;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextErrors = validateForm();

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSubmitError("");
    setSuccessMessage("");

    try {
      const payload = {
        ...form,
        companyName: form.companyName.trim(),
        rut: normalizeRut(form.rut),
        contactFirstName: form.contactFirstName.trim(),
        contactLastName: form.contactLastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        address: form.address.trim(),
        commune: form.commune.trim(),
        city: form.city.trim(),
        region: form.region.trim(),
        website: form.website.trim(),
        notes: form.notes.trim(),
      };

      const response = await fetch("/api/clients", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...payload,
          ...(editingId ? { id: editingId } : {}),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string; client?: ClientRecord };

      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo guardar el cliente.");
        return;
      }

      setSuccessMessage(editingId ? "Cliente actualizado correctamente." : "Cliente creado correctamente.");
      setIsModalOpen(false);
      setForm(emptyForm);
      setEditingId(null);
      await fetchClients();
    } catch {
      setSubmitError("No se pudo guardar el cliente.");
    }
  }

  async function handleChangeStatus(clientId: string, nextStatus: ClientStatus) {
    try {
      const response = await fetch(`/api/clients/${clientId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (response.ok) {
        await fetchClients();
      }
    } catch {
      // No-op; show false in UI only if needed in the future.
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="clientes"
        eyebrow="Gestión comercial"
        title="Clientes"
        description="Registros comerciales administrados desde el Dashboard interno de SmartPro."
        action={{ label: "Nuevo cliente", onClick: openCreateModal }}
      />

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-md">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar empresa, contacto, email o RUT"
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 pr-10 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as ClientStatus | "TODOS")}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary lg:max-w-xs"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVO">Activo</option>
            <option value="POTENCIAL">Potencial</option>
            <option value="INACTIVO">Inactivo</option>
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {successMessage}
        </div>
      )}

      <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full text-left text-sm text-foreground">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">RUT</th>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Teléfono</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }, (_, index) => (
                  <tr key={`client-skeleton-${index}`} className="border-t border-border">
                    <td className="px-4 py-3" colSpan={8}>
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 animate-pulse rounded-full bg-slate-200/80" />
                        <div className="h-3 w-full max-w-xl animate-pulse rounded-full bg-slate-200/80" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                    No hay clientes registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => (
                  <tr
                    key={client.id}
                    role="link"
                    tabIndex={0}
                    aria-label={`Abrir detalle de ${client.companyName}`}
                    className={clientRowInteractiveClassName}
                    onClick={(event) => handleClientRowActivate(client.id, event)}
                    onKeyDown={(event) => handleClientRowActivate(client.id, event)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                          {getInitials(client.companyName)}
                        </div>
                        <div>
                          <div className="font-semibold text-foreground">{client.companyName}</div>
                          <div className="text-xs text-muted">{client.city}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{client.rut}</td>
                    <td className="px-4 py-3">{client.contactFirstName} {client.contactLastName}</td>
                    <td className="px-4 py-3 text-muted">{client.email || "—"}</td>
                    <td className="px-4 py-3">{client.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[client.status]}`}>
                        {getClientStatusLabel(client.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted">{formatDate(client.createdAt)}</td>
                    <td className="px-4 py-3" data-row-stop-navigation="true" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/dashboard/clientes/${client.id}`}
                          className="text-sm font-medium text-primary"
                          onClick={(event) => event.stopPropagation()}
                        >
                          Ver
                        </Link>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            openEditModal(client);
                          }}
                          className="text-sm font-medium text-foreground"
                        >
                          Editar
                        </button>
                        <select
                          value={client.status}
                          onClick={(event) => event.stopPropagation()}
                          onChange={(event) => {
                            event.stopPropagation();
                            handleChangeStatus(client.id, event.target.value as ClientStatus);
                          }}
                          className="rounded-full border border-border bg-soft-background px-2 py-1 text-[11px] text-foreground outline-none"
                          aria-label={`Cambiar estado para ${client.companyName}`}
                        >
                          <option value="ACTIVO">Activo</option>
                          <option value="POTENCIAL">Potencial</option>
                          <option value="INACTIVO">Inactivo</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {isLoading ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={`client-card-skeleton-${index}`} className="rounded-[20px] border border-border bg-soft-background p-4">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/80" />
                <div className="mt-3 h-3 w-1/2 animate-pulse rounded-full bg-slate-200/80" />
                <div className="mt-4 h-8 w-24 animate-pulse rounded-full bg-slate-200/80" />
              </div>
            ))
          ) : filteredClients.length === 0 ? (
            <div className="rounded-2xl border border-border bg-soft-background p-4 text-center text-sm text-muted">
              No hay clientes registrados con esos filtros.
            </div>
          ) : (
            filteredClients.map((client) => (
              <div
                key={client.id}
                role="link"
                tabIndex={0}
                aria-label={`Abrir detalle de ${client.companyName}`}
                className={clientCardInteractiveClassName}
                onClick={(event) => handleClientRowActivate(client.id, event)}
                onKeyDown={(event) => handleClientRowActivate(client.id, event)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-semibold text-foreground">{client.companyName}</div>
                    <div className="text-xs text-muted">{client.rut}</div>
                  </div>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[client.status]}`}>
                    {getClientStatusLabel(client.status)}
                  </span>
                </div>

                <div className="mt-3 space-y-1 text-sm text-muted">
                  <p><span className="font-medium text-foreground">Contacto:</span> {client.contactFirstName} {client.contactLastName}</p>
                  <p><span className="font-medium text-foreground">Email:</span> {client.email || "—"}</p>
                  <p><span className="font-medium text-foreground">Teléfono:</span> {client.phone || "—"}</p>
                  <p><span className="font-medium text-foreground">Fecha:</span> {formatDate(client.createdAt)}</p>
                </div>

                <div
                  className="mt-4 flex flex-wrap gap-2"
                  data-row-stop-navigation="true"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Link
                    href={`/dashboard/clientes/${client.id}`}
                    className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-primary"
                    onClick={(event) => event.stopPropagation()}
                  >
                    Ver
                  </Link>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openEditModal(client);
                    }}
                    className="inline-flex rounded-full border border-border bg-white px-3 py-1.5 text-xs font-semibold text-foreground"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-border bg-white p-5 shadow-[0_18px_56px_rgba(16,16,36,0.14)] sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Clientes</p>
                <h2 className="mt-2 text-2xl font-bold tracking-[-0.05em] text-foreground">
                  {editingId ? "Editar cliente" : "Nuevo cliente"}
                </h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-lg text-muted">×</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-foreground">Empresa / Razón social</span>
                  <input
                    value={form.companyName}
                    onChange={(event) => handleFieldChange("companyName", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Comercial Andes SpA"
                  />
                  {errors.companyName && <span className="mt-1 block text-xs text-red-600">{errors.companyName}</span>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">RUT</span>
                  <input
                    value={form.rut}
                    onChange={(event) => handleFieldChange("rut", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="76.123.456-7"
                  />
                  {errors.rut && <span className="mt-1 block text-xs text-red-600">{errors.rut}</span>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Estado</span>
                  <select
                    value={form.status}
                    onChange={(event) => handleFieldChange("status", event.target.value as ClientStatus)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                  >
                    <option value="ACTIVO">Activo</option>
                    <option value="POTENCIAL">Potencial</option>
                    <option value="INACTIVO">Inactivo</option>
                  </select>
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Nombre del contacto</span>
                  <input
                    value={form.contactFirstName}
                    onChange={(event) => handleFieldChange("contactFirstName", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Andrea"
                  />
                  {errors.contactFirstName && <span className="mt-1 block text-xs text-red-600">{errors.contactFirstName}</span>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Apellido del contacto</span>
                  <input
                    value={form.contactLastName}
                    onChange={(event) => handleFieldChange("contactLastName", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Pérez"
                  />
                  {errors.contactLastName && <span className="mt-1 block text-xs text-red-600">{errors.contactLastName}</span>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Email</span>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(event) => handleFieldChange("email", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="andrea@empresa.cl"
                  />
                  {errors.email && <span className="mt-1 block text-xs text-red-600">{errors.email}</span>}
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Teléfono</span>
                  <input
                    value={form.phone}
                    onChange={(event) => handleFieldChange("phone", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="+56 9 1234 5678"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-foreground">Dirección</span>
                  <input
                    value={form.address}
                    onChange={(event) => handleFieldChange("address", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Av. Providencia 1234"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Comuna</span>
                  <input
                    value={form.commune}
                    onChange={(event) => handleFieldChange("commune", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Providencia"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Ciudad</span>
                  <input
                    value={form.city}
                    onChange={(event) => handleFieldChange("city", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Santiago"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Región</span>
                  <input
                    value={form.region}
                    onChange={(event) => handleFieldChange("region", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Metropolitana"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-medium text-foreground">Sitio web</span>
                  <input
                    value={form.website}
                    onChange={(event) => handleFieldChange("website", event.target.value)}
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="www.empresa.cl"
                  />
                </label>

                <label className="block md:col-span-2">
                  <span className="mb-2 block text-sm font-medium text-foreground">Notas</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => handleFieldChange("notes", event.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-base text-foreground outline-none transition focus:border-primary"
                    placeholder="Información relevante del cliente..."
                  />
                </label>
              </div>

              {submitError && (
                <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground">
                  Cancelar
                </button>
                <button type="submit" className="inline-flex min-h-11 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(109,40,217,0.2)]">
                  {editingId ? "Guardar cambios" : "Crear cliente"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
