# API pública de SmartPro (v1)

Esta es la API que consumen las subpáginas por servicio (Desarrollo Web, Negocio Completo, etc.).
Permite leer el catálogo, cobrar con Webpay o Mercado Pago, registrar ventas y crear clientes
potenciales, sin duplicar en cada sitio la lógica ni los datos que ya viven en SmartPro.

- **Base:** `https://smartpro.cl`
- **Prefijo:** `/api/v1`
- **Especificación OpenAPI:** `GET /api/v1/openapi` (pégala en cualquier herramienta o IA)
- **Moneda:** pesos chilenos, siempre enteros sin decimales

## Dónde viven las subpáginas

En local, cada subpágina de servicio es un repositorio aparte dentro de
`Agencia Smartpro/servicios-smartpro/`, hermano de este proyecto:

```
Agencia Smartpro/
├── smartpro/                       ← este repositorio (la API y el dashboard)
└── servicios-smartpro/
    └── desarrolloWeb/              ← subpágina de Desarrollo Web
```

Para que ambos convivan en desarrollo, SmartPro corre en el puerto 3000 y cada subpágina en
uno propio (Desarrollo Web usa 3100). Ese puerto debe estar en los dominios autorizados de su
credencial, porque si no el navegador y la firma lo rechazan.

| Subpágina | Slug de la credencial | Servicio en alcance | Puerto local |
| --- | --- | --- | --- |
| `desarrolloWeb` | `desarrollo-web` | Desarrollo Web | 3100 |

---

## 1. Antes de empezar

### Aplicar el esquema de base de datos

Una sola vez, en SmartPro:

```bash
npm run db:api:schema
```

### Crear las credenciales de una subpágina

```bash
npm run api:client -- create \
  --name "Desarrollo Web" \
  --origins https://desarrolloweb.cl,https://www.desarrolloweb.cl \
  --return-urls https://desarrolloweb.cl/pago/resultado \
  --services desarrollo-web \
  --webhook https://desarrolloweb.cl/api/smartpro/webhook
```

El comando imprime **una sola vez** las tres variables que necesita la subpágina:

```
SMARTPRO_PUBLIC_KEY=pk_live_...
SMARTPRO_SECRET_KEY=sk_live_...
SMARTPRO_WEBHOOK_SECRET=...
```

Otros comandos: `list`, `show <slug>`, `update <slug>`, `rotate <slug>`, `suspend <slug>`,
`activate <slug>`, `revoke <slug>`. Agrega `--test` para emitir claves `pk_test_` / `sk_test_`.

### Comprobar que todo funciona

Con el servidor levantado, esta prueba recorre el camino completo de una subpágina:
credenciales, CORS, firma, catálogo, pago, idempotencia, venta y lead. Crea registros reales y
no los borra al terminar, así que úsala con una credencial de prueba y limpia después.

```bash
$env:SMARTPRO_SECRET_KEY="sk_test_..."
$env:SMARTPRO_PUBLIC_KEY="pk_test_..."
npm run api:smoke -- http://localhost:3000
```

### Qué configura cada opción

| Opción | Para qué sirve |
| --- | --- |
| `--origins` | Dominios desde los que el navegador puede usar la clave pública (CORS). Admite `https://*.dominio.cl`. |
| `--return-urls` | Únicas URLs a las que se puede devolver al comprador después de pagar. |
| `--services` | Servicios del catálogo que ve esta aplicación. Vacío = todo el catálogo. |
| `--webhook` | Dónde avisa SmartPro cuando cambia el estado de un pago. |
| `--scopes` | Permisos. Por defecto se otorgan todos. |
| `--rate` | Solicitudes por minuto (120 por defecto). |

---

## 2. Autenticación

Hay dos credenciales por aplicación y **no son intercambiables**.

### Clave secreta (`sk_live_…`) — servidor

Es la que se usa para casi todo: pagos, ventas, leads y consultas de estado.
Vive solo en el servidor de la subpágina y cada solicitud va firmada con HMAC-SHA256.

```
Authorization: Bearer sk_live_...
X-SmartPro-Timestamp: 1760000000
X-SmartPro-Signature: v1=<hmac>
```

La firma se calcula así:

```
payload   = "v1\n" + timestamp + "\n" + MÉTODO + "\n" + ruta + "\n" + sha256Hex(cuerpo)
firma     = "v1=" + hmacSha256Hex(claveSecreta, payload)
```

