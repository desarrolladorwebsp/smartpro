"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Bell, ChevronDown, Video } from "lucide-react";

import type { CalendarClient, CalendarParticipant, CalendarReminder, CalendarZoomMeeting } from "./calendar-types";
import { createCalendarReminder, bookCalendarZoomMeeting } from "@/app/dashboard/calendario/actions";
import { DashboardFormActions, DashboardFormFooter, DashboardFormModal } from "./dashboard-form";

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-CL");
}

export function CalendarSlotDialog({ date, time, startTime, zoomConfigured, clients, participants, initialClientKey, onClose, onSaved, onMeetingSaved }: {
  date: string;
  time: string;
  startTime: string;
  zoomConfigured: boolean;
  clients: CalendarClient[];
  participants: CalendarParticipant[];
  initialClientKey: string;
  onClose: () => void;
  onSaved: (reminder: CalendarReminder) => void;
  onMeetingSaved: (meeting: CalendarZoomMeeting) => void;
}) {
  const [mode, setMode] = useState<"choose" | "zoom" | "reminder">("choose");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [clientKey, setClientKey] = useState(initialClientKey);
  const [clientQuery, setClientQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchResults = useRef<HTMLDivElement>(null);
  const searchResultsId = useId();
  const [contactId, setContactId] = useState("");
  const [copyStatus, setCopyStatus] = useState("");
  const [sendInvitation, setSendInvitation] = useState(false);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [bookingResult, setBookingResult] = useState<{ internalInvitation?: "sent" | "failed"; existing?: boolean }>({});
  const [meeting, setMeeting] = useState<CalendarZoomMeeting | null>(null);
  const selectedClient = clients.find((client) => client.id === clientKey);
  const contacts = selectedClient?.contacts ?? [];
  const query = clientQuery.trim();
  const matchingClients = query ? clients.filter((client) =>
    normalizeSearch(client.name).includes(normalizeSearch(query))).slice(0, 10) : [];

  const showResults = Boolean(query) && (mode === "reminder" || (mode === "zoom" && !meeting));
  useLayoutEffect(() => {
    const input = searchInput.current;
    const popup = searchResults.current;
    if (!showResults || !input || !popup) return;

    function positionResults() {
      if (!input || !popup) return;
      const bounds = input.getBoundingClientRect();
      const top = bounds.bottom + 4;
      popup.style.left = `${bounds.left}px`;
      popup.style.top = `${top}px`;
      popup.style.width = `${bounds.width}px`;
      popup.style.maxHeight = `${Math.max(0, Math.min(160, window.innerHeight - top - 8))}px`;
    }

    positionResults();
    popup.showPopover();
    window.addEventListener("resize", positionResults);
    window.addEventListener("scroll", positionResults, true);
    return () => {
      if (popup.matches(":popover-open")) popup.hidePopover();
      window.removeEventListener("resize", positionResults);
      window.removeEventListener("scroll", positionResults, true);
    };
  }, [showResults]);

  function chooseClient(id: string) {
    setClientKey(id);
    setContactId("");
    setClientQuery("");
  }

  const associationFields = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="min-w-0 space-y-1.5" onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setClientQuery("");
      }} onKeyDown={(event) => {
        if (event.key === "Escape" && showResults) {
          event.stopPropagation();
          searchInput.current?.focus();
          setClientQuery("");
        }
      }}>
        <input type="hidden" name="clientKey" value={clientKey} />
        <label className="block text-sm font-medium">
          Cliente (opcional)
          <input ref={searchInput} type="search" aria-label="Buscar cliente" aria-controls={searchResultsId} placeholder="Buscar por nombre"
            value={clientQuery} onChange={(event) => setClientQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (matchingClients.length === 1) chooseClient(matchingClients[0].id);
            }}
            className="dashboard-field mt-1.5 w-full" />
        </label>
        {selectedClient && (
          <div className="flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-xs text-primary">
            <span className="min-w-0 break-words font-medium">{selectedClient.name}</span>
            <button type="button" className="shrink-0 font-semibold underline" onClick={() => chooseClient("")}>Quitar</button>
          </div>
        )}
        <div id={searchResultsId} ref={searchResults} popover="manual"
          className="fixed inset-auto m-0 overflow-y-auto rounded-lg border border-border bg-white shadow-lg">
          {matchingClients.length ? (
          <ul aria-label="Clientes encontrados">
            {matchingClients.map((client) => (
              <li key={client.id}>
                <button type="button" onClick={() => chooseClient(client.id)}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-primary/10 focus-visible:bg-primary/10">
                  {client.name}
                </button>
              </li>
            ))}
          </ul>
          ) : <p role="status" className="px-3 py-2 text-xs text-muted">Sin clientes encontrados.</p>}
        </div>
      </div>
      <label className="block text-sm font-medium">
        Contacto (opcional)
        <select aria-label="Contacto (opcional)" name="contactId" value={contactId} onChange={(event) => setContactId(event.target.value)}
          disabled={!contacts.length} className="dashboard-field mt-1.5 disabled:opacity-60">
          <option value="">{clientKey ? (contacts.length ? "Sin contacto" : "Sin contactos disponibles") : "Selecciona un cliente primero"}</option>
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.email ? `${contact.name} - ${contact.email}` : contact.name}</option>)}
        </select>
      </label>
    </div>
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    saving.current = true;
    setPending(true);
    setError("");
    try {
      if (mode === "zoom") {
        const result = await bookCalendarZoomMeeting(form);
        if (result.meeting) {
          setMeeting(result.meeting);
          setBookingResult({ internalInvitation: result.internalInvitation, existing: result.existing });
          onMeetingSaved(result.meeting);
        } else setError(result.error);
      } else {
        const result = await createCalendarReminder(form);
        if (result.reminder) onSaved(result.reminder);
        else setError(result.error);
      }
    } catch {
      setError("No se pudo guardar el recordatorio. Inténtalo de nuevo.");
    } finally {
      setPending(false);
      saving.current = false;
    }
  }

  const title = mode === "zoom" ? "Reunión por Zoom" : mode === "reminder" ? "Nuevo recordatorio" : "Agregar al calendario";

  return (
    <DashboardFormModal eyebrow="Calendario" title={title}
      onClose={() => { if (!saving.current) onClose(); }}>
      {mode === "choose" && (
        <div className="space-y-3 p-4">
          <p className="text-sm text-muted">{date.split("-").reverse().join("/")} · {time}</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => setMode("zoom")} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left font-medium hover:bg-primary/10">
              <Video size={18} className="text-primary" aria-hidden="true" /> Reunión por Zoom
            </button>
            <button type="button" onClick={() => setMode("reminder")} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left font-medium hover:bg-primary/10">
              <Bell size={18} className="text-primary" aria-hidden="true" /> Recordatorio
            </button>
          </div>
        </div>
      )}
      {mode === "zoom" && (meeting ? (
        <div className="space-y-3 p-4">
          <p role="status" className="font-medium text-emerald-700">Reunión agendada en Zoom.</p>
          <p className="text-sm">{meeting.title} · {time} · {meeting.duration} min</p>
          {meeting.clientInvitationStatus === "PENDING" && (
            <p role="status" className="text-sm text-amber-800">Invitación al cliente pendiente de entrega.</p>
          )}
          {meeting.clientInvitationStatus === "DELIVERED" && (
            <p role="status" className="text-sm text-emerald-700">Invitación entregada al servidor de correo del cliente.</p>
          )}
          {meeting.clientInvitationStatus === "FAILED" && (
            <p role="alert" className="text-sm text-amber-800">No se pudo enviar la invitación al cliente. Puedes compartir el enlace.</p>
          )}
          {bookingResult.internalInvitation === "sent" && (
            <p role="status" className="text-sm text-emerald-700">Invitación interna enviada.</p>
          )}
          {bookingResult.internalInvitation === "failed" && (
            <p role="alert" className="text-sm text-amber-800">Revisa el envío interno. Una o más copias no se pudieron enviar.</p>
          )}
          {bookingResult.existing && (
            <p role="status" className="text-sm text-muted">La reunión ya estaba agendada. Se evitó un envío duplicado.</p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <button type="button" className="rounded-xl bg-primary px-3 py-2 text-sm font-semibold text-white" onClick={async () => {
              try {
                await navigator.clipboard.writeText(meeting.joinUrl);
                setCopyStatus("Enlace copiado.");
              } catch {
                setCopyStatus("No se pudo copiar. Puedes abrir el enlace de Zoom.");
              }
            }}>Copiar enlace</button>
            <a href={meeting.joinUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary">Abrir Zoom</a>
          </div>
          {copyStatus && <p role="status" className="text-sm text-muted">{copyStatus}</p>}
        </div>
      ) : (
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="time" value={startTime} />
          <div className="space-y-4 overflow-y-auto p-4">
            <p className="text-sm text-muted">{date.split("-").reverse().join("/")} · {time} · Hora de Chile</p>
            <label className="block text-sm font-medium">
              Título
              <input name="title" required maxLength={191} defaultValue="Reunión SmartPro" className="dashboard-field mt-1.5" />
            </label>
            <label className="block text-sm font-medium">
              Duración
              <select aria-label="Duración" name="duration" defaultValue="15" className="dashboard-field mt-1.5">
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="40">40 minutos</option>
              </select>
            </label>
            {associationFields}
            <div className="space-y-3 border-t border-border pt-3">
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" name="sendInvitation" checked={sendInvitation}
                  onChange={(event) => setSendInvitation(event.target.checked)}
                  className="size-4 accent-primary" />
                Enviar invitación al cliente por correo
              </label>
              {sendInvitation && (
                <label className="block text-sm font-medium">
                  Correo del destinatario
                  <input key={clientKey + ":" + contactId} type="email" name="invitationEmail" required maxLength={254}
                    defaultValue={contacts.find((contact) => contact.id === contactId)?.email ?? ""}
                    placeholder="nombre@empresa.cl" className="dashboard-field mt-1.5" />
                </label>
              )}
            </div>
            <fieldset disabled={pending} className="space-y-2">
              <legend className="text-sm font-medium">Participantes</legend>
              {participants.length > 0 ? (
                <details className="group rounded-2xl border border-border bg-surface-alt">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-2 rounded-2xl px-3 py-2.5 text-sm focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
                    {participantIds.length > 0
                      ? `${participantIds.length} ${participantIds.length === 1 ? "seleccionado" : "seleccionados"}`
                      : "Seleccionar usuarios"}
                    <ChevronDown size={16} aria-hidden="true" className="shrink-0 group-open:rotate-180" />
                  </summary>
                  <div className="max-h-44 space-y-0.5 overflow-y-auto border-t border-border px-2 py-1">
                    {participants.map(({ id, name }) => (
                      <label key={id} className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg px-2 text-sm hover:bg-primary/10">
                        <input type="checkbox" name="participantIds" value={id} checked={participantIds.includes(id)}
                          onChange={({ target: { checked } }) => setParticipantIds((previous) =>
                            checked ? [...previous, id] : previous.filter((selected) => selected !== id))}
                          className="size-4 shrink-0 accent-primary" />
                        {name}
                      </label>
                    ))}
                  </div>
                </details>
              ) : <p className="text-sm text-muted">No hay usuarios activos disponibles.</p>}
              <p className="text-xs text-muted">Los usuarios seleccionados reciben una invitación interna. Se envía una copia a contacto@smartpro.cl.</p>
            </fieldset>
            {!zoomConfigured && <p className="text-sm text-muted">Conecta la cuenta de Zoom para agendar.</p>}
          </div>
          <DashboardFormFooter error={error}>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={pending} onClick={onClose}
                className="h-9 rounded-full border border-border px-4 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={pending || !zoomConfigured}
                className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
                {pending ? "Agendando…" : "Agendar en Zoom"}
              </button>
            </div>
          </DashboardFormFooter>
        </form>
      ))}
      {mode === "reminder" && (
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <input type="hidden" name="time" value={startTime} />
          <div className="space-y-4 overflow-y-auto p-4">
            <label className="block text-sm font-medium">
              Fecha
              <input name="date" type="date" required defaultValue={date} className="dashboard-field mt-1.5" />
            </label>
            <p className="text-sm text-muted">{time} · Hora de Chile</p>
            <label className="block text-sm font-medium">
              Nota
              <textarea name="note" required maxLength={4000} rows={4} autoFocus className="dashboard-field mt-1.5 resize-y" />
            </label>
            {associationFields}
          </div>
          <DashboardFormFooter error={error}>
            <DashboardFormActions isSaving={pending} onCancel={() => { if (!saving.current) onClose(); }} submitLabel="Guardar recordatorio" />
          </DashboardFormFooter>
        </form>
      )}
    </DashboardFormModal>
  );
}
