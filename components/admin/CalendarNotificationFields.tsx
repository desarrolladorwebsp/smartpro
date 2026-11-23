"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { ActivityNotices } from "@/lib/calendar-activity-notifications";
import type { CalendarParticipant } from "./calendar-types";

export function activityNoticeMessage(notices?: ActivityNotices) {
  if (notices?.client === "failed" || notices?.internal === "failed") return "Uno o más avisos no se pudieron enviar.";
  if (notices?.client === "sent" || notices?.internal === "sent") return "Avisos enviados.";
  return "";
}

export function CalendarNotificationFields({ participants, initialIds, clientEmail, recipientKey, zoom, deleting, pending }: {
  participants: CalendarParticipant[];
  initialIds?: string[];
  clientEmail: string;
  recipientKey: string;
  zoom: boolean;
  deleting?: boolean;
  pending: boolean;
}) {
  const [client, setClient] = useState(false);
  const [internal, setInternal] = useState(false);
  const [ids, setIds] = useState(() => (initialIds ?? []).filter((id) => participants.some((participant) => participant.id === id)));

  return (
    <fieldset disabled={pending} className="space-y-3 border-t border-border pt-3 text-sm">
      <legend className="pr-2 font-semibold">¿Quieres enviar avisos?</legend>
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" name="sendInvitation" checked={client}
          onChange={({ target }) => setClient(target.checked)} className="size-4 accent-primary" />
        Notificar al cliente
      </label>
      {client && <label className="block font-medium">
        Correo del cliente
        <input key={recipientKey} name="invitationEmail" type="email" required maxLength={254} defaultValue={clientEmail}
          placeholder="nombre@empresa.cl" className="dashboard-field mt-1.5" />
      </label>}
      <label className="flex items-center gap-2 font-medium">
        <input type="checkbox" name="notifyParticipants" checked={internal}
          disabled={!zoom && !participants.length}
          onChange={({ target }) => setInternal(target.checked)} className="size-4 accent-primary" />
        Notificar a participantes
      </label>
      {(!deleting || internal) && participants.length > 0 && (
        <details className="group rounded-xl border border-border bg-surface-alt">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-xl px-3 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
            {ids.length ? `Participantes (${ids.length})` : "Seleccionar participantes"}
            <ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open:rotate-180" />
          </summary>
          <div className="max-h-40 overflow-y-auto border-t border-border px-2 py-1">
            {participants.map(({ id, name }) => (
              <label key={id} className="flex min-h-9 cursor-pointer items-center gap-2 rounded-md px-2 hover:bg-primary/10">
                <input type="checkbox" name="participantIds" value={id} checked={ids.includes(id)}
                  onChange={({ target: { checked } }) => setIds((current) => checked ? [...current, id] : current.filter((selected) => selected !== id))}
                  className="size-4 shrink-0 accent-primary" />
                {name}
              </label>
            ))}
          </div>
        </details>
      )}
      {zoom && internal && <p className="text-xs text-muted">Los avisos internos incluyen una copia a contacto@smartpro.cl.</p>}
    </fieldset>
  );
}