- `ruta` incluye la query string (`/api/v1/plans?service=desarrollo-web`).
- `cuerpo` es el JSON exacto que se envía; cadena vacía en `GET`.
- La firma vale 5 minutos. Si el reloj del servidor está desfasado, la API responde
  `signature_expired`.

Firmar el cuerpo evita que alguien que intercepte la conexión pueda alterar el carrito, y
firmar el instante evita que una solicitud capturada se reproduzca más tarde.

### Clave pública (`pk_live_…`) — navegador

Solo sirve para leer catálogo y portafolio, y solo desde los dominios autorizados:

```
X-SmartPro-Key: pk_live_...
```

Cualquier intento de cobrar o registrar algo con la clave pública se rechaza con
`invalid_credentials`, aunque la credencial tenga el permiso. En general conviene leer el
catálogo desde el servidor de la subpágina (con la clave secreta y `revalidate`) y reservar la
clave pública para widgets que se arman en el navegador.

### Verificar que todo quedó bien

```bash
curl https://smartpro.cl/api/v1/ping -H "X-SmartPro-Key: pk_live_..."
```

---

## 3. Formato de las respuestas

Todo viene envuelto igual. Éxito:

```json
{
  "data": { "plans": [] },
  "meta": { "requestId": "0b7f…", "apiVersion": "v1", "count": 0 }
}
```

Error:

```json
{
  "error": { "code": "validation_failed", "message": "customer.email no es un correo válido." },
  "meta": { "requestId": "0b7f…", "apiVersion": "v1" }
}
```

El `requestId` identifica la solicitud en los registros de SmartPro: inclúyelo cuando reportes
un problema.

### Códigos de error

| Código | HTTP | Qué pasó |
| --- | --- | --- |
| `invalid_request` | 400 | Falta una cabecera obligatoria, como `Idempotency-Key`. |
| `invalid_json` | 400 | El cuerpo no es un objeto JSON válido. |
| `missing_credentials` | 401 | No enviaste credencial. |
| `invalid_credentials` | 401 | Clave desconocida, revocada, o clave pública en una operación de escritura. |
| `invalid_signature` | 401 | La firma no coincide: revisa que firmas el cuerpo exacto y la ruta con query. |
| `signature_expired` | 401 | La firma tiene más de 5 minutos. Sincroniza el reloj. |
| `insufficient_scope` | 403 | La credencial no tiene ese permiso. |
| `origin_not_allowed` | 403 | El dominio no está en la lista blanca. |
| `client_suspended` | 403 | La aplicación está suspendida. |
| `resource_not_found` | 404 | No existe, o pertenece a otra aplicación. |
| `idempotency_conflict` | 409 | Reutilizaste una `Idempotency-Key` con un cuerpo distinto. |
| `validation_failed` | 422 | Datos inválidos. `details` indica qué. |
| `rate_limited` | 429 | Superaste tu límite por minuto. Respeta `Retry-After`. |
| `payment_gateway_error` | 502 | Webpay o Mercado Pago falló. Reintenta. |
| `service_unavailable` | 503 | SmartPro no está disponible momentáneamente. |

### Idempotencia

Los `POST` exigen la cabecera `Idempotency-Key`. Si repites la llamada con la misma clave y el
mismo cuerpo, se devuelve la respuesta original con `Idempotent-Replay: true` en lugar de volver
a cobrar o registrar. Usa tu propio identificador de pedido (`pedido-1042`), no un aleatorio
distinto en cada intento: de lo contrario la protección no sirve.

---

## 4. Catálogo

El vocabulario de la API es el que se ve en el sitio:

- **Servicio**: el nivel superior (Desarrollo Web, Negocio Completo).
- **Categoría**: agrupación dentro del servicio (Sitios corporativos, Tiendas en línea).
- **Plan**: lo que efectivamente se vende y se cobra.

Una credencial solo ve los servicios que tiene asignados. Si pide uno fuera de su alcance, la
respuesta es `resource_not_found`: desde afuera, es como si no existiera.

