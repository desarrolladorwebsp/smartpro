import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

if (process.env.VERCEL_ENV !== "production") {
  process.exit(0);
}

const expectedDatabase = "smartpro_db";
const database = process.env.DB_NAME?.trim();

if (database !== expectedDatabase) {
  throw new Error(`La migración de usuarios esperaba ${expectedDatabase}.`);
}

const { DB_HOST: host, DB_USER: user, DB_PASSWORD: password } = process.env;
const port = Number(process.env.DB_PORT || 3306);

if (!host || !user || !password || !Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("Falta la configuración de base de datos para la migración de usuarios.");
}

const connectionUrl = new URL("mariadb://localhost");
connectionUrl.hostname = host.trim();
connectionUrl.port = String(port);
connectionUrl.username = user.trim();
connectionUrl.password = password;
connectionUrl.pathname = `/${database}`;
connectionUrl.searchParams.set("allowPublicKeyRetrieval", "true");
connectionUrl.searchParams.set("connectTimeout", "30000");
connectionUrl.searchParams.set("acquireTimeout", "30000");
connectionUrl.searchParams.set("connectionLimit", "1");

if (process.env.DB_SSL === "true") {
  connectionUrl.searchParams.set("ssl", "true");
}

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(connectionUrl.toString()) });

try {
  const [{ database: connectedDatabase }] = await prisma.$queryRawUnsafe("SELECT DATABASE() AS database");
  if (connectedDatabase !== expectedDatabase) {
    throw new Error(`La conexión no apunta a ${expectedDatabase}.`);
  }

  const columns = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM `User` LIKE 'deletedAt'");
  if (columns.length === 0) {
    await prisma.$executeRawUnsafe("ALTER TABLE `User` ADD COLUMN `deletedAt` DATETIME(3) NULL");
  }

  const indexes = await prisma.$queryRawUnsafe(
    "SHOW INDEX FROM `User` WHERE Key_name = 'User_deletedAt_idx'",
  );
  if (indexes.length === 0) {
    await prisma.$executeRawUnsafe("CREATE INDEX `User_deletedAt_idx` ON `User` (`deletedAt`)");
  }

  console.log("[smartpro:migrate] El esquema de usuarios está listo.");
} finally {
  await prisma.$disconnect();
}
