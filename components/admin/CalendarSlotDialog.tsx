"use client";

import { useId, useLayoutEffect, useRef, useState, type FormEvent } from "react";
import { Bell, Plus, Video } from "lucide-react";

import type { CalendarActivity, CalendarClient, CalendarParticipant, CalendarReminder, CalendarZoomMeeting } from "./calendar-types";
import { createCalendarReminder, bookCalendarZoomMeeting, updateCalendarReminder, updateCalendarZoomMeeting } from "@/app/dashboard/calendario/actions";
import { formatCalendarTime } from "@/lib/calendar-slots";
import { parseCommercialClientId } from "@/lib/clients/commercial-clients";
import { AccountContactForm } from "./ClientAccountForms";
import { CalendarScheduleFields } from "./CalendarScheduleFields";
import { activityNoticeMessage, CalendarNotificationFields } from "./CalendarNotificationFields";
import { DashboardFormActions, DashboardFormFooter, DashboardFormModal } from "./dashboard-form";

function normalizeSearch(value: string) {
  return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es-CL");
}

export function CalendarSlotDialog({ date, startTime, zoomConfigured, clients, participants, initialClientKey, onClose, onSaved, onMeetingSaved, onContactAdded, editing, today = date }: {
  date: string;
  startTime?: string;
  editing?: CalendarActivity;
  today?: string;
  zoomConfigured: boolean;
  clients: CalendarClient[];
  participants: CalendarParticipant[];
  initialClientKey: string;
  onClose: () => void;
  onSaved: (reminder: CalendarReminder, message?: string) => void;
  onMeetingSaved?: (meeting: CalendarZoomMeeting, message?: string) => void;
  onContactAdded: (clientKey: string, contact: CalendarClient["contacts"][number]) => void;
}) {
  const [mode, setMode] = useState<"choose" | "zoom" | "reminder">(() =>
    editing ? ("joinUrl" in editing ? "zoom" : "reminder") : "choose");
  const editingMeeting = editing && "joinUrl" in editing ? editing : null;
  const editingReminder = editing && "note" in editing ? editing : null;
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const saving = useRef(false);
  const [clientKey, setClientKey] = useState(editing ? (editing.clientKey ?? "") : initialClientKey);
  const [clientQuery, setClientQuery] = useState("");
  const searchInput = useRef<HTMLInputElement>(null);
  const searchResults = useRef<HTMLDivElement>(null);
  const searchResultsId = useId();
  const [contactId, setContactId] = useState(editing?.contactId ?? "");
  const [addedContacts, setAddedContacts] = useState<Record<string, CalendarClient["contacts"]>>({});
  const [addingContact, setAddingContact] = useState(false);
  const addContactButton = useRef<HTMLButtonElement>(null);
  const [deliveries, setDeliveries] = useState<{
    internalInvitation?: "sent" | "failed";
    existing?: boolean;
  }>({});
  const [copyStatus, setCopyStatus] = useState("");
  const [meeting, setMeeting] = useState<CalendarZoomMeeting | null>(null);
  const selectedClient = clients.find((client) => client.id === clientKey);
  const clientInField = !startTime ? selectedClient : undefined;
  const contacts = [
    ...(selectedClient?.contacts ?? []),
    ...(addedContacts[clientKey] ?? []).filter((contact) => !selectedClient?.contacts.some(({ id }) => id === contact.id)),
  ];
  const timeLabel = startTime ? formatCalendarTime(startTime) : "";
  const selectedAccount = selectedClient ? parseCommercialClientId(selectedClient.id) : null;
  const accountId = selectedAccount?.kind === "business" ? selectedAccount.id : null;
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
          <input ref={searchInput} type="search" aria-label={clientInField ? "Cliente seleccionado" : "Buscar cliente"}
            aria-controls={clientInField ? undefined : searchResultsId} placeholder="Buscar por nombre"
            value={clientInField?.name ?? clientQuery} readOnly={Boolean(clientInField)}
            onChange={(event) => setClientQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key !== "Enter") return;
              event.preventDefault();
              if (matchingClients.length === 1) chooseClient(matchingClients[0].id);
            }}
            className="dashboard-field mt-1.5 w-full" />
        </label>
        {clientKey && (
          <div className={clientInField ? "flex justify-end text-xs text-primary" : "flex items-center justify-between gap-2 rounded-lg bg-primary/10 px-2 py-1.5 text-xs text-primary"}>
            {!clientInField && <span className="min-w-0 break-words font-medium">{selectedClient?.name ?? "Cliente no disponible"}</span>}
            <button type="button" className="shrink-0 font-semibold underline" onClick={() => {
              chooseClient("");
              searchInput.current?.focus();
            }}>Quitar</button>
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
      <div className="min-w-0 space-y-1.5">
        <label className="block text-sm font-medium">
          Contacto (opcional)
          <select aria-label="Contacto (opcional)" name="contactId" value={contactId} onChange={(event) => setContactId(event.target.value)}
            disabled={!contacts.length} className="dashboard-field mt-1.5 disabled:opacity-60">
            <option value="">{clientKey ? (contacts.length ? "Sin contacto" : "Sin contactos disponibles") : "Selecciona un cliente primero"}</option>
            {contacts.map((contact) => (
              <option key={contact.id} value={contact.id}>
                {contact.email ? `${contact.name} - ${contact.email}` : contact.name}
              </option>
            ))}
          </select>
        </label>
        {accountId && (
          <button ref={addContactButton} type="button" onClick={() => setAddingContact(true)} disabled={pending}
            className="inline-flex min-h-8 items-center gap-1 rounded-lg px-1 text-xs font-semibold text-primary hover:bg-primary/10 focus-visible:outline-primary disabled:opacity-60">
            <Plus size={14} aria-hidden="true" /> Agregar contacto
          </button>
        )}
      </div>
    </div>
  );

  const savedEmail = editing && (editing.clientKey ?? "") === clientKey && (editing.contactId ?? "") === contactId
    ? editing.notificationTargets?.clientEmail : undefined;
  const contactEmail = contacts.find((contact) => contact.id === contactId)?.email
    ?? (selectedAccount?.kind === "person" && !contactId ? contacts[0]?.email : undefined);
  const notificationFields = (
    <CalendarNotificationFields participants={participants} initialIds={editing?.notificationTargets?.participantIds}
      clientEmail={savedEmail || contactEmail || ""} recipientKey={clientKey + ":" + contactId}
      zoom={mode === "zoom"} pending={pending} />
  );

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    const form = new FormData(event.currentTarget);
    saving.current = true;
    setPending(true);
    setError("");
    try {
      if (editingMeeting) {
        const result = await updateCalendarZoomMeeting(editingMeeting.id, form);
        if ("error" in result) setError(result.error ?? "No se pudo editar la reunión.");
        else {
          onMeetingSaved?.(result.meeting, activityNoticeMessage(result.notices));
          onClose();
        }
      } else if (editingReminder) {
        const result = await updateCalendarReminder(editingReminder.id, form);
        if ("error" in result) setError(result.error ?? "No se pudo editar el recordatorio.");
        else onSaved(result.reminder, activityNoticeMessage(result.notices));
      } else if (mode === "zoom") {
        const result = await bookCalendarZoomMeeting(form);
        if (result.meeting) {
          setMeeting(result.meeting);
          setDeliveries({
            internalInvitation: result.internalInvitation,
            existing: result.existing,
          });
          onMeetingSaved?.(result.meeting);
        } else setError(result.error);
      } else {
        const result = await createCalendarReminder(form);
        if ("error" in result) setError(result.error ?? "No se pudo guardar el recordatorio.");
        else onSaved(result.reminder, activityNoticeMessage(result.notices));
      }
    } catch {
      setError(editing ? "No se pudo confirmar el cambio. Revisa el calendario antes de guardar de nuevo."
        : mode === "zoom" ? "No se pudo confirmar la reserva. Revisa el calendario antes de volver a agendar."
        : "No se pudo guardar el recordatorio. Inténtalo de nuevo.");
    } finally {
      setPending(false);
      saving.current = false;
    }
  }

  const title = editingMeeting ? "Editar reunión de Zoom" : editingReminder ? "Editar recordatorio"
    : mode === "zoom" ? "Reunión por Zoom" : mode === "reminder" ? "Nuevo recordatorio" : "Agregar al calendario";

  function closeContactForm() {
    setAddingContact(false);
    requestAnimationFrame(() => addContactButton.current?.focus());
  }

  return (
    <>
    <div inert={addingContact} onKeyDown={(event) => {
      if (event.key === "Escape" && !saving.current) {
        event.preventDefault();
        onClose();
      }
    }}>
    <DashboardFormModal eyebrow="Calendario" title={title}
      onClose={() => { if (!saving.current) onClose(); }}>
      {mode === "choose" && (
        <div className="space-y-3 p-4">
          {startTime ? <p className="text-sm text-muted">{date.split("-").reverse().join("/")} · {timeLabel}</p>
            : <p className="text-sm text-muted">{selectedClient?.name}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" autoFocus onClick={() => setMode("zoom")} className="flex items-center gap-3 rounded-xl border border-border p-3 text-left font-medium hover:bg-primary/10">
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
          <p className="text-sm">{meeting.title} · {meeting.date.split("-").reverse().join("/")} · {formatCalendarTime(meeting.time)} · {meeting.duration} min</p>
          {meeting.clientInvitationStatus === "PENDING" && (
            <p role="status" className="text-sm text-amber-800">Invitación al cliente pendiente de entrega.</p>
          )}
          {meeting.clientInvitationStatus === "DELIVERED" && (
            <p role="status" className="text-sm text-emerald-700">Invitación entregada al servidor de correo del cliente.</p>
          )}
          {meeting.clientInvitationStatus === "FAILED" && (
            <p role="alert" className="text-sm text-amber-800">No se pudo enviar la invitación al cliente. Puedes compartir el enlace.</p>
          )}
          {deliveries.internalInvitation === "sent" && (
            <p role="status" className="text-sm text-emerald-700">Invitación interna enviada.</p>
          )}
          {deliveries.internalInvitation === "failed" && (
            <p role="alert" className="text-sm text-amber-800">Revisa el envío interno. Una o más copias no se pudieron enviar.</p>
          )}
          {deliveries.existing && (
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
          <div className="space-y-4 overflow-y-auto p-4">
            {startTime ? <>
              <input type="hidden" name="date" value={date} />
              <input type="hidden" name="time" value={startTime} />
              <p className="text-sm text-muted">{date.split("-").reverse().join("/")} · {timeLabel} · Hora de Chile</p>
            </> : <CalendarScheduleFields initialDate={date} minDate={date < today ? date : today}
              initialTime={editingMeeting?.time} activityId={editingMeeting?.id} kind="zoom" />}
            <label className="block text-sm font-medium">
              Título
              <input name="title" required maxLength={191} defaultValue={editingMeeting?.title ?? "Reunión SmartPro"} className="dashboard-field mt-1.5" />
            </label>
            <label className="block text-sm font-medium">
              Duración
              <select aria-label="Duración" name="duration" defaultValue={editingMeeting?.duration ?? 15} className="dashboard-field mt-1.5">
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="40">40 minutos</option>
              </select>
            </label>
            {associationFields}
            {notificationFields}
            {!zoomConfigured && <p className="text-sm text-muted">Conecta la cuenta de Zoom para agendar.</p>}
          </div>
          <DashboardFormFooter error={error}>
            <div className="flex justify-end gap-2">
              <button type="button" disabled={pending} onClick={onClose}
                className="h-9 rounded-full border border-border px-4 text-sm font-medium">Cancelar</button>
              <button type="submit" disabled={pending || !zoomConfigured}
                className="h-9 rounded-full bg-primary px-4 text-sm font-semibold text-white disabled:opacity-60">
                {pending ? (editing ? "Guardando…" : "Agendando…") : (editing ? "Guardar cambios" : "Agendar en Zoom")}
              </button>
            </div>
          </DashboardFormFooter>
        </form>
      ))}
      {mode === "reminder" && (
        <form onSubmit={save} className="flex min-h-0 flex-col">
          <div className="space-y-4 overflow-y-auto p-4">
            {startTime ? <>
              <input type="hidden" name="time" value={startTime} />
              <label className="block text-sm font-medium">
                Fecha
                <input name="date" type="date" required defaultValue={date} className="dashboard-field mt-1.5" />
              </label>
              <p className="text-sm text-muted">{timeLabel} · Hora de Chile</p>
            </> : <CalendarScheduleFields initialDate={date} initialTime={editingReminder?.time ?? undefined}
              allowUntimed={editingReminder?.time === null} activityId={editingReminder?.id} kind="reminder" />}
            <label className="block text-sm font-medium">
              Nota
              <textarea name="note" required maxLength={4000} rows={4} autoFocus defaultValue={editingReminder?.note} className="dashboard-field mt-1.5 resize-y" />
            </label>
            {associationFields}
            {notificationFields}
          </div>
          <DashboardFormFooter error={error}>
            <DashboardFormActions isSaving={pending} onCancel={() => { if (!saving.current) onClose(); }} submitLabel={editingReminder ? "Guardar cambios" : "Guardar recordatorio"} />
          </DashboardFormFooter>
        </form>
      )}
    </DashboardFormModal>
    </div>
    {addingContact && accountId && selectedClient && (
      <AccountContactForm accountId={accountId} accountName={selectedClient.name} onClose={closeContactForm}
        onSaved={(saved) => {
          const contact = {
            id: saved.legacyClientId,
            name: [saved.firstName, saved.lastName].filter(Boolean).join(" "),
            email: saved.email,
          };
          setAddedContacts((current) => ({ ...current, [selectedClient.id]: [...(current[selectedClient.id] ?? []), contact] }));
          onContactAdded(selectedClient.id, contact);
          setContactId(saved.legacyClientId);
          closeContactForm();
        }} />
    )}
    </>
  );
}
