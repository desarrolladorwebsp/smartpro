import type { PrismaClient } from "@prisma/client";

import { getPrismaClient } from "../db";

export const CREATE_PORTFOLIO_PROJECT_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS \`PortfolioProject\` (
    \`id\` VARCHAR(191) NOT NULL,
    \`categoryId\` VARCHAR(191) NOT NULL,
    \`subcategoryId\` VARCHAR(191) NOT NULL,
    \`title\` VARCHAR(191) NOT NULL,
    \`slug\` VARCHAR(191) NOT NULL,
    \`summary\` TEXT NOT NULL,
    \`image\` VARCHAR(191) NOT NULL DEFAULT '',
    \`url\` VARCHAR(191) NOT NULL DEFAULT '',
    \`tags\` JSON NOT NULL DEFAULT (JSON_ARRAY()),
    \`status\` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
    \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
    PRIMARY KEY (\`id\`),
    UNIQUE INDEX \`PortfolioProject_categoryId_slug_key\` (\`categoryId\`, \`slug\`),
    INDEX \`PortfolioProject_categoryId_status_sortOrder_idx\` (\`categoryId\`, \`status\`, \`sortOrder\`),
    INDEX \`PortfolioProject_subcategoryId_idx\` (\`subcategoryId\`),
    CONSTRAINT \`PortfolioProject_categoryId_fkey\`
      FOREIGN KEY (\`categoryId\`) REFERENCES \`ServiceCategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT \`PortfolioProject_subcategoryId_fkey\`
      FOREIGN KEY (\`subcategoryId\`) REFERENCES \`ServiceSubcategory\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE
  ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
`;

const ensurePromises = new WeakMap<object, Promise<void>>();

export function isMissingPortfolioTableError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const code = "code" in error ? String((error as { code?: string }).code ?? "") : "";
  const message = error instanceof Error ? error.message : String(error);

  return code === "P2021" || /table `?PortfolioProject`? does not exist/i.test(message);
}

export function isPortfolioConnectionError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return /no hay conexión a la base de datos/i.test(error.message);
}

export async function ensurePortfolioProjectTable(client?: PrismaClient | null): Promise<void> {
  const prisma = client ?? getPrismaClient();

  if (!prisma) {
    throw new Error("No hay conexión a la base de datos.");
  }

  const existing = ensurePromises.get(prisma);
  if (existing) {
    await existing;
    return;
  }

  const pending = prisma.$executeRawUnsafe(CREATE_PORTFOLIO_PROJECT_TABLE_SQL).then(() => undefined);
  ensurePromises.set(prisma, pending);

  try {
    await pending;
  } catch (error) {
    ensurePromises.delete(prisma);
    throw error;
  }
}

export async function withPortfolioTable<T>(
  operation: () => Promise<T>,
  client?: PrismaClient | null,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (!isMissingPortfolioTableError(error)) {
      throw error;
    }

    await ensurePortfolioProjectTable(client);
    return operation();
  }
}
