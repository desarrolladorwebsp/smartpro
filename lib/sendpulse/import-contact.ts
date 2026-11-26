import { setTimeout } from "node:timers/promises";
import { Prisma } from "@prisma/client";
import { linkImportedContact } from "@/lib/clients/account-repository";
import { prisma } from "@/lib/db";
import { fetchContactProfile, resolveContact, type ContactAction } from "./contact";

type ImportContact = NonNullable<ReturnType<typeof resolveContact>>;

export async function registerSendpulseContact(action: ContactAction): Promise<200 | 409 | 422 | 503> {
  try {
    if (!prisma) return 503;
    const linked = await prisma.sendpulseContact.findUnique({ where: { externalId: action.id } });
    if (linked) return 200;

    const apiKey = process.env.SENDPULSE_API_KEY?.trim();
    const profile = apiKey ? await fetchContactProfile(action.id, apiKey).catch(() => undefined) : undefined;
    const contact = resolveContact(action, profile);
    if (!contact) return apiKey && !profile ? 503 : 422;

    return await importSendpulseContact(contact) === "conflict" ? 409 : 200;
  } catch {
    console.error("[smartpro:sendpulse] No se pudo guardar la ficha.");
    return 503;
  }
}

function isRetryableConflict(error: unknown) {
  if (!(error instanceof Prisma.PrismaClientKnownRequestError)) return false;
  if (error.code === "P2002" || error.code === "P2034") return true;

  // Prisma wraps MariaDB transaction conflicts from raw queries differently from model writes.
  const adapterError = error.meta?.driverAdapterError;
  const cause = adapterError instanceof Error
    ? adapterError.cause as { kind?: string; originalCode?: string } | undefined
    : undefined;
  return error.code === "P2010" && (cause?.kind === "TransactionWriteConflict" ||
    ["1020", "1205", "1213"].includes(cause?.originalCode ?? ""));
}

export async function importSendpulseContact(contact: ImportContact) {
  const db = prisma;
  if (!db) throw new Error("No hay conexión a la base de datos.");

  const digits = contact.phone.slice(1);
  const phoneVariants = [digits, `00${digits}`];
  if (/^569\d{8}$/.test(digits)) phoneVariants.push(digits.slice(2));
  const matchPhone = digits
    ? Prisma.sql`REGEXP_REPLACE(COALESCE(p.phone, c.phone), '[^0-9]', '') IN (${Prisma.join(phoneVariants)})`
    : Prisma.sql`FALSE`;
  const matchEmail = contact.email
    ? Prisma.sql`LOWER(TRIM(COALESCE(p.email, c.email))) = ${contact.email}`
    : Prisma.sql`FALSE`;

  for (let attempt = 0; ; attempt++) {
    try {
      return await db.$transaction(async (tx) => {
        const linked = await tx.sendpulseContact.findUnique({ where: { externalId: contact.externalId } });
        if (linked) return "existing";

        const matches = await tx.$queryRaw<{ id: string }[]>`
          SELECT c.id FROM Client c
          LEFT JOIN ClientContact cc ON cc.legacyClientId = c.id
          LEFT JOIN Contact p ON p.id = cc.contactId
          WHERE (${matchPhone}) OR (${matchEmail})
          LIMIT 2
        `;
        if (matches.length > 1) return "conflict";

        let clientId = matches[0]?.id;
        const created = !clientId;
        if (!clientId) {
          const legacy = await tx.client.create({
            data: {
              companyName: "",
              contactFirstName: contact.firstName,
              contactLastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              status: "POTENCIAL",
            },
          });
          await linkImportedContact(tx, legacy, "SENDPULSE");
          clientId = legacy.id;
        }
        await tx.sendpulseContact.create({ data: { externalId: contact.externalId, clientId } });
        return created ? "created" : "existing";
      }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    } catch (error) {
      if (attempt >= 5 || !isRetryableConflict(error)) throw error;
      await setTimeout(25 * 2 ** attempt + Math.random() * 25);
    }
  }
}
