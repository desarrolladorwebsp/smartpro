"use client";

import { useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ContactRound, IdCard, Plus, Trash2, type LucideIcon } from "lucide-react";
import { DashboardFormFooter, DashboardFormModal } from "@/components/admin/dashboard-form";
import type { BusinessProfile } from "@/lib/clients/business";
import { CLIENT_STATUSES, getClientStatusLabel, type ClientRecord } from "@/lib/clients/types";

const button = "rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60";
const linkButton = "rounded-xl border border-border px-4 py-2 text-sm font-semibold text-primary disabled:opacity-60";
const fieldLabel = "block min-w-0 text-sm font-medium text-foreground";
const field = "dashboard-field mt-1.5 h-10 rounded-xl px-3 py-2";
const panel = "min-w-0 space-y-3.5 rounded-2xl border border-border bg-white p-3.5 sm:p-4";

function FormSectionHeading({ icon: Icon, title }: { icon: LucideIcon; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon size={17} aria-hidden="true" />
      </span>
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );
}

async function save(path: string, method: string, payload: unknown) {
  const response = await fetch(path, {
    method, body: JSON.stringify(payload), headers: { "Content-Type": "application/json" },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? "No se pudo guardar el cambio.");
  return data;
}

function ContactFields({ prefix, contact, compactAtMedium = false }: {
  prefix: string;
  contact?: ClientRecord;
  compactAtMedium?: boolean;
}) {
  const mainField = compactAtMedium ? `${fieldLabel} sm:max-lg:col-span-2` : fieldLabel;
  const emailField = compactAtMedium ? `${fieldLabel} sm:max-lg:col-span-3` : fieldLabel;
  const jobField = `${fieldLabel} col-span-full ${compactAtMedium ? "sm:max-lg:col-span-3" : ""}`;
  return (
    <div className={`grid grid-cols-2 gap-x-3 gap-y-2.5 max-[359px]:grid-cols-1 ${compactAtMedium ? "sm:max-lg:grid-cols-6" : ""}`}>
      <label className={mainField}>Nombre del contacto
        <input className={field} required maxLength={191} name={prefix + "firstName"} defaultValue={contact?.contactFirstName} />
      </label>
      <label className={mainField}>Apellido
        <input className={field} required maxLength={191} name={prefix + "lastName"} defaultValue={contact?.contactLastName} />
      </label>
      <label className={mainField}>Teléfono
        <input className={field} required type="tel" maxLength={191} name={prefix + "phone"} defaultValue={contact?.phone} />
      </label>
      <label className={emailField}>Correo <span className="font-normal text-muted">(opcional)</span>
        <input className={field} type="email" maxLength={191} name={prefix + "email"} defaultValue={contact?.email} />
      </label>
      <label className={jobField}>Cargo <span className="font-normal text-muted">(opcional)</span>
        <input className={field} maxLength={191} name={prefix + "jobTitle"} defaultValue={contact?.jobTitle} />
      </label>
    </div>
  );
}

function readContact(fields: FormData, prefix: string) {
  return {
    firstName: fields.get(prefix + "firstName"), lastName: fields.get(prefix + "lastName"),
    phone: fields.get(prefix + "phone"), email: fields.get(prefix + "email"), jobTitle: fields.get(prefix + "jobTitle"),
  };
}

export function ClientAccountForm({ account, onClose }: { account?: BusinessProfile; onClose: () => void }) {
  const router = useRouter();
  const [contacts, setContacts] = useState([0]);
  const nextContact = useRef(1);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    const fields = new FormData(event.currentTarget);
    const data = Object.fromEntries(["name", "rut", "website", "address", "status", "notes"].map((key) => [key, fields.get(key)]));
    try {
      if (account) {
        await save(`/api/clientes/${encodeURIComponent(account.id)}`, "PATCH", data);
      } else {
        await save("/api/clientes", "POST", {
          ...data, contacts: contacts.map((id) => readContact(fields, `contact-${id}-`)),
        });
      }
      onClose();
      router.refresh();
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar el cliente.");
    } finally {
      setPending(false);
    }
  }

  return (
    <DashboardFormModal title={account ? "Editar cliente" : "Nuevo cliente"} eyebrow="Clientes" onClose={onClose} wide>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="min-h-0 overflow-y-auto bg-slate-50/80 p-3 sm:p-4">
          <div className={`grid items-start gap-3 sm:gap-4 ${account ? "" : "lg:grid-cols-2"}`}>
            <section className={panel}>
              <FormSectionHeading icon={IdCard} title="Datos del cliente" />
              <div className={`grid gap-x-3 gap-y-2.5 min-[390px]:grid-cols-2 ${account ? "" : "sm:max-lg:grid-cols-6"}`}>
                <label className={`${fieldLabel} col-span-full`}>Nombre del cliente
                  <input className={field} name="name" required maxLength={191} defaultValue={account?.name} />
                </label>
                <label className={`${fieldLabel} ${account ? "" : "sm:max-lg:col-span-2"}`}>RUT <span className="font-normal text-muted">(opcional)</span>
                  <input className={field} name="rut" maxLength={20} defaultValue={account?.rut} />
                </label>
                <label className={`${fieldLabel} ${account ? "" : "sm:max-lg:col-span-2"}`}>Estado
                  <select className={field} name="status" defaultValue={account?.status ?? "POTENCIAL"}>
                    {CLIENT_STATUSES.map((status) => <option key={status} value={status}>{getClientStatusLabel(status)}</option>)}
                  </select>
                </label>
                <label className={`${fieldLabel} ${account ? "" : "sm:max-lg:col-span-2"}`}>Sitio web <span className="font-normal text-muted">(opcional)</span>
                  <input className={field} name="website" maxLength={191} defaultValue={account?.website} />
                </label>
                <label className={`${fieldLabel} ${account ? "" : "sm:max-lg:col-span-3"}`}>Dirección <span className="font-normal text-muted">(opcional)</span>
                  <input className={field} name="address" maxLength={191} defaultValue={account?.address} />
                </label>
                <label className={`${fieldLabel} col-span-full ${account ? "" : "sm:max-lg:col-span-3"}`}>Notas <span className="font-normal text-muted">(opcional)</span>
                  <textarea className="dashboard-field mt-1.5 min-h-14 resize-y rounded-xl px-3 py-2" name="notes" maxLength={10000} defaultValue={account?.notes ?? ""} />
                </label>
              </div>
            </section>
            {!account && <section className={panel}>
              <FormSectionHeading icon={ContactRound} title="Contactos" />
              <p className="text-xs leading-relaxed text-muted">Nombre, apellido y teléfono son obligatorios.</p>
              {contacts.map((id, index) => <fieldset key={id} className="min-w-0 space-y-2.5 rounded-xl border border-border bg-slate-50/65 px-3 pb-3">
                <legend className="px-1.5 text-xs font-semibold text-primary">Contacto {index + 1}</legend>
                <ContactFields prefix={`contact-${id}-`} compactAtMedium />
                {contacts.length > 1 && <button type="button" className="inline-flex min-h-9 items-center gap-1.5 text-sm font-medium text-muted hover:text-red-700"
                  onClick={() => setContacts((list) => list.filter((row) => row !== id))}>
                  <Trash2 size={14} aria-hidden="true" /> Quitar contacto {index + 1}
                </button>}
              </fieldset>)}
              <button type="button" className="flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/30 bg-primary/5 px-3 text-sm font-semibold text-primary hover:bg-primary/10" onClick={() => {
                const id = nextContact.current++;
                setContacts((list) => [...list, id]);
              }}><Plus size={16} aria-hidden="true" /> Agregar contacto</button>
            </section>}
          </div>
        </div>
        <DashboardFormFooter error={error}>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={linkButton} onClick={onClose} disabled={pending}>Cancelar</button>
            <button className={button} disabled={pending}>{pending ? "Guardando…" : "Guardar cliente"}</button>
          </div>
        </DashboardFormFooter>
      </form>
    </DashboardFormModal>
  );
}

