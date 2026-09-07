export type ExecutiveRole = "EXECUTIVE" | "ADMIN";

export type ExecutiveStatus = "ACTIVE" | "INACTIVE" | "PENDING";

export type ExecutiveRecord = {
  id: string;
  firstName: string;
  lastName: string;
  rut: string;
  email: string;
  phone: string;
  role: ExecutiveRole;
  status: ExecutiveStatus;
  createdAt: string;
};

export function getExecutiveRoleLabel(role: ExecutiveRole): string {
  const labels: Record<ExecutiveRole, string> = {
    EXECUTIVE: "Ejecutivo",
    ADMIN: "Administrador",
  };

  return labels[role] ?? role;
}
