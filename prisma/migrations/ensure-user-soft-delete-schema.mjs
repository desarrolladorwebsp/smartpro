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

  const saleColumns = [
    ["archivedAt", "DATETIME(3) NULL"],
    ["archivedByEmail", "VARCHAR(255) NULL"],
    ["archiveReason", "TEXT NULL"],
  ];
  for (const [column, definition] of saleColumns) {
    const existing = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`Sale\` LIKE '${column}'`);
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`Sale\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }

  const saleIndexes = await prisma.$queryRawUnsafe(
    "SHOW INDEX FROM `Sale` WHERE Key_name = 'Sale_archivedAt_idx'",
  );
  if (saleIndexes.length === 0) {
    await prisma.$executeRawUnsafe("CREATE INDEX `Sale_archivedAt_idx` ON `Sale` (`archivedAt`)");
  }

  const serviceCoverColumns = [
    ["coverImage", "VARCHAR(191) NOT NULL DEFAULT ''"],
    ["coverMime", "VARCHAR(64) NOT NULL DEFAULT ''"],
    ["coverBytes", "MEDIUMBLOB NULL"],
  ];
  for (const [column, definition] of serviceCoverColumns) {
    const existing = await prisma.$queryRawUnsafe(`SHOW COLUMNS FROM \`ServiceCategory\` LIKE '${column}'`);
    if (existing.length === 0) {
      await prisma.$executeRawUnsafe(`ALTER TABLE \`ServiceCategory\` ADD COLUMN \`${column}\` ${definition}`);
    }
  }

  let hosting = await prisma.serviceCategory.findUnique({ where: { slug: "hosting" }, select: { id: true } });
  if (!hosting) {
    const lastCategory = await prisma.serviceCategory.findFirst({
      orderBy: { sortOrder: "desc" },
      select: { sortOrder: true },
    });
    hosting = await prisma.serviceCategory.create({
      data: {
        name: "Hosting",
        slug: "hosting",
        description: "Alojamiento y correo para pymes con sitio web corporativo.",
        sortOrder: (lastCategory?.sortOrder ?? -1) + 1,
        status: "ACTIVE",
      },
      select: { id: true },
    });
  }

  let subcategory = await prisma.serviceSubcategory.findUnique({
    where: { categoryId_slug: { categoryId: hosting.id, slug: "hosting" } },
  });
  if (!subcategory) {
    subcategory = await prisma.serviceSubcategory.create({
      data: {
        categoryId: hosting.id,
        name: "Hosting",
        slug: "hosting",
        sortOrder: 0,
        status: "ACTIVE",
      },
    });
  }

  let plan = await prisma.servicePlan.findUnique({
    where: { subcategoryId_slug: { subcategoryId: subcategory.id, slug: "hosting-plan-anual" } },
  });
  if (!plan) {
    plan = await prisma.servicePlan.create({
      data: {
        subcategoryId: subcategory.id,
        name: "Hosting Plan Anual",
        slug: "hosting-plan-anual",
        price: 49990,
        pricePrefix: "",
        taxLabel: "+ IVA",
        taxRate: 0.19,
        summary: "Hosting anual para pymes con sitio web corporativo y correo empresarial.",
        note: "Dominio, migración y desarrollo web no incluidos.",
        featureGroupTitle: "Incluye",
        status: "ACTIVE",
        sortOrder: 0,
      },
    });
  }

  const items = [
    "Alojamiento para 1 sitio web corporativo (12 meses)",
    "5 cuentas de correo empresarial de 2 GB cada una",
    "Certificado SSL",
    "Respaldos periódicos",
    "Soporte técnico básico",
  ];
  for (const [sortOrder, label] of items.entries()) {
    const slug = label
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const existing = await prisma.servicePlanItem.findUnique({
      where: { planId_slug: { planId: plan.id, slug } },
      select: { id: true },
    });
    if (!existing) {
      await prisma.servicePlanItem.create({ data: { planId: plan.id, label, slug, sortOrder, status: "ACTIVE" } });
    }
  }

  console.log("[smartpro:migrate] El esquema de usuarios, ventas y catálogo está listo.");
} finally {
  await prisma.$disconnect();
}
