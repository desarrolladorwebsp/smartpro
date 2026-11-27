import { ArrowLeftRight, ChevronDown } from "lucide-react";
import { CRM_ARCHIVE_STATES, isCrmArchiveState } from "@/lib/clients/crm-archive";
import { CRM_STAGES, isClientCrmStage, type CrmColumn } from "@/lib/clients/types";

export function ClientStageSelect({ name, currentStage, onSelect, locked = false, saving = false }: {
  name: string;
  currentStage: CrmColumn;
  onSelect: (stage: CrmColumn) => void;
  locked?: boolean;
  saving?: boolean;
}) {
  return (
    <div className="relative">
      <ArrowLeftRight size={15} aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
      <select data-stage-control aria-label={`Cambiar estado de ${name}`} value="" aria-disabled={locked}
        className="min-h-11 w-full appearance-none rounded-lg border border-border bg-white px-8 text-center text-xs font-semibold text-foreground hover:bg-slate-50 focus-visible:outline-primary aria-disabled:opacity-60 lg:min-h-9"
        onChange={(event) => {
          const stage = event.currentTarget.value;
          if (!locked && (isClientCrmStage(stage) || isCrmArchiveState(stage))) onSelect(stage);
        }}>
        <option value="">{saving ? "Guardando…" : "Cambiar etapa"}</option>
        {CRM_STAGES.filter(({ id }) => id !== currentStage).map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
        {isClientCrmStage(currentStage) && CRM_ARCHIVE_STATES.map(({ id, label }) => <option key={id} value={id}>{label}</option>)}
      </select>
      <ChevronDown size={14} aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}
