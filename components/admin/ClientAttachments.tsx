"use client";

import { Download, ExternalLink, FileText, Upload } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import { CLIENT_ATTACHMENT_FORMATS, CLIENT_ATTACHMENT_MAX_BYTES, isClientAttachmentMimeType, type ClientAttachmentItem } from "@/lib/clients/attachments";

const date = new Intl.DateTimeFormat("es-CL", { dateStyle: "medium", timeZone: "America/Santiago" });
const number = new Intl.NumberFormat("es-CL", { maximumFractionDigits: 1 });
const action = "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-xl border border-border px-3 text-sm font-semibold text-primary hover:bg-primary/5";
const accept = Object.keys(CLIENT_ATTACHMENT_FORMATS).join(",");

type FileListState = { files: ClientAttachmentItem[] } | { error: string; retry: boolean };

export function ClientAttachments({ clientKey }: { clientKey: string }) {
  const endpoint = `/api/clients/${encodeURIComponent(clientKey)}/attachments`;
  const input = useRef<HTMLInputElement>(null);
  const uploading = useRef(false);
  const [state, setState] = useState<FileListState>();
  const [attempt, setAttempt] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

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
        setUploadStatus(`Subiendo archivo ${index + 1} de ${files.length}…`);
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
      setUploadStatus(savedCount === 1 ? "1 archivo disponible." : savedCount ? `${savedCount} archivos disponibles.` : "");
    } finally {
      uploading.current = false;
      setBusy(false);
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
        <button type="button" aria-disabled={busy} onClick={() => { if (!busy) input.current?.click(); }}
          className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white hover:bg-primary/90 aria-disabled:opacity-60">
          <Upload size={16} aria-hidden="true" /> Subir archivos
        </button>
      </div>
      <p role="status" className={uploadStatus ? "text-sm text-muted" : "sr-only"}>{uploadStatus}</p>
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
            </div>
          </li>;
        })}
      </ul>}
    </div>
  );
}
