import { listCrmHistory } from "@/lib/clients/crm-history";
import { CRM_STAGES, getClientStatusLabel, isClientStatus } from "@/lib/clients/types";
import { CRM_ARCHIVE_STATES } from "@/lib/clients/crm-archive";

const dateFormat = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" });

function stateLabel(value: string) {
  return [...CRM_STAGES, ...CRM_ARCHIVE_STATES].find((entry) => entry.id === value)?.label ??
    (isClientStatus(value) ? getClientStatusLabel(value) : value);
}

export async function ClientCrmHistory({ accountId, clientId }: { accountId: string | null; clientId?: string }) {
  const history = await listCrmHistory(accountId, clientId);
  return (
    <section className="space-y-3 rounded-2xl border border-border bg-white p-5">
      <h2 className="font-semibold">Historial de estados</h2>
      {history.length === 0 && <p className="text-sm text-muted">Los próximos cambios de estado aparecerán aquí.</p>}
      <ul className="divide-y divide-border">
        {history.map((entry) => (
          <li key={entry.id} className="space-y-1 py-3 text-sm">
            <p className="font-medium">{stateLabel(entry.fromState)} → {stateLabel(entry.toState)}</p>
            {entry.note && <p className="whitespace-pre-wrap break-words">{entry.note}</p>}
            {entry.reactivateOn && <p className="text-muted">Reactivación programada · {entry.reactivateOn.toISOString().slice(0, 10).split("-").reverse().join("/")}</p>}
            <p className="break-words text-xs text-muted">
              <time dateTime={entry.createdAt.toISOString()}>{dateFormat.format(entry.createdAt)}</time> · {entry.actorEmail}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
