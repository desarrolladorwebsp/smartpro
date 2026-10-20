"use client";

import { useState } from "react";
import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { ExecutiveInviteModal } from "@/components/admin/ExecutiveInviteModal";
import { ExecutiveRegistrationForm } from "@/components/admin/ExecutiveRegistrationForm";
import { getExecutiveRoleLabel, type ExecutiveRecord } from "@/lib/executives/types";

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("es-CL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

function getInitials(firstName: string, lastName: string): string {
  const combined = `${firstName} ${lastName}`.trim();

  return (
    combined
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "E"
  );
}

const roleStyles: Record<ExecutiveRecord["role"], string> = {
  ADMIN: "bg-primary/10 text-primary",
  EXECUTIVE: "bg-slate-200 text-slate-700",
};

type ExecutivesDashboardProps = {
  initialExecutives?: ExecutiveRecord[];
};

export function ExecutivesDashboard({ initialExecutives = [] }: ExecutivesDashboardProps) {
  const [executives, setExecutives] = useState<ExecutiveRecord[]>(initialExecutives);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  function handleCreated(executive: ExecutiveRecord) {
    setExecutives((current) => [executive, ...current]);
  }

  async function refreshExecutives() {
    try {
      const response = await fetch("/api/executives", { cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { executives?: ExecutiveRecord[] };

      if (response.ok && data.executives) {
        setExecutives(data.executives);
      }
    } catch {
      // Keep current list if refresh fails.
    }
  }

  async function updateUser(executive: ExecutiveRecord, action: "status" | "delete") {
    const deleting = action === "delete";
    const nextStatus = executive.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const prompt = deleting
      ? `¿Eliminar a ${executive.firstName} ${executive.lastName} de la lista? El registro se conservará para mantener el historial.`
      : `${nextStatus === "INACTIVE" ? "¿Suspender" : "¿Reactivar"} a ${executive.firstName} ${executive.lastName}?`;
    if (!window.confirm(prompt)) return;

    setBusyId(executive.id);
    setActionError("");
    try {
      const response = await fetch("/api/executives", {
        method: deleting ? "DELETE" : "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deleting ? { id: executive.id } : { id: executive.id, status: nextStatus }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo actualizar el usuario.");
      if (deleting) setExecutives((current) => current.filter((entry) => entry.id !== executive.id));
      else setExecutives((current) => current.map((entry) => entry.id === executive.id ? { ...entry, status: nextStatus } : entry));
    } catch (error) {
      setActionError(error instanceof Error ? error.message : "No se pudo actualizar el usuario.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="ejecutivos"
        eyebrow="Equipo interno"
        title="Ejecutivos"
        action={{
          label: "Invitar ejecutivo",
          onClick: () => setIsInviteModalOpen(true),
        }}
      />

      <ExecutiveInviteModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        onInvited={refreshExecutives}
      />

      {actionError ? <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{actionError}</p> : null}

      <div className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  <th className="px-5 py-4">Ejecutivo</th>
                  <th className="px-5 py-4">Correo</th>
                  <th className="px-5 py-4">Rol</th>
                  <th className="px-5 py-4">Estado</th>
                  <th className="px-5 py-4">Registrado</th>
                  <th className="px-5 py-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {executives.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground">
                      Aún no hay ejecutivos registrados.
                    </td>
                  </tr>
                ) : (
                  executives.map((executive) => (
                    <tr key={executive.id} className="border-t border-border align-top">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-magenta text-xs font-bold text-white">
                            {getInitials(executive.firstName, executive.lastName)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">
                              {executive.firstName} {executive.lastName}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{executive.rut || "—"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-foreground">{executive.email}</td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleStyles[executive.role]}`}>
                          {getExecutiveRoleLabel(executive.role)}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${executive.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                          {executive.status === "ACTIVE" ? "Activo" : executive.status === "INACTIVE" ? "Suspendido" : "Pendiente"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-muted-foreground">{formatDate(executive.createdAt)}</td>
                      <td className="px-5 py-4">
                        <div className="flex flex-wrap gap-2">
                          <button type="button" disabled={busyId === executive.id} onClick={() => void updateUser(executive, "status")} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground disabled:opacity-50">
                            {executive.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                          </button>
                          <button type="button" disabled={busyId === executive.id} onClick={() => void updateUser(executive, "delete")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-700 disabled:opacity-50">
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="space-y-3 p-4 md:hidden">
            {executives.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">Aún no hay ejecutivos registrados.</p>
            ) : (
              executives.map((executive) => (
                <div key={executive.id} className="rounded-[20px] border border-border bg-soft-background p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-magenta text-xs font-bold text-white">
                      {getInitials(executive.firstName, executive.lastName)}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-foreground">
                        {executive.firstName} {executive.lastName}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">{executive.email}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span className={`inline-flex rounded-full px-3 py-1 font-semibold ${roleStyles[executive.role]}`}>
                      {getExecutiveRoleLabel(executive.role)}
                    </span>
                    <span>{executive.status === "ACTIVE" ? "Activo" : executive.status === "INACTIVE" ? "Suspendido" : "Pendiente"} · {formatDate(executive.createdAt)}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" disabled={busyId === executive.id} onClick={() => void updateUser(executive, "status")} className="rounded-lg border border-border px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-50">
                      {executive.status === "ACTIVE" ? "Suspender" : "Reactivar"}
                    </button>
                    <button type="button" disabled={busyId === executive.id} onClick={() => void updateUser(executive, "delete")} className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 disabled:opacity-50">Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
      </div>

      <div className="hidden" aria-hidden="true">
        <ExecutiveRegistrationForm onCreated={handleCreated} />
      </div>
    </div>
  );
}
