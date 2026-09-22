import { prisma } from "../lib/db";

async function exec(sql: string) {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  await prisma.$executeRawUnsafe(sql);
}

async function tableExists(table: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe("SHOW TABLES")) as Array<Record<string, string>>;
  return rows.some((row) => Object.values(row)[0] === table);
}

async function columnExists(table: string, column: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT COLUMN_NAME
    FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND COLUMN_NAME = '${column}'
  `)) as Array<{ COLUMN_NAME: string }>;
  return rows.length > 0;
}

async function indexExists(table: string, index: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT INDEX_NAME
    FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND INDEX_NAME = '${index}'
  `)) as Array<{ INDEX_NAME: string }>;
  return rows.length > 0;
}

async function foreignKeyExists(table: string, constraint: string) {
  if (!prisma) return false;
  const rows = (await prisma.$queryRawUnsafe(`
    SELECT CONSTRAINT_NAME
    FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = '${table}'
      AND CONSTRAINT_NAME = '${constraint}'
      AND CONSTRAINT_TYPE = 'FOREIGN KEY'
  `)) as Array<{ CONSTRAINT_NAME: string }>;
  return rows.length > 0;
}

async function addColumn(table: string, column: string, definition: string) {
  if (await columnExists(table, column)) {
    return;
  }

  await exec(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
  console.log(`Added ${table}.${column}`);
}

async function addIndex(table: string, index: string, columns: string) {
  if (await indexExists(table, index)) {
    return;
  }

  await exec(`CREATE INDEX \`${index}\` ON \`${table}\`(${columns})`);
  console.log(`Added index ${index}`);
}

async function addApiClientForeignKey(table: string, constraint: string, column = "apiClientId") {
  if (await foreignKeyExists(table, constraint)) {
    return;
  }

  await exec(`
    ALTER TABLE \`${table}\`
    ADD CONSTRAINT \`${constraint}\`
    FOREIGN KEY (\`${column}\`) REFERENCES \`ApiClient\`(\`id\`)
    ON DELETE SET NULL ON UPDATE CASCADE
  `);
  console.log(`Added ${table}.${column} foreign key`);
}

async function createApiClientTable() {
  if (await tableExists("ApiClient")) {
    return;
  }

  await exec(`
    CREATE TABLE \`ApiClient\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`name\` VARCHAR(191) NOT NULL,
      \`slug\` VARCHAR(191) NOT NULL,
      \`publicKey\` VARCHAR(191) NOT NULL,
      \`secretHash\` VARCHAR(191) NOT NULL,
      \`secretPreview\` VARCHAR(191) NOT NULL DEFAULT '',
      \`status\` ENUM('ACTIVE', 'SUSPENDED', 'REVOKED') NOT NULL DEFAULT 'ACTIVE',
      \`scopes\` JSON NOT NULL,
      \`allowedOrigins\` JSON NOT NULL,
      \`allowedReturnUrls\` JSON NOT NULL,
      \`allowedServiceIds\` JSON NOT NULL,
      \`webhookUrl\` VARCHAR(191) NOT NULL DEFAULT '',
      \`rateLimitPerMinute\` INT NOT NULL DEFAULT 120,
      \`contactEmail\` VARCHAR(191) NOT NULL DEFAULT '',
      \`notes\` TEXT NOT NULL,
      \`lastUsedAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ApiClient_slug_key\` (\`slug\`),
      UNIQUE INDEX \`ApiClient_publicKey_key\` (\`publicKey\`),
      UNIQUE INDEX \`ApiClient_secretHash_key\` (\`secretHash\`),
      INDEX \`ApiClient_status_idx\` (\`status\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log("Created ApiClient table");
}

async function createApiRequestLogTable() {
  if (await tableExists("ApiRequestLog")) {
    return;
  }

  await exec(`
    CREATE TABLE \`ApiRequestLog\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`apiClientId\` VARCHAR(191) NULL,
      \`method\` VARCHAR(191) NOT NULL,
      \`path\` TEXT NOT NULL,
      \`status\` INT NOT NULL,
      \`errorCode\` VARCHAR(191) NOT NULL DEFAULT '',
      \`origin\` VARCHAR(191) NOT NULL DEFAULT '',
      \`ip\` VARCHAR(191) NOT NULL DEFAULT '',
      \`durationMs\` INT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      INDEX \`ApiRequestLog_apiClientId_createdAt_idx\` (\`apiClientId\`, \`createdAt\`),
      INDEX \`ApiRequestLog_createdAt_idx\` (\`createdAt\`),
      CONSTRAINT \`ApiRequestLog_apiClientId_fkey\`
        FOREIGN KEY (\`apiClientId\`) REFERENCES \`ApiClient\`(\`id\`) ON DELETE SET NULL ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log("Created ApiRequestLog table");
}

async function createApiIdempotencyTable() {
  if (await tableExists("ApiIdempotencyRecord")) {
    return;
  }

  await exec(`
    CREATE TABLE \`ApiIdempotencyRecord\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`apiClientId\` VARCHAR(191) NOT NULL,
      \`endpoint\` VARCHAR(191) NOT NULL,
      \`key\` VARCHAR(191) NOT NULL,
      \`requestHash\` VARCHAR(191) NOT NULL,
      \`status\` INT NOT NULL,
      \`responseBody\` JSON NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ApiIdempotencyRecord_apiClientId_endpoint_key_key\` (\`apiClientId\`, \`endpoint\`, \`key\`),
      INDEX \`ApiIdempotencyRecord_createdAt_idx\` (\`createdAt\`),
      CONSTRAINT \`ApiIdempotencyRecord_apiClientId_fkey\`
        FOREIGN KEY (\`apiClientId\`) REFERENCES \`ApiClient\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log("Created ApiIdempotencyRecord table");
}

async function createApiWebhookDeliveryTable() {
  if (await tableExists("ApiWebhookDelivery")) {
    return;
  }

  await exec(`
    CREATE TABLE \`ApiWebhookDelivery\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`apiClientId\` VARCHAR(191) NOT NULL,
      \`event\` VARCHAR(191) NOT NULL,
      \`resourceId\` VARCHAR(191) NOT NULL,
      \`payload\` JSON NOT NULL,
      \`status\` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
      \`attempts\` INT NOT NULL DEFAULT 0,
      \`responseStatus\` INT NULL,
      \`lastError\` TEXT NOT NULL,
      \`nextAttemptAt\` DATETIME(3) NULL,
      \`deliveredAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE INDEX \`ApiWebhookDelivery_apiClientId_event_resourceId_key\` (\`apiClientId\`, \`event\`, \`resourceId\`),
      INDEX \`ApiWebhookDelivery_status_nextAttemptAt_idx\` (\`status\`, \`nextAttemptAt\`),
      CONSTRAINT \`ApiWebhookDelivery_apiClientId_fkey\`
        FOREIGN KEY (\`apiClientId\`) REFERENCES \`ApiClient\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
  `);
  console.log("Created ApiWebhookDelivery table");
}

async function widenPaymentEnums() {
  await exec(`
    ALTER TABLE \`Order\`
    MODIFY COLUMN \`paymentMethod\`
      ENUM('simulated', 'transbank', 'mercadopago', 'transfer', 'cash', 'other')
      NOT NULL DEFAULT 'transbank'
  `);

  await exec(`
    ALTER TABLE \`Sale\`
    MODIFY COLUMN \`paymentMethod\`
      ENUM('simulated', 'transbank', 'mercadopago', 'transfer', 'cash', 'other')
      NULL
  `);

  await exec(`
    ALTER TABLE \`Sale\`
    MODIFY COLUMN \`source\`
      ENUM('MANUAL', 'QUOTE_ACCEPTED', 'ORDER_PAID', 'EXTERNAL_API')
      NOT NULL DEFAULT 'MANUAL'
  `);

  console.log("Widened payment method and sale source enums");
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  for (const table of ["Order", "Sale", "Client"]) {
    if (!(await tableExists(table))) {
      throw new Error(`Se requiere la tabla ${table} antes de aplicar el esquema de la API pública.`);
    }
  }

  await createApiClientTable();
  await createApiRequestLogTable();
  await createApiIdempotencyTable();
  await createApiWebhookDeliveryTable();

  await addColumn("Order", "apiClientId", "VARCHAR(191) NULL");
  await addColumn("Order", "apiReturnUrl", "VARCHAR(191) NOT NULL DEFAULT ''");
  await addColumn("Order", "apiExternalReference", "VARCHAR(191) NOT NULL DEFAULT ''");
  await addIndex("Order", "Order_apiClientId_idx", "`apiClientId`");
  await addApiClientForeignKey("Order", "Order_apiClientId_fkey");

  await addColumn("Sale", "apiClientId", "VARCHAR(191) NULL");
  await addColumn("Sale", "externalReference", "VARCHAR(191) NOT NULL DEFAULT ''");
  await addIndex("Sale", "Sale_apiClientId_idx", "`apiClientId`");
  await addApiClientForeignKey("Sale", "Sale_apiClientId_fkey");

  await addColumn("Client", "apiClientId", "VARCHAR(191) NULL");
  await addIndex("Client", "Client_apiClientId_idx", "`apiClientId`");
  await addApiClientForeignKey("Client", "Client_apiClientId_fkey");

  await widenPaymentEnums();

  console.log("API schema applied.");
  await prisma.$disconnect();
  process.exit(0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
