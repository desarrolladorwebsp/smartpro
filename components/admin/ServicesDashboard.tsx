"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { CircleDollarSign, ImageIcon, ListChecks, Search, Settings2, TextAlignStart, X } from "lucide-react";

import { DashboardPageHeader } from "@/components/admin/DashboardPageHeader";
import {
  DashboardFormActions,
  DashboardFormField,
  DashboardFormFooter,
  DashboardFormModal,
  DashboardFormSection,
  dashboardFieldClassName,
  dashboardTextareaClassName,
} from "@/components/admin/dashboard-form";
import {
  filterCategories,
  filterPlans,
  filterServices,
  flattenCatalog,
  formatCatalogDate,
  formatCatalogPrice,
  getCatalogCreateLabel,
  getCatalogEmptyMessage,
  getCatalogSearchPlaceholder,
  hasActiveCatalogFilters,
  CATALOG_VIEWS,
  type CatalogCategoryRow,
  type CatalogHighlightedFilter,
  type CatalogServiceRow,
  type CatalogStatusFilter,
  type CatalogView,
} from "@/lib/services/catalog-table";
import { getCatalogStatusLabel, type CatalogStatus, type CatalogTree, type ServicePlanRecord } from "@/lib/services/types";
import { resolveServiceCoverImage } from "@/lib/services/default-covers";

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

type ServiceFormState = {
  name: string;
  status: CatalogStatus;
  coverImage: string;
  slug: string;
};

