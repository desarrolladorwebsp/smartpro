import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import mariadb from "mariadb";

const production = process.env.VERCEL_ENV === "production";
const rehearsalSocket = process.env.SMARTPRO_CRM_REHEARSAL_SOCKET;
if (!production && !rehearsalSocket) process.exit(0);

const database = production ? "smartpro_db" : "smartpro_crm_rehearsal";
if (production && process.env.DB_NAME?.trim() !== database) {
  throw new Error("La migración CRM requiere la base de producción de SmartPro.");
}

const connection = await mariadb.createConnection(production ? {
  host: process.env.DB_HOST?.trim(),
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER?.trim(),
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === "true",
  database,
} : { socketPath: rehearsalSocket, user: "root", database });

const steps = [
  ["20261028170000_multi_agency_quotes", "Quote", "agencySnapshot"],
  ["20261116150000_client_crm_stage", "Client", "crmStage"],
  ["20261116160000_client_recurrent_status", "Client", "status", "RECURRENTE"],
  ["20261116170000_business_clients", "Sale", "businessRecipient"],
  ["20261116180000_commercial_clients", "Sale", "contactSnapshot"],
  ["20261116181000_preserve_commercial_contact_history"],
  ["20261116183000_direct_sale_request", "Sale", "directRequestHash"],
  ["20261116190000_clients_and_contacts", "Sale", "contactId"],
  ["20261116191000_quick_client_notes", "ClientNote", "accountId"],
  ["20261116192000_crm_order_responsible", "Business", "responsibleId"],
  ["20261116194000_crm_archive", "Client", "crmReactivateOn"],
  ["20261117150000_calendar_reminders", "CalendarReminder", "id"],
  ["20261117160000_calendar_client_links", "CalendarReminder", "clientKey"],
  ["20261117170000_calendar_zoom_meetings", "CalendarZoomMeeting", "id"],
  ["20261117180000_calendar_reminder_time", "CalendarReminder", "time"],
  ["20261118170000_calendar_invitation_delivery", "CalendarZoomMeeting", "clientInvitationStatus"],
  ["20261117120000_client_crm_history", "ClientCrmHistory", "id"],
  ["20261123183000_calendar_notification_targets"],
];

const protectedTables = ["Business", "Client", "ClientNote", "Contact", "ClientContact", "ClientCrmHistory", "Quote", "QuoteItem", "Sale", "SalePayment", "SaleInternalComment"];
const migrationColumns = new Set(["businessId", "agencyId", "agencySnapshot", "contactId", "contactSnapshot"]);

async function ensureClientSoftDeleteSchema() {
  const folder = "20261123120000_client_soft_delete";
  const sql = await readFile(new URL(`./${folder}/migration.sql`, import.meta.url), "utf8");
  const statements = sql.split(/;\s*(?:\r?\n|$)/).filter((part) => part.trim());
  const guards = [
    ["Business", "COLUMNS", "COLUMN_NAME", "deletedAt"],
    ["Client", "COLUMNS", "COLUMN_NAME", "deletedAt"],
    ["Business", "STATISTICS", "INDEX_NAME", "Business_deletedAt_idx"],
    ["Client", "STATISTICS", "INDEX_NAME", "Client_deletedAt_idx"],
  ];
  if (statements.length !== guards.length) throw new Error("Migración de clientes incompleta.");

  for (const [index, [table, catalog, field, name]] of guards.entries()) {
    const existing = await connection.query(
      `SELECT 1 FROM information_schema.${catalog} WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND ${field} = ?`,
      [table, name],
    );
    if (existing.length === 0) await connection.query(statements[index]);
  }
  console.log("[smartpro:crm] Esquema de eliminación lógica de clientes verificado.");
}

async function snapshot() {
  const tables = new Map();
  for (const table of protectedTables) {
    const fields = await connection.query("SELECT COLUMN_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? ORDER BY ORDINAL_POSITION", [table]);
    if (fields.length === 0) continue;
    const columns = fields.map(({ name }) => name).filter((name) => !migrationColumns.has(name) || table === "ClientContact");
    const query = 'SELECT ' + columns.map((name) => '`' + name + '`').join(', ') + ' FROM `' + table + '`';
    const rows = await connection.query(query);
    const digests = rows.map((row) => createHash("sha256").update(JSON.stringify(row, (_, value) =>
      typeof value === "bigint" ? value.toString() : value,
    )).digest("hex"));
    tables.set(table, { columns, digests });
  }
  return tables;
}

