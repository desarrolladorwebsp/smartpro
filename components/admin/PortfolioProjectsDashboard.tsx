"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Archive, ImageIcon, Link2, Pencil, Search, Settings2, Tags } from "lucide-react";

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
  isAllowedPortfolioAspect,
  PORTFOLIO_IMAGE_MAX_BYTES,
  PORTFOLIO_IMAGE_MIME_TYPES,
} from "@/lib/portfolio/constants";
import { getPortfolioStatusLabel, type PortfolioCategorySummary, type PortfolioProjectRecord, type PortfolioProjectStatus } from "@/lib/portfolio/types";

type FormState = {
  title: string;
  subcategoryId: string;
  summary: string;
  url: string;
  tags: string;
  status: PortfolioProjectStatus;
  sortOrder: string;
  image: string;
};

const emptyForm: FormState = {
  title: "",
  subcategoryId: "",
  summary: "",
  url: "",
  tags: "",
  status: "DRAFT",
  sortOrder: "0",
  image: "",
};

const statusStyles: Record<PortfolioProjectStatus, string> = {
  PUBLISHED: "bg-emerald-100 text-emerald-700",
  DRAFT: "bg-amber-100 text-amber-800",
  ARCHIVED: "bg-slate-200 text-slate-700",
};

type PortfolioProjectsDashboardProps = {
  category: PortfolioCategorySummary;
  initialProjects: PortfolioProjectRecord[];
};

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new window.Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("No se pudo leer la imagen."));
    };
    image.src = url;
  });
}