| Endpoint | Devuelve |
| --- | --- |
| `GET /api/v1/catalog` | `services[]` con categorías y planes anidados. Una sola llamada para armar toda la página. |
| `GET /api/v1/services` | `services[]` sin planes. |
| `GET /api/v1/services/{slug}` | `service` con sus categorías y planes. |
| `GET /api/v1/plans?service=&category=` | `plans[]` filtrados por slug. |
| `GET /api/v1/plans/{id}` | `plan` con sus prestaciones incluidas. |
| `GET /api/v1/portfolio?service=` | `projects[]` publicados. |

Un plan se ve así:

```json
{
  "id": "cmg7…",
  "name": "Sitio Corporativo",
  "slug": "sitio-corporativo",
  "summary": "Ideal para empresas que necesitan presencia profesional.",
  "highlighted": true,
  "price": {
    "net": { "amount": 390000, "currency": "CLP", "formatted": "$390.000" },
    "tax": { "amount": 74100, "currency": "CLP", "formatted": "$74.100" },
    "gross": { "amount": 464100, "currency": "CLP", "formatted": "$464.100" },
    "taxRate": 0.19,
    "taxLabel": "+ IVA",
    "pricePrefix": "desde",
    "quoteOnly": false
  },
  "features": ["Hasta 6 secciones", "Formulario de contacto", "Optimización SEO inicial"],
  "service": { "id": "cmg6…", "name": "Desarrollo Web" },
  "category": { "id": "cmg6…", "name": "Sitios Corporativos" }
}
```

`quoteOnly: true` significa que el plan se cotiza y **no puede cobrarse en línea**: muestra un
botón de contacto en lugar del de pago. Si intentas cobrarlo, la API responde
`validation_failed`.

---

## 5. Cobrar con Webpay o Mercado Pago

El flujo es de redirección: la subpágina arma el carro, SmartPro abre la transacción y devuelve
la instrucción para mandar al comprador al gateway. El comprador nunca sale de la marca de la
subpágina salvo para pagar, y vuelve a la URL que tú definas.

```
Subpágina                SmartPro                 Gateway
    │  POST checkout/sessions │                        │
    ├────────────────────────>│  crea la orden         │
    │                         ├───────────────────────>│
    │  { session, redirect }  │<───────────────────────┤
    │<────────────────────────┤                        │
    │  redirige al comprador ─────────────────────────>│
    │                         │<── resultado del pago ─┤
    │<── vuelve a returnUrl ──┤                        │
    │  POST webhook firmado   │                        │
    │<────────────────────────┤                        │
```

### Crear la sesión

`POST /api/v1/checkout/sessions` · scope `checkout:write` · requiere `Idempotency-Key`

```json
{
  "method": "webpay",
  "returnUrl": "https://desarrolloweb.cl/pago/resultado",
  "externalReference": "pedido-1042",
  "customer": {
    "name": "Ana Pérez",
    "email": "ana@empresa.cl",
    "phone": "+56912345678",
    "company": "Empresa SpA"
  },
  "items": [{ "planId": "cmg7…", "quantity": 1 }]
}
```

El cuerpo dice **qué** planes cobrar, nunca **cuánto**: los precios se leen del catálogo en el
momento de crear la orden. Cualquier monto que envíes se ignora, así que no es posible
manipular el precio desde el navegador.

La `returnUrl` debe estar dentro de las URLs autorizadas de la credencial; si no, la respuesta
es `validation_failed`. El `externalReference` es tu identificador interno y vuelve en el
retorno y en el webhook.

Respuesta `201`:

```json
{
  "data": {
    "session": { "orderId": "SP-2026-123456", "paymentStatus": "pending", "amounts": { "…": "…" } },
    "redirect": {
      "type": "form_post",
      "method": "POST",
      "url": "https://webpay3g.transbank.cl/webpayserver/initTransaction",
      "fields": { "token_ws": "01ab…" }
    }
  }
}
```

Hay dos formas de `redirect`:

- `type: "url"` (Mercado Pago): redirige el navegador a `url`.
- `type: "form_post"` (Webpay): envía un formulario `POST` a `url` con los campos de `fields`.
  Webpay exige POST; una redirección simple no funciona.

Formulario de auto-envío que sirve para ambos casos:

```tsx
export function RedirectToGateway({ redirect }: { redirect: CheckoutRedirect }) {
  if (redirect.type === "url") {
    redirect_(redirect.url); // o <meta http-equiv="refresh">
  }

  return (
    <form action={redirect.url} method="POST" ref={(form) => form?.submit()}>
      {Object.entries(redirect.fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
    </form>
  );
}
```

