import { readFileSync } from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { isManagedServiceCoverPath } from "../lib/services/cover-image";
import { DEFAULT_SERVICE_COVERS } from "../lib/services/default-covers";

const SOURCE_DB = "smartpro_dev";
const TARGET_DB = "smartpro_db";

function parseEnvValue(raw: string): string {
  const trimmed = raw.trim();

  if (
    (trimmed.startsWith("\"") && trimmed.includes("\"", 1)) ||
    (trimmed.startsWith("'") && trimmed.includes("'", 1))
  ) {
    const quote = trimmed[0];
    const closingQuoteIndex = trimmed.indexOf(quote, 1);
    return trimmed.slice(1, closingQuoteIndex);
  }

  return trimmed.split("#")[0]?.trim() ?? "";
}

function loadEnvFiles() {
  for (const file of [".env.local", ".env"]) {
    try {
      const contents = readFileSync(path.join(process.cwd(), file), "utf8");
      for (const line of contents.split(/\r?\n/)) {
        if (!line || line.startsWith("#") || !line.includes("=")) continue;
        const separator = line.indexOf("=");
        const key = line.slice(0, separator).trim();
        const value = parseEnvValue(line.slice(separator + 1));
        if (!(key in process.env)) {
          process.env[key] = value;
        }
      }
    } catch {
      // File may not exist.
    }
  }
}

function createClient(database: string) {
  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const password = process.env.DB_PASSWORD ?? "";
  const port = process.env.DB_PORT || "3306";

  if (!host || !user) {
    throw new Error("Faltan DB_HOST o DB_USER.");
  }

  const url = new URL("mariadb://localhost");
  url.username = user;
  url.password = password;
  url.hostname = host;
  url.port = String(port);
  url.pathname = `/${database}`;
  url.searchParams.set("allowPublicKeyRetrieval", "true");
  url.searchParams.set("connectTimeout", "30000");
  url.searchParams.set("acquireTimeout", "30000");
  url.searchParams.set("connectionLimit", "1");

  return new PrismaClient({
    adapter: new PrismaMariaDb(url.toString()),
    log: ["error"],
  });
}

function coverForProduction(coverImage: string | null | undefined, slug: string) {
  const current = String(coverImage ?? "").trim();
  if (!current || isManagedServiceCoverPath(current)) {
    return DEFAULT_SERVICE_COVERS[slug] ?? current;
  }
  return current;
}