type CategoryFormState = {
  categoryId: string;
  name: string;
  status: CatalogStatus;
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

const emptyServiceForm: ServiceFormState = {
  name: "",
  status: "ACTIVE",
  coverImage: "",
  slug: "",
};

const emptyCategoryForm: CategoryFormState = {
  categoryId: "",
  name: "",
  status: "ACTIVE",
};

const statusStyles: Record<CatalogStatus, string> = {
  ACTIVE: "bg-emerald-100 text-emerald-700",
  INACTIVE: "bg-slate-200 text-slate-700",
};

type ServicesDashboardProps = {
  initialTree: CatalogTree;
  initialView?: CatalogView;
};

export function ServicesDashboard({ initialTree, initialView = "servicios" }: ServicesDashboardProps) {
  const router = useRouter();
  const [tree, setTree] = useState<CatalogTree>(initialTree);
  const [prevInitialTree, setPrevInitialTree] = useState<CatalogTree>(initialTree);
  if (initialTree !== prevInitialTree) {
    setPrevInitialTree(initialTree);
    setTree(initialTree);
  }
  const [view, setView] = useState<CatalogView>(initialView);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<CatalogStatusFilter>("TODOS");
  const [serviceFilter, setServiceFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [highlightedFilter, setHighlightedFilter] = useState<CatalogHighlightedFilter>("TODOS");
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [viewingPlan, setViewingPlan] = useState<ServicePlanRecord | null>(null);
  const [planForm, setPlanForm] = useState<PlanFormState>(emptyPlanForm);
  const [serviceForm, setServiceForm] = useState<ServiceFormState>(emptyServiceForm);
  const [categoryForm, setCategoryForm] = useState<CategoryFormState>(emptyCategoryForm);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isCoverSaving, setIsCoverSaving] = useState(false);
  const [pendingCoverFile, setPendingCoverFile] = useState<File | null>(null);
  const [pendingCoverPreviewUrl, setPendingCoverPreviewUrl] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      if (pendingCoverPreviewUrl) {
        URL.revokeObjectURL(pendingCoverPreviewUrl);
      }
    };
  }, [pendingCoverPreviewUrl]);

  const { services, categories, plans } = useMemo(() => flattenCatalog(tree), [tree]);
  const filters = useMemo(
    () => ({
      query: search,
      status: statusFilter,
      serviceId: serviceFilter || undefined,
      categoryId: categoryFilter || undefined,
      highlighted: highlightedFilter,
    }),
    [search, statusFilter, serviceFilter, categoryFilter, highlightedFilter],
  );

  const filteredServices = useMemo(() => filterServices(services, filters), [services, filters]);
  const filteredCategories = useMemo(() => filterCategories(categories, filters), [categories, filters]);
  const filteredPlans = useMemo(() => filterPlans(plans, filters), [plans, filters]);

  const categoriesForFilter = serviceFilter
    ? categories.filter((category) => category.categoryId === serviceFilter)
    : categories;
  const subcategoriesForForm = categories.filter((category) =>
    planForm.categoryId ? category.categoryId === planForm.categoryId : true,
  );
  const filtersActive = hasActiveCatalogFilters(filters);

  function changeView(next: CatalogView, drill?: { serviceId?: string; categoryId?: string }) {
    setView(next);
    setSubmitError("");

    if (drill) {
      setServiceFilter(drill.serviceId ?? "");
      setCategoryFilter(drill.categoryId ?? "");
    } else {
      setServiceFilter("");
      setCategoryFilter("");
      setHighlightedFilter("TODOS");
    }

    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (next === "servicios") url.searchParams.delete("vista");
      else url.searchParams.set("vista", next);
      window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
    }
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("TODOS");
    setServiceFilter("");
    setCategoryFilter("");
    setHighlightedFilter("TODOS");
  }

  function openCreateCurrent() {
    if (view === "categorias") openCreateCategory();
    else if (view === "planes") openCreatePlan();
    else openCreateService();
  }

  async function refreshCatalog() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/services", { method: "GET", cache: "no-store" });
      const data = (await response.json().catch(() => ({}))) as { tree?: CatalogTree; error?: string };
      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo actualizar el catálogo.");
        return;
      }
      setTree(Array.isArray(data.tree) ? data.tree : []);
      router.refresh();
    } catch {
      setSubmitError("No se pudo actualizar el catálogo.");
    } finally {
      setIsRefreshing(false);
    }
  }

  async function patchStatus(url: string, status: CatalogStatus, fallback: string) {
    setSubmitError("");
    setPendingStatusId(url);
    try {
      const response = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setSubmitError(data.error ?? fallback);
        return;
      }
      await refreshCatalog();
    } catch {
      setSubmitError(fallback);
    } finally {
      setPendingStatusId(null);
    }
  }

  function resetCoverDraft() {
    if (pendingCoverPreviewUrl) {
      URL.revokeObjectURL(pendingCoverPreviewUrl);
    }
    setPendingCoverFile(null);
    setPendingCoverPreviewUrl(null);
  }

  function openCreateService() {
    setEditingServiceId(null);
    setServiceForm(emptyServiceForm);
    resetCoverDraft();
    setSubmitError("");
    setIsServiceModalOpen(true);
  }

  function openEditService(service: CatalogServiceRow) {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      status: service.status,
      coverImage: service.coverImage ?? "",
      slug: service.slug,
    });
    resetCoverDraft();
    setSubmitError("");
    setIsServiceModalOpen(true);
  }

  function getServicePreviewImage(service: Pick<CatalogServiceRow, "coverImage" | "slug">, index: number) {
    return resolveServiceCoverImage(service.coverImage, service.slug, index);
  }

  function isRemoteCoverSrc(src: string) {
    return src.startsWith("/api/") || src.startsWith("blob:");
  }

  async function uploadServiceCover(serviceId: string, file: File) {
    const formData = new FormData();
    formData.append("cover", file);

    const response = await fetch(`/api/services/categories/${serviceId}/cover`, {
      method: "POST",
      body: formData,
    });
    const data = (await response.json().catch(() => ({}))) as { error?: string; category?: { coverImage?: string } };

    if (!response.ok) {
      throw new Error(data.error ?? "No se pudo subir la imagen del servicio.");
    }

    return data.category?.coverImage ?? "";
  }

  async function removeServiceCover(serviceId: string) {
    const response = await fetch(`/api/services/categories/${serviceId}/cover`, { method: "DELETE" });
    const data = (await response.json().catch(() => ({}))) as { error?: string };

    if (!response.ok) {
      throw new Error(data.error ?? "No se pudo quitar la imagen del servicio.");
    }
  }

  function handleCoverFileChange(file: File | null) {
    resetCoverDraft();

    if (!file) {
      return;
    }

    setPendingCoverFile(file);
    setPendingCoverPreviewUrl(URL.createObjectURL(file));
  }

  async function handleUploadCover() {
    if (!editingServiceId || !pendingCoverFile) {
      setSubmitError("Guarda el servicio o selecciona una imagen antes de subirla.");
      return;
    }

    setSubmitError("");
    setIsCoverSaving(true);

    try {
      const coverImage = await uploadServiceCover(editingServiceId, pendingCoverFile);
      setServiceForm((current) => ({ ...current, coverImage }));
      resetCoverDraft();
      setSuccessMessage("Imagen del servicio actualizada.");
      await refreshCatalog();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo subir la imagen del servicio.");
    } finally {
      setIsCoverSaving(false);
    }
  }

  async function handleRemoveCover() {
    if (!editingServiceId) {
      resetCoverDraft();
      return;
    }

    setSubmitError("");
    setIsCoverSaving(true);

    try {
      await removeServiceCover(editingServiceId);
      setServiceForm((current) => ({ ...current, coverImage: "" }));
      resetCoverDraft();
      setSuccessMessage("Imagen del servicio eliminada.");
      await refreshCatalog();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo quitar la imagen del servicio.");
    } finally {
      setIsCoverSaving(false);
    }
  }

  function openCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm({
      ...emptyCategoryForm,
      categoryId: serviceFilter || services[0]?.id || "",
    });
    setSubmitError("");
    setIsCategoryModalOpen(true);
  }

  function openEditCategory(category: CatalogCategoryRow) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      categoryId: category.categoryId,
      name: category.name,
      status: category.status,
    });
    setSubmitError("");
    setIsCategoryModalOpen(true);
  }

  function openCreatePlan() {
    const selectedService = tree.find((category) => category.id === (serviceFilter || tree[0]?.id));
    const selectedCategory =
      selectedService?.subcategories.find((subcategory) => subcategory.id === categoryFilter) ??
      selectedService?.subcategories[0];

    setEditingPlanId(null);
    setPlanForm({
      ...emptyPlanForm,
      categoryId: selectedService?.id ?? "",
      subcategoryId: selectedCategory?.id ?? "",
    });
    setSubmitError("");
    setIsPlanModalOpen(true);
  }

  function openEditPlan(plan: ServicePlanRecord) {
    setViewingPlan(null);
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

  async function handleSaveService(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/services/categories", {
        method: editingServiceId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingServiceId ?? undefined,
          name: serviceForm.name.trim(),
          status: serviceForm.status,
          description: editingServiceId
            ? services.find((service) => service.id === editingServiceId)?.description ?? ""
            : "",
        }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        category?: { id?: string; coverImage?: string };
      };
      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo guardar el servicio.");
        return;
      }

      const savedServiceId = editingServiceId ?? data.category?.id ?? null;

      if (savedServiceId && pendingCoverFile) {
        try {
          const coverImage = await uploadServiceCover(savedServiceId, pendingCoverFile);
          setServiceForm((current) => ({ ...current, coverImage }));
          resetCoverDraft();
        } catch (error) {
          setSubmitError(
            error instanceof Error ? error.message : "El servicio se guardó, pero no se pudo subir la imagen.",
          );
          await refreshCatalog();
          return;
        }
      }

      setSuccessMessage(editingServiceId ? "Servicio actualizado correctamente." : "Servicio creado correctamente.");
      setIsServiceModalOpen(false);
      setServiceForm(emptyServiceForm);
      setEditingServiceId(null);
      resetCoverDraft();
      await refreshCatalog();
    } catch {
      setSubmitError("No se pudo guardar el servicio.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSaveCategory(event: React.FormEvent) {
    event.preventDefault();
    setSubmitError("");
    setIsSaving(true);

    try {
      const response = await fetch("/api/services/subcategories", {
        method: editingCategoryId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingCategoryId ?? undefined,
          categoryId: categoryForm.categoryId,
          name: categoryForm.name.trim(),
          status: categoryForm.status,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setSubmitError(data.error ?? "No se pudo guardar la categoría.");
        return;
      }
      setSuccessMessage(editingCategoryId ? "Categoría actualizada correctamente." : "Categoría creada correctamente.");
      setIsCategoryModalOpen(false);
      setCategoryForm(emptyCategoryForm);
      setEditingCategoryId(null);
      await refreshCatalog();
    } catch {
      setSubmitError("No se pudo guardar la categoría.");
    } finally {
      setIsSaving(false);
    }
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

  return (
    <div className="space-y-4">
      <DashboardPageHeader
        icon="servicios"
        eyebrow="Catálogo"
        title="Gestión de servicios"
        action={{ label: getCatalogCreateLabel(view), onClick: openCreateCurrent }}
      />

      <div className="rounded-[24px] border border-border bg-white p-3 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <div
            role="tablist"
            aria-label="Vistas del catálogo"
            className="grid w-full grid-cols-3 rounded-2xl bg-soft-background p-1 xl:w-auto xl:min-w-[22rem]"
          >
            {CATALOG_VIEWS.map((tab) => {
              const selected = view === tab.id;
              const count =
                tab.id === "servicios" ? services.length : tab.id === "categorias" ? categories.length : plans.length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => changeView(tab.id)}
                  className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                    selected
                      ? "bg-white text-foreground shadow-[0_8px_20px_rgba(16,16,36,0.06)]"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  <span className="truncate">{tab.label}</span>
                  <span className="ml-1.5 text-[11px] font-medium text-muted">{count}</span>
                </button>
              );
            })}
          </div>

          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={getCatalogSearchPlaceholder(view)}
              className="h-10 w-full rounded-xl border border-border bg-soft-background py-2 pl-9 pr-3 text-sm text-foreground outline-none transition focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:flex xl:flex-wrap xl:items-center">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as CatalogStatusFilter)}
              className="h-10 rounded-xl border border-border bg-soft-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
              aria-label="Filtrar por estado"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="ACTIVE">Activo</option>
              <option value="INACTIVE">Inactivo</option>
            </select>

            {view !== "servicios" ? (
              <select
                value={serviceFilter}
                onChange={(event) => {
                  setServiceFilter(event.target.value);
                  setCategoryFilter("");
                }}
                className="h-10 rounded-xl border border-border bg-soft-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                aria-label="Filtrar por servicio"
              >
                <option value="">Todos los servicios</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            ) : null}

            {view === "planes" ? (
              <>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="h-10 rounded-xl border border-border bg-soft-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  aria-label="Filtrar por categoría"
                >
                  <option value="">Todas las categorías</option>
                  {categoriesForFilter.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <select
                  value={highlightedFilter}
                  onChange={(event) => setHighlightedFilter(event.target.value as CatalogHighlightedFilter)}
                  className="h-10 rounded-xl border border-border bg-soft-background px-3 text-sm text-foreground outline-none transition focus:border-primary"
                  aria-label="Filtrar planes destacados"
                >
                  <option value="TODOS">Todos los planes</option>
                  <option value="SI">Destacados</option>
                  <option value="NO">Estándar</option>
                </select>
              </>
            ) : null}
          </div>
        </div>

        {filtersActive ? (
          <div className="mt-3 flex justify-end">
            <button type="button" onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">
              Limpiar filtros
            </button>
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{successMessage}</div>
      ) : null}
      {submitError && !isPlanModalOpen && !isServiceModalOpen && !isCategoryModalOpen ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</div>
      ) : null}

      <section className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        <div className="hidden max-h-[min(640px,calc(100vh-16.5rem))] overflow-auto md:block">
          {view === "servicios" ? (
            <table className="min-w-full text-left text-[13px] text-foreground">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Imagen</th>
                  <th className="px-3 py-2.5 font-medium">Servicio</th>
                  <th className="px-3 py-2.5 font-medium">Categorías</th>
                  <th className="px-3 py-2.5 font-medium">Planes</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-3 py-2.5 font-medium">Actualizado</th>
                  <th className="px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isRefreshing ? (
                  <TableLoadingRow columns={7} />
                ) : filteredServices.length === 0 ? (
                  <EmptyRow
                    columns={7}
                    message={getCatalogEmptyMessage("servicios", filtersActive)}
                    actionLabel={filtersActive ? "Limpiar filtros" : "Nuevo servicio"}
                    onAction={filtersActive ? clearFilters : openCreateService}
                  />
                ) : (
                  filteredServices.map((service, index) => (
                    <tr key={service.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="relative h-12 w-16 overflow-hidden rounded-xl bg-slate-100">
                          <Image
                            src={getServicePreviewImage(service, index)}
                            alt={service.name}
                            fill
                            className="object-cover"
                            sizes="64px"
                            unoptimized={isRemoteCoverSrc(getServicePreviewImage(service, index))}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-semibold text-foreground">{service.name}</div>
                        <div className="text-[11px] text-muted">{service.slug}</div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{service.categoryCount}</td>
                      <td className="px-3 py-2 tabular-nums">{service.planCount}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={service.status} />
                      </td>
                      <td className="px-3 py-2 text-muted">{formatCatalogDate(service.updatedAt)}</td>
                      <td className="px-3 py-2">
                        <RowActions
                          disabled={pendingStatusId !== null}
                          status={service.status}
                          onView={() => changeView("categorias", { serviceId: service.id })}
                          onEdit={() => openEditService(service)}
                          onToggle={() =>
                            void patchStatus(
                              `/api/services/categories/${service.id}/status`,
                              service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              "No se pudo actualizar el servicio.",
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          {view === "categorias" ? (
            <table className="min-w-full text-left text-[13px] text-foreground">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Categoría</th>
                  <th className="px-3 py-2.5 font-medium">Servicio</th>
                  <th className="px-3 py-2.5 font-medium">Planes</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-3 py-2.5 font-medium">Actualizado</th>
                  <th className="px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isRefreshing ? (
                  <TableLoadingRow columns={6} />
                ) : filteredCategories.length === 0 ? (
                  <EmptyRow
                    columns={6}
                    message={getCatalogEmptyMessage("categorias", filtersActive)}
                    actionLabel={filtersActive ? "Limpiar filtros" : services.length === 0 ? "Nuevo servicio" : "Nueva categoría"}
                    onAction={filtersActive ? clearFilters : services.length === 0 ? openCreateService : openCreateCategory}
                  />
                ) : (
                  filteredCategories.map((category) => (
                    <tr key={category.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-foreground">{category.name}</div>
                        <div className="text-[11px] text-muted">{category.slug}</div>
                      </td>
                      <td className="px-3 py-2">{category.categoryName}</td>
                      <td className="px-3 py-2 tabular-nums">{category.planCount}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={category.status} />
                      </td>
                      <td className="px-3 py-2 text-muted">{formatCatalogDate(category.updatedAt)}</td>
                      <td className="px-3 py-2">
                        <RowActions
                          disabled={pendingStatusId !== null}
                          status={category.status}
                          onView={() =>
                            changeView("planes", { serviceId: category.categoryId, categoryId: category.id })
                          }
                          onEdit={() => openEditCategory(category)}
                          onToggle={() =>
                            void patchStatus(
                              `/api/services/subcategories/${category.id}/status`,
                              category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              "No se pudo actualizar la categoría.",
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}

          {view === "planes" ? (
            <table className="min-w-full text-left text-[13px] text-foreground">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-[0.16em] text-muted">
                <tr>
                  <th className="px-3 py-2.5 font-medium">Plan</th>
                  <th className="px-3 py-2.5 font-medium">Servicio</th>
                  <th className="px-3 py-2.5 font-medium">Categoría</th>
                  <th className="px-3 py-2.5 font-medium">Precio</th>
                  <th className="px-3 py-2.5 font-medium">Ítems</th>
                  <th className="px-3 py-2.5 font-medium">Estado</th>
                  <th className="px-3 py-2.5 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isRefreshing ? (
                  <TableLoadingRow columns={7} />
                ) : filteredPlans.length === 0 ? (
                  <EmptyRow
                    columns={7}
                    message={getCatalogEmptyMessage("planes", filtersActive)}
                    actionLabel={filtersActive ? "Limpiar filtros" : categories.length === 0 ? "Nueva categoría" : "Nuevo plan"}
                    onAction={filtersActive ? clearFilters : categories.length === 0 ? openCreateCategory : openCreatePlan}
                  />
                ) : (
                  filteredPlans.map((plan) => (
                    <tr key={plan.id} className="border-t border-border">
                      <td className="px-3 py-2">
                        <div className="font-semibold text-foreground">{plan.name}</div>
                        <div className="flex flex-wrap gap-1 text-[11px]">
                          {plan.badge ? <span className="font-medium text-primary">{plan.badge}</span> : null}
                          {plan.highlighted ? <span className="text-muted">Destacado</span> : null}
                        </div>
                      </td>
                      <td className="px-3 py-2">{plan.categoryName}</td>
                      <td className="px-3 py-2">{plan.subcategoryName}</td>
                      <td className="px-3 py-2">
                        <div className="font-semibold">{formatCatalogPrice(plan.price)}</div>
                        <div className="text-[11px] text-muted">{plan.taxLabel}</div>
                      </td>
                      <td className="px-3 py-2 tabular-nums">{plan.items.length}</td>
                      <td className="px-3 py-2">
                        <StatusBadge status={plan.status} />
                      </td>
                      <td className="px-3 py-2">
                        <RowActions
                          disabled={pendingStatusId !== null}
                          status={plan.status}
                          onView={() => setViewingPlan(plan)}
                          onEdit={() => openEditPlan(plan)}
                          onToggle={() =>
                            void patchStatus(
                              `/api/services/${plan.id}/status`,
                              plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                              "No se pudo actualizar el plan.",
                            )
                          }
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          ) : null}
        </div>

        <div className="max-h-[min(70vh,640px)] space-y-2 overflow-auto p-3 md:hidden">
          {isRefreshing ? (
            Array.from({ length: 4 }, (_, index) => (
              <div key={`mobile-skeleton-${index}`} className="rounded-[20px] border border-border bg-soft-background p-3">
                <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/80" />
                <div className="mt-2 h-3 w-1/2 animate-pulse rounded-full bg-slate-200/80" />
              </div>
            ))
          ) : view === "servicios" ? (
            filteredServices.length === 0 ? (
              <MobileEmpty
                message={getCatalogEmptyMessage("servicios", filtersActive)}
                actionLabel={filtersActive ? "Limpiar filtros" : "Nuevo servicio"}
                onAction={filtersActive ? clearFilters : openCreateService}
              />
            ) : (
              filteredServices.map((service, index) => (
                <article key={service.id} className="rounded-[20px] border border-border bg-soft-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      <Image
                        src={getServicePreviewImage(service, index)}
                        alt={service.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                        unoptimized={isRemoteCoverSrc(getServicePreviewImage(service, index))}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground">{service.name}</h3>
                      <p className="text-[11px] text-muted">
                        {service.categoryCount} categorías · {service.planCount} planes
                      </p>
                    </div>
                    <StatusBadge status={service.status} />
                  </div>
                  <RowActions
                    className="mt-3"
                    disabled={pendingStatusId !== null}
                    status={service.status}
                    onView={() => changeView("categorias", { serviceId: service.id })}
                    onEdit={() => openEditService(service)}
                    onToggle={() =>
                      void patchStatus(
                        `/api/services/categories/${service.id}/status`,
                        service.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        "No se pudo actualizar el servicio.",
                      )
                    }
                  />
                </article>
              ))
            )
          ) : view === "categorias" ? (
            filteredCategories.length === 0 ? (
              <MobileEmpty
                message={getCatalogEmptyMessage("categorias", filtersActive)}
                actionLabel={filtersActive ? "Limpiar filtros" : services.length === 0 ? "Nuevo servicio" : "Nueva categoría"}
                onAction={filtersActive ? clearFilters : services.length === 0 ? openCreateService : openCreateCategory}
              />
            ) : (
              filteredCategories.map((category) => (
                <article key={category.id} className="rounded-[20px] border border-border bg-soft-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="truncate font-semibold text-foreground">{category.name}</h3>
                      <p className="text-[11px] text-muted">
                        {category.categoryName} · {category.planCount} planes
                      </p>
                    </div>
                    <StatusBadge status={category.status} />
                  </div>
                  <RowActions
                    className="mt-3"
                    disabled={pendingStatusId !== null}
                    status={category.status}
                    onView={() => changeView("planes", { serviceId: category.categoryId, categoryId: category.id })}
                    onEdit={() => openEditCategory(category)}
                    onToggle={() =>
                      void patchStatus(
                        `/api/services/subcategories/${category.id}/status`,
                        category.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        "No se pudo actualizar la categoría.",
                      )
                    }
                  />
                </article>
              ))
            )
          ) : filteredPlans.length === 0 ? (
            <MobileEmpty
              message={getCatalogEmptyMessage("planes", filtersActive)}
              actionLabel={filtersActive ? "Limpiar filtros" : categories.length === 0 ? "Nueva categoría" : "Nuevo plan"}
              onAction={filtersActive ? clearFilters : categories.length === 0 ? openCreateCategory : openCreatePlan}
            />
          ) : (
            filteredPlans.map((plan) => (
              <article key={plan.id} className="rounded-[20px] border border-border bg-soft-background p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-[11px] text-muted">
                      {plan.categoryName} → {plan.subcategoryName}
                    </p>
                    <p className="mt-1 font-semibold">{formatCatalogPrice(plan.price)}</p>
                  </div>
                  <StatusBadge status={plan.status} />
                </div>
                <RowActions
                  className="mt-3"
                  disabled={pendingStatusId !== null}
                  status={plan.status}
                  onView={() => setViewingPlan(plan)}
                  onEdit={() => openEditPlan(plan)}
                  onToggle={() =>
                    void patchStatus(
                      `/api/services/${plan.id}/status`,
                      plan.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                      "No se pudo actualizar el plan.",
                    )
                  }
                />
              </article>
            ))
          )}
        </div>
      </section>

      {isServiceModalOpen ? (
        <DashboardFormModal
          eyebrow="Servicio"
          title={editingServiceId ? "Editar servicio" : "Nuevo servicio"}
          onClose={() => setIsServiceModalOpen(false)}
        >
          <form onSubmit={handleSaveService} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <DashboardFormSection icon={Settings2} title="Configuración general">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <DashboardFormField label="Nombre" htmlFor="service-name" className="sm:col-span-2">
                    <input
                      id="service-name"
                      value={serviceForm.name}
                      onChange={(event) => setServiceForm((current) => ({ ...current, name: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="Desarrollo Web"
                      required
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Estado" htmlFor="service-status">
                    <select
                      id="service-status"
                      value={serviceForm.status}
                      onChange={(event) =>
                        setServiceForm((current) => ({ ...current, status: event.target.value as CatalogStatus }))
                      }
                      className={dashboardFieldClassName}
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </DashboardFormField>
                </div>
              </DashboardFormSection>

              <DashboardFormSection icon={ImageIcon} title="Imagen de portada">
                <div className="space-y-3">
                  <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-border bg-slate-100">
                    <Image
                      src={
                        pendingCoverPreviewUrl ??
                        resolveServiceCoverImage(serviceForm.coverImage, serviceForm.slug, 0)
                      }
                      alt={serviceForm.name || "Vista previa del servicio"}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 480px"
                      unoptimized={isRemoteCoverSrc(
                        pendingCoverPreviewUrl ??
                          resolveServiceCoverImage(serviceForm.coverImage, serviceForm.slug, 0),
                      )}
                    />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-border px-4 text-xs font-semibold text-foreground">
                      Elegir imagen
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={(event) => handleCoverFileChange(event.target.files?.[0] ?? null)}
                      />
                    </label>

                    {editingServiceId && pendingCoverFile ? (
                      <button
                        type="button"
                        onClick={() => void handleUploadCover()}
                        disabled={isCoverSaving || isSaving}
                        className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {isCoverSaving ? "Subiendo..." : "Subir imagen"}
                      </button>
                    ) : null}

                    {editingServiceId && (serviceForm.coverImage || pendingCoverFile) ? (
                      <button
                        type="button"
                        onClick={() => void handleRemoveCover()}
                        disabled={isCoverSaving || isSaving}
                        className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-200 px-4 text-xs font-semibold text-red-600 disabled:opacity-60"
                      >
                        Quitar imagen
                      </button>
                    ) : null}
                  </div>

                  <p className="text-xs text-muted">
                    {editingServiceId
                      ? "Esta imagen se usa como fondo en la tarjeta del servicio en la web. Formatos JPG, PNG o WEBP, máximo 5 MB."
                      : "Puedes elegir una imagen ahora y se subirá automáticamente al guardar el servicio."}
                  </p>
                </div>
              </DashboardFormSection>
            </div>
            <DashboardFormFooter error={submitError}>
              <DashboardFormActions isSaving={isSaving || isCoverSaving} onCancel={() => setIsServiceModalOpen(false)} submitLabel="Guardar servicio" />
            </DashboardFormFooter>
          </form>
        </DashboardFormModal>
      ) : null}

      {isCategoryModalOpen ? (
        <DashboardFormModal
          eyebrow="Categoría"
          title={editingCategoryId ? "Editar categoría" : "Nueva categoría"}
          onClose={() => setIsCategoryModalOpen(false)}
        >
          <form onSubmit={handleSaveCategory} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <DashboardFormSection icon={Settings2} title="Configuración general">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                  <DashboardFormField label="Servicio padre" htmlFor="category-parent">
                    <select
                      id="category-parent"
                      value={categoryForm.categoryId}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, categoryId: event.target.value }))}
                      className={dashboardFieldClassName}
                      required
                      disabled={Boolean(editingCategoryId)}
                    >
                      <option value="">Selecciona servicio</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="Nombre" htmlFor="category-name">
                    <input
                      id="category-name"
                      value={categoryForm.name}
                      onChange={(event) => setCategoryForm((current) => ({ ...current, name: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="Sitios web"
                      required
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Estado" htmlFor="category-status">
                    <select
                      id="category-status"
                      value={categoryForm.status}
                      onChange={(event) =>
                        setCategoryForm((current) => ({ ...current, status: event.target.value as CatalogStatus }))
                      }
                      className={dashboardFieldClassName}
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </DashboardFormField>
                </div>
              </DashboardFormSection>
            </div>
            <DashboardFormFooter error={submitError}>
              <DashboardFormActions isSaving={isSaving} onCancel={() => setIsCategoryModalOpen(false)} submitLabel="Guardar categoría" />
            </DashboardFormFooter>
          </form>
        </DashboardFormModal>
      ) : null}

      {viewingPlan ? (
        <DashboardFormModal eyebrow="Plan" title={viewingPlan.name} onClose={() => setViewingPlan(null)} wide>
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3 text-sm">
              <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                <DetailItem label="Servicio" value={viewingPlan.categoryName} />
                <DetailItem label="Categoría" value={viewingPlan.subcategoryName} />
                <DetailItem label="Precio" value={`${formatCatalogPrice(viewingPlan.price)} ${viewingPlan.taxLabel}`.trim()} />
                <DetailItem label="Estado" value={getCatalogStatusLabel(viewingPlan.status)} />
              </div>
              {viewingPlan.summary ? <DetailItem label="Descripción" value={viewingPlan.summary} /> : null}
              {viewingPlan.note ? <DetailItem label="Nota" value={viewingPlan.note} /> : null}
              <div>
                <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary">
                  {viewingPlan.featureGroupTitle || "Ítems incluidos"}
                </p>
                {viewingPlan.items.length === 0 ? (
                  <p className="text-muted">Sin ítems incluidos.</p>
                ) : (
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {viewingPlan.items.map((item) => (
                      <li key={item.id} className="rounded-xl bg-soft-background px-3 py-1.5 text-foreground">
                        {item.label}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <div className="flex shrink-0 justify-end gap-2 border-t border-border px-4 py-2.5">
              <button
                type="button"
                onClick={() => setViewingPlan(null)}
                className="inline-flex h-9 items-center rounded-full border border-border px-4 text-sm font-medium"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={() => openEditPlan(viewingPlan)}
                className="inline-flex h-9 items-center rounded-full bg-gradient-to-r from-primary to-magenta px-4 text-sm font-semibold text-white"
              >
                Editar plan
              </button>
            </div>
          </div>
        </DashboardFormModal>
      ) : null}

      {isPlanModalOpen ? (
        <DashboardFormModal
          eyebrow="Plan"
          title={editingPlanId ? "Editar plan" : "Nuevo plan"}
          onClose={() => setIsPlanModalOpen(false)}
          wide
        >
          <form onSubmit={handleSavePlan} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto px-4 py-3">
              <DashboardFormSection icon={Settings2} title="Configuración general">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  <DashboardFormField label="Servicio padre" htmlFor="plan-service">
                    <select
                      id="plan-service"
                      value={planForm.categoryId}
                      onChange={(event) =>
                        setPlanForm((current) => ({
                          ...current,
                          categoryId: event.target.value,
                          subcategoryId: "",
                        }))
                      }
                      className={dashboardFieldClassName}
                    >
                      <option value="">Selecciona servicio</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name}
                        </option>
                      ))}
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="Categoría" htmlFor="plan-category">
                    <select
                      id="plan-category"
                      value={planForm.subcategoryId}
                      onChange={(event) => setPlanForm((current) => ({ ...current, subcategoryId: event.target.value }))}
                      className={dashboardFieldClassName}
                    >
                      <option value="">Selecciona categoría</option>
                      {subcategoriesForForm.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="Estado" htmlFor="plan-status">
                    <select
                      id="plan-status"
                      value={planForm.status}
                      onChange={(event) =>
                        setPlanForm((current) => ({ ...current, status: event.target.value as CatalogStatus }))
                      }
                      className={dashboardFieldClassName}
                    >
                      <option value="ACTIVE">Activo</option>
                      <option value="INACTIVE">Inactivo</option>
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="Nombre del plan" htmlFor="plan-name" className="sm:col-span-2">
                    <input
                      id="plan-name"
                      value={planForm.name}
                      onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="SmartWeb Pro"
                    />
                  </DashboardFormField>
                  <label htmlFor="plan-highlighted" className="flex h-9 items-center gap-2 self-end rounded-xl border border-border bg-soft-background px-3">
                    <input
                      id="plan-highlighted"
                      type="checkbox"
                      checked={planForm.highlighted}
                      onChange={(event) => setPlanForm((current) => ({ ...current, highlighted: event.target.checked }))}
                      className="size-3.5 accent-primary"
                    />
                    <span className="text-sm font-medium text-foreground">Destacado</span>
                  </label>
                </div>
              </DashboardFormSection>

              <DashboardFormSection icon={CircleDollarSign} title="Detalles">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  <DashboardFormField label="Precio" htmlFor="plan-price">
                    <input
                      id="plan-price"
                      type="number"
                      min="0"
                      step="1"
                      value={planForm.price}
                      onChange={(event) => setPlanForm((current) => ({ ...current, price: event.target.value }))}
                      className={dashboardFieldClassName}
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Prefijo de precio" htmlFor="plan-prefix">
                    <input
                      id="plan-prefix"
                      value={planForm.pricePrefix}
                      onChange={(event) => setPlanForm((current) => ({ ...current, pricePrefix: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="desde"
                    />
                  </DashboardFormField>
                  <DashboardFormField label="IVA" htmlFor="plan-tax">
                    <input
                      id="plan-tax"
                      value={planForm.taxLabel}
                      onChange={(event) => setPlanForm((current) => ({ ...current, taxLabel: event.target.value }))}
                      className={dashboardFieldClassName}
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Badge" htmlFor="plan-badge" className="sm:col-span-2">
                    <input
                      id="plan-badge"
                      value={planForm.badge}
                      onChange={(event) => setPlanForm((current) => ({ ...current, badge: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="★ MÁS CONTRATADO"
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Orden" htmlFor="plan-order">
                    <input
                      id="plan-order"
                      type="number"
                      min="0"
                      value={planForm.sortOrder}
                      onChange={(event) => setPlanForm((current) => ({ ...current, sortOrder: event.target.value }))}
                      className={dashboardFieldClassName}
                    />
                  </DashboardFormField>
                </div>
              </DashboardFormSection>

              <DashboardFormSection icon={TextAlignStart} title="Descripción">
                <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
                  <DashboardFormField label="Descripción" htmlFor="plan-summary">
                    <textarea
                      id="plan-summary"
                      rows={2}
                      value={planForm.summary}
                      onChange={(event) => setPlanForm((current) => ({ ...current, summary: event.target.value }))}
                      className={dashboardTextareaClassName}
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Nota" htmlFor="plan-note">
                    <textarea
                      id="plan-note"
                      rows={2}
                      value={planForm.note}
                      onChange={(event) => setPlanForm((current) => ({ ...current, note: event.target.value }))}
                      className={dashboardTextareaClassName}
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Título de características" htmlFor="plan-features-title" className="lg:col-span-2">
                    <input
                      id="plan-features-title"
                      value={planForm.featureGroupTitle}
                      onChange={(event) => setPlanForm((current) => ({ ...current, featureGroupTitle: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="Incluye"
                    />
                  </DashboardFormField>
                </div>
              </DashboardFormSection>

              <DashboardFormSection icon={ListChecks} title="Ítems">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted">Lo que incluye el plan en el catálogo público.</p>
                  <button
                    type="button"
                    onClick={() => setPlanForm((current) => ({ ...current, items: [...current.items, ""] }))}
                    className="text-xs font-semibold text-primary hover:underline"
                  >
                    Agregar ítem
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                  {planForm.items.map((item, index) => (
                    <div key={`item-${index}`} className="flex items-center gap-1.5">
                      <input
                        value={item}
                        onChange={(event) =>
                          setPlanForm((current) => ({
                            ...current,
                            items: current.items.map((value, itemIndex) => (itemIndex === index ? event.target.value : value)),
                          }))
                        }
                        className={dashboardFieldClassName}
                        placeholder="Dominio profesional"
                        aria-label={`Ítem ${index + 1}`}
                      />
                      {planForm.items.length > 1 ? (
                        <button
                          type="button"
                          onClick={() =>
                            setPlanForm((current) => ({
                              ...current,
                              items: current.items.filter((_, itemIndex) => itemIndex !== index),
                            }))
                          }
                          className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl text-muted transition hover:bg-soft-background hover:text-foreground"
                          aria-label={`Quitar ítem ${index + 1}`}
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      ) : null}
                    </div>
                  ))}
                </div>
              </DashboardFormSection>
            </div>
            <DashboardFormFooter error={submitError}>
              <DashboardFormActions isSaving={isSaving} onCancel={() => setIsPlanModalOpen(false)} submitLabel="Guardar plan" />
            </DashboardFormFooter>
          </form>
        </DashboardFormModal>
      ) : null}
    </div>
  );
}

function StatusBadge({ status }: { status: CatalogStatus }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusStyles[status]}`}>
      {getCatalogStatusLabel(status)}
    </span>
  );
}

function RowActions({
  status,
  onView,
  onEdit,
  onToggle,
  disabled,
  className = "",
}: {
  status: CatalogStatus;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <button type="button" onClick={onView} className="text-sm font-medium text-primary">
        Ver
      </button>
      <button type="button" onClick={onEdit} className="text-sm font-medium text-foreground">
        Editar
      </button>
      <button type="button" onClick={onToggle} disabled={disabled} className="text-sm font-medium text-muted disabled:opacity-60">
        {status === "ACTIVE" ? "Desactivar" : "Activar"}
      </button>
    </div>
  );
}

function TableLoadingRow({ columns }: { columns: number }) {
  return (
    <>
      {Array.from({ length: 6 }, (_, index) => (
        <tr key={`catalog-skeleton-${index}`} className="border-t border-border">
          <td className="px-3 py-3" colSpan={columns}>
            <div className="h-3 max-w-xl animate-pulse rounded-full bg-slate-200/80" />
          </td>
        </tr>
      ))}
    </>
  );
}

function EmptyRow({
  columns,
  message,
  actionLabel,
  onAction,
}: {
  columns: number;
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <tr>
      <td colSpan={columns} className="px-4 py-12 text-center">
        <p className="text-sm text-muted">{message}</p>
        <button type="button" onClick={onAction} className="mt-3 text-sm font-semibold text-primary hover:underline">
          {actionLabel}
        </button>
      </td>
    </tr>
  );
}

function MobileEmpty({
  message,
  actionLabel,
  onAction,
}: {
  message: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <div className="rounded-2xl border border-border bg-soft-background p-4 text-center">
      <p className="text-sm text-muted">{message}</p>
      <button type="button" onClick={onAction} className="mt-3 text-sm font-semibold text-primary">
        {actionLabel}
      </button>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-foreground">{value}</p>
    </div>
  );
}
