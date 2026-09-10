export type ClientStatus = "ACTIVO" | "POTENCIAL" | "INACTIVO";

export const CLIENT_COMMERCIAL_STATUSES = ["PROSPECTO", "EN_SEGUIMIENTO", "CERRADO_PERDIDO"] as const;

export type ClientCommercialStatus = (typeof CLIENT_COMMERCIAL_STATUSES)[number];

export type ClientAssignedExecutive = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
};

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
  commercialStatus: ClientCommercialStatus;
  assignedExecutiveId: string | null;
  assignedExecutive: ClientAssignedExecutive | null;
  interestServiceId: string | null;
  interestServiceName: string;
  interestSubcategoryId: string | null;
  interestSubcategoryName: string;
  interestPlanId: string | null;
  interestPlanName: string;
  createdAt: string;
  updatedAt: string;
};

export const CLIENT_COMMERCIAL_STATUS_LABELS: Record<ClientCommercialStatus, string> = {
  PROSPECTO: "Prospecto",
  EN_SEGUIMIENTO: "En seguimiento",
  CERRADO_PERDIDO: "Cerrado perdido",
};

export function isClientCommercialStatus(value: unknown): value is ClientCommercialStatus {
  return CLIENT_COMMERCIAL_STATUSES.includes(value as ClientCommercialStatus);
}

export function parseClientCommercialStatus(value: unknown): ClientCommercialStatus {
  if (!isClientCommercialStatus(value)) {
    throw new Error("Estado comercial inválido.");
  }

  return value;
}

export function getClientCommercialStatusLabel(status: ClientCommercialStatus): string {
  return CLIENT_COMMERCIAL_STATUS_LABELS[status] ?? status;
}

export function getAssignedExecutiveName(executive: ClientAssignedExecutive | null | undefined): string {
  if (!executive) return "Sin asignar";
  const name = `${executive.firstName} ${executive.lastName}`.trim();
  return name || executive.email;
}

export function parseAssignedExecutiveId(value: unknown): string | null {
  if (value == null || value === "") {
    return null;
  }

  if (typeof value !== "string") {
    throw new Error("El ejecutivo asignado no es válido.");
  }

  const executiveId = value.trim();
  return executiveId || null;
}

export function getClientStatusLabel(status: ClientStatus): string {
  const labels: Record<ClientStatus, string> = {
    ACTIVO: "Activo",
    POTENCIAL: "Potencial",
    INACTIVO: "Inactivo",
  };

  return labels[status] ?? status;
}
