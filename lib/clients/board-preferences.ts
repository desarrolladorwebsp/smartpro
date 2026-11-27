import { CRM_COLUMNS, DEFAULT_CRM_STAGES, isClientStatus, type ClientStatus, type CrmColumn } from "./types";

export type BoardDisplay = {
  view: "board" | "list" | "archived";
  statuses: ClientStatus[];
  executives: string[];
  services: string[];
  columns: CrmColumn[];
};

export type BoardCardOrder = Partial<Record<CrmColumn, string[]>>;

export type ClientBoardPreferences = {
  display: BoardDisplay;
  collapsed: string[] | null;
  cardOrder: BoardCardOrder;
};

export type ClientBoardPreferencePatch = Partial<Omit<ClientBoardPreferences, "collapsed"> & { collapsed: string[] }>;

const columnIds = CRM_COLUMNS.map(({ id }) => id);
export const defaultBoardDisplay: BoardDisplay = {
  view: "board", statuses: [], executives: [], services: [],
  columns: DEFAULT_CRM_STAGES.map(({ id }) => id),
};

function object(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : undefined;
}

export function parseBoardCardIds(value: unknown) {
  if (!Array.isArray(value)) return undefined;
  return [...new Set(value.filter((id): id is string => typeof id === "string" && /^(business|person):[^:]{1,191}$/.test(id)))];
}

function filterValues(value: unknown) {
  const candidates: unknown[] = Array.isArray(value) ? value : [value];
  return [...new Set(candidates.flatMap((entry) => typeof entry === "string" && entry ? [entry.slice(0, 191)] : []))];
}

export function parseClientBoardPreferencePatch(value: unknown): ClientBoardPreferencePatch {
  const input = object(value);
  if (!input) return {};
  const patch: ClientBoardPreferencePatch = {};
  const display = object(input.display);
  if (display) {
    const { view, columns } = display;
    patch.display = {
      view: view === "list" || view === "archived" ? view : "board",
      statuses: filterValues(display.statuses ?? display.status).filter(isClientStatus),
      executives: filterValues(display.executives ?? display.executive),
      services: filterValues(display.services ?? display.service),
      columns: Array.isArray(columns) ? columnIds.filter((column) => columns.includes(column)) : defaultBoardDisplay.columns,
    };
  }
  const collapsed = parseBoardCardIds(input.collapsed);
  if (collapsed) patch.collapsed = collapsed;
  const order = object(input.cardOrder);
  if (order) {
    patch.cardOrder = {};
    for (const column of columnIds) {
      const cards = parseBoardCardIds(order[column]);
      if (cards?.length) patch.cardOrder[column] = cards;
    }
  }
  return patch;
}

export function resolveClientBoardPreferences(value: unknown): ClientBoardPreferences {
  const patch = parseClientBoardPreferencePatch(value);
  return {
    display: patch.display ?? defaultBoardDisplay,
    collapsed: patch.collapsed ?? null,
    cardOrder: patch.cardOrder ?? {},
  };
}

export function orderClientCards<T extends { id: string; name: string; crmPosition?: number | null }>(cards: T[], personalOrder: string[] = []) {
  const rank = new Map(personalOrder.map((id, index) => [id, index]));
  return cards.sort((a, b) => (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity)
    || (a.crmPosition ?? Infinity) - (b.crmPosition ?? Infinity)
    || a.name.localeCompare(b.name, "es-CL") || a.id.localeCompare(b.id));
}

export function moveClientCardInOrder(ids: string[], id: string, anchor: { key: string; after: boolean }) {
  const remaining = ids.filter((key) => key !== id);
  const index = remaining.indexOf(anchor.key);
  if (index < 0) return ids;
  remaining.splice(index + Number(anchor.after), 0, id);
  return remaining;
}