export function PortfolioProjectsDashboard({ category, initialProjects }: PortfolioProjectsDashboardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [prevProjects, setPrevProjects] = useState(initialProjects);
  if (initialProjects !== prevProjects) {
    setPrevProjects(initialProjects);
    setProjects(initialProjects);
  }

  const [query, setQuery] = useState("");
  const [subcategoryFilter, setSubcategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<PortfolioProjectStatus | "ACTIVE">("ACTIVE");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitError, setSubmitError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [pendingImage, setPendingImage] = useState<File | null>(null);
  const [pendingPreviewUrl, setPendingPreviewUrl] = useState<string | null>(null);
  const [pendingActionId, setPendingActionId] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timeout = window.setTimeout(() => setSuccessMessage(""), 4000);
    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  useEffect(() => {
    return () => {
      if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    };
  }, [pendingPreviewUrl]);

  const filteredProjects = useMemo(() => {
    const needle = query.trim().toLowerCase();

    return projects.filter((project) => {
      if (subcategoryFilter && project.subcategoryId !== subcategoryFilter) return false;
      if (statusFilter === "ACTIVE" && project.status === "ARCHIVED") return false;
      if (statusFilter !== "ACTIVE" && project.status !== statusFilter) return false;
      if (!needle) return true;
      return (
        project.title.toLowerCase().includes(needle) ||
        project.summary.toLowerCase().includes(needle) ||
        project.tags.some((tag) => tag.toLowerCase().includes(needle))
      );
    });
  }, [projects, query, subcategoryFilter, statusFilter]);

  function resetImageDraft() {
    if (pendingPreviewUrl) URL.revokeObjectURL(pendingPreviewUrl);
    setPendingImage(null);
    setPendingPreviewUrl(null);
  }

  function openCreate() {
    setEditingId(null);
    setForm({
      ...emptyForm,
      subcategoryId: category.subcategories[0]?.id ?? "",
      sortOrder: String((projects[projects.length - 1]?.sortOrder ?? 0) + 10),
    });
    resetImageDraft();
    setSubmitError("");
    setIsModalOpen(true);
  }

  function openEdit(project: PortfolioProjectRecord) {
    setEditingId(project.id);
    setForm({
      title: project.title,
      subcategoryId: project.subcategoryId,
      summary: project.summary,
      url: project.url,
      tags: project.tags.join(", "),
      status: project.status === "ARCHIVED" ? "DRAFT" : project.status,
      sortOrder: String(project.sortOrder),
      image: project.image,
    });
    resetImageDraft();
    setSubmitError("");
    setIsModalOpen(true);
  }

  async function handleImageChange(file: File | null) {
    resetImageDraft();
    setSubmitError("");
    if (!file) return;

    try {
      if (file.size > PORTFOLIO_IMAGE_MAX_BYTES) {
        setSubmitError("La imagen no puede superar 5 MB.");
        return;
      }

      if (!(PORTFOLIO_IMAGE_MIME_TYPES as readonly string[]).includes(file.type)) {
        setSubmitError("Formato no permitido. Usa JPG, PNG o WEBP.");
        return;
      }

      const size = await readImageSize(file);
      if (!isAllowedPortfolioAspect(size.width, size.height)) {
        setSubmitError(`La imagen mide ${size.width}×${size.height}px. Usa proporción 5:4.`);
        return;
      }
      setPendingImage(file);
      setPendingPreviewUrl(URL.createObjectURL(file));
    } catch {
      setSubmitError("No se pudo leer la imagen. Usa JPG, PNG o WEBP.");
    }
  }

  async function uploadImage(projectId: string, file: File) {
    const formData = new FormData();
    formData.append("image", file);
    const response = await fetch(`/api/portfolio/projects/${projectId}/image`, { method: "POST", body: formData });
    const data = (await response.json().catch(() => ({}))) as { error?: string; project?: PortfolioProjectRecord };
    if (!response.ok) {
      throw new Error(data.error ?? "No se pudo subir la imagen.");
    }
    return data.project;
  }

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    setIsSaving(true);
    setSubmitError("");

    try {
      const wantsPublished = form.status === "PUBLISHED";
      const payload = {
        categorySlug: category.slug,
        subcategoryId: form.subcategoryId,
        title: form.title,
        summary: form.summary,
        url: form.url,
        tags: form.tags,
        status: wantsPublished && pendingImage && !form.image ? "DRAFT" : form.status,
        sortOrder: form.sortOrder,
      };

      const response = await fetch(editingId ? `/api/portfolio/projects/${editingId}` : "/api/portfolio/projects", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; project?: PortfolioProjectRecord };
      if (!response.ok || !data.project) {
        throw new Error(data.error ?? "No se pudo guardar el proyecto.");
      }

      let saved = data.project;
      if (pendingImage) {
        saved = (await uploadImage(saved.id, pendingImage)) ?? saved;
      }

      if (wantsPublished && saved.status !== "PUBLISHED") {
        const publishResponse = await fetch(`/api/portfolio/projects/${saved.id}/status`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PUBLISHED" }),
        });
        const publishData = (await publishResponse.json().catch(() => ({}))) as {
          error?: string;
          project?: PortfolioProjectRecord;
        };
        if (!publishResponse.ok || !publishData.project) {
          throw new Error(publishData.error ?? "El proyecto se guardó, pero no se pudo publicar.");
        }
        saved = publishData.project;
      }

      setProjects((current) => {
        const without = current.filter((project) => project.id !== saved.id);
        return [...without, saved].sort((left, right) => left.sortOrder - right.sortOrder);
      });
      setSuccessMessage(editingId ? "Proyecto actualizado." : "Proyecto creado.");
      setIsModalOpen(false);
      resetImageDraft();
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo guardar el proyecto.");
    } finally {
      setIsSaving(false);
    }
  }

  async function patchStatus(id: string, status: PortfolioProjectStatus, success: string) {
    setPendingActionId(id);
    setSubmitError("");
    try {
      const response = await fetch(`/api/portfolio/projects/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string; project?: PortfolioProjectRecord };
      if (!response.ok || !data.project) {
        throw new Error(data.error ?? "No se pudo actualizar el estado.");
      }
      setProjects((current) => current.map((project) => (project.id === id ? data.project! : project)));
      setSuccessMessage(success);
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo actualizar el estado.");
    } finally {
      setPendingActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!window.confirm("Esta acción no se puede deshacer. ¿Eliminar el proyecto archivado?")) {
      return;
    }

    setPendingActionId(id);
    try {
      const response = await fetch(`/api/portfolio/projects/${id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "No se pudo eliminar el proyecto.");
      }
      setProjects((current) => current.filter((project) => project.id !== id));
      setSuccessMessage("Proyecto eliminado.");
      router.refresh();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "No se pudo eliminar el proyecto.");
    } finally {
      setPendingActionId(null);
    }
  }

  const previewSrc = pendingPreviewUrl || form.image;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        icon="portafolios"
        eyebrow="Portafolio"
        title={category.name}
        action={{ label: "Nuevo proyecto", onClick: openCreate, icon: "plus" }}
        trailing={
          <button
            type="button"
            onClick={() => router.push("/dashboard/portafolios")}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-border bg-white px-4 text-sm font-semibold text-foreground"
          >
            Volver
          </button>
        }
      />

      {successMessage ? (
        <p className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{successMessage}</p>
      ) : null}
      {submitError && !isModalOpen ? (
        <p className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{submitError}</p>
      ) : null}

      <div className="rounded-[24px] border border-border bg-white p-4 shadow-[0_18px_46px_rgba(16,16,36,0.04)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, descripción o tag"
              className={`${dashboardFieldClassName} h-11 pl-9`}
            />
          </label>
          <select
            value={subcategoryFilter}
            onChange={(event) => setSubcategoryFilter(event.target.value)}
            className={`${dashboardFieldClassName} h-11`}
            aria-label="Filtrar por subcategoría"
          >
            <option value="">Todas las subcategorías</option>
            {category.subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.id}>
                {subcategory.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as PortfolioProjectStatus | "ACTIVE")}
            className={`${dashboardFieldClassName} h-11`}
            aria-label="Filtrar por estado"
          >
            <option value="ACTIVE">Publicados y borradores</option>
            <option value="PUBLISHED">Publicados</option>
            <option value="DRAFT">Borradores</option>
            <option value="ARCHIVED">Archivados</option>
          </select>
        </div>
      </div>

      <section className="overflow-hidden rounded-[24px] border border-border bg-white shadow-[0_18px_46px_rgba(16,16,36,0.04)]">
        {filteredProjects.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm font-semibold text-foreground">
              {projects.length === 0 ? "Sin proyectos todavía" : "No hay proyectos en esta vista"}
            </p>
            <p className="mt-2 text-sm text-muted">
              {projects.length === 0 ? "Crea el primero con el botón Nuevo proyecto." : "Ajusta los filtros o crea un proyecto."}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="min-w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-[0.12em] text-muted">
                  <tr>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Subcategoría</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Orden</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="border-t border-border">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                            {project.image ? (
                              <Image src={project.image} alt="" fill className="object-cover" sizes="64px" />
                            ) : null}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-foreground">{project.title}</p>
                            <p className="truncate text-xs text-muted">{project.url || "Sin URL"}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{project.subcategoryName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>
                          {getPortfolioStatusLabel(project.status)}
                        </span>
                      </td>
                      <td className="px-4 py-3">{project.sortOrder}</td>
                      <td className="px-4 py-3">
                        <ProjectActions
                          project={project}
                          busy={pendingActionId === project.id}
                          onEdit={() => openEdit(project)}
                          onPublish={() => void patchStatus(project.id, "PUBLISHED", "Proyecto publicado.")}
                          onUnpublish={() => void patchStatus(project.id, "DRAFT", "Proyecto pasado a borrador.")}
                          onArchive={() => {
                            if (window.confirm("El proyecto dejará de verse en el sitio público. ¿Archivar?")) {
                              void patchStatus(project.id, "ARCHIVED", "Proyecto archivado.");
                            }
                          }}
                          onDelete={() => void handleDelete(project.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-3 p-4 md:hidden">
              {filteredProjects.map((project) => (
                <article key={project.id} className="rounded-[20px] border border-border bg-soft-background p-4">
                  <div className="flex gap-3">
                    <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                      {project.image ? <Image src={project.image} alt="" fill className="object-cover" sizes="80px" /> : null}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-foreground">{project.title}</p>
                      <p className="text-xs text-muted">{project.subcategoryName}</p>
                      <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[project.status]}`}>
                        {getPortfolioStatusLabel(project.status)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3">
                    <ProjectActions
                      project={project}
                      busy={pendingActionId === project.id}
                      onEdit={() => openEdit(project)}
                      onPublish={() => void patchStatus(project.id, "PUBLISHED", "Proyecto publicado.")}
                      onUnpublish={() => void patchStatus(project.id, "DRAFT", "Proyecto pasado a borrador.")}
                      onArchive={() => {
                        if (window.confirm("El proyecto dejará de verse en el sitio público. ¿Archivar?")) {
                          void patchStatus(project.id, "ARCHIVED", "Proyecto archivado.");
                        }
                      }}
                      onDelete={() => void handleDelete(project.id)}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>

      {isModalOpen ? (
        <DashboardFormModal
          wide
          eyebrow={category.name}
          title={editingId ? "Editar proyecto" : "Nuevo proyecto"}
          onClose={() => setIsModalOpen(false)}
        >
          <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-3">
              <DashboardFormSection icon={Settings2} title="Información">
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  <DashboardFormField label="Título" htmlFor="portfolio-title" className="sm:col-span-2">
                    <input
                      id="portfolio-title"
                      value={form.title}
                      onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                      className={dashboardFieldClassName}
                      required
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Subcategoría" htmlFor="portfolio-subcategory">
                    <select
                      id="portfolio-subcategory"
                      value={form.subcategoryId}
                      onChange={(event) => setForm((current) => ({ ...current, subcategoryId: event.target.value }))}
                      className={dashboardFieldClassName}
                      required
                    >
                      {category.subcategories.map((subcategory) => (
                        <option key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </option>
                      ))}
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="Orden" htmlFor="portfolio-order">
                    <input
                      id="portfolio-order"
                      type="number"
                      min={0}
                      value={form.sortOrder}
                      onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                      className={dashboardFieldClassName}
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Estado" htmlFor="portfolio-status">
                    <select
                      id="portfolio-status"
                      value={form.status}
                      onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as PortfolioProjectStatus }))}
                      className={dashboardFieldClassName}
                    >
                      <option value="DRAFT">Borrador</option>
                      <option value="PUBLISHED">Publicado</option>
                    </select>
                  </DashboardFormField>
                  <DashboardFormField label="URL del proyecto" htmlFor="portfolio-url">
                    <input
                      id="portfolio-url"
                      value={form.url}
                      onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
                      className={dashboardFieldClassName}
                      placeholder="https://cliente.cl"
                    />
                  </DashboardFormField>
                  <DashboardFormField label="Descripción breve" htmlFor="portfolio-summary" className="sm:col-span-2">
                    <textarea
                      id="portfolio-summary"
                      value={form.summary}
                      onChange={(event) => setForm((current) => ({ ...current, summary: event.target.value }))}
                      className={dashboardTextareaClassName}
                      maxLength={280}
                    />
                  </DashboardFormField>
                </div>
              </DashboardFormSection>

              <DashboardFormSection icon={Tags} title="Etiquetas">
                <DashboardFormField label="Tags separadas por coma" htmlFor="portfolio-tags">
                  <input
                    id="portfolio-tags"
                    value={form.tags}
                    onChange={(event) => setForm((current) => ({ ...current, tags: event.target.value }))}
                    className={dashboardFieldClassName}
                    placeholder="Next.js, Responsive, Conversión"
                  />
                </DashboardFormField>
              </DashboardFormSection>

              <DashboardFormSection icon={ImageIcon} title="Imagen principal 5:4">
                <div className="space-y-3">
                  <div className="relative aspect-[5/4] overflow-hidden rounded-2xl border border-border bg-slate-100">
                    {previewSrc ? (
                      previewSrc.startsWith("blob:") ? (
                        // Blob previews cannot go through the Next.js image optimizer.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={previewSrc} alt="Vista previa" className="h-full w-full object-cover" />
                      ) : (
                        <Image src={previewSrc} alt="Vista previa" fill className="object-cover" sizes="480px" />
                      )
                    ) : (
                      <div className="flex h-full items-center justify-center text-xs font-medium uppercase tracking-[0.16em] text-muted">
                        Sin imagen
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted">Usa JPG, PNG o WEBP de hasta 5 MB, con proporción 5 de ancho × 4 de alto.</p>
                  <label className="inline-flex min-h-10 cursor-pointer items-center justify-center rounded-full border border-border px-4 text-xs font-semibold">
                    Elegir imagen
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(event) => void handleImageChange(event.target.files?.[0] ?? null)}
                    />
                  </label>
                </div>
              </DashboardFormSection>
            </div>
            <DashboardFormFooter error={submitError}>
              <DashboardFormActions isSaving={isSaving} onCancel={() => setIsModalOpen(false)} submitLabel={editingId ? "Guardar cambios" : "Crear proyecto"} />
            </DashboardFormFooter>
          </form>
        </DashboardFormModal>
      ) : null}
    </div>
  );
}

function ProjectActions({
  project,
  busy,
  onEdit,
  onPublish,
  onUnpublish,
  onArchive,
  onDelete,
}: {
  project: PortfolioProjectRecord;
  busy: boolean;
  onEdit: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex flex-wrap justify-end gap-2">
      <button type="button" onClick={onEdit} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold" disabled={busy}>
        <Pencil size={12} /> Editar
      </button>
      {project.status === "PUBLISHED" ? (
        <button type="button" onClick={onUnpublish} className="inline-flex h-8 items-center rounded-full border border-border px-3 text-xs font-semibold" disabled={busy}>
          Despublicar
        </button>
      ) : (
        <button type="button" onClick={onPublish} className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-xs font-semibold text-white" disabled={busy}>
          Publicar
        </button>
      )}
      {project.status !== "ARCHIVED" ? (
        <button type="button" onClick={onArchive} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold" disabled={busy}>
          <Archive size={12} /> Archivar
        </button>
      ) : (
        <button type="button" onClick={onDelete} className="inline-flex h-8 items-center rounded-full border border-red-200 px-3 text-xs font-semibold text-red-700" disabled={busy}>
          Eliminar
        </button>
      )}
      {project.url ? (
        <a href={project.url} target="_blank" rel="noopener noreferrer" className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold">
          <Link2 size={12} /> Ver
        </a>
      ) : null}
    </div>
  );
}
