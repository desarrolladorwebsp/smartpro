import type { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../db";

const ensurePromises = new WeakMap<object, Promise<void>>();

export function isMissingServiceCoverColumnError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return (
    code === "P2022" ||
    /column `?cover(Bytes|Mime)`?/i.test(message) ||
    /unknown column ['`]cover(Bytes|Mime)['`]/i.test(message)
  );
}

async function columnExists(prisma: PrismaClient, table: string, column: string) {
  const columns = (await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
  return columns.some((entry) => entry.Field === column);
}

export async function ensureServiceCoverColumns(client?: PrismaClient | null): Promise<void> {
  const prisma = client ?? getPrismaClient();

  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  const existing = ensurePromises.get(prisma);
  if (existing) {
    await existing;
    return;
  }

  const pending = (async () => {
    if (!(await columnExists(prisma, "ServiceCategory", "coverMime"))) {
      await prisma.$executeRawUnsafe(
        "ALTER TABLE `ServiceCategory` ADD COLUMN `coverMime` VARCHAR(64) NOT NULL DEFAULT ''",
      );
    }

    if (!(await columnExists(prisma, "ServiceCategory", "coverBytes"))) {
      await prisma.$executeRawUnsafe("ALTER TABLE `ServiceCategory` ADD COLUMN `coverBytes` MEDIUMBLOB NULL");
    }
  })();

  ensurePromises.set(prisma, pending);

  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(prisma);
    throw error;
  }
}

export async function withServiceCoverColumns<T>(
  operation: () => Promise<T>,
  client?: PrismaClient | null,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingServiceCoverColumnError(error)) {
      throw error;
    }

    await ensureServiceCoverColumns(client);
    return operation();
  }
}
