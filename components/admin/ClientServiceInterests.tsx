import { AppWindow, ChevronDown, ListChecks, Megaphone, Mic, type LucideIcon } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { CLIENT_SERVICE_INTERESTS, CLIENT_SERVICE_INTEREST_KEYS, type ClientServiceInterest } from "@/lib/clients/service-interests";

const serviceIcons: Record<ClientServiceInterest, { icon: LucideIcon; color: string }> = {
  ADVERTISING: { icon: Megaphone, color: "bg-violet-100 text-violet-800" },
  WEB_DEVELOPMENT: { icon: AppWindow, color: "bg-blue-100 text-blue-800" },
  PODCAST: { icon: Mic, color: "bg-teal-100 text-teal-800" },
};

function ServiceIcon({ service }: { service: ClientServiceInterest }) {
  const { icon: Icon, color } = serviceIcons[service];
  return <span aria-hidden="true" title={CLIENT_SERVICE_INTERESTS[service]}
    className={`inline-flex size-5 shrink-0 items-center justify-center rounded-md ${color}`}>
    <Icon size={13} strokeWidth={2} />
  </span>;
}

export function ClientServiceIcons({ services, descriptionId }: { services: ClientServiceInterest[]; descriptionId: string }) {
  if (!services.length) return null;
  return <>
    <span className="inline-flex shrink-0 items-center gap-0.5">
      {services.map((service) => <ServiceIcon key={service} service={service} />)}
    </span>
    <span hidden id={descriptionId}>{services.map((service) => CLIENT_SERVICE_INTERESTS[service]).join(", ")}</span>
  </>;
}

export function ClientServiceInterestSelector({ clientKey, services, onSaved }: {
  clientKey: string;
  services: ClientServiceInterest[];
  onSaved: () => void;
}) {
  const id = useId();
  const control = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<ClientServiceInterest[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  useEffect(() => {
    if (!open || saving) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !control.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open, saving]);

  function close() {
    setOpen(false);
    trigger.current?.focus({ preventScroll: true });
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");
    try {
      const response = await fetch("/api/clients/service-interests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientKey, services: draft }),
      });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error ?? "No se pudieron guardar los servicios de interés.");
      }
      onSaved();
      setSavedMessage("Servicios de interés guardados.");
      close();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "No se pudieron guardar los servicios de interés.");
    } finally {
      setSaving(false);
    }
  }

  return <div ref={control} className="relative shrink-0" onKeyDown={(event) => {
    if (open && event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      if (!saving) close();
    }
  }}>
    <button ref={trigger} type="button" aria-label="Configurar servicios de interés" title="Configurar servicios de interés"
      aria-controls={id} aria-expanded={open} aria-disabled={saving}
      onClick={() => {
        if (saving) return;
        setDraft(services);
        setError("");
        setSavedMessage("");
        setOpen(!open);
      }}
      className="inline-flex min-h-10 min-w-10 items-center justify-center gap-1.5 rounded-xl border border-border bg-white px-2.5 text-sm font-semibold text-primary hover:bg-primary/5 focus-visible:outline-primary aria-disabled:opacity-60">
      <ListChecks size={17} aria-hidden="true" />
      <span className="hidden sm:inline">Servicios</span>
      <ChevronDown size={14} aria-hidden="true" className="hidden sm:block" />
    </button>
    <form id={id} hidden={!open} onSubmit={save}
      className="absolute -right-8 top-full z-30 mt-2 max-h-[min(18rem,50dvh)] w-60 max-w-[calc(100dvw-5.5rem)] space-y-2 overflow-y-auto overscroll-contain rounded-2xl border border-border bg-white p-3 shadow-xl sm:right-0">
      <fieldset disabled={saving} className="space-y-1">
        <legend className="mb-1 text-sm font-bold text-foreground">Servicios de interés</legend>
        {CLIENT_SERVICE_INTEREST_KEYS.map((service) => <label key={service}
          className="flex min-h-9 cursor-pointer items-center gap-2 rounded-lg px-1.5 text-sm text-foreground hover:bg-slate-50">
          <input type="checkbox" className="size-4 shrink-0 accent-primary" checked={draft.includes(service)}
            onChange={(event) => {
              const checked = event.currentTarget.checked;
              setDraft((current) => checked ? [...current, service] : current.filter((entry) => entry !== service));
            }} />
          <ServiceIcon service={service} />
          <span>{CLIENT_SERVICE_INTERESTS[service]}</span>
        </label>)}
      </fieldset>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
      <div className="flex justify-end gap-2 border-t border-border pt-2">
        <button type="button" onClick={close} disabled={saving} className="min-h-9 rounded-lg px-2.5 text-xs font-semibold text-muted hover:bg-slate-50 focus-visible:outline-primary">Cancelar</button>
        <button type="submit" disabled={saving} className="min-h-9 rounded-lg bg-primary px-3 text-xs font-semibold text-white hover:bg-primary/90 focus-visible:outline-primary disabled:opacity-60">
          {saving ? "Guardando…" : "Guardar"}
        </button>
      </div>
    </form>
    <p role="status" className="sr-only">{savedMessage}</p>
  </div>;
}
