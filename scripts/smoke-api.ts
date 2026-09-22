import crypto from "node:crypto";

/**
 * Prueba de humo de la API pública contra un servidor en ejecución.
 *
 *   SMARTPRO_SECRET_KEY=sk_test_... SMARTPRO_PUBLIC_KEY=pk_test_... \
 *     npx tsx scripts/smoke-api.ts [http://localhost:3000]
 *
 * Recorre el camino completo de una subpágina: verifica la credencial, lee el
 * catálogo, comprueba que la clave pública no pueda escribir, valida la firma y
 * la idempotencia, y registra un lead y una venta reales.
 */

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const SECRET_KEY = process.env.SMARTPRO_SECRET_KEY ?? "";
const PUBLIC_KEY = process.env.SMARTPRO_PUBLIC_KEY ?? "";
const ORIGIN = process.env.SMARTPRO_ORIGIN ?? BASE;

if (!SECRET_KEY || !PUBLIC_KEY) {
  console.error("Faltan SMARTPRO_SECRET_KEY y SMARTPRO_PUBLIC_KEY en el entorno.");
  process.exit(1);
}

let passed = 0;
let failed = 0;

function sha256Hex(value: string) {
  return crypto.createHash("sha256").update(value, "utf8").digest("hex");
}

function sign(secret: string, timestamp: number, method: string, path: string, body: string) {
  const payload = ["v1", String(timestamp), method.toUpperCase(), path, sha256Hex(body)].join("\n");
  return `v1=${crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex")}`;
}

type CallResult = { status: number; body: any; headers: Headers };

