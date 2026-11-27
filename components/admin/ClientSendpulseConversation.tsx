"use client";

import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import type { SendpulseConversation } from "@/lib/sendpulse/conversation";

type ConversationOption = {
  externalId: string;
  name: string;
};

const dateTime = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago",
});

export function ClientSendpulseConversation({ accountId, options }: { accountId: string; options: ConversationOption[] }) {
  const [selectedId, setSelectedId] = useState(options[0]?.externalId ?? "");
  const [snapshots, setSnapshots] = useState<Record<string, SendpulseConversation>>({});
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const selected = options.find(({ externalId }) => externalId === selectedId) ?? options[0];
  const externalId = selected?.externalId;
  const endpoint = `/api/clientes/${encodeURIComponent(accountId)}/conversacion-sendpulse`;

  useEffect(() => {
    if (!externalId) return;
    const controller = new AbortController();
    fetch(`${endpoint}?externalId=${encodeURIComponent(externalId)}`, { signal: controller.signal })
      .then(async (response) => response.ok ? await response.json() as SendpulseConversation | null : null)
      .then((cached) => {
        if (cached && !controller.signal.aborted) {
          setSnapshots((current) => current[externalId] ? current : { ...current, [externalId]: cached });
        }
      })
      .catch(() => {});
    return () => controller.abort();
  }, [endpoint, externalId]);

  if (!selected) return null;

  const snapshot = snapshots[selected.externalId];

  async function refresh(externalId: string) {
    setPending(true);
    setError("");
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ externalId }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error || "No se pudo actualizar la conversación de SendPulse.");
      }
      const data = await response.json() as SendpulseConversation;
      setSnapshots((current) => ({ ...current, [externalId]: data }));
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo actualizar la conversación de SendPulse.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section aria-label="Conversación en SendPulse" className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">Conversación en SendPulse</h2>
          <p className="mt-1 text-sm text-muted" role="status">{snapshot
            ? `Última actualización · ${dateTime.format(new Date(snapshot.refreshedAt))}`
            : "Pulsa Actualizar conversación para consultar los mensajes recientes."}</p>
        </div>
        <button type="button" disabled={pending} onClick={() => void refresh(selected.externalId)}
          className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/5 disabled:opacity-60">
          <RefreshCw size={16} aria-hidden="true" className={pending ? "motion-safe:animate-spin" : undefined} />
          {pending ? "Actualizando…" : "Actualizar conversación"}
        </button>
      </div>
      {options.length > 1 && <label className="block max-w-sm text-sm font-medium">
        Contacto
        <select value={selected.externalId} disabled={pending} onChange={(event) => {
          setSelectedId(event.target.value);
          setError("");
        }} className="dashboard-field mt-1.5 min-h-11 rounded-xl px-3">
          {options.map(({ externalId, name }) => <option key={externalId} value={externalId}>{name}</option>)}
        </select>
      </label>}
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      {snapshot && (snapshot.messages.length > 0 ? (
        <ol aria-label="Mensajes recientes" className="max-h-96 space-y-2 overflow-y-auto rounded-xl bg-slate-50 p-3">
          {snapshot.messages.map((message) => <li key={message.id} className={`w-fit max-w-full rounded-xl px-3 py-2 sm:max-w-[85%] ${message.direction === "outgoing" ? "ml-auto bg-primary/10" : "border border-border bg-white"}`}>
            <div className="flex flex-wrap gap-x-2 text-xs text-muted">
              <span className="font-semibold">{message.direction === "incoming" ? selected.name : "SmartPro"}</span>
              {message.sentAt && <time dateTime={message.sentAt}>{dateTime.format(new Date(message.sentAt))}</time>}
            </div>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm">{message.text}</p>
          </li>)}
        </ol>
      ) : <p className="text-sm text-muted">SendPulse no tiene mensajes recientes para este contacto.</p>)}
    </section>
  );
}
