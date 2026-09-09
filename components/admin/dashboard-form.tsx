import { X, type LucideIcon } from "lucide-react";

export const dashboardFieldClassName =
  "dashboard-field h-9 rounded-xl px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-70";
export const dashboardTextareaClassName = "dashboard-field min-h-[4.25rem] resize-y rounded-xl px-3 py-2 text-sm";

export function DashboardFormSection({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary/15 to-magenta/15 text-primary">
          <Icon size={13} strokeWidth={2.2} aria-hidden="true" />
        </span>
        <h3 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{title}</h3>
        <span className="h-px min-w-4 flex-1 bg-gradient-to-r from-primary/25 to-transparent" aria-hidden="true" />
      </div>
      {children}
    </section>
  );
}

export function DashboardFormField({
  label,
  htmlFor,
  children,
  className = "",
  error,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
  className?: string;
  error?: string;
}) {
  return (
    <div className={`block min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="mb-1 block text-[11px] font-medium text-muted">
        {label}
      </label>
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600" role="alert">
          {error}
        </span>
      ) : null}
    </div>
  );
}

export function DashboardFormModal({
  eyebrow,
  title,
  onClose,
  children,
  wide = false,
}: {
  eyebrow: string;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-form-modal-title"
        className={`flex max-h-[min(92vh,840px)] w-full flex-col overflow-hidden rounded-[22px] border border-border bg-white shadow-[0_18px_56px_rgba(16,16,36,0.16)] ${
          wide ? "max-w-3xl" : "max-w-lg"
        }`}
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</p>
            <h2 id="dashboard-form-modal-title" className="truncate text-lg font-bold tracking-[-0.03em] text-foreground sm:text-xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-soft-background hover:text-foreground"
            aria-label="Cerrar"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function DashboardFormFooter({ error, children }: { error?: string; children: React.ReactNode }) {
  return (
    <div className="shrink-0 space-y-2 border-t border-border px-4 py-2.5">
      {error ? (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function DashboardFormActions({
  isSaving,
  onCancel,
  submitLabel,
}: {
  isSaving?: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  return (
    <div className="flex justify-end gap-2">
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white disabled:opacity-70"
      >
        {isSaving ? "Guardando..." : submitLabel}
      </button>
    </div>
  );
}