async function assertNoDemos() {
  const tables = await connection.query("SELECT 1 FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'Business'");
  const queries = ["SELECT COUNT(*) AS count FROM Client WHERE id LIKE 'crm-scroll-demo-%' OR companyName LIKE 'Demo CRM%'"];
  if (tables.length) queries.push("SELECT COUNT(*) AS count FROM Business WHERE id LIKE 'crm-scroll-demo-%' OR name LIKE 'Demo CRM%'");
  for (const query of queries) {
    const [{ count }] = await connection.query(query);
    if (Number(count) > 0) throw new Error("Se encontraron clientes Demo CRM en la base de destino.");
  }
}

try {
  const [{ name }] = await connection.query("SELECT DATABASE() AS name");
  if (name !== database) throw new Error("La conexión del CRM apunta a una base inesperada.");
  const [{ locked }] = await connection.query("SELECT GET_LOCK('smartpro_crm_release_20261116', 20) AS locked");
  if (Number(locked) !== 1) throw new Error("Otra migración del CRM está en curso.");

  await assertNoDemos();
  const before = await snapshot();
  const automaticDates = await connection.query(
    "SELECT TABLE_NAME AS name FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME IN ('Quote', 'Sale') AND COLUMN_NAME = 'updatedAt' AND LOWER(EXTRA) LIKE '%on update%' ORDER BY TABLE_NAME",
  );
  if (automaticDates.length) {
    console.log(`[smartpro:crm] Fechas automáticas de modificación en: ${automaticDates.map(({ name }) => name).join(", ")}.`);
  }

  for (const [folder, table, field, expectedType] of steps) {
    if (table) {
      const [column] = await connection.query("SELECT COLUMN_TYPE AS type FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?", [table, field]);
      if (column && (!expectedType || column.type.includes(expectedType))) continue;
    }
    const sql = await readFile(new URL(`./${folder}/migration.sql`, import.meta.url), "utf8");
    for (const statement of sql.split(/;\s*(?:\r?\n|$)/).filter((part) => part.trim())) {
      await connection.query(statement);
    }
    console.log(`[smartpro:crm] Migración aplicada: ${folder}`);
  }

  await ensureClientSoftDeleteSchema();
  await assertNoDemos();
  for (const [table, { columns, digests }] of before) {
    const query = 'SELECT ' + columns.map((name) => '`' + name + '`').join(', ') + ' FROM `' + table + '`';
    const rows = await connection.query(query);
    const found = new Map();
    for (const row of rows) {
      const digest = createHash("sha256").update(JSON.stringify(row, (_, value) =>
        typeof value === "bigint" ? value.toString() : value,
      )).digest("hex");
      found.set(digest, (found.get(digest) ?? 0) + 1);
    }
    for (const digest of digests) {
      const matches = found.get(digest) ?? 0;
      if (!matches) throw new Error(`Cambió el historial existente de ${table} durante la migración CRM.`);
      found.set(digest, matches - 1);
    }
    console.log(`[smartpro:crm] ${table}: ${digests.length} registros previos conservados.`);
  }

  const [{ contacts, linked, mismatched }] = await connection.query(`
    SELECT (SELECT COUNT(*) FROM Contact) AS contacts,
           (SELECT COUNT(*) FROM ClientContact) AS linked,
           (SELECT COUNT(*) FROM Client c
            LEFT JOIN ClientContact link ON link.legacyClientId = c.id
            LEFT JOIN Contact ct ON ct.id = link.contactId
            WHERE c.id = ct.id AND NOT (
              c.contactFirstName <=> ct.firstName AND c.contactLastName <=> ct.lastName
              AND c.phone <=> ct.phone AND c.email <=> ct.email
            )) AS mismatched
  `);
  if (Number(mismatched) || Number(linked) < before.get("Client").digests.length) {
    throw new Error("La verificación de los contactos migrados encontró diferencias.");
  }
  console.log(`[smartpro:crm] Contactos: ${contacts}. Vínculos: ${linked}. Demo CRM: 0.`);
} catch (error) {
  if (error.sqlMessage) throw new Error(`Falló la migración CRM (${error.code}).`);
  throw error;
} finally {
  await connection.end();
}
