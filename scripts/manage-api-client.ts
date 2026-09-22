import { prisma } from "../lib/db";
import { deriveWebhookSecret } from "../lib/api/v1/keys";
import {
  createApiClient,
  getApiClientById,
  listApiClients,
  revokeApiClient,
  rotateApiClientSecret,
  updateApiClient,
} from "../lib/api/v1/repository";
import { API_SCOPES, DEFAULT_SCOPES, isApiScope, type ApiScope } from "../lib/api/v1/types";

type Flags = Record<string, string | boolean>;

function parseArgs(argv: string[]): { command: string; positional: string[]; flags: Flags } {
  const [command = "help", ...rest] = argv;
  const positional: string[] = [];
  const flags: Flags = {};

  for (let index = 0; index < rest.length; index += 1) {
    const token = rest[index];

    if (!token.startsWith("--")) {
      positional.push(token);
      continue;
    }

    const key = token.slice(2);
    const next = rest[index + 1];

    if (!next || next.startsWith("--")) {
      flags[key] = true;
      continue;
    }

    flags[key] = next;
    index += 1;
  }

  return { command, positional, flags };
}

function readList(flags: Flags, key: string): string[] {
  const value = flags[key];

  if (typeof value !== "string") {
    return [];
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseScopeFlag(flags: Flags): ApiScope[] {
  const requested = readList(flags, "scopes");

  if (!requested.length) {
    return [...DEFAULT_SCOPES];
  }

  const invalid = requested.filter((scope) => !isApiScope(scope));

  if (invalid.length) {
    throw new Error(`Scopes inválidos: ${invalid.join(", ")}. Disponibles: ${API_SCOPES.join(", ")}`);
  }

  return requested as ApiScope[];
}

async function resolveServiceIds(values: string[]): Promise<string[]> {
  if (!values.length || !prisma) {
    return [];
  }

  const services = await prisma.serviceCategory.findMany({
    where: { OR: [{ id: { in: values } }, { slug: { in: values.map((value) => value.toLowerCase()) } }] },
    select: { id: true, slug: true, name: true },
  });

  const missing = values.filter(
    (value) => !services.some((service) => service.id === value || service.slug === value.toLowerCase()),
  );

  if (missing.length) {
    throw new Error(`No se encontraron estos servicios: ${missing.join(", ")}`);
  }

  for (const service of services) {
    console.log(`  Alcance: ${service.name} (${service.slug})`);
  }

  return services.map((service) => service.id);
}

async function findBySlug(slug: string) {
  if (!prisma) {
    throw new Error("Prisma client is not available.");
  }

  const row = await prisma.apiClient.findUnique({ where: { slug } });

  if (!row) {
    throw new Error(`No existe una aplicación con slug "${slug}".`);
  }

  return row.id;
}

function printCredentials(input: { name: string; publicKey: string; secretKey: string; webhookSecret: string }) {
  console.log("");
  console.log("═".repeat(72));
  console.log(`Credenciales de ${input.name}`);
  console.log("═".repeat(72));
  console.log(`SMARTPRO_PUBLIC_KEY=${input.publicKey}`);
  console.log(`SMARTPRO_SECRET_KEY=${input.secretKey}`);
  console.log(`SMARTPRO_WEBHOOK_SECRET=${input.webhookSecret}`);
  console.log("═".repeat(72));
  console.log("Guarda la clave secreta ahora: no se puede volver a mostrar.");
  console.log("La clave secreta solo debe vivir en el servidor de la subpágina.");
  console.log("");
}

async function commandCreate(flags: Flags) {
  const name = typeof flags.name === "string" ? flags.name.trim() : "";

  if (!name) {
    throw new Error('Falta --name "Nombre de la subpágina".');
  }

  const slug = typeof flags.slug === "string" ? slugify(flags.slug) : slugify(name);
  const allowedOrigins = readList(flags, "origins");
  const allowedReturnUrls = readList(flags, "return-urls");

  if (!allowedOrigins.length) {
    throw new Error("Falta --origins https://mi-subpagina.cl (separa varios con comas).");
  }

  if (!allowedReturnUrls.length) {
    throw new Error("Falta --return-urls https://mi-subpagina.cl/pago/resultado (separa varios con comas).");
  }

  const allowedServiceIds = await resolveServiceIds(readList(flags, "services"));

  const { client, secretKey } = await createApiClient({
    name,
    slug,
    scopes: parseScopeFlag(flags),
    allowedOrigins,
    allowedReturnUrls,
    allowedServiceIds,
    webhookUrl: typeof flags.webhook === "string" ? flags.webhook : "",
    rateLimitPerMinute: typeof flags.rate === "string" ? Number(flags.rate) : undefined,
    contactEmail: typeof flags.email === "string" ? flags.email : "",
    notes: typeof flags.notes === "string" ? flags.notes : "",
    environment: flags.test ? "test" : "live",
  });

  console.log(`Aplicación creada: ${client.name} (${client.slug})`);
  console.log(`Scopes: ${client.scopes.join(", ")}`);
  console.log(`Alcance de servicios: ${client.allowedServiceIds.length ? client.allowedServiceIds.join(", ") : "todo el catálogo"}`);

  printCredentials({
    name: client.name,
    publicKey: client.publicKey,
    secretKey,
    webhookSecret: deriveWebhookSecret(client.id),
  });
}

async function commandList() {
  const clients = await listApiClients();

  if (!clients.length) {
    console.log('No hay aplicaciones registradas. Crea una con: npm run api:client -- create --name "..."');
    return;
  }

  for (const client of clients) {
    console.log("");
    console.log(`${client.name} (${client.slug}) — ${client.status}`);
    console.log(`  publicKey: ${client.publicKey}`);
    console.log(`  secretKey: ${client.secretPreview}`);
    console.log(`  scopes: ${client.scopes.join(", ") || "ninguno"}`);
    console.log(`  origenes: ${client.allowedOrigins.join(", ") || "ninguno"}`);
    console.log(`  returnUrls: ${client.allowedReturnUrls.join(", ") || "ninguno"}`);
    console.log(`  servicios: ${client.allowedServiceIds.join(", ") || "todo el catálogo"}`);
    console.log(`  webhook: ${client.webhookUrl || "sin configurar"}`);
    console.log(`  límite: ${client.rateLimitPerMinute} req/min`);
    console.log(`  último uso: ${client.lastUsedAt ?? "nunca"}`);
  }

  console.log("");
}

async function commandShow(slug: string) {
  const client = await getApiClientById(await findBySlug(slug));

  if (!client) {
    throw new Error("La aplicación no existe.");
  }

  console.log(JSON.stringify(client, null, 2));
  console.log("");
  console.log(`SMARTPRO_WEBHOOK_SECRET=${deriveWebhookSecret(client.id)}`);
}

async function commandRotate(slug: string, flags: Flags) {
  const { client, secretKey } = await rotateApiClientSecret(
    await findBySlug(slug),
    flags.test ? "test" : "live",
  );

  console.log(`Credenciales rotadas para ${client.name}. Las anteriores dejaron de funcionar.`);

  printCredentials({
    name: client.name,
    publicKey: client.publicKey,
    secretKey,
    webhookSecret: deriveWebhookSecret(client.id),
  });
}

async function commandStatus(slug: string, status: "ACTIVE" | "SUSPENDED") {
  const client = await updateApiClient(await findBySlug(slug), { status });
  console.log(`${client.name} quedó en estado ${client.status}.`);
}

async function commandRevoke(slug: string) {
  const client = await revokeApiClient(await findBySlug(slug));
  console.log(`${client.name} fue revocada. Sus credenciales ya no sirven.`);
}

async function commandUpdate(slug: string, flags: Flags) {
  const id = await findBySlug(slug);
  const origins = readList(flags, "origins");
  const returnUrls = readList(flags, "return-urls");
  const services = readList(flags, "services");

  const client = await updateApiClient(id, {
    ...(typeof flags.name === "string" ? { name: flags.name } : {}),
    ...(flags.scopes ? { scopes: parseScopeFlag(flags) } : {}),
    ...(origins.length ? { allowedOrigins: origins } : {}),
    ...(returnUrls.length ? { allowedReturnUrls: returnUrls } : {}),
    ...(services.length ? { allowedServiceIds: await resolveServiceIds(services) } : {}),
    ...(typeof flags.webhook === "string" ? { webhookUrl: flags.webhook } : {}),
    ...(typeof flags.rate === "string" ? { rateLimitPerMinute: Number(flags.rate) } : {}),
    ...(typeof flags.email === "string" ? { contactEmail: flags.email } : {}),
    ...(typeof flags.notes === "string" ? { notes: flags.notes } : {}),
  });

  console.log(`${client.name} actualizada.`);
}

function printHelp() {
  console.log(`
Gestión de aplicaciones autorizadas de la API pública de SmartPro.

  npm run api:client -- <comando> [opciones]
  npx tsx scripts/manage-api-client.ts <comando> [opciones]

Comandos:
  create    Crea una aplicación y muestra sus credenciales (una sola vez).
  list      Lista las aplicaciones registradas.
  show      Muestra una aplicación y su secreto de webhooks.
  update    Cambia dominios, URLs de retorno, scopes, webhook o límites.
  rotate    Genera credenciales nuevas e invalida las anteriores.
  suspend   Bloquea temporalmente la aplicación.
  activate  Reactiva una aplicación suspendida.
  revoke    Revoca la aplicación de forma definitiva.

Opciones de create/update:
  --name "Desarrollo Web"
  --slug desarrollo-web
  --origins https://desarrolloweb.cl,https://www.desarrolloweb.cl
  --return-urls https://desarrolloweb.cl/pago/resultado
  --services desarrollo-web          (slug o id; vacío = todo el catálogo)
  --webhook https://desarrolloweb.cl/api/smartpro/webhook
  --scopes ${API_SCOPES.join(",")}
  --rate 120
  --email contacto@desarrolloweb.cl
  --test                             (genera claves de prueba pk_test_/sk_test_)

Ejemplo:
  npx tsx scripts/manage-api-client.ts create \\
    --name "Desarrollo Web" \\
    --origins https://desarrolloweb.cl \\
    --return-urls https://desarrolloweb.cl/pago/resultado \\
    --services desarrollo-web \\
    --webhook https://desarrolloweb.cl/api/smartpro/webhook
`);
}

async function main() {
  if (!prisma) {
    throw new Error("Prisma client is not available. Revisa la configuración de la base de datos.");
  }

  const { command, positional, flags } = parseArgs(process.argv.slice(2));
  const slug = positional[0] ?? (typeof flags.slug === "string" ? flags.slug : "");

  switch (command) {
    case "create":
      await commandCreate(flags);
      break;
    case "list":
      await commandList();
      break;
    case "show":
      await commandShow(slug);
      break;
    case "update":
      await commandUpdate(slug, flags);
      break;
    case "rotate":
      await commandRotate(slug, flags);
      break;
    case "suspend":
      await commandStatus(slug, "SUSPENDED");
      break;
    case "activate":
      await commandStatus(slug, "ACTIVE");
      break;
    case "revoke":
      await commandRevoke(slug);
      break;
    default:
      printHelp();
  }

  await prisma.$disconnect();
  process.exit(0);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