### El comprador vuelve

SmartPro lo devuelve a tu `returnUrl` con:

```
?status=approved&orderId=SP-2026-123456&reference=pedido-1042
```

`status` es `approved`, `rejected` o `cancelled`. **No confíes en ese parámetro para entregar
el servicio**: es un dato que viaja por la barra de direcciones. Úsalo solo para elegir qué
pantalla mostrar, y confirma el estado real con:

`GET /api/v1/checkout/sessions/{orderId}` · scope `orders:read`

```json
{
  "data": {
    "session": { "orderId": "SP-2026-123456", "paymentStatus": "paid", "…": "…" },
    "sale": { "number": "VEN-2026-0042", "…": "…" }
  }
}
```

Cuando `paymentStatus` es `paid`, la venta ya quedó registrada en SmartPro: no hay que crearla
a mano.

---

## 6. Webhooks

Si la aplicación tiene `--webhook`, SmartPro envía un `POST` a esa URL cada vez que un pago
queda aprobado, rechazado o cancelado. Se reintenta hasta 5 veces (1 min, 5 min, 15 min, 1 h).

Cabeceras:

```
X-SmartPro-Event: checkout.paid
X-SmartPro-Delivery: <id de la entrega>
X-SmartPro-Timestamp: 1760000000
X-SmartPro-Signature: v1=<hmac>
```

Cuerpo:

```json
{
  "event": "checkout.paid",
  "createdAt": "2026-03-12T18:04:11.000Z",
  "data": {
    "orderId": "SP-2026-123456",
    "paymentStatus": "paid",
    "externalReference": "pedido-1042",
    "saleNumber": "VEN-2026-0042",
    "amounts": { "total": { "amount": 464100, "currency": "CLP", "formatted": "$464.100" } },
    "customer": { "name": "Ana Pérez", "email": "ana@empresa.cl" }
  }
}
```

Verifica la firma antes de confiar en el contenido:

```
payload  = "v1\n" + timestamp + "\n" + sha256Hex(cuerpoCrudo)
esperado = "v1=" + hmacSha256Hex(SMARTPRO_WEBHOOK_SECRET, payload)
```

Usa el cuerpo **crudo**, sin volver a serializar el JSON. Responde `2xx` para detener los
reintentos; cualquier otra cosa se considera fallo. Ejemplo completo en
[`smartpro-client.ts`](./smartpro-client.ts) (`verifyWebhookSignature`).

Si el webhook no llega, la consulta de estado sigue siendo la fuente de verdad.

---

## 7. Registrar una venta fuera de línea

Las ventas pagadas con Webpay o Mercado Pago se registran solas. Este endpoint es para las que
se cierran por transferencia, efectivo o acuerdo directo.

`POST /api/v1/sales` · scope `sales:write` · requiere `Idempotency-Key`

```json
{
  "client": {
    "companyName": "Empresa SpA",
    "contactName": "Ana Pérez",
    "email": "ana@empresa.cl",
    "phone": "+56912345678"
  },
  "paymentMethod": "transfer",
  "externalReference": "venta-2026-014",
  "observation": "Transferencia recibida el 12 de marzo.",
  "amounts": { "net": 890000 }
}
```

El monto puede venir de dos formas:

- `items` con planes del catálogo: se calcula con el precio vigente.
- `amounts.net` con el monto neto acordado: el IVA se calcula al 19% salvo que envíes
  `amounts.tax` (usa `0` para exento).

Si el correo ya existe en el CRM se reutiliza la ficha en vez de duplicarla. Si envías un
`externalReference` que ya se registró, la respuesta es `200` con `duplicate: true` y la venta
existente.

También hay `GET /api/v1/sales` y `GET /api/v1/sales/{id}`, que devuelven únicamente las ventas
de esa aplicación.

---

## 8. Leads

`POST /api/v1/leads` · scope `leads:write` · requiere `Idempotency-Key`

```json
{
  "contact": {
    "companyName": "Empresa SpA",
    "contactName": "Ana Pérez",
    "email": "ana@empresa.cl",
    "phone": "+56912345678"
  },
  "interest": { "serviceSlug": "desarrollo-web" },
  "message": "Necesito renovar mi sitio con tienda en línea."
}
```

