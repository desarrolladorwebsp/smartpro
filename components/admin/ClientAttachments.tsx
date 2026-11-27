"use client";

import { Download, ExternalLink, FileText, Trash2, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { CLIENT_ATTACHMENT_FORMATS, CLIENT_ATTACHMENT_MAX_BYTES, isClientAttachmentMimeType, type ClientAttachmentItem } from "@/lib/clients/attachments";

const date = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const action = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/5";
const accept = Object.keys(CLIENT_ATTACHMENT_FORMATS).join(",");

type FileListState = { files: ClientAttachmentItem[] } | { error: string; retry: boolean };

export function ClientAttachments({ clientKey }: { clientKey: string }) {
  const endpoint = `/api/clients/${encodeURIComponent(clientKey)}/attachments`;
  const input = useRef<HTMLInputElement>(null);
  const uploadButton = useRef<HTMLButtonElement>(null);
  const deleteDialog = useRef<HTMLDialogElement>(null);
  const uploading = useRef(false);
  const deleting = useRef(false);
  const dialogId = useId();
  const [state, setState] = useState<FileListState>();
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ClientAttachmentItem | null>(null);
  const [deletePending, setDeletePending] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(endpoint, { signal: controller.signal });
        const result = await response.json() as { files?: ClientAttachmentItem[]; error?: string };
        if (controller.signal.aborted) return;
        setState(response.ok && result.files ? { files: result.files } : {
          error: result.error ?? "No se pudieron cargar los archivos.", retry: response.status !== 404 && response.status !== 401,
        });
      } catch {
        if (!controller.signal.aborted) setState({ error: "No se pudieron cargar los archivos.", retry: true });
      }
    }
    void load();
    return () => controller.abort();
  }, [endpoint, attempt]);

  useEffect(() => {
    if (deleteTarget && !deleteDialog.current?.open) deleteDialog.current?.showModal();
  }, [deleteTarget]);

  async function upload(selected: FileList) {
    const files = Array.from(selected);
    if (input.current) input.current.value = "";
    if (!files.length || uploading.current) return;
    uploading.current = true;
    setBusy(true);
    setErrors([]);
    const failures: string[] = [];
    let savedCount = 0;
    try {
      for (const [index, file] of files.entries()) {
        setStatus(`Subiendo archivo ${index + 1} de ${files.length}…`);
        try {
          if (!isClientAttachmentMimeType(file.type)) throw new Error("Formato no admitido.");
          if (!file.size || file.size > CLIENT_ATTACHMENT_MAX_BYTES) throw new Error("El archivo debe pesar entre 1 byte y 4 MB.");
          const form = new FormData();
          form.append("file", file);
          const response = await fetch(endpoint, { method: "POST", body: form });
          const result = await response.json().catch(() => ({})) as { file?: ClientAttachmentItem; error?: string };
          if (!response.ok || !result.file) throw new Error(result.error ?? "No se pudo adjuntar.");
          const saved = result.file;
          setState((current) => {
            const existing = current && "files" in current ? current.files : [];
            return existing.some(({ id }) => id === saved.id) ? current : { files: [saved, ...existing] };
          });
          savedCount++;
        } catch (error) {
          failures.push(`${file.name} · ${error instanceof Error ? error.message : "No se pudo adjuntar."}`);
        }
      }
      setErrors(failures);
      setStatus(savedCount === 1 ? "1 archivo disponible." : savedCount ? `${savedCount} archivos disponibles.` : "");
    } finally {
      uploading.current = false;
      setBusy(false);
    }
  }

  async function confirmDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deleteTarget || deleting.current) return;
    deleting.current = true;
    setDeletePending(true);
    setDeleteError("");
    try {
      const response = await fetch(`${endpoint}/${encodeURIComponent(deleteTarget.id)}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmed: true }),
      });
      if (!response.ok) {
        const result: { error?: string; missing?: boolean } | null = await response.json().catch(() => null);
        if (response.status !== 404 || !result?.missing) throw new Error(result?.error ?? "No se pudo eliminar el archivo.");
      }
      setState((current) => current && "files" in current
        ? { files: current.files.filter(({ id }) => id !== deleteTarget.id) }
        : current);
      setStatus(`Archivo eliminado: ${deleteTarget.fileName}`);
      deleteDialog.current?.close();
      uploadButton.current?.focus({ preventScroll: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "No se pudo eliminar el archivo.");
    } finally {
      deleting.current = false;
      setDeletePending(false);
    }
  }

  if (!state) return <p role="status" className="text-sm text-muted">Cargando archivos…</p>;
  if ("error" in state) return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <p role="alert" className="text-muted">{state.error}</p>
      {state.retry && <button type="button" className={action} onClick={() => { setState(undefined); setAttempt((value) => value + 1); }}>Reintentar</button>}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-3.5"
        onDragOver={(event) => { if (event.dataTransfer.types.includes("Files")) event.preventDefault(); }}
        onDrop={(event) => { if (event.dataTransfer.types.includes("Files")) { event.preventDefault(); void upload(event.dataTransfer.files); } }}>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">Arrastra archivos aquí</p>
          <p className="text-xs text-muted">PDF, JPG, PNG o WebP · Hasta 4 MB por archivo</p>
        </div>
        <input ref={input} type="file" accept={accept} multiple hidden onChange={(event) => {
          if (event.currentTarget.files) void upload(event.currentTarget.files);
        }} />
        <button ref={uploadButton} type="button" aria-disabled={busy} onClick={() => { if (!busy) input.current?.click(); }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 aria-disabled:opacity-60">
          <Upload size={16} aria-hidden="true" /> Subir archivos
        </button>
      </div>
      <p role="status" className={status ? "break-words text-sm text-muted" : "sr-only"}>{status}</p>
      {!!errors.length && <ul role="alert" className="space-y-1 rounded-xl bg-red-50 p-3 text-sm text-red-800">
        {errors.map((error, index) => <li key={index} className="break-words">{error}</li>)}
      </ul>}
      {!state.files.length && <p className="text-sm text-muted">Este cliente aún no tiene archivos adjuntos.</p>}
      {!!state.files.length && <ul aria-label="Archivos adjuntos" className="divide-y divide-border">
        {state.files.map((file) => {
          const href = `${endpoint}/${encodeURIComponent(file.id)}`;
          return <li key={file.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
            <div className="flex min-w-0 flex-1 basis-48 items-center gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 text-primary">
                {file.mimeType.startsWith("image/")
                  ? <Image unoptimized src={href} alt="" width={44} height={44} className="size-full object-cover" />
                  : <FileText size={20} aria-hidden="true" />}
              </div>
              <div className="min-w-0 break-words">
                <p className="text-sm font-semibold">{file.fileName}</p>
                <p className="text-xs text-muted"><time dateTime={file.createdAt}>{date.format(new Date(file.createdAt))}</time> · {file.size < 1024 ? `${file.size} B` : `${number.format(file.size / 1024)} KB`}</p>
                <p className="text-xs text-muted">{file.uploadedBy}</p>
              </div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <a href={href} target="_blank" rel="noopener" aria-label={`Ver ${file.fileName}`} className={action}><ExternalLink size={15} aria-hidden="true" /> Ver</a>
              <a href={`${href}?download=1`} aria-label={`Descargar ${file.fileName}`} className={action}><Download size={15} aria-hidden="true" /> Descargar</a>
              <button type="button" aria-label={`Eliminar ${file.fileName}`} aria-disabled={busy}
                className="inline-flex min-h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 focus-visible:outline-2 focus-visible:outline-rose-700 aria-disabled:opacity-60"
                title="Eliminar archivo" onClick={() => { if (!uploading.current) { setDeleteError(""); setDeleteTarget(file); } }}>
                <Trash2 size={16} aria-hidden="true" />
              </button>
            </div>
          </li>;
        })}
      </ul>}
      {deleteTarget && <dialog ref={deleteDialog} role="alertdialog" aria-labelledby={`${dialogId}-title`} aria-describedby={`${dialogId}-description`}
        onClose={(event) => { event.stopPropagation(); setDeleteTarget(null); }}
        onCancel={(event) => { event.stopPropagation(); if (deleting.current) event.preventDefault(); }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-md overflow-y-auto rounded-3xl border border-border bg-white p-5 text-foreground shadow-2xl backdrop:bg-navy/45">
        <form onSubmit={confirmDelete} className="space-y-3">
          <h2 id={`${dialogId}-title`} className="text-lg font-bold">Eliminar archivo</h2>
          <p id={`${dialogId}-description`} className="break-words text-sm text-muted">
            Se eliminará permanentemente <strong className="text-foreground">{deleteTarget.fileName}</strong> de la ficha del cliente.
          </p>
          {deleteError && <p role="alert" className="text-sm text-rose-700">{deleteError}</p>}
          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button type="button" disabled={deletePending} onClick={() => deleteDialog.current?.close()} className={`${action} disabled:opacity-60`}>Cancelar</button>
            <button type="submit" disabled={deletePending} className="min-h-10 rounded-xl bg-rose-700 px-3 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-60">
              {deletePending ? "Eliminando…" : "Eliminar archivo"}
            </button>
          </div>
        </form>
      </dialog>}
    </div>
  );
}
