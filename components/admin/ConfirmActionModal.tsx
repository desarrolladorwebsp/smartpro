"use client";

type ConfirmActionModalProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  busyLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmActionModal({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancelar",
  busyLabel,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmActionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/45 p-3 sm:p-4" role="presentation">
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-action-title"
        aria-describedby="confirm-action-description"
        className="w-full max-w-md rounded-[26px] border border-border bg-white p-5 shadow-[0_24px_64px_rgba(16,16,36,0.20)] sm:p-6"
      >
        <h2 id="confirm-action-title" className="text-xl font-bold tracking-[-0.05em] text-foreground">
          {title}
        </h2>
        <p id="confirm-action-description" className="mt-2 text-sm leading-6 text-muted">
          {description}
        </p>
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isBusy ? busyLabel ?? "Procesando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
