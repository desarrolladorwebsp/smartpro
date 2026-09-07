import { prisma } from "../db";
import { hashPassword } from "../auth";
import type { ExecutiveRegistrationInput } from "./validation";
import type { ExecutiveRecord } from "./types";

function getPrisma() {
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return prisma;
}

type ExecutiveRow = {
  id: string;
  firstName: string;
  lastName: string | null;
  rut: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
};

const EXECUTIVE_SELECT = {
  id: true,
  firstName: true,
  lastName: true,
  rut: true,
  email: true,
  phone: true,
  role: true,
  status: true,
  createdAt: true,
} as const;

function toExecutiveRecord(row: ExecutiveRow): ExecutiveRecord {
  return {
    id: row.id,
    firstName: row.firstName,
    lastName: row.lastName ?? "",
    rut: row.rut ?? "",
    email: row.email,
    phone: row.phone ?? "",
    role: row.role as ExecutiveRecord["role"],
    status: row.status as ExecutiveRecord["status"],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listExecutives(): Promise<ExecutiveRecord[]> {
  const db = getPrisma();

  const rows = await db.user.findMany({
    where: { role: { in: ["EXECUTIVE", "ADMIN"] } },
    select: EXECUTIVE_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toExecutiveRecord);
}

export async function createExecutive(input: ExecutiveRegistrationInput): Promise<ExecutiveRecord> {
  const db = getPrisma();

  const existing = await db.user.findUnique({ where: { email: input.email } });

  if (existing) {
    throw new Error("Ya existe una cuenta registrada con este correo.");
  }

  const passwordHash = hashPassword(input.password);

  const user = await db.user.create({
    data: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      rut: input.rut,
      phone: input.phone,
      passwordHash,
      role: input.role,
      status: "ACTIVE",
    },
    select: EXECUTIVE_SELECT,
  });

  return toExecutiveRecord(user);
}
