import { randomUUID } from "node:crypto";

import { prisma } from "../db";

export const SALE_INTERNAL_COMMENT_MAX_LENGTH = 2000;

export type SaleInternalCommentRecord = {
  id: string;
  saleId: string;
  authorEmail: string;
  body: string;
  createdAt: string;
};

function getPrisma() {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  return prisma;
}

async function ensureTable() {
  await getPrisma().$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`SaleInternalComment\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`saleId\` VARCHAR(191) NOT NULL,
      \`authorEmail\` VARCHAR(191) NOT NULL,
      \`body\` TEXT NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`SaleInternalComment_saleId_createdAt_idx\` (\`saleId\`, \`createdAt\`),
      CONSTRAINT \`SaleInternalComment_saleId_fkey\` FOREIGN KEY (\`saleId\`) REFERENCES \`Sale\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

export async function listSaleInternalComments(saleId: string): Promise<SaleInternalCommentRecord[]> {
  await ensureTable();
  const rows = await getPrisma().$queryRaw<Array<{
    id: string; saleId: string; authorEmail: string; body: string; createdAt: Date;
  }>>`
    SELECT \`id\`, \`saleId\`, \`authorEmail\`, \`body\`, \`createdAt\`
    FROM \`SaleInternalComment\` WHERE \`saleId\` = ${saleId}
    ORDER BY \`createdAt\` DESC
  `;
  return rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() }));
}

export async function addSaleInternalComment(saleId: string, authorEmail: string, value: unknown) {
  const body = String(value ?? "").trim();
  if (!body) throw new Error("Escribe un comentario antes de guardar.");
  if (body.length > SALE_INTERNAL_COMMENT_MAX_LENGTH) throw new Error("El comentario no puede superar 2000 caracteres.");

  await ensureTable();
  const id = randomUUID();
  await getPrisma().$executeRaw`
    INSERT INTO \`SaleInternalComment\` (\`id\`, \`saleId\`, \`authorEmail\`, \`body\`)
    VALUES (${id}, ${saleId}, ${authorEmail}, ${body})
  `;
  return (await listSaleInternalComments(saleId)).find((comment) => comment.id === id) ?? null;
}
