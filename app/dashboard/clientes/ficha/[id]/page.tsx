import Link from "next/link";
import { ContactButton, EditClientButton } from "@/components/admin/ClientAccountForms";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/auth";
import { getBusiness } from "@/lib/clients/business-repository";
import { commercialClientId, personName } from "@/lib/clients/commercial-clients";
import { listClientNotes, listClients } from "@/lib/clients/repository";
import { CRM_STAGES, getAssignedExecutiveName, getClientStatusLabel } from "@/lib/clients/types";
import { formatCurrency } from "@/lib/orders/service";
import { listQuotes } from "@/lib/quotes/repository";
import { listSales } from "@/lib/sales/repository";

export const dynamic = "force-dynamic";

const noteDate = new Intl.DateTimeFormat("es-CL", { dateStyle: "short", timeStyle: "short", timeZone: "America/Santiago" });

export default async function BusinessDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdminSession();
  const { id } = await params;
  const business = await getBusiness(id);
  if (!business) notFound();
  const [contacts, quotes, sales, notes] = await Promise.all([
    listClients({ businessId: id }),
    listQuotes({ businessId: id }),
    listSales({ businessId: id }),
    listClientNotes("", id),
  ]);
  const contactById = new Map(contacts.map((contact) => [contact.id, personName(contact)]));
  const executives = [...new Set(contacts.filter((contact) => contact.assignedExecutive).map((contact) =>
    getAssignedExecutiveName(contact.assignedExecutive)))];
  const key = encodeURIComponent(commercialClientId("", id));
  const panel = "space-y-3 rounded-2xl border border-border bg-white p-5";
  const item = "flex flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-primary";
  return (
    <main className="space-y-5">
      <Link href="/dashboard/clientes" className="font-semibold text-primary">Volver a clientes</Link>
      <header className={panel}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-bold">{business.name}</h1>
          <EditClientButton account={{ ...business, rut: business.rut ?? "" }} />
        </div>
        {(business.rut || business.address) && <p className="text-sm text-muted">{[business.rut, business.address].filter(Boolean).join(" · ")}</p>}
        {business.website && <p className="text-sm text-muted">{business.website}</p>}
        {business.notes && <p className="whitespace-pre-wrap text-sm text-muted">{business.notes}</p>}
        {executives.length > 0 && <p className="text-sm text-muted">Ejecutivos de contacto · {executives.join(", ")}</p>}
        <p className="text-sm">{getClientStatusLabel(business.status)} · {CRM_STAGES.find(({ id }) => id === business.crmStage)?.label}</p>
      </header>
      <section className={panel}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-semibold">Contactos</h2>
          <ContactButton accountId={id} />
        </div>
        {contacts.length === 0 && <p className="text-sm text-muted">Sin contactos asociados.</p>}
        <ul className="divide-y divide-border">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
              <div>
                <Link className="font-semibold hover:text-primary" href={`/dashboard/clientes/${contact.id}`}>{personName(contact) || "Contacto sin nombre"}</Link>
                <p className="text-muted">{[contact.jobTitle, contact.phone, contact.email].filter(Boolean).join(" · ")}</p>
                {(!contact.contactFirstName || !contact.contactLastName || !contact.phone) && <p className="text-xs text-amber-800">Completa los datos del contacto para cotizar o registrar una venta nueva.</p>}
              </div>
              {contact.contactId && <ContactButton accountId={id} contact={contact} />}
            </li>
          ))}
        </ul>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Cotizaciones</h2>
            <Link href={`/dashboard/cotizaciones?clientId=${key}`} className="text-sm font-semibold text-primary">Ir a cotizaciones</Link>
          </div>
          {quotes.length === 0 && <p className="text-sm text-muted">Sin cotizaciones registradas.</p>}
          <ul className="divide-y divide-border">
            {quotes.map((quote) => (
              <li key={quote.id}>
                <Link className={item} href={`/dashboard/cotizaciones/${quote.id}`}>
                  <span>{quote.number} · {quote.clientName}</span><span>{formatCurrency(quote.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section className={panel}>
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Ventas</h2>
            <Link href={`/dashboard/ventas?clientId=${key}`} className="text-sm font-semibold text-primary">Ir a ventas</Link>
          </div>
          {sales.length === 0 && <p className="text-sm text-muted">Sin ventas registradas.</p>}
          <ul className="divide-y divide-border">
            {sales.map((sale) => (
              <li key={sale.id}>
                <Link className={item} href={`/dashboard/ventas/${sale.id}`}>
                  <span>{sale.number} · {sale.clientName}</span><span>{formatCurrency(sale.total)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
      <section id="notas" className={panel}>
        <h2 className="font-semibold">Notas</h2>
        {notes.length === 0 && <p className="text-sm text-muted">Sin notas registradas.</p>}
        <ul className="divide-y divide-border">
          {notes.map((note) => (
            <li key={note.id} className="space-y-1 py-3 text-sm">
              {note.clientId ? <Link href={`/dashboard/clientes/${note.clientId}`} className="font-semibold text-primary">
                {note.title || contactById.get(note.clientId) || "Nota de contacto"}
              </Link> : <p className="font-semibold text-foreground">Nota rápida</p>}
              <p className="whitespace-pre-wrap break-words text-foreground">{note.content}</p>
              <p className="break-words text-xs text-muted"><time dateTime={note.createdAt}>{noteDate.format(new Date(note.createdAt))}</time> · {note.executiveEmail}</p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
