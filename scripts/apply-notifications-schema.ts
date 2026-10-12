import { prisma } from "../lib/db";
import { ensureAdminNotificationTable } from "../lib/notifications/schema";

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await ensureAdminNotificationTable(prisma);
  console.log("AdminNotification schema applied.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma?.$disconnect();
  });
