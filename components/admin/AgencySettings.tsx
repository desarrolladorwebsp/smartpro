"use client";

import { useState } from "react";
import { Plus, Save } from "lucide-react";

import type { AgencyProfile } from "@/lib/agencies/types";

const FIELDS: Array<{ key: keyof AgencyProfile; label: string; group: string; placeholder?: string }> = [
  { key: "brandName", label: "Nombre comercial", group: "Identidad" },
  { key: "legalName", label: "Entidad legal", group: "Identidad" },
  { key: "rut", label: "RUT", group: "Identidad" },
  { key: "tagline", label: "Frase / descripción", group: "Identidad" },
  { key: "logoUrl", label: "Ruta local del logo", group: "Identidad", placeholder: "Ej. /images/logo/logo-smartstudio.png" },
  { key: "contactName", label: "Persona de contacto", group: "Contacto" },
  { key: "email", label: "Correo", group: "Contacto" },
  { key: "phone", label: "Teléfono", group: "Contacto" },
  { key: "address", label: "Dirección", group: "Contacto" },
  { key: "commune", label: "Comuna / ciudad", group: "Contacto" },
  { key: "postalCode", label: "Código postal", group: "Contacto" },
  { key: "offices", label: "Oficinas adicionales", group: "Contacto" },
  { key: "website", label: "Sitio web", group: "Contacto" },
  { key: "bankAccountHolder", label: "Titular de cuenta", group: "Datos bancarios" },
  { key: "bankRut", label: "RUT del titular", group: "Datos bancarios" },
  { key: "bankName", label: "Banco", group: "Datos bancarios" },
  { key: "bankAccountType", label: "Tipo de cuenta", group: "Datos bancarios" },
  { key: "bankAccountNumber", label: "Número de cuenta", group: "Datos bancarios" },
  { key: "bankEmail", label: "Correo asociado a la cuenta", group: "Datos bancarios" },
];

function blankAgency(): AgencyProfile {
  return {
    id: "", brandName: "", legalName: "", rut: "", tagline: "", address: "", commune: "", postalCode: "", offices: "",
    phone: "", contactName: "", email: "", website: "", logoUrl: "", bankAccountHolder: "", bankRut: "",
    bankName: "", bankAccountType: "", bankAccountNumber: "", bankEmail: "", active: true,
  };
}

export function AgencySettings({ initialAgencies }: { initialAgencies: AgencyProfile[] }) {
  const [agencies, setAgencies] = useState(initialAgencies);
  const [selectedId, setSelectedId] = useState(initialAgencies[0]?.id ?? "");
  const [draft, setDraft] = useState<AgencyProfile>(initialAgencies[0] ?? blankAgency());
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function selectAgency(id: string) {
    const next = agencies.find((agency) => agency.id === id);
    if (!next) return;
    setSelectedId(id);
    setDraft(next);
    setIsNew(false);
    setMessage("");
  }

  async function save() {
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/agencies", {
        method: isNew ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agency: draft }),
      });
      const data = (await response.json().catch(() => ({}))) as { agency?: AgencyProfile; error?: string };
      if (!response.ok || !data.agency) throw new Error(data.error ?? "No se pudo guardar la agencia.");
      setAgencies((current) => [data.agency!, ...current.filter((entry) => entry.id !== data.agency!.id)]);
      setDraft(data.agency);
      setSelectedId(data.agency.id);
      setIsNew(false);
      setMessage("Configuración guardada. Las cotizaciones existentes conservan su identidad guardada.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo guardar la agencia.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-border bg-white p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Cada cotización guarda una copia de estos datos al crearla.</p>
            <label className="mt-4 block max-w-sm">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">Agencia</span>
              <select value={isNew ? "" : selectedId} onChange={(event) => selectAgency(event.target.value)} className="dashboard-field">
                {agencies.map((agency) => <option key={agency.id} value={agency.id}>{agency.brandName}</option>)}
                {isNew ? <option value="">Nueva agencia</option> : null}
              </select>
            </label>
          </div>
          <button type="button" onClick={() => { setDraft(blankAgency()); setSelectedId(""); setIsNew(true); setMessage(""); }} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:border-primary/40 hover:text-primary">
            <Plus size={16} /> Agregar agencia
          </button>
        </div>
      </section>

      {(["Identidad", "Contacto", "Datos bancarios"] as const).map((group) => (
        <section key={group} className="rounded-3xl border border-border bg-white p-5 sm:p-6">
          <h2 className="text-lg font-bold">{group}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {FIELDS.filter((field) => field.group === group).map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1.5 block text-sm font-semibold">{field.label}</span>
                <input
                  value={String(draft[field.key])}
                  onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                  className="dashboard-field"
                  placeholder={field.placeholder}
                />
              </label>
            ))}
          </div>
        </section>
      ))}

      <label className="flex items-center gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm">
        <input type="checkbox" checked={draft.active} onChange={(event) => setDraft((current) => ({ ...current, active: event.target.checked }))} />
        Disponible para nuevas cotizaciones
      </label>

      {message ? <p className="rounded-2xl border border-border bg-white p-4 text-sm" role="status">{message}</p> : null}
      <div className="flex justify-end">
        <button type="button" onClick={() => void save()} disabled={saving} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60">
          <Save size={16} /> {saving ? "Guardando..." : "Guardar configuración"}
        </button>
      </div>
    </div>
  );
}
