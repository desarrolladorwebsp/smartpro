import type { CommercialClient } from "@/lib/clients/commercial-clients";

type ContactOption = { id: string; name: string; email?: string };

export function CommercialRecipientFields({
  accounts, accountId, onAccountChange, contacts, contactId, onContactChange, disabled = false, loading = false,
}: {
  accounts: CommercialClient[];
  accountId: string;
  onAccountChange: (id: string) => void;
  contacts: ContactOption[];
  contactId: string;
  onContactChange: (id: string) => void;
  disabled?: boolean;
  loading?: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">Cliente</span>
        <select aria-label="Cliente" className="dashboard-field" value={accountId} disabled={disabled}
          onChange={(event) => onAccountChange(event.target.value)}>
          <option value="">Selecciona un cliente</option>
          {accounts.map((account) => <option key={account.id} value={account.id}>{account.name}{account.rut && ` · ${account.rut}`}</option>)}
        </select>
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-semibold text-foreground">Contacto</span>
        <select aria-label="Contacto" className="dashboard-field" value={contactId} disabled={disabled || !accountId || loading || contacts.length === 0}
          onChange={(event) => onContactChange(event.target.value)}>
          <option value="">{loading ? "Cargando contactos…" : accountId && !contacts.length ? "Sin contactos disponibles" : "Selecciona un contacto"}</option>
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}{contact.email && ` · ${contact.email}`}</option>)}
        </select>
      </label>
    </div>
  );
}