export function EditClientButton({ account }: { account: BusinessProfile }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className={linkButton} onClick={() => setOpen(true)}>Editar cliente</button>
    {open && <ClientAccountForm account={account} onClose={() => setOpen(false)} />}
  </>;
}

export function ContactButton({ accountId, contact }: { accountId: string; contact?: ClientRecord }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError("");
    try {
      await save(`/api/clientes/${encodeURIComponent(accountId)}/contactos`, "POST", {
        ...readContact(new FormData(event.currentTarget), ""), id: contact?.contactId,
      });
      router.refresh();
      setOpen(false);
    } catch (error) {
      setError(error instanceof Error ? error.message : "No se pudo guardar el contacto.");
    } finally {
      setPending(false);
    }
  }

  return <>
    <button type="button" className={linkButton} onClick={() => { setError(""); setOpen(true); }}>
      {contact ? "Editar contacto" : "Agregar contacto"}
    </button>
    {open && <DashboardFormModal title={contact ? "Editar contacto" : "Agregar contacto"} eyebrow="Contactos" onClose={() => setOpen(false)}>
      <form onSubmit={submit} className="flex min-h-0 flex-col">
        <div className="min-h-0 overflow-y-auto bg-slate-50/80 p-3 sm:p-4">
          <section className={panel}>
            <p className="text-xs leading-relaxed text-muted">Nombre, apellido y teléfono son obligatorios.</p>
            <ContactFields prefix="" contact={contact} />
          </section>
        </div>
        <DashboardFormFooter error={error}>
          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className={linkButton} onClick={() => setOpen(false)} disabled={pending}>Cancelar</button>
            <button className={button} disabled={pending}>{pending ? "Guardando…" : "Guardar contacto"}</button>
          </div>
        </DashboardFormFooter>
      </form>
    </DashboardFormModal>}
  </>;
}

