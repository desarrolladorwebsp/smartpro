import crypto from "node:crypto";

import type { UserRole } from "@prisma/client";

import { getAppUrl } from "../app-url";
import { buildExecutiveInvitationEmail } from "../email/executive-invitation";
import { sendEmail } from "../email/resend";
import { prisma } from "../db";
import { hashPassword, normalizeEmail } from "../auth";
import type { ExecutiveInviteInput, InvitationAcceptInput } from "./invitation-validation";
import { getExecutiveRoleLabel } from "./types";
import type { ExecutiveRecord } from "./types";

const INVITATION_TTL_MS = 1000 * 60 * 60 * 72;

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

function getPrisma() {
  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  return prisma;
}

function generateInvitationToken(): string {
  return crypto.randomBytes(32).toString("base64url");
}

function toExecutiveRecord(row: {
  id: string;
  firstName: string;
  lastName: string | null;
  rut: string | null;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  createdAt: Date;
}): ExecutiveRecord {
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

async function expireStaleInvitations(email: string) {
  const db = getPrisma();
  const now = new Date();

  await db.invitation.updateMany({
    where: {
      email,
      status: "PENDING",
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });
}

export type ValidInvitationPreview = {
  email: string;
  role: UserRole;
  expiresAt: string;
};

export async function createExecutiveInvitation(
  input: ExecutiveInviteInput,
  invitedById: string,
): Promise<{ email: string; expiresAt: string; emailDelivered: boolean }> {
  const db = getPrisma();
  const email = normalizeEmail(input.email);

  const existingUser = await db.user.findUnique({ where: { email } });

  if (existingUser?.status === "ACTIVE") {
    throw new Error("Ya existe un usuario activo con este correo.");
  }

  if (existingUser) {
    throw new Error("Ya existe una cuenta registrada con este correo.");
  }

  await expireStaleInvitations(email);

  const pendingInvitation = await db.invitation.findFirst({
    where: {
      email,
      status: "PENDING",
      expiresAt: { gt: new Date() },
    },
  });

  if (pendingInvitation) {
    throw new Error("Ya existe una invitación pendiente para este correo.");
  }

  const appUrl = getAppUrl();
  const token = generateInvitationToken();
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);

  await db.invitation.updateMany({
    where: {
      email,
      status: "PENDING",
    },
    data: { status: "CANCELLED" },
  });

  await db.invitation.create({
    data: {
      email,
      firstName: "",
      role: input.role,
      token,
      status: "PENDING",
      expiresAt,
      invitedById,
    },
  });

  const inviteUrl = `${appUrl}/invitacion/ejecutivo?token=${encodeURIComponent(token)}`;
  const roleLabel = getExecutiveRoleLabel(input.role);
  const invitationEmail = buildExecutiveInvitationEmail({
    roleLabel,
    inviteUrl,
    appUrl,
  });

  const emailResult = await sendEmail({
    to: email,
    subject: invitationEmail.subject,
    text: invitationEmail.text,
    html: invitationEmail.html,
  });

  return {
    email,
    expiresAt: expiresAt.toISOString(),
    emailDelivered: emailResult.delivered,
  };
}

export async function getValidInvitationByToken(token: string): Promise<ValidInvitationPreview | null> {
  if (!token) {
    return null;
  }

  const db = getPrisma();
  const invitation = await db.invitation.findUnique({ where: { token } });

  if (!invitation) {
    return null;
  }

  if (invitation.status === "PENDING" && invitation.expiresAt < new Date()) {
    await db.invitation.update({
      where: { id: invitation.id },
      data: { status: "EXPIRED" },
    });
    return null;
  }

  if (invitation.status !== "PENDING") {
    return null;
  }

  if (invitation.role !== "EXECUTIVE" && invitation.role !== "ADMIN") {
    return null;
  }

  return {
    email: invitation.email,
    role: invitation.role,
    expiresAt: invitation.expiresAt.toISOString(),
  };
}

export async function acceptExecutiveInvitation(input: InvitationAcceptInput): Promise<ExecutiveRecord> {
  const db = getPrisma();
  const now = new Date();

  return db.$transaction(async (tx) => {
    const invitation = await tx.invitation.findUnique({ where: { token: input.token } });

    if (!invitation) {
      throw new Error("La invitación no es válida.");
    }

    if (invitation.status === "PENDING" && invitation.expiresAt < now) {
      await tx.invitation.update({
        where: { id: invitation.id },
        data: { status: "EXPIRED" },
      });
      throw new Error("La invitación ha expirado.");
    }

    if (invitation.status !== "PENDING") {
      throw new Error("Esta invitación ya fue utilizada o no está disponible.");
    }

    if (invitation.role !== "EXECUTIVE" && invitation.role !== "ADMIN") {
      throw new Error("La invitación no es válida.");
    }

    const email = normalizeEmail(invitation.email);

    const existingUser = await tx.user.findUnique({ where: { email } });

    if (existingUser?.status === "ACTIVE") {
      throw new Error("Ya existe un usuario activo con este correo.");
    }

    if (existingUser) {
      throw new Error("Ya existe una cuenta registrada con este correo.");
    }

    if (input.rut) {
      const existingRut = await tx.user.findFirst({ where: { rut: input.rut } });

      if (existingRut) {
        throw new Error("Ya existe un usuario registrado con este RUT.");
      }
    }

    const passwordHash = hashPassword(input.password);

    const user = await tx.user.create({
      data: {
        email,
        firstName: input.firstName,
        lastName: input.lastName,
        rut: input.rut,
        phone: input.phone,
        passwordHash,
        role: invitation.role,
        status: "ACTIVE",
      },
      select: EXECUTIVE_SELECT,
    });

    const updated = await tx.invitation.updateMany({
      where: {
        id: invitation.id,
        status: "PENDING",
        expiresAt: { gt: now },
      },
      data: {
        status: "ACCEPTED",
        acceptedAt: now,
        acceptedById: user.id,
        firstName: input.firstName,
        lastName: input.lastName,
      },
    });

    if (updated.count === 0) {
      throw new Error("No se pudo completar la invitación. Inténtalo de nuevo.");
    }

    return toExecutiveRecord(user);
  });
}
