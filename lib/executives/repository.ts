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
    where: { role: { in: ["EXECUTIVE", "ADMIN"] }, deletedAt: null },
    select: EXECUTIVE_SELECT,
    orderBy: { createdAt: "desc" },
  });

  return rows.map(toExecutiveRecord);
}

export async function listAssignableExecutives(): Promise<ExecutiveRecord[]> {
  const db = getPrisma();

  const rows = await db.user.findMany({
    where: {
      role: { in: ["EXECUTIVE", "ADMIN"] },
      status: "ACTIVE",
      deletedAt: null,
    },
    select: EXECUTIVE_SELECT,
    orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
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

export async function updateExecutiveStatus(id: string, status: "ACTIVE" | "INACTIVE"): Promise<void> {
  const db = getPrisma();
  const user = await db.user.findFirst({ where: { id, role: { in: ["EXECUTIVE", "ADMIN"] }, deletedAt: null } });
  if (!user) throw new Error("No se encontró el usuario.");

  if (user.role === "ADMIN" && user.status === "ACTIVE" && status !== "ACTIVE") {
    const activeAdmins = await db.user.count({
      where: { role: "ADMIN", status: "ACTIVE", deletedAt: null },
    });
    if (activeAdmins <= 1) throw new Error("Debe existir al menos un administrador activo.");
  }

  await db.user.update({ where: { id }, data: { status } });
  if (status !== "ACTIVE") {
    await db.session.deleteMany({ where: { userId: id } });
  }
}

export async function softDeleteExecutive(id: string): Promise<void> {
  const db = getPrisma();
  const user = await db.user.findFirst({ where: { id, role: { in: ["EXECUTIVE", "ADMIN"] }, deletedAt: null } });
  if (!user) throw new Error("No se encontró el usuario.");

  if (user.role === "ADMIN" && user.status === "ACTIVE") {
    const activeAdmins = await db.user.count({
      where: { role: "ADMIN", status: "ACTIVE", deletedAt: null },
    });
    if (activeAdmins <= 1) throw new Error("Debe existir al menos un administrador activo.");
  }

  await db.user.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
  await db.session.deleteMany({ where: { userId: id } });
}
