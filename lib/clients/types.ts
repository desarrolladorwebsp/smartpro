export type ClientStatus = "ACTIVO" | "POTENCIAL" | "INACTIVO";

export type ClientRecord = {
  id: string;
  companyName: string;
  rut: string;
  contactFirstName: string;
  contactLastName: string;
  email: string;
  phone: string;
  address: string;
  commune: string;
  city: string;
  region: string;
  website: string;
  notes: string;
  status: ClientStatus;
  createdAt: string;
  updatedAt: string;
};

export function getClientStatusLabel(status: ClientStatus): string {
  const labels: Record<ClientStatus, string> = {
    ACTIVO: "Activo",
    POTENCIAL: "Potencial",
    INACTIVO: "Inactivo",
  };

  return labels[status] ?? status;
}
