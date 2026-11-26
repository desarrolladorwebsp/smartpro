import { prisma } from "../db";
import { resolveClientBoardPreferences, type ClientBoardPreferencePatch } from "./board-preferences";

export async function loadClientBoardPreferences(userId: string) {
  const row = await prisma?.clientBoardPreference.findUnique({ where: { userId } });
  return resolveClientBoardPreferences(row);
}

export async function saveClientBoardPreferences(userId: string, patch: ClientBoardPreferencePatch) {
  if (!prisma) throw new Error("No hay conexión a la base de datos.");
  const display = patch.display ? JSON.stringify(patch.display) : null;
  const collapsed = patch.collapsed ? JSON.stringify(patch.collapsed) : null;
  const order = patch.cardOrder ? JSON.stringify(patch.cardOrder) : null;
  await prisma.$executeRaw`
    INSERT INTO ClientBoardPreference (userId, display, collapsed, cardOrder)
    VALUES (${userId}, ${display}, ${collapsed}, ${order})
    ON DUPLICATE KEY UPDATE
      display = COALESCE(VALUES(display), display),
      collapsed = COALESCE(VALUES(collapsed), collapsed),
      cardOrder = COALESCE(VALUES(cardOrder), cardOrder)
  `;
}
