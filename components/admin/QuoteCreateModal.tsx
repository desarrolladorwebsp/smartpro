"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pencil, Plus, Search, Trash2, X } from "lucide-react";

import type { ClientRecord } from "@/lib/clients/types";
import { formatCurrency, TAX_RATE } from "@/lib/orders/service";
import {
  QUOTE_DEFAULT_DELIVERY_DAYS,
  QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT,
  QUOTE_DEFAULT_VALIDITY_DAYS,
} from "@/lib/quotes/company";
import { CUSTOM_QUOTE_SERVICE_LABEL, parseCustomQuoteItemInput } from "@/lib/quotes/custom-item";
import type { QuoteCatalogGroup, QuoteCatalogPlan, QuoteRecord } from "@/lib/quotes/types";

type SelectedCatalogPlan = {
  kind: "catalog";
  plan: QuoteCatalogPlan;
  quantity: number;
};

type SelectedCustomService = {
  kind: "custom";
  id: string;
  name: string;
  unitPrice: number;
  quantity: number;
  includedItems: string[];
};

type SelectedEntry = SelectedCatalogPlan | SelectedCustomService;

type CustomDraft = {
  id: string | null;
  name: string;
  price: string;
  items: string[];
};

type QuoteCreateModalProps = {
  open: boolean;
  onClose: () => void;
  client?: ClientRecord | null;
  clients?: ClientRecord[];
  onCreated?: (quote: QuoteRecord) => void;
};

function defaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + QUOTE_DEFAULT_VALIDITY_DAYS);
  return date.toISOString().slice(0, 10);
}

function emptyCustomDraft(): CustomDraft {
  return { id: null, name: "", price: "", items: [""] };
}

function customDraftIsDirty(draft: CustomDraft): boolean {
  return Boolean(draft.name.trim() || draft.price.trim() || draft.items.some((item) => item.trim()));
}

function selectedKey(entry: SelectedEntry): string {
  return entry.kind === "catalog" ? entry.plan.id : entry.id;
}

function lineSubtotal(entry: SelectedEntry): number {
  if (entry.kind === "catalog") return entry.plan.price * entry.quantity;
  return entry.unitPrice * entry.quantity;
}

function lineTax(entry: SelectedEntry): number {
  if (entry.kind === "catalog") return entry.plan.price * entry.quantity * entry.plan.taxRate;
  return entry.unitPrice * entry.quantity * TAX_RATE;
}

export function QuoteCreateModal({ open, ...props }: QuoteCreateModalProps) {
  if (!open) return null;
  return <QuoteCreateForm {...props} />;
}