Crea el cliente potencial en el CRM de SmartPro y deja el mensaje como nota en su ficha. Si el
correo ya existía, responde `200` con `created: false` y agrega igualmente la nota, para que
ningún contacto se pierda ni se dupliquen fichas entre el sitio principal y las subpáginas.

---

## 9. Integración en la subpágina

Copia [`smartpro-client.ts`](./smartpro-client.ts) en la subpágina (por ejemplo en
`lib/smartpro.ts`) y define:

```bash
SMARTPRO_API_URL=https://smartpro.cl
SMARTPRO_SECRET_KEY=sk_live_...
SMARTPRO_WEBHOOK_SECRET=...
NEXT_PUBLIC_SMARTPRO_PUBLIC_KEY=pk_live_...
```

Listar planes en una página de servidor:

```tsx
import { listPlans } from "@/lib/smartpro";

export default async function PlanesPage() {
  const plans = await listPlans({ service: "desarrollo-web" });

  return (
    <ul>
      {plans.map((plan) => (
        <li key={plan.id}>
          {plan.name} — {plan.price.gross.formatted}
        </li>
      ))}
    </ul>
  );
}
```

Iniciar un pago desde una server action:

```ts
"use server";

import { redirect } from "next/navigation";
import { createCheckoutSession } from "@/lib/smartpro";

export async function pagar(planId: string, customer: Customer) {
  const { redirect: instruction } = await createCheckoutSession({
    method: "webpay",
    returnUrl: "https://desarrolloweb.cl/pago/resultado",
    externalReference: `pedido-${Date.now()}`,
    customer,
    items: [{ planId }],
    idempotencyKey: `pedido-${planId}-${customer.email}`,
  });

  if (instruction.type === "url") {
    redirect(instruction.url);
  }

  return instruction; // Webpay: renderiza el formulario de auto-envío
}
```

Recibir el webhook:

```ts
import { verifyWebhookSignature, type WebhookPayload } from "@/lib/smartpro";

export async function POST(request: Request) {
  const rawBody = await request.text();

  const valid = verifyWebhookSignature({
    rawBody,
    signatureHeader: request.headers.get("x-smartpro-signature"),
    timestampHeader: request.headers.get("x-smartpro-timestamp"),
  });

  if (!valid) {
    return new Response("Firma inválida", { status: 401 });
  }

  const payload = JSON.parse(rawBody) as WebhookPayload;

  if (payload.event === "checkout.paid") {
    // entregar el servicio, enviar el correo de bienvenida, etc.
  }

  return new Response(null, { status: 204 });
}
```

---

## 10. Buenas prácticas

- La clave secreta jamás en el navegador, ni en variables `NEXT_PUBLIC_*`.
- Cachea el catálogo (`revalidate: 300`) y no cachees nunca pagos, ventas ni estados.
- Deriva la `Idempotency-Key` de tu identificador de pedido, no de un aleatorio por intento.
- Confirma siempre el pago con el webhook o con la consulta de estado, nunca con el parámetro
  `status` de la URL de retorno.
- Ante `rate_limited`, respeta `Retry-After`; el límite por defecto es 120 solicitudes por
  minuto y se puede subir con `--rate`.
- Si se filtra una clave: `npm run api:client -- rotate <slug>` la invalida al instante.

---

## 11. Agregar un recurso nuevo a la API

La estructura está pensada para crecer. Para sumar un recurso:

1. Agrega el scope en `lib/api/v1/types.ts` (y a `PUBLISHABLE_SCOPES` solo si es lectura
   pública).
2. Escribe la lógica en `lib/api/v1/<recurso>.ts`, filtrando por
   `client.allowedServiceIds` cuando corresponda.
3. Agrega la función de presentación en `lib/api/v1/presenters.ts` para no exponer el modelo
   interno.
4. Crea la ruta en `app/api/v1/<recurso>/route.ts` con `createApiRoute`, que ya resuelve
   autenticación, firma, CORS, límite de uso, idempotencia, errores y registro.
5. Documenta el endpoint en `lib/api/v1/openapi.ts` y en este archivo.

```ts
export const GET = createApiRoute({
  scope: "mi-recurso:read",
  methods: ["GET"],
  handler: async ({ auth, searchParams }) => {
    const items = await listMiRecurso(auth.client, searchParams.get("filtro"));
    return { data: { items }, count: items.length };
  },
});

export const OPTIONS = createApiPreflight(["GET"]);
```
