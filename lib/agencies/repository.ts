import { prisma } from "../db";
import { ensureAgencySchema } from "./schema";
import { SMARTPRO_AGENCY_ID, type AgencyIdentity, type AgencyProfile } from "./types";

function db() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

export async function listAgencyProfiles(): Promise<AgencyProfile[]> {
  const client = db();
  await ensureAgencySchema(client);
  const rows = await client.agency.findMany({ orderBy: [{ active: "desc" }, { brandName: "asc" }] });
  return rows.map((row) => ({ ...row, id: row.id }));
}

export async function getAgencyProfile(id: string): Promise<AgencyProfile> {
  const client = db();
  await ensureAgencySchema(client);
  const profile = await client.agency.findUnique({ where: { id } });
  if (!profile || !profile.active) throw new Error("La agencia seleccionada no está disponible.");
  return profile;
}

function normalizeProfile(input: Partial<AgencyIdentity>, id: string): AgencyIdentity {
  const text = (key: keyof AgencyIdentity) => String(input[key] ?? "").trim();
  const brandName = text("brandName");
  const email = text("email");
  if (!brandName) throw new Error("Ingresa el nombre comercial de la agencia.");
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("El correo de contacto no es válido.");
  return {
    id,
    brandName,
    legalName: text("legalName"),
    rut: text("rut"),
    tagline: text("tagline"),
    address: text("address"),
    commune: text("commune"),
    postalCode: text("postalCode"),
    offices: text("offices"),
    phone: text("phone"),
    contactName: text("contactName"),
    email,
    website: text("website"),
    logoUrl: text("logoUrl"),
    bankAccountHolder: text("bankAccountHolder"),
    bankRut: text("bankRut"),
    bankName: text("bankName"),
    bankAccountType: text("bankAccountType"),
    bankAccountNumber: text("bankAccountNumber"),
    bankEmail: text("bankEmail"),
  };
}

export async function saveAgencyProfile(input: Partial<AgencyProfile>, requestedId?: string): Promise<AgencyProfile> {
  const client = db();
  await ensureAgencySchema(client);
  const brandName = String(input.brandName ?? "").trim();
  const id = requestedId || brandName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (!id || id.length > 64 || !/^[a-z0-9-]+$/.test(id)) throw new Error("El identificador de agencia no es válido.");
  if (!requestedId && id === SMARTPRO_AGENCY_ID) throw new Error("Ya existe una agencia con ese identificador.");
  const data = normalizeProfile(input, id);
  if (id === SMARTPRO_AGENCY_ID && input.active === false) throw new Error("SmartPro debe permanecer disponible para nuevas cotizaciones.");
  return client.agency.upsert({
    where: { id },
    create: { ...data, active: input.active ?? true },
    update: { ...data, ...(typeof input.active === "boolean" ? { active: input.active } : {}) },
  });
}

export async function getAgencySnapshot(id: string): Promise<AgencyIdentity> {
  return getAgencyProfile(id);
}