async function callSecret(
  method: "GET" | "POST",
  path: string,
  payload?: unknown,
  options: { idempotencyKey?: string; secret?: string; timestamp?: number; tamper?: boolean } = {},
): Promise<CallResult> {
  const body = payload === undefined ? "" : JSON.stringify(payload);
  const timestamp = options.timestamp ?? Math.floor(Date.now() / 1000);
  const secret = options.secret ?? SECRET_KEY;

  const headers: Record<string, string> = {
    authorization: `Bearer ${secret}`,
    "x-smartpro-timestamp": String(timestamp),
    "x-smartpro-signature": sign(secret, timestamp, method, path, options.tamper ? `${body} ` : body),
  };

  if (body) headers["content-type"] = "application/json";
  if (options.idempotencyKey) headers["idempotency-key"] = options.idempotencyKey;

  const response = await fetch(`${BASE}${path}`, { method, headers, ...(body ? { body } : {}) });

  return { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
}

async function callPublic(method: "GET" | "POST", path: string, origin = ORIGIN): Promise<CallResult> {
  const response = await fetch(`${BASE}${path}`, {
    method,
    headers: { "x-smartpro-key": PUBLIC_KEY, ...(origin ? { origin } : {}) },
  });

  return { status: response.status, body: await response.json().catch(() => null), headers: response.headers };
}

function check(label: string, condition: unknown, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  ok   ${label}`);
    return;
  }

  failed += 1;
  console.log(`  FALLA ${label}`);

  if (detail !== undefined) {
    console.log(`       ${JSON.stringify(detail).slice(0, 400)}`);
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

async function main() {
  const stamp = Date.now();

  section("Credencial y diagnóstico");
  const ping = await callSecret("GET", "/api/v1/ping");
  check("ping con clave secreta responde 200", ping.status === 200, ping.body);
  check("informa la aplicación", ping.body?.data?.client?.name, ping.body);
  check("el sobre trae requestId y apiVersion", ping.body?.meta?.requestId && ping.body?.meta?.apiVersion === "v1");

  const pingPublic = await callPublic("GET", "/api/v1/ping");
  check("ping con clave pública responde 200", pingPublic.status === 200, pingPublic.body);
  check(
    "refleja el origen autorizado en CORS",
    pingPublic.headers.get("access-control-allow-origin") === ORIGIN,
    pingPublic.headers.get("access-control-allow-origin"),
  );

  section("Seguridad");
  const noCreds = await fetch(`${BASE}/api/v1/catalog`).then(async (r) => ({ status: r.status, body: await r.json() }));
  check("sin credencial responde 401", noCreds.status === 401, noCreds.body);
  check("el código es missing_credentials", noCreds.body?.error?.code === "missing_credentials", noCreds.body);

  const tampered = await callSecret("GET", "/api/v1/catalog", undefined, { tamper: true });
  check("una firma alterada responde 401", tampered.status === 401, tampered.body);
  check("el código es invalid_signature", tampered.body?.error?.code === "invalid_signature", tampered.body);

  const expired = await callSecret("GET", "/api/v1/catalog", undefined, {
    timestamp: Math.floor(Date.now() / 1000) - 3600,
  });
  check("una firma vencida responde signature_expired", expired.body?.error?.code === "signature_expired", expired.body);

  const foreignOrigin = await callPublic("GET", "/api/v1/catalog", "https://atacante.cl");
  check("un origen ajeno responde 403", foreignOrigin.status === 403, foreignOrigin.body);
  check(
    "el código es origin_not_allowed",
    foreignOrigin.body?.error?.code === "origin_not_allowed",
    foreignOrigin.body,
  );

  const publicWrite = await fetch(`${BASE}/api/v1/leads`, {
    method: "POST",
    headers: { "x-smartpro-key": PUBLIC_KEY, "content-type": "application/json", "idempotency-key": `x-${stamp}` },
    body: JSON.stringify({ contact: { email: "x@y.cl", contactName: "X" } }),
  });
  check("la clave pública no puede escribir", publicWrite.status === 401, publicWrite.status);

  const preflight = await fetch(`${BASE}/api/v1/catalog`, {
    method: "OPTIONS",
    headers: { origin: ORIGIN, "access-control-request-method": "GET" },
  });
  check("el preflight responde 204", preflight.status === 204, preflight.status);
  check(
    "el preflight autoriza el origen",
    preflight.headers.get("access-control-allow-origin") === ORIGIN,
    preflight.headers.get("access-control-allow-origin"),
  );

  section("Catálogo");
  const catalog = await callSecret("GET", "/api/v1/catalog");
  const services = catalog.body?.data?.services ?? [];
  check("el catálogo responde 200", catalog.status === 200, catalog.body);
  check("devuelve servicios", services.length > 0, `${services.length} servicios`);

  const plans = services.flatMap((service: any) =>
    (service.categories ?? []).flatMap((category: any) => category.plans ?? []),
  );
  check("los servicios traen planes", plans.length > 0, `${plans.length} planes`);

  const sellable = plans.find((plan: any) => !plan.price.quoteOnly);
  check("hay al menos un plan cobrable", Boolean(sellable), sellable?.name);
  check(
    "el precio trae neto, IVA y bruto coherentes",
    sellable && sellable.price.gross.amount === sellable.price.net.amount + sellable.price.tax.amount,
    sellable?.price,
  );

  const firstService = services[0];
  const bySlug = await callSecret("GET", `/api/v1/services/${firstService.slug}`);
  check("un servicio por slug responde 200", bySlug.status === 200, bySlug.body);

  const filtered = await callSecret("GET", `/api/v1/plans?service=${firstService.slug}`);
  check("el filtro por servicio responde 200", filtered.status === 200, filtered.body);
  check("la firma cubre la query string", (filtered.body?.data?.plans ?? []).length > 0, filtered.body?.meta);

  const missing = await callSecret("GET", "/api/v1/plans/no-existe");
  check("un plan inexistente responde 404", missing.status === 404, missing.body);

  const portfolio = await callSecret("GET", "/api/v1/portfolio");
  check("el portafolio responde 200", portfolio.status === 200, portfolio.body);

  section("Validaciones de pago");
  const badReturn = await callSecret(
    "POST",
    "/api/v1/checkout/sessions",
    {
      method: "webpay",
      returnUrl: "https://atacante.cl/robo",
      customer: { name: "Ana Pérez", email: "ana@prueba.cl", phone: "+56912345678" },
      items: [{ planId: sellable?.id }],
    },
    { idempotencyKey: `return-${stamp}` },
  );
  check("una returnUrl ajena responde 422", badReturn.status === 422, badReturn.body);

  const noIdempotency = await callSecret("POST", "/api/v1/checkout/sessions", {
    method: "webpay",
    returnUrl: `${BASE}/pago/resultado`,
    customer: { name: "Ana Pérez", email: "ana@prueba.cl", phone: "+56912345678" },
    items: [{ planId: sellable?.id }],
  });
  check("sin Idempotency-Key responde 400", noIdempotency.status === 400, noIdempotency.body);

  const badCustomer = await callSecret(
    "POST",
    "/api/v1/checkout/sessions",
    {
      method: "webpay",
      returnUrl: `${BASE}/pago/resultado`,
      customer: { name: "Ana", email: "no-es-correo", phone: "+56912345678" },
      items: [{ planId: sellable?.id }],
    },
    { idempotencyKey: `cliente-${stamp}` },
  );
  check("un correo inválido responde 422", badCustomer.status === 422, badCustomer.body);

  section("Sesión de pago");
  const checkoutBody = {
    method: "webpay" as const,
    returnUrl: `${BASE}/pago/resultado`,
    externalReference: `smoke-${stamp}`,
    customer: { name: "Ana Pérez", email: `ana+${stamp}@prueba.cl`, phone: "+56912345678", company: "Prueba SpA" },
    items: [{ planId: sellable?.id, quantity: 1 }],
  };

  const checkout = await callSecret("POST", "/api/v1/checkout/sessions", checkoutBody, {
    idempotencyKey: `checkout-${stamp}`,
  });

  check("la sesión se crea con 201", checkout.status === 201, checkout.body);
  const session = checkout.body?.data?.session;
  const redirect = checkout.body?.data?.redirect;
  check("devuelve el orderId", Boolean(session?.orderId), session?.orderId);
  check("queda pendiente de pago", session?.paymentStatus === "pending", session?.paymentStatus);
  check("devuelve la instrucción de redirección", redirect?.type === "form_post" && redirect?.url, redirect);
  check("Webpay entrega el token", Boolean(redirect?.fields?.token_ws), Object.keys(redirect?.fields ?? {}));
  check(
    "el total lo fija el catálogo",
    session?.amounts?.total?.amount === sellable.price.gross.amount,
    { esperado: sellable?.price?.gross?.amount, recibido: session?.amounts?.total?.amount },
  );

  const replay = await callSecret("POST", "/api/v1/checkout/sessions", checkoutBody, {
    idempotencyKey: `checkout-${stamp}`,
  });
  check("repetir la clave devuelve la misma orden", replay.body?.data?.session?.orderId === session?.orderId, {
    original: session?.orderId,
    repetida: replay.body?.data?.session?.orderId,
  });
  check("la respuesta se marca como repetición", replay.headers.get("idempotent-replay") === "true");

  const conflict = await callSecret(
    "POST",
    "/api/v1/checkout/sessions",
    { ...checkoutBody, externalReference: `otro-${stamp}` },
    { idempotencyKey: `checkout-${stamp}` },
  );
  check("la misma clave con otro cuerpo responde 409", conflict.status === 409, conflict.body);

  const status = await callSecret("GET", `/api/v1/checkout/sessions/${session?.orderId}`);
  check("la consulta de estado responde 200", status.status === 200, status.body);
  check("sigue pendiente y sin venta", status.body?.data?.session?.paymentStatus === "pending" && status.body?.data?.sale === null);

  const foreign = await callSecret("GET", "/api/v1/checkout/sessions/SP-0000-000000");
  check("una orden ajena responde 404", foreign.status === 404, foreign.body);

  section("Lead");
  const lead = await callSecret(
    "POST",
    "/api/v1/leads",
    {
      contact: {
        companyName: "Prueba SpA",
        contactName: "Lead Prueba",
        email: `lead+${stamp}@prueba.cl`,
        phone: "+56912345678",
      },
      interest: { serviceSlug: firstService.slug },
      message: "Mensaje de prueba de humo.",
    },
    { idempotencyKey: `lead-${stamp}` },
  );

  check("el lead se crea con 201", lead.status === 201, lead.body);
  check("queda como cliente potencial", lead.body?.data?.lead?.created === true, lead.body?.data?.lead);
  check("registra el interés", Boolean(lead.body?.data?.lead?.interest?.serviceName), lead.body?.data?.lead?.interest);

  section("Venta fuera de línea");
  const sale = await callSecret(
    "POST",
    "/api/v1/sales",
    {
      client: {
        companyName: "Prueba SpA",
        contactName: "Venta Prueba",
        email: `venta+${stamp}@prueba.cl`,
        phone: "+56912345678",
      },
      paymentMethod: "transfer",
      externalReference: `venta-${stamp}`,
      observation: "Venta de prueba de humo.",
      amounts: { net: 100000 },
    },
    { idempotencyKey: `venta-${stamp}` },
  );

  check("la venta se registra con 201", sale.status === 201, sale.body);
  check("calcula el IVA al 19%", sale.body?.data?.sale?.amounts?.total?.amount === 119000, sale.body?.data?.sale?.amounts);
  check("queda atribuida a la API", sale.body?.data?.sale?.source === "EXTERNAL_API", sale.body?.data?.sale?.source);

  const duplicate = await callSecret(
    "POST",
    "/api/v1/sales",
    {
      client: { contactName: "Venta Prueba", email: `venta+${stamp}@prueba.cl` },
      paymentMethod: "transfer",
      externalReference: `venta-${stamp}`,
      amounts: { net: 100000 },
    },
    { idempotencyKey: `venta-dup-${stamp}` },
  );

  check("una referencia repetida no duplica la venta", duplicate.body?.data?.duplicate === true, duplicate.body?.data);
  check(
    "devuelve la venta original",
    duplicate.body?.data?.sale?.id === sale.body?.data?.sale?.id,
    duplicate.body?.data?.sale?.number,
  );

  const badMethod = await callSecret(
    "POST",
    "/api/v1/sales",
    {
      client: { contactName: "Venta Prueba", email: `venta+${stamp}@prueba.cl` },
      paymentMethod: "transbank",
      amounts: { net: 100000 },
    },
    { idempotencyKey: `venta-malo-${stamp}` },
  );
  check("un pago en línea no se registra a mano", badMethod.status === 422, badMethod.body);

  const list = await callSecret("GET", "/api/v1/sales");
  check("lista las ventas de la aplicación", (list.body?.data?.sales ?? []).length > 0, list.body?.meta);

  section("Documentación");
  const openapi = await fetch(`${BASE}/api/v1/openapi`).then(async (r) => ({ status: r.status, body: await r.json() }));
  check("la especificación responde 200", openapi.status === 200);
  check("es OpenAPI 3.1", openapi.body?.openapi === "3.1.0", openapi.body?.openapi);
  check("documenta el checkout", Boolean(openapi.body?.paths?.["/api/v1/checkout/sessions"]?.post));
  check("documenta el webhook", Boolean(openapi.body?.webhooks?.checkoutStatusChanged));

  console.log(`\n${passed} comprobaciones correctas, ${failed} fallidas.`);
  process.exit(failed ? 1 : 0);
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
