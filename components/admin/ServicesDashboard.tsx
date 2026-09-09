"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import { getCatalogStatusLabel, type CatalogStatus, type CatalogTree, type ServicePlanRecord } from "@/lib/services/types";

type PlanFormState = {
  categoryId: string;
  subcategoryId: string;
  name: string;
  price: string;
  pricePrefix: string;
  taxLabel: string;
  summary: string;
  badge: string;
  note: string;
  featureGroupTitle: string;
  highlighted: boolean;
  sortOrder: string;
  status: CatalogStatus;
  items: string[];
};

const emptyPlanForm: PlanFormState = {
  categoryId: "",
  subcategoryId: "",
  name: "",
  price: "",
  pricePrefix: "",
  taxLabel: "+ IVA",
  summary: "",
  badge: "",
  note: "",
  featureGroupTitle: "Incluye",
  highlighted: false,
  sortOrder: "",
  status: "ACTIVE",
  items: [""],
};

const statusStyles: Record<CatalogStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-700",
};

function formatPrice(value: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

type ServicesDashboardProps = {
  initialTree: CatalogTree;
};

export function ServicesDashboard({ initialTree }: ServicesDashboardProps) {
  const router = useRouter();
  const [tree, setTree] = useState<CatalogTree>(initialTree);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogStatus | "TODOS">("TODOS");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [categoryName, setCategoryName] = useState("");
  const [subcategoryName, setSubcategoryName] = useState("");
  const [subcategoryCategoryId, setSubcategoryCategoryId] = useState("");
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceName, setEditingServiceName] = useState("");
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");

  const categories = tree;
  const subcategories = useMemo(
    () => tree.flatMap((category) => category.subcategories.map((subcategory) => ({ ...subcategory, categoryId: category.id }))),
    [tree],
  );
  const plans = useMemo(
    () => tree.flatMap((category) => category.subcategories.flatMap((subcategory) => subcategory.plans)),
    [tree],
  );

  const filteredPlans = useMemo(() => {
    const query = search.trim().toLowerCase();

    return plans.filter((plan) => {
      const matchesSearch =
        !query ||
        [plan.name, plan.categoryName, plan.subcategoryName, plan.badge, plan.summary]
          .join(" ")
          .toLowerCase()
          .includes(query);
      const matchesStatus = statusFilter === "TODOS" || plan.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [plans, search, statusFilter]);

  const subcategoriesForForm = subcategories.filter((subcategory) =>
    planForm.categoryId ? subcategory.categoryId === planForm.categoryId : true,
  );

  async function refreshCatalog() {
    const response = await fetch("/api/services", { method: "GET", cache: "no-store" });
    const data = (await response.json().catch(() => ({}))) as { tree?: CatalogTree };
    setTree(Array.isArray(data.tree) ? data.tree : []);
    router.refresh();
  }

  function openCreatePlan() {
    setEditingPlanId(null);
    setPlanForm({
      ...emptyPlanForm,
      categoryId: categories[0]?.id ?? "",
      subcategoryId: categories[0]?.subcategories[0]?.id ?? "",
    });
    setSubmitError("");
    setIsPlanModalOpen(true);
  }

  function openEditPlan(plan: ServicePlanRecord) {
    setEditingPlanId(plan.id);
    setPlanForm({
      categoryId: plan.categoryId,
      subcategoryId: plan.subcategoryId,
      name: plan.name,
      price: String(plan.price),
      pricePrefix: plan.pricePrefix,
      taxLabel: plan.taxLabel,
      summary: plan.summary,
      badge: plan.badge,
      note: plan.note,
      featureGroupTitle: plan.featureGroupTitle,
      highlighted: plan.highlighted,
      sortOrder: String(plan.sortOrder),
      status: plan.status,
      items: plan.items.length > 0 ? plan.items.map((item) => item.label) : [""],
    });
    setSubmitError("");
    setIsPlanModalOpen(true);
  }

  async function handleSavePlan(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");
    setIsSaving(true);

    try {
      const payload = {
        subcategoryId: planForm.subcategoryId,
        name: planForm.name.trim(),
        price: Number(planForm.price),
        pricePrefix: planForm.pricePrefix.trim(),
        taxLabel: planForm.taxLabel.trim() || "+ IVA",
        summary: planForm.summary.trim(),
        badge: planForm.badge.trim(),
        note: planForm.note.trim(),
        featureGroupTitle: planForm.featureGroupTitle.trim(),
        highlighted: planForm.highlighted,
        sortOrder: planForm.sortOrder.trim() === "" ? undefined : Number(planForm.sortOrder),
        status: planForm.status,
        items: planForm.items.map((label) => ({ label: label.trim() })).filter((item) => item.label),
      };

      const response = await fetch(editingPlanId ? `/api/services/${editingPlanId}` : "/api/services", {
        method: editingPlanId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo guardar el plan.");
        return;
      }

      setSuccessMessage(editingPlanId ? "Plan actualizado correctamente." : "Plan creado correctamente.");
      setIsPlanModalOpen(false);
      setPlanForm(emptyPlanForm);
      setEditingPlanId(null);
      await refreshCatalog();
    } catch {
      setSubmitError("No se pudo guardar el plan.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePlanStatus(planId: string, status: CatalogStatus) {
    const response = await fetch(`/api/services/${planId}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await refreshCatalog();
  }

  async function handleCreateCategory(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/services/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: categoryName }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSubmitError(data.error ?? "No se pudo crear el servicio.");
      return;
    }
    setCategoryName("");
    setSuccessMessage("Servicio creado correctamente.");
    await refreshCatalog();
  }

  async function handleCreateSubcategory(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/services/subcategories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId: subcategoryCategoryId, name: subcategoryName }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSubmitError(data.error ?? "No se pudo crear la categoría.");
      return;
    }
    setSubcategoryName("");
    setSuccessMessage("Categoría creada correctamente.");
    await refreshCatalog();
  }

  async function handleRenameService(id: string) {
    const response = await fetch("/api/services/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingServiceName }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSubmitError(data.error ?? "No se pudo actualizar el servicio.");
      return;
    }
    setEditingServiceId(null);
    setSuccessMessage("Servicio actualizado correctamente.");
    await refreshCatalog();
  }

  async function handleRenameCategory(id: string) {
    const response = await fetch("/api/services/subcategories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingCategoryName }),
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string };
    if (!response.ok) {
      setSubmitError(data.error ?? "No se pudo actualizar la categoría.");
      return;
    }
    setEditingCategoryId(null);
    setSuccessMessage("Categoría actualizada correctamente.");
    await refreshCatalog();
  }

  async function handleCategoryStatus(id: string, status: CatalogStatus) {
    const response = await fetch(`/api/services/categories/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await refreshCatalog();
  }

  async function handleSubcategoryStatus(id: string, status: CatalogStatus) {
    const response = await fetch(`/api/services/subcategories/${id}/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (response.ok) await refreshCatalog();
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="servicios"
        eyebrow="Catálogo"
        title="Gestión de servicios"
        description="Administra servicios, categorías, planes e ítems incluidos. La base de datos es la única fuente de verdad del catálogo."
        action={{ label: "Nuevo plan", onClick: openCreatePlan }}
      />

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar plan, servicio o categoría"
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary lg:max-w-md"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as CatalogStatus | "TODOS")}
            className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm text-foreground outline-none transition focus:border-primary lg:max-w-xs"
          >
            <option value="TODOS">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
      </div>

      {successMessage && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</div>
      )}
      {submitError && !isPlanModalOpen && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</div>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <h2 className="text-lg font-bold text-foreground">Servicios</h2>
          <form onSubmit={handleCreateCategory} className="mt-4 flex gap-2">
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="Nuevo servicio"
              className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-full bg-primary px-4 text-sm font-semibold text-white">
              Crear
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {categories.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay servicios.</p>
            ) : (
              categories.map((category) => (
                <div key={category.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-soft-background px-3 py-2">
                  <div className="min-w-0 flex-1">
                    {editingServiceId === category.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingServiceName}
                          onChange={(event) => setEditingServiceName(event.target.value)}
                          className="w-full rounded-xl border border-border bg-white px-3 py-1 text-sm outline-none focus:border-primary"
                        />
                        <button type="button" onClick={() => void handleRenameService(category.id)} className="text-sm font-medium text-primary">
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-foreground">{category.name}</div>
                        <div className="text-xs text-muted">{category.subcategories.length} categorías</div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingServiceId(category.id);
                        setEditingServiceName(category.name);
                      }}
                      className="text-xs font-medium text-primary"
                    >
                      Editar
                    </button>
                    <select
                      value={category.status}
                      onChange={(event) => handleCategoryStatus(category.id, event.target.value as CatalogStatus)}
                      className="rounded-full border border-border bg-white px-2 py-1 text-[11px]"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="rounded-[24px] border border-border bg-white p-5 shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
          <h2 className="text-lg font-bold text-foreground">Categorías</h2>
          <form onSubmit={handleCreateSubcategory} className="mt-4 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
            <select
              value={subcategoryCategoryId}
              onChange={(event) => setSubcategoryCategoryId(event.target.value)}
              className="rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Servicio</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              value={subcategoryName}
              onChange={(event) => setSubcategoryName(event.target.value)}
              placeholder="Nueva categoría"
              className="rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
            />
            <button type="submit" className="rounded-full bg-primary px-4 text-sm font-semibold text-white">
              Crear
            </button>
          </form>
          <div className="mt-4 space-y-2">
            {subcategories.length === 0 ? (
              <p className="text-sm text-muted">Aún no hay categorías.</p>
            ) : (
              subcategories.map((subcategory) => (
                <div key={subcategory.id} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-soft-background px-3 py-2">
                  <div className="min-w-0 flex-1">
                    {editingCategoryId === subcategory.id ? (
                      <div className="flex gap-2">
                        <input
                          value={editingCategoryName}
                          onChange={(event) => setEditingCategoryName(event.target.value)}
                          className="w-full rounded-xl border border-border bg-white px-3 py-1 text-sm outline-none focus:border-primary"
                        />
                        <button type="button" onClick={() => void handleRenameCategory(subcategory.id)} className="text-sm font-medium text-primary">
                          Guardar
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-foreground">{subcategory.name}</div>
                        <div className="text-xs text-muted">{subcategory.categoryName}</div>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategoryId(subcategory.id);
                        setEditingCategoryName(subcategory.name);
                      }}
                      className="text-xs font-medium text-primary"
                    >
                      Editar
                    </button>
                    <select
                      value={subcategory.status}
                      onChange={(event) => handleSubcategoryStatus(subcategory.id, event.target.value as CatalogStatus)}
                      className="rounded-full border border-border bg-white px-2 py-1 text-[11px]"
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <div className="border-b border-border px-5 py-4">
          <h2 className="text-lg font-bold text-foreground">Planes</h2>
        </div>
        <div className="hidden overflow-x-auto md:block">
          <table className="min-w-full text-left text-sm text-foreground">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-[0.18em] text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Plan</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Categoría</th>
                <th className="px-4 py-3 font-medium">Precio</th>
                <th className="px-4 py-3 font-medium">Ítems</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredPlans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-muted">
                    No hay planes registrados con esos filtros.
                  </td>
                </tr>
              ) : (
                filteredPlans.map((plan) => (
                  <tr key={plan.id} className="border-t border-border align-top">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{plan.name}</div>
                      {plan.badge && <div className="text-xs text-primary">{plan.badge}</div>}
                    </td>
                    <td className="px-4 py-3">{plan.categoryName}</td>
                    <td className="px-4 py-3">{plan.subcategoryName}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold">{formatPrice(plan.price)}</div>
                      <div className="text-xs text-muted">{plan.taxLabel}</div>
                    </td>
                    <td className="px-4 py-3 text-muted">{plan.items.length}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[plan.status]}`}>
                        {getCatalogStatusLabel(plan.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" onClick={() => openEditPlan(plan)} className="text-sm font-medium text-primary">
                          Editar
                        </button>
                        <select
                          value={plan.status}
                          onChange={(event) => handlePlanStatus(plan.id, event.target.value as CatalogStatus)}
                          className="rounded-full border border-border bg-soft-background px-2 py-1 text-[11px]"
                        >
                          <option value="ACTIVE">Activo</option>
                          <option value="INACTIVE">Inactivo</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="space-y-3 p-3 md:hidden">
          {filteredPlans.length === 0 ? (
            <div className="rounded-2xl border border-border bg-soft-background p-4 text-center text-sm text-muted">
              No hay planes registrados con esos filtros.
            </div>
          ) : (
            filteredPlans.map((plan) => (
              <div key={plan.id} className="rounded-[20px] border border-border bg-soft-background p-4">
                <div className="font-semibold text-foreground">{plan.name}</div>
                <div className="mt-1 text-xs text-muted">
                  {plan.categoryName} → {plan.subcategoryName}
                </div>
                <div className="mt-2 font-bold">{formatPrice(plan.price)}</div>
                <div className="mt-3 flex items-center gap-2">
                  <button type="button" onClick={() => openEditPlan(plan)} className="text-sm font-medium text-primary">
                    Editar
                  </button>
                  <select
                    value={plan.status}
                    onChange={(event) => handlePlanStatus(plan.id, event.target.value as CatalogStatus)}
                    className="rounded-full border border-border bg-white px-2 py-1 text-[11px]"
                  >
                    <option value="ACTIVE">Activo</option>
                    <option value="INACTIVE">Inactivo</option>
                  </select>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4">
          <form onSubmit={handleSavePlan} className="my-6 w-full max-w-2xl space-y-4 rounded-[24px] border border-border bg-white p-5 shadow-xl">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary">Servicio</p>
              <h2 className="mt-1 text-2xl font-bold text-foreground">{editingPlanId ? "Editar plan" : "Nuevo plan"}</h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Servicio padre</span>
                <select
                  value={planForm.categoryId}
                  onChange={(event) =>
                    setPlanForm((current) => ({
                      ...current,
                      categoryId: event.target.value,
                      subcategoryId: "",
                    }))
                  }
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Selecciona servicio</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Categoría</span>
                <select
                  value={planForm.subcategoryId}
                  onChange={(event) => setPlanForm((current) => ({ ...current, subcategoryId: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="">Selecciona categoría</option>
                  {subcategoriesForForm.map((subcategory) => (
                    <option key={subcategory.id} value={subcategory.id}>
                      {subcategory.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Nombre del plan</span>
                <input
                  value={planForm.name}
                  onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="SmartWeb Pro"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Precio</span>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={planForm.price}
                  onChange={(event) => setPlanForm((current) => ({ ...current, price: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">IVA</span>
                <input
                  value={planForm.taxLabel}
                  onChange={(event) => setPlanForm((current) => ({ ...current, taxLabel: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Prefijo de precio</span>
                <input
                  value={planForm.pricePrefix}
                  onChange={(event) => setPlanForm((current) => ({ ...current, pricePrefix: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="desde"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Orden</span>
                <input
                  type="number"
                  min="0"
                  value={planForm.sortOrder}
                  onChange={(event) => setPlanForm((current) => ({ ...current, sortOrder: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Badge</span>
                <input
                  value={planForm.badge}
                  onChange={(event) => setPlanForm((current) => ({ ...current, badge: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="★ MÁS CONTRATADO"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">Estado</span>
                <select
                  value={planForm.status}
                  onChange={(event) => setPlanForm((current) => ({ ...current, status: event.target.value as CatalogStatus }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                >
                  <option value="ACTIVE">Activo</option>
                  <option value="INACTIVE">Inactivo</option>
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Descripción</span>
                <textarea
                  rows={3}
                  value={planForm.summary}
                  onChange={(event) => setPlanForm((current) => ({ ...current, summary: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Título de características</span>
                <input
                  value={planForm.featureGroupTitle}
                  onChange={(event) => setPlanForm((current) => ({ ...current, featureGroupTitle: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                  placeholder="Incluye"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-medium">Nota</span>
                <textarea
                  rows={2}
                  value={planForm.note}
                  onChange={(event) => setPlanForm((current) => ({ ...current, note: event.target.value }))}
                  className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                />
              </label>
              <label className="flex items-center gap-2 md:col-span-2">
                <input
                  type="checkbox"
                  checked={planForm.highlighted}
                  onChange={(event) => setPlanForm((current) => ({ ...current, highlighted: event.target.checked }))}
                />
                <span className="text-sm">Destacado</span>
              </label>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Ítems incluidos</span>
                <button
                  type="button"
                  onClick={() => setPlanForm((current) => ({ ...current, items: [...current.items, ""] }))}
                  className="text-sm font-medium text-primary"
                >
                  Agregar ítem
                </button>
              </div>
              {planForm.items.map((item, index) => (
                <div key={`item-${index}`} className="flex gap-2">
                  <input
                    value={item}
                    onChange={(event) =>
                      setPlanForm((current) => ({
                        ...current,
                        items: current.items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)),
                      }))
                    }
                    className="w-full rounded-2xl border border-border bg-soft-background px-4 py-3 text-sm outline-none focus:border-primary"
                    placeholder="Dominio profesional"
                  />
                  {planForm.items.length > 1 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPlanForm((current) => ({
                          ...current,
                          items: current.items.filter((_, itemIndex) => itemIndex !== index),
                        }))
                      }
                      className="text-sm text-muted"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
            </div>

            {submitError && <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsPlanModalOpen(false)}
                className="rounded-full border border-border px-5 py-2 text-sm font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="rounded-full bg-gradient-to-r from-primary to-magenta px-5 py-2 text-sm font-semibold text-white disabled:opacity-70"
              >
                {isSaving ? "Guardando..." : "Guardar plan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