async function tableExists(client: PrismaClient, table: string) {
  const rows = (await client.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  const names = rows.map((row) => Object.values(row)[0]);
  return names.includes(table);
}

async function columnExists(client: PrismaClient, table: string, column: string) {
  const columns = (await client.$queryRawUnsafe(`SHOW COLUMNS FROM \`${table}\``)) as Array<{ Field: string }>;
  return columns.some((entry) => entry.Field === column);
}

async function ensureCatalogSchema(client: PrismaClient) {
  if (!(await tableExists(client, "ServiceCategory"))) {
    throw new Error("En producción no existe la tabla ServiceCategory.");
  }

  if (!(await columnExists(client, "ServiceCategory", "coverImage"))) {
    await client.$executeRawUnsafe(
      "ALTER TABLE `ServiceCategory` ADD COLUMN `coverImage` VARCHAR(191) NOT NULL DEFAULT ''",
    );
    console.log("Producción: se agregó ServiceCategory.coverImage");
  }

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ServiceSubcategory\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`categoryId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServiceSubcategory_categoryId_slug_key\` (\`categoryId\`, \`slug\`),
      INDEX \`ServiceSubcategory_categoryId_idx\` (\`categoryId\`),
      INDEX \`ServiceSubcategory_status_idx\` (\`status\`),
      CONSTRAINT \`ServiceSubcategory_categoryId_fkey\`
        FOREIGN KEY (\`categoryId\`) REFERENCES \`ServiceCategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ServicePlan\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`subcategoryId\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`price\` DECIMAL(12, 2) NOT NULL,
      \`pricePrefix\` VARCHAR(191) NOT NULL DEFAULT '',
      \`taxLabel\` VARCHAR(191) NOT NULL DEFAULT '+ IVA',
      \`taxRate\` DECIMAL(5, 4) NOT NULL DEFAULT 0.1900,
      \`summary\` TEXT NOT NULL,
      \`badge\` VARCHAR(191) NOT NULL DEFAULT '',
      \`note\` TEXT NOT NULL,
      \`featureGroupTitle\` VARCHAR(191) NOT NULL DEFAULT '',
      \`highlighted\` BOOLEAN NOT NULL DEFAULT false,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`icon\` VARCHAR(191) NOT NULL DEFAULT '',
      \`externalLink\` VARCHAR(191) NOT NULL DEFAULT '',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServicePlan_subcategoryId_slug_key\` (\`subcategoryId\`, \`slug\`),
      INDEX \`ServicePlan_subcategoryId_idx\` (\`subcategoryId\`),
      INDEX \`ServicePlan_status_idx\` (\`status\`),
      INDEX \`ServicePlan_highlighted_idx\` (\`highlighted\`),
      INDEX \`ServicePlan_sortOrder_idx\` (\`sortOrder\`),
      CONSTRAINT \`ServicePlan_subcategoryId_fkey\`
        FOREIGN KEY (\`subcategoryId\`) REFERENCES \`ServiceSubcategory\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);

  await client.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS \`ServicePlanItem\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`planId\` VARCHAR(191) NOT NULL,
      \`label\` TEXT NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`sortOrder\` INTEGER NOT NULL DEFAULT 0,
      \`status\` VARCHAR(191) NOT NULL DEFAULT 'ACTIVE',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL,
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ServicePlanItem_planId_slug_key\` (\`planId\`, \`slug\`),
      INDEX \`ServicePlanItem_planId_idx\` (\`planId\`),
      CONSTRAINT \`ServicePlanItem_planId_fkey\`
        FOREIGN KEY (\`planId\`) REFERENCES \`ServicePlan\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
}

async function countCatalog(client: PrismaClient) {
  const [categories, subcategories, plans, items] = await Promise.all([
    client.serviceCategory.count(),
    client.serviceSubcategory.count(),
    client.servicePlan.count(),
    client.servicePlanItem.count(),
  ]);

  return { categories, subcategories, plans, items };
}

async function listServiceNames(client: PrismaClient) {
  const rows = await client.serviceCategory.findMany({
    select: { name: true, slug: true, status: true, _count: { select: { subcategories: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return rows.map((row) => `${row.name} [${row.slug}] ${row.status} cats=${row._count.subcategories}`);
}

async function nullQuotePlanIds(client: PrismaClient, planIds: string[]) {
  if (planIds.length === 0 || !(await tableExists(client, "QuoteItem"))) return;

  await client.quoteItem.updateMany({
    where: { planId: { in: planIds } },
    data: { planId: null },
  });
}

async function main() {
  loadEnvFiles();

  if ((SOURCE_DB as string) === (TARGET_DB as string)) {
    throw new Error("Origen y destino no pueden ser la misma base.");
  }

  const source = createClient(SOURCE_DB);
  const target = createClient(TARGET_DB);

  try {
    await source.$queryRawUnsafe("SELECT 1");
    await target.$queryRawUnsafe("SELECT 1");
    await ensureCatalogSchema(target);

    const beforeSource = await countCatalog(source);
    const beforeTarget = await countCatalog(target);

    console.log(`Origen ${SOURCE_DB}:`, beforeSource);
    console.log(`Destino ${TARGET_DB} (antes):`, beforeTarget);
    console.log("Servicios origen:\n- " + (await listServiceNames(source)).join("\n- "));
    console.log("Servicios destino antes:\n- " + ((await listServiceNames(target)).join("\n- ") || "(vacío)"));

    const tree = await source.serviceCategory.findMany({
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      include: {
        subcategories: {
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          include: {
            plans: {
              orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
              include: {
                items: { orderBy: [{ sortOrder: "asc" }, { label: "asc" }] },
              },
            },
          },
        },
      },
    });

    const keepCategoryIds = new Set<string>();
    const keepSubcategoryIds = new Set<string>();
    const keepPlanIds = new Set<string>();

    for (const category of tree) {
      const existingBySlug = await target.serviceCategory.findUnique({ where: { slug: category.slug } });
      const coverImage = coverForProduction(category.coverImage, category.slug);
      const categoryData = {
        name: category.name,
        slug: category.slug,
        description: category.description,
        coverImage,
        sortOrder: category.sortOrder,
        status: category.status,
        createdAt: category.createdAt,
        updatedAt: category.updatedAt,
      };

      let categoryId = existingBySlug?.id;
      if (existingBySlug) {
        await target.serviceCategory.update({
          where: { id: existingBySlug.id },
          data: {
            name: categoryData.name,
            description: categoryData.description,
            coverImage: categoryData.coverImage,
            sortOrder: categoryData.sortOrder,
            status: categoryData.status,
          },
        });
      } else {
        const idTaken = await target.serviceCategory.findUnique({ where: { id: category.id } });
        const created = await target.serviceCategory.create({
          data: idTaken ? categoryData : { id: category.id, ...categoryData },
        });
        categoryId = created.id;
      }

      if (!categoryId) throw new Error(`No se pudo guardar el servicio ${category.slug}`);
      keepCategoryIds.add(categoryId);

      for (const subcategory of category.subcategories) {
        const existingSub = await target.serviceSubcategory.findFirst({
          where: { categoryId, slug: subcategory.slug },
        });
        const subcategoryData = {
          categoryId,
          name: subcategory.name,
          slug: subcategory.slug,
          sortOrder: subcategory.sortOrder,
          status: subcategory.status,
          createdAt: subcategory.createdAt,
          updatedAt: subcategory.updatedAt,
        };

        let subcategoryId = existingSub?.id;
        if (existingSub) {
          await target.serviceSubcategory.update({
            where: { id: existingSub.id },
            data: {
              name: subcategoryData.name,
              sortOrder: subcategoryData.sortOrder,
              status: subcategoryData.status,
            },
          });
        } else {
          const idTaken = await target.serviceSubcategory.findUnique({ where: { id: subcategory.id } });
          const created = await target.serviceSubcategory.create({
            data: idTaken ? subcategoryData : { id: subcategory.id, ...subcategoryData },
          });
          subcategoryId = created.id;
        }

        if (!subcategoryId) throw new Error(`No se pudo guardar la categoría ${subcategory.slug}`);
        keepSubcategoryIds.add(subcategoryId);

        for (const plan of subcategory.plans) {
          const existingPlan = await target.servicePlan.findFirst({
            where: { subcategoryId, slug: plan.slug },
          });
          const planData = {
            subcategoryId,
            name: plan.name,
            slug: plan.slug,
            price: plan.price,
            pricePrefix: plan.pricePrefix,
            taxLabel: plan.taxLabel,
            taxRate: plan.taxRate,
            summary: plan.summary,
            badge: plan.badge,
            note: plan.note,
            featureGroupTitle: plan.featureGroupTitle,
            highlighted: plan.highlighted,
            sortOrder: plan.sortOrder,
            status: plan.status,
            icon: plan.icon,
            externalLink: plan.externalLink,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
          };

          let planId = existingPlan?.id;
          if (existingPlan) {
            await target.servicePlan.update({
              where: { id: existingPlan.id },
              data: {
                name: planData.name,
                price: planData.price,
                pricePrefix: planData.pricePrefix,
                taxLabel: planData.taxLabel,
                taxRate: planData.taxRate,
                summary: planData.summary,
                badge: planData.badge,
                note: planData.note,
                featureGroupTitle: planData.featureGroupTitle,
                highlighted: planData.highlighted,
                sortOrder: planData.sortOrder,
                status: planData.status,
                icon: planData.icon,
                externalLink: planData.externalLink,
              },
            });
          } else {
            const idTaken = await target.servicePlan.findUnique({ where: { id: plan.id } });
            const created = await target.servicePlan.create({
              data: idTaken ? planData : { id: plan.id, ...planData },
            });
            planId = created.id;
          }

          if (!planId) throw new Error(`No se pudo guardar el plan ${plan.slug}`);
          keepPlanIds.add(planId);

          const keepItemIds = new Set<string>();
          for (const item of plan.items) {
            const existingItem = await target.servicePlanItem.findFirst({
              where: { planId, slug: item.slug },
            });
            const itemData = {
              planId,
              label: item.label,
              slug: item.slug,
              sortOrder: item.sortOrder,
              status: item.status,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            };

            if (existingItem) {
              await target.servicePlanItem.update({
                where: { id: existingItem.id },
                data: {
                  label: itemData.label,
                  sortOrder: itemData.sortOrder,
                  status: itemData.status,
                },
              });
              keepItemIds.add(existingItem.id);
            } else {
              const idTaken = await target.servicePlanItem.findUnique({ where: { id: item.id } });
              const created = await target.servicePlanItem.create({
                data: idTaken ? itemData : { id: item.id, ...itemData },
              });
              keepItemIds.add(created.id);
            }
          }

          await target.servicePlanItem.deleteMany({
            where: { planId, id: { notIn: [...keepItemIds] } },
          });
        }
      }
    }

    const extraPlans = await target.servicePlan.findMany({
      where: { id: { notIn: [...keepPlanIds] } },
      select: { id: true },
    });
    await nullQuotePlanIds(
      target,
      extraPlans.map((plan) => plan.id),
    );

    await target.servicePlan.deleteMany({ where: { id: { notIn: [...keepPlanIds] } } });
    await target.serviceSubcategory.deleteMany({ where: { id: { notIn: [...keepSubcategoryIds] } } });
    await target.serviceCategory.deleteMany({ where: { id: { notIn: [...keepCategoryIds] } } });

    const afterTarget = await countCatalog(target);
    console.log(`Destino ${TARGET_DB} (después):`, afterTarget);
    console.log("Servicios destino después:\n- " + (await listServiceNames(target)).join("\n- "));

    if (
      afterTarget.categories !== beforeSource.categories ||
      afterTarget.subcategories !== beforeSource.subcategories ||
      afterTarget.plans !== beforeSource.plans ||
      afterTarget.items !== beforeSource.items
    ) {
      throw new Error("Los conteos de producción no coinciden con desarrollo.");
    }

    console.log("Sincronización de catálogo completada.");
  } finally {
    await Promise.all([source.$disconnect(), target.$disconnect()]);
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