export function DeleteClientButton({ id, kind, name }: {
  id: string;
  kind: "business" | "person";
  name: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const saving = useRef(false);

  function close() {
    if (!saving.current) setOpen(false);
  }

  async function confirm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving.current) return;
    saving.current = true;
    setPending(true);
    setError("");
    try {
      await save(`/api/clientes/${encodeURIComponent(id)}`, "DELETE", { kind, confirmed: true });
      router.replace("/dashboard/clientes");
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "No se pudo eliminar el cliente.");
    } finally {
      saving.current = false;
      setPending(false);
    }
  }

  return (
    <>
      <button type="button" onClick={() => { setError(""); setOpen(true); }}
        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-red-200 px-3 text-sm font-semibold text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-red-700">
        <Trash2 size={15} aria-hidden="true" /> Eliminar cliente
      </button>
      {open && <DashboardFormModal title="Eliminar cliente" eyebrow="Clientes" onClose={close}>
        <form onSubmit={confirm} className="flex min-h-0 flex-col">
          <div className="space-y-2 overflow-y-auto px-4 py-3 text-sm">
            <p className="break-words font-semibold">{name}</p>
            <p className="text-muted">La ficha se ocultará de Clientes y se excluirá de los indicadores. Se conservarán sus datos e historial.</p>
          </div>
          <DashboardFormFooter error={error}>
            <div className="flex flex-wrap justify-end gap-2">
              <button type="button" onClick={close} disabled={pending} autoFocus className={linkButton}>Cancelar</button>
              <button type="submit" disabled={pending}
                className="rounded-xl bg-red-700 px-4 py-2 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                {pending ? "Eliminando…" : "Eliminar cliente"}
              </button>
            </div>
          </DashboardFormFooter>
        </form>
      </DashboardFormModal>}
    </>
  );
}