function QuoteCreateForm({ onClose, client, clients = [], onCreated }: Omit<QuoteCreateModalProps, "open">) {
  const isSavingRef = useRef(false);
  const [catalog, setCatalog] = useState<QuoteCatalogGroup[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [clientId, setClientId] = useState(client?.id ?? "");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<SelectedEntry[]>([]);
  const [customDraft, setCustomDraft] = useState<CustomDraft | null>(null);
  const [customError, setCustomError] = useState("");
  const [customFocusToken, setCustomFocusToken] = useState(0);
  const customSectionRef = useRef<HTMLElement>(null);
  const customNameRef = useRef<HTMLInputElement>(null);
  const [notes, setNotes] = useState("");
  const [validUntil, setValidUntil] = useState(defaultValidUntil);
  const [deliveryBusinessDays, setDeliveryBusinessDays] = useState(String(QUOTE_DEFAULT_DELIVERY_DAYS));
  const [initialPaymentPercent, setInitialPaymentPercent] = useState(String(QUOTE_DEFAULT_INITIAL_PAYMENT_PERCENT));
  const [submitError, setSubmitError] = useState("");
  const [isSaving, setIsSaving] = useState<"DRAFT" | "CREATED" | null>(null);

  useEffect(() => {
    let cancelled = false;

    void fetch("/api/quotes/catalog", { cache: "no-store" })
      .then(async (response) => {
        const data = (await response.json().catch(() => ({}))) as { catalog?: QuoteCatalogGroup[]; error?: string };
        if (!response.ok) {
          throw new Error(data.error ?? "No se pudo cargar el catálogo.");
        }
        if (!cancelled) {
          setCatalog(Array.isArray(data.catalog) ? data.catalog : []);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCatalogError(error instanceof Error ? error.message : "No se pudo cargar el catálogo.");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingCatalog(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isSavingRef.current) onClose();
    };
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);

  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return catalog;

    return catalog
      .map((group) => ({
        ...group,
        plans: group.plans.filter((plan) =>
          [plan.name, plan.categoryName, plan.subcategoryName, plan.summary].join(" ").toLowerCase().includes(query),
        ),
      }))
      .filter((group) => group.plans.length > 0);
  }, [catalog, search]);

  const totals = useMemo(() => {
    const subtotal = selected.reduce((sum, item) => sum + lineSubtotal(item), 0);
    const tax = selected.reduce((sum, item) => sum + lineTax(item), 0);
    return { subtotal, tax, total: subtotal + tax };
  }, [selected]);

  useEffect(() => {
    if (!customFocusToken) return;
    customSectionRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    customNameRef.current?.focus();
  }, [customFocusToken]);

  function openCustomDraft(draft: CustomDraft = emptyCustomDraft()) {
    setCustomDraft(draft);
    setCustomError("");
    setSubmitError("");
    setCustomFocusToken((current) => current + 1);
  }

  function addPlan(plan: QuoteCatalogPlan) {
    setSelected((current) => {
      if (current.some((entry) => entry.kind === "catalog" && entry.plan.id === plan.id)) return current;
      return [...current, { kind: "catalog", plan, quantity: 1 }];
    });
    setSubmitError("");
  }

  function removeEntry(key: string) {
    setSelected((current) => current.filter((entry) => selectedKey(entry) !== key));
    setCustomDraft((current) => (current?.id === key ? null : current));
    setCustomError("");
  }

  function updateQuantity(key: string, quantity: number) {
    setSelected((current) =>
      current.map((entry) => {
        if (selectedKey(entry) !== key) return entry;
        const next = Math.max(1, Math.trunc(quantity) || 1);
        return { ...entry, quantity: entry.kind === "custom" ? Math.min(99, next) : next };
      }),
    );
  }

  function updateCustomDraft(patch: Partial<CustomDraft>) {
    setCustomDraft((current) => (current ? { ...current, ...patch } : current));
    setCustomError("");
  }

  function updateCustomDraftItem(index: number, value: string) {
    setCustomDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        items: current.items.map((item, itemIndex) => (itemIndex === index ? value : item)),
      };
    });
    setCustomError("");
  }

  function commitCustomDraft() {
    if (!customDraft) return;

    try {
      const parsed = parseCustomQuoteItemInput({
        name: customDraft.name,
        unitPrice: customDraft.price,
        includedItems: customDraft.items,
      });
      setSelected((current) => {
        if (customDraft.id) {
          return current.map((entry) =>
            entry.kind === "custom" && entry.id === customDraft.id
              ? {
                  ...entry,
                  name: parsed.name,
                  unitPrice: parsed.unitPrice,
                  includedItems: parsed.includedItems,
                }
              : entry,
          );
        }

        return [
          ...current,
          {
            kind: "custom",
            id: crypto.randomUUID(),
            name: parsed.name,
            unitPrice: parsed.unitPrice,
            quantity: parsed.quantity,
            includedItems: parsed.includedItems,
          },
        ];
      });
      setCustomDraft(null);
      setCustomError("");
      setSubmitError("");
    } catch (error) {
      setCustomError(error instanceof Error ? error.message : "Revisa el servicio único.");
    }
  }

  async function save(status: "DRAFT" | "CREATED") {
    if (isSavingRef.current) return;
    if (!clientId) {
      setSubmitError("Selecciona un cliente.");
      return;
    }
    if (customDraft && customDraftIsDirty(customDraft)) {
      setSubmitError("Guarda o cancela el servicio único que estás editando.");
      setCustomError("Guarda o cancela este servicio antes de crear la cotización.");
      setCustomFocusToken((current) => current + 1);
      return;
    }
    if (selected.length === 0) {
      setSubmitError("Agrega al menos un plan o servicio.");
      return;
    }

    isSavingRef.current = true;
    setIsSaving(status);
    setSubmitError("");

    try {
      const response = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          status,
          notes,
          validUntil: validUntil || null,
          deliveryBusinessDays,
          initialPaymentPercent,
          items: selected.map((item) =>
            item.kind === "catalog"
              ? { planId: item.plan.id, quantity: item.quantity }
              : {
                  name: item.name,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity,
                  includedItems: item.includedItems,
                },
          ),
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { quote?: QuoteRecord; error?: string };

      if (!response.ok || !data.quote) {
        setSubmitError(data.error ?? "No se pudo guardar la cotización.");
        return;
      }

      onCreated?.(data.quote);
      onClose();
    } catch {
      setSubmitError("No se pudo guardar la cotización.");
    } finally {
      isSavingRef.current = false;
      setIsSaving(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/35 p-3 sm:p-4" role="presentation">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quote-create-title"
        className="flex max-h-[min(92vh,880px)] w-full max-w-5xl flex-col overflow-hidden rounded-[26px] border border-border bg-white shadow-[0_24px_64px_rgba(16,16,36,0.20)]"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">Cotizaciones</p>
            <h2 id="quote-create-title" className="mt-1 text-2xl font-bold tracking-[-0.05em] text-foreground">
              Nueva cotización
            </h2>
            <p className="mt-1 text-sm text-muted">
              {client ? `${client.companyName} · ${client.contactFirstName} ${client.contactLastName}` : "Selecciona cliente, planes y condiciones."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={Boolean(isSaving)}
            aria-label="Cerrar modal"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border text-muted transition hover:border-primary/30 hover:text-primary disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          <div className="grid gap-5 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-4">
              {!client ? (
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-foreground">Cliente</span>
                  <select value={clientId} onChange={(event) => setClientId(event.target.value)} className="dashboard-field">
                    <option value="">Selecciona un cliente</option>
                    {clients.map((entry) => (
                      <option key={entry.id} value={entry.id}>
                        {entry.companyName} — {entry.contactFirstName} {entry.contactLastName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="relative block">
                <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="dashboard-field pl-9"
                  placeholder="Buscar plan o servicio"
                />
              </label>

              {isLoadingCatalog ? <p className="text-sm text-muted">Cargando catálogo...</p> : null}
              {catalogError ? <p className="text-sm text-red-600">{catalogError}</p> : null}

              <div className="space-y-4">
                <section ref={customSectionRef}>
                  <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{CUSTOM_QUOTE_SERVICE_LABEL}</h3>
                  <article className="rounded-2xl border border-primary/30 bg-primary/[0.04] p-3">
                    {customDraft ? (
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-foreground">{CUSTOM_QUOTE_SERVICE_LABEL}</p>
                          <p className="text-xs text-muted">
                            Servicio fuera del catálogo. El nombre, el precio y los ítems se muestran en la cotización igual que un plan.
                          </p>
                        </div>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-foreground">Nombre</span>
                          <input
                            ref={customNameRef}
                            value={customDraft.name}
                            onChange={(event) => updateCustomDraft({ name: event.target.value })}
                            className="dashboard-field"
                            placeholder="Ej. Landing para campaña"
                            maxLength={120}
                            disabled={Boolean(isSaving)}
                          />
                        </label>
                        <label className="block">
                          <span className="mb-1.5 block text-sm font-semibold text-foreground">Precio neto</span>
                          <input
                            value={customDraft.price}
                            onChange={(event) => updateCustomDraft({ price: event.target.value })}
                            className="dashboard-field"
                            inputMode="numeric"
                            placeholder="150000"
                            disabled={Boolean(isSaving)}
                          />
                          <span className="mt-1 block text-xs text-muted">Sin IVA. El impuesto se calcula al guardar, igual que en el catálogo.</span>
                        </label>
                        <div>
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-foreground">Ítems</span>
                            <button
                              type="button"
                              onClick={() => updateCustomDraft({ items: [...customDraft.items, ""] })}
                              disabled={Boolean(isSaving)}
                              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                            >
                              Agregar ítem
                            </button>
                          </div>
                          <div className="space-y-1.5">
                            {customDraft.items.map((item, index) => (
                              <div key={`custom-item-${index}`} className="flex items-center gap-1.5">
                                <input
                                  value={item}
                                  onChange={(event) => updateCustomDraftItem(index, event.target.value)}
                                  className="dashboard-field"
                                  placeholder="Ej. Diseño de 5 piezas"
                                  maxLength={180}
                                  aria-label={`Ítem ${index + 1}`}
                                  disabled={Boolean(isSaving)}
                                />
                                {customDraft.items.length > 1 ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateCustomDraft({
                                        items: customDraft.items.filter((_, itemIndex) => itemIndex !== index),
                                      })
                                    }
                                    disabled={Boolean(isSaving)}
                                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-white hover:text-foreground disabled:opacity-50"
                                    aria-label={`Quitar ítem ${index + 1}`}
                                  >
                                    <X size={14} />
                                  </button>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        </div>
                        {customError ? <p className="text-sm text-red-600">{customError}</p> : null}
                        <div className="flex flex-wrap justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setCustomDraft(null);
                              setCustomError("");
                            }}
                            disabled={Boolean(isSaving)}
                            className="min-h-9 rounded-full border border-border px-3 text-sm font-semibold disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={commitCustomDraft}
                            disabled={Boolean(isSaving)}
                            className="min-h-9 rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white disabled:opacity-60"
                          >
                            {customDraft.id ? "Guardar cambios" : "Agregar servicio"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-foreground">{CUSTOM_QUOTE_SERVICE_LABEL}</p>
                          <p className="text-xs text-muted">Agrega un servicio que no está en el catálogo, con nombre, precio e ítems.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openCustomDraft()}
                          disabled={Boolean(isSaving)}
                          aria-label="Agregar servicio único"
                          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Plus size={16} strokeWidth={2.4} />
                        </button>
                      </div>
                    )}
                  </article>
                </section>

                {filteredCatalog.map((group) => (
                  <section key={group.id}>
                    <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">{group.name}</h3>
                    <div className="space-y-2">
                      {group.plans.map((plan) => {
                        const isSelected = selected.some((entry) => entry.kind === "catalog" && entry.plan.id === plan.id);
                        return (
                          <article
                            key={plan.id}
                            className={`rounded-2xl border p-3 transition ${
                              isSelected ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-slate-50/80"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-foreground">{plan.name}</p>
                                <p className="text-xs text-muted">{plan.subcategoryName}</p>
                              </div>
                              <p className="shrink-0 text-sm font-semibold text-primary">{formatCurrency(plan.price)}</p>
                              <button
                                type="button"
                                onClick={() => addPlan(plan)}
                                disabled={isSelected || Boolean(isSaving)}
                                aria-label={isSelected ? `${plan.name} ya está agregado` : `Agregar ${plan.name}`}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-primary to-magenta text-white disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                <Plus size={16} strokeWidth={2.4} />
                              </button>
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-0">
              <div className="rounded-[20px] border border-border bg-white p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Servicios agregados</p>
                {selected.length === 0 ? (
                  <p className="mt-3 text-sm text-muted">Usa el botón + para agregar un servicio único o un plan del catálogo.</p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {selected.map((item) => {
                      const key = selectedKey(item);
                      const name = item.kind === "catalog" ? item.plan.name : item.name;
                      const price = item.kind === "catalog" ? item.plan.price : item.unitPrice;
                      const isEditing = item.kind === "custom" && customDraft?.id === item.id;

                      return (
                        <li
                          key={key}
                          className={`rounded-2xl border p-3 ${isEditing ? "border-primary/40 bg-primary/[0.04]" : "border-border bg-slate-50/80"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-foreground">{name}</p>
                              <p className="text-xs text-muted">
                                {formatCurrency(price)}
                                {item.kind === "custom" ? ` · ${CUSTOM_QUOTE_SERVICE_LABEL}` : ""}
                              </p>
                            </div>
                            <div className="flex shrink-0">
                              {item.kind === "custom" ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    openCustomDraft({
                                      id: item.id,
                                      name: item.name,
                                      price: String(item.unitPrice),
                                      items: [...item.includedItems],
                                    })
                                  }
                                  aria-label={`Editar ${name}`}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-primary"
                                >
                                  <Pencil size={15} />
                                </button>
                              ) : null}
                              <button
                                type="button"
                                onClick={() => removeEntry(key)}
                                aria-label={`Quitar ${name}`}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition hover:bg-white hover:text-red-600"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                          {item.kind === "custom" ? (
                            <ul className="mt-2 list-disc space-y-0.5 pl-4 text-xs text-foreground">
                              {item.includedItems.map((feature) => (
                                <li key={feature}>{feature}</li>
                              ))}
                            </ul>
                          ) : null}
                          <label className="mt-2 inline-flex items-center gap-2 text-xs font-medium text-foreground">
                            Cantidad
                            <input
                              type="number"
                              min={1}
                              max={item.kind === "custom" ? 99 : undefined}
                              value={item.quantity}
                              onChange={(event) => updateQuantity(key, Number(event.target.value))}
                              className="dashboard-field h-9 w-20 px-2"
                            />
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              <div className="rounded-[20px] border border-border bg-slate-50/80 p-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">Resumen</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between gap-3"><span className="text-muted">Ítems</span><span>{selected.length}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted">Subtotal</span><span>{formatCurrency(totals.subtotal)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-muted">IVA</span><span>{formatCurrency(totals.tax)}</span></div>
                  <div className="flex justify-between gap-3 border-t border-border pt-2 font-semibold"><span>Total</span><span className="text-primary">{formatCurrency(totals.total)}</span></div>
                </div>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Fecha de vencimiento</span>
                <input type="date" value={validUntil} onChange={(event) => setValidUntil(event.target.value)} className="dashboard-field" />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Plazo de entrega (días hábiles)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={deliveryBusinessDays}
                  onChange={(event) => setDeliveryBusinessDays(event.target.value)}
                  className="dashboard-field"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Porcentaje de pago inicial</span>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={initialPaymentPercent}
                  onChange={(event) => setInitialPaymentPercent(event.target.value)}
                  className="dashboard-field"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-sm font-semibold text-foreground">Observaciones</span>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  className="dashboard-field min-h-24 resize-y"
                  placeholder="Notas internas o condiciones adicionales."
                />
              </label>
            </aside>
          </div>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-5 py-4 sm:px-6">
          {submitError ? <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700" role="alert">{submitError}</p> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={onClose} disabled={Boolean(isSaving)} className="min-h-11 rounded-full border border-border px-4 text-sm font-semibold disabled:opacity-50">
              Cancelar
            </button>
            <button type="button" onClick={() => void save("DRAFT")} disabled={Boolean(isSaving)} className="min-h-11 rounded-full border border-primary/25 px-4 text-sm font-semibold text-primary disabled:opacity-60">
              {isSaving === "DRAFT" ? "Guardando..." : "Guardar borrador"}
            </button>
            <button type="button" onClick={() => void save("CREATED")} disabled={Boolean(isSaving)} className="min-h-11 rounded-full bg-gradient-to-r from-primary to-magenta px-5 text-sm font-semibold text-white disabled:opacity-60">
              {isSaving === "CREATED" ? "Creando..." : "Crear cotización"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
