import { API_SCOPE_DESCRIPTIONS, API_SCOPES } from "./types";

const MONEY_SCHEMA = {
  type: "object",
  required: ["amount", "currency", "formatted"],
  properties: {
    amount: { type: "integer", description: "Monto en pesos chilenos, sin decimales." },
    currency: { type: "string", enum: ["CLP"] },
    formatted: { type: "string", example: "$119.000" },
  },
} as const;

const ERROR_SCHEMA = {
  type: "object",
  required: ["error", "meta"],
  properties: {
    error: {
      type: "object",
      required: ["code", "message"],
      properties: {
        code: { type: "string", example: "invalid_signature" },
        message: { type: "string" },
        details: {},
      },
    },
    meta: { $ref: "#/components/schemas/Meta" },
  },
} as const;

function errorResponse(description: string) {
  return {
    description,
    content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } },
  };
}

const COMMON_ERRORS = {
  "401": errorResponse("Credencial ausente, inválida o firma incorrecta."),
  "403": errorResponse("La credencial no tiene el scope, el dominio o el servicio requerido."),
  "429": errorResponse("Se superó el límite de solicitudes por minuto."),
  "500": errorResponse("Error interno."),
} as const;

export function buildOpenApiDocument(serverUrl: string) {
  return {
    openapi: "3.1.0",
    info: {
      title: "API pública de SmartPro",
      version: "1.0.0",
      description: [
        "API que consumen las subpáginas de servicio de SmartPro para leer el catálogo,",
        "cobrar con Webpay o Mercado Pago, registrar ventas y crear clientes potenciales.",
        "",
        "## Autenticación",
        "",
        "Hay dos credenciales por aplicación:",
        "",
        "- **Clave pública** (`pk_live_…`): se envía en la cabecera `X-SmartPro-Key` y solo",
        "  sirve para lecturas de catálogo y portafolio. Puede usarse desde el navegador,",
        "  siempre que el dominio esté en la lista blanca de la aplicación.",
        "- **Clave secreta** (`sk_live_…`): se envía como `Authorization: Bearer sk_live_…`,",
        "  **solo desde el servidor**, y toda solicitud debe ir firmada con HMAC-SHA256.",
        "",
        "### Firma de solicitudes",
        "",
        "```",
        "payload = \"v1\\n\" + timestamp + \"\\n\" + METHOD + \"\\n\" + path + \"\\n\" + sha256Hex(body)",
        "X-SmartPro-Timestamp: <unix en segundos>",
        "X-SmartPro-Signature: v1=<hmacSha256Hex(secretKey, payload)>",
        "```",
        "",
        "`path` incluye la query string. `body` es el cuerpo JSON exacto que se envía",
        "(cadena vacía en GET). Se aceptan firmas con hasta 5 minutos de desviación.",
        "",
        "### Idempotencia",
        "",
        "Los POST exigen la cabecera `Idempotency-Key`. Reintentar con la misma clave y el",
        "mismo cuerpo devuelve la respuesta original en lugar de volver a cobrar o registrar.",
      ].join("\n"),
      contact: { name: "SmartPro", url: "https://smartpro.cl" },
    },
    servers: [{ url: serverUrl, description: "SmartPro" }],
    security: [{ SecretKey: [] }],
    tags: [
      { name: "Catálogo", description: "Servicios, categorías y planes." },
      { name: "Pagos", description: "Sesiones de pago con Webpay y Mercado Pago." },
      { name: "Ventas", description: "Ventas registradas desde las subpáginas." },
      { name: "Leads", description: "Clientes potenciales enviados al CRM." },
      { name: "Portafolio", description: "Proyectos publicados por servicio." },
      { name: "Diagnóstico", description: "Verificación de credenciales." },
    ],
    paths: {
      "/api/v1/ping": {
        get: {
          tags: ["Diagnóstico"],
          summary: "Verifica la credencial y devuelve su configuración",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          responses: {
            "200": {
              description: "La credencial es válida.",
              content: { "application/json": { schema: { $ref: "#/components/schemas/PingResponse" } } },
            },
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/catalog": {
        get: {
          tags: ["Catálogo"],
          summary: "Catálogo completo dentro del alcance de la credencial",
          description:
            "Devuelve los servicios activos con sus categorías y planes. Solo incluye los servicios asignados a la credencial.",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          responses: {
            "200": {
              description: "Catálogo.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/Success" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: { services: { type: "array", items: { $ref: "#/components/schemas/Service" } } },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/services": {
        get: {
          tags: ["Catálogo"],
          summary: "Lista los servicios sin sus planes",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          responses: { "200": { description: "Servicios." }, ...COMMON_ERRORS },
        },
      },
      "/api/v1/services/{slug}": {
        get: {
          tags: ["Catálogo"],
          summary: "Un servicio con sus categorías y planes",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          parameters: [
            {
              name: "slug",
              in: "path",
              required: true,
              schema: { type: "string" },
              example: "desarrollo-web",
            },
          ],
          responses: {
            "200": { description: "Servicio." },
            "404": errorResponse("El servicio no existe o está fuera del alcance."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/plans": {
        get: {
          tags: ["Catálogo"],
          summary: "Lista planes, opcionalmente filtrados",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          parameters: [
            { name: "service", in: "query", schema: { type: "string" }, description: "Slug del servicio." },
            { name: "category", in: "query", schema: { type: "string" }, description: "Slug de la categoría." },
          ],
          responses: { "200": { description: "Planes." }, ...COMMON_ERRORS },
        },
      },
      "/api/v1/plans/{id}": {
        get: {
          tags: ["Catálogo"],
          summary: "Detalle de un plan con sus prestaciones incluidas",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": {
              description: "Plan.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/Success" },
                      {
                        type: "object",
                        properties: {
                          data: { type: "object", properties: { plan: { $ref: "#/components/schemas/Plan" } } },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "404": errorResponse("El plan no existe o está fuera del alcance."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/checkout/sessions": {
        post: {
          tags: ["Pagos"],
          summary: "Inicia un pago y devuelve la instrucción de redirección",
          description: [
            "Crea la orden en SmartPro y abre la transacción en el gateway elegido.",
            "",
            "Los precios se toman del catálogo: el cuerpo indica **qué** planes cobrar, nunca cuánto.",
            "",
            "Según el gateway, `redirect` indica cómo continuar:",
            "- `type: \"url\"` (Mercado Pago): redirige el navegador a `url`.",
            "- `type: \"form_post\"` (Webpay): envía un formulario POST a `url` con los campos de `fields`.",
            "",
            "Al terminar el pago, el comprador vuelve a la `returnUrl` con `status`, `orderId` y `reference`.",
            "El estado definitivo se confirma con el webhook o consultando la sesión.",
          ].join("\n"),
          parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CheckoutSessionRequest" },
                example: {
                  method: "webpay",
                  returnUrl: "https://desarrolloweb.cl/pago/resultado",
                  externalReference: "pedido-1042",
                  customer: {
                    name: "Ana Pérez",
                    email: "ana@empresa.cl",
                    phone: "+56912345678",
                    company: "Empresa SpA",
                  },
                  items: [{ planId: "ckplan123", quantity: 1 }],
                },
              },
            },
          },
          responses: {
            "201": {
              description: "Sesión creada.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/Success" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              session: { $ref: "#/components/schemas/CheckoutSession" },
                              redirect: { $ref: "#/components/schemas/CheckoutRedirect" },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "409": errorResponse("La Idempotency-Key ya se usó con otro cuerpo."),
            "422": errorResponse("Datos inválidos: returnUrl no autorizada, plan sin precio, etc."),
            "502": errorResponse("El gateway de pago no respondió correctamente."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/checkout/sessions/{orderId}": {
        get: {
          tags: ["Pagos"],
          summary: "Estado de una sesión de pago",
          description:
            "Fuente de verdad del resultado del pago. Úsalo cuando el comprador vuelve a tu sitio y como respaldo del webhook.",
          parameters: [{ name: "orderId", in: "path", required: true, schema: { type: "string" }, example: "SP-2026-123456" }],
          responses: {
            "200": {
              description: "Sesión y, si corresponde, la venta generada.",
              content: {
                "application/json": {
                  schema: {
                    allOf: [
                      { $ref: "#/components/schemas/Success" },
                      {
                        type: "object",
                        properties: {
                          data: {
                            type: "object",
                            properties: {
                              session: { $ref: "#/components/schemas/CheckoutSession" },
                              sale: { oneOf: [{ $ref: "#/components/schemas/Sale" }, { type: "null" }] },
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              },
            },
            "404": errorResponse("La sesión no existe o pertenece a otra aplicación."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/sales": {
        get: {
          tags: ["Ventas"],
          summary: "Ventas registradas por esta aplicación",
          responses: { "200": { description: "Ventas." }, ...COMMON_ERRORS },
        },
        post: {
          tags: ["Ventas"],
          summary: "Registra una venta cerrada fuera del pago en línea",
          description: [
            "Para ventas pagadas por transferencia, efectivo u otro acuerdo directo.",
            "Las ventas pagadas con Webpay o Mercado Pago se registran automáticamente al aprobarse el pago.",
            "",
            "El monto puede venir de dos formas: `items` con planes del catálogo (se calcula con el precio vigente),",
            "o `amounts.net` con el monto neto acordado (el IVA se calcula al 19% si no se envía `amounts.tax`).",
            "",
            "Si envías `externalReference` y ya existe una venta con esa referencia, se devuelve la existente con `duplicate: true`.",
          ].join("\n"),
          parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/SaleRequest" },
                example: {
                  client: {
                    companyName: "Empresa SpA",
                    contactName: "Ana Pérez",
                    email: "ana@empresa.cl",
                    phone: "+56912345678",
                  },
                  paymentMethod: "transfer",
                  externalReference: "venta-2026-014",
                  observation: "Transferencia recibida el 12 de marzo.",
                  amounts: { net: 890000 },
                },
              },
            },
          },
          responses: {
            "201": { description: "Venta registrada." },
            "200": { description: "Ya existía una venta con esa referencia externa." },
            "422": errorResponse("Datos inválidos."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/sales/{id}": {
        get: {
          tags: ["Ventas"],
          summary: "Detalle de una venta de esta aplicación",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: {
            "200": { description: "Venta." },
            "404": errorResponse("La venta no existe o pertenece a otra aplicación."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/leads": {
        post: {
          tags: ["Leads"],
          summary: "Crea un cliente potencial en el CRM de SmartPro",
          description:
            "Si el correo ya existe en el CRM se reutiliza la ficha y se agrega el mensaje como nota, devolviendo `created: false`.",
          parameters: [{ $ref: "#/components/parameters/IdempotencyKey" }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LeadRequest" },
                example: {
                  contact: {
                    companyName: "Empresa SpA",
                    contactName: "Ana Pérez",
                    email: "ana@empresa.cl",
                    phone: "+56912345678",
                    website: "https://empresa.cl",
                  },
                  interest: { serviceSlug: "desarrollo-web" },
                  message: "Necesito renovar mi sitio con tienda en línea.",
                },
              },
            },
          },
          responses: {
            "201": { description: "Lead creado." },
            "200": { description: "El contacto ya existía y se agregó la nota." },
            "422": errorResponse("Datos inválidos."),
            ...COMMON_ERRORS,
          },
        },
      },
      "/api/v1/portfolio": {
        get: {
          tags: ["Portafolio"],
          summary: "Proyectos publicados de los servicios en alcance",
          security: [{ SecretKey: [] }, { PublicKey: [] }],
          parameters: [{ name: "service", in: "query", schema: { type: "string" }, description: "Slug del servicio." }],
          responses: { "200": { description: "Proyectos." }, ...COMMON_ERRORS },
        },
      },
    },
    webhooks: {
      checkoutStatusChanged: {
        post: {
          summary: "Notificación de resultado de pago",
          description: [
            "SmartPro envía este POST a la `webhookUrl` de la aplicación cuando un pago queda aprobado,",
            "rechazado o cancelado. Se reintenta hasta 5 veces con espera creciente.",
            "",
            "Verifica la firma antes de confiar en el contenido:",
            "",
            "```",
            "payload = \"v1\\n\" + timestamp + \"\\n\" + sha256Hex(rawBody)",
            "esperado = \"v1=\" + hmacSha256Hex(SMARTPRO_WEBHOOK_SECRET, payload)",
            "```",
            "",
            "y compáralo con la cabecera `X-SmartPro-Signature`.",
          ].join("\n"),
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["event", "createdAt", "data"],
                  properties: {
                    event: { type: "string", enum: ["checkout.paid", "checkout.failed", "checkout.cancelled"] },
                    createdAt: { type: "string", format: "date-time" },
                    data: {
                      allOf: [
                        { $ref: "#/components/schemas/CheckoutSession" },
                        {
                          type: "object",
                          properties: { saleNumber: { type: ["string", "null"], example: "VEN-2026-0042" } },
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Recibido. Responde 2xx para detener los reintentos." } },
        },
      },
    },
    components: {
      securitySchemes: {
        SecretKey: {
          type: "http",
          scheme: "bearer",
          description: [
            "Clave secreta `sk_live_…` usada **solo desde el servidor**.",
            "Requiere además las cabeceras `X-SmartPro-Timestamp` y `X-SmartPro-Signature`.",
          ].join(" "),
        },
        PublicKey: {
          type: "apiKey",
          in: "header",
          name: "X-SmartPro-Key",
          description: "Clave pública `pk_live_…` para lecturas de catálogo y portafolio desde el navegador.",
        },
      },
      parameters: {
        IdempotencyKey: {
          name: "Idempotency-Key",
          in: "header",
          required: true,
          schema: { type: "string", maxLength: 200 },
          description: "Identificador único de la operación. Un reintento con la misma clave no duplica el efecto.",
        },
      },
      schemas: {
        Meta: {
          type: "object",
          required: ["requestId", "apiVersion"],
          properties: {
            requestId: { type: "string", format: "uuid" },
            apiVersion: { type: "string", enum: ["v1"] },
            count: { type: "integer" },
          },
        },
        Success: {
          type: "object",
          required: ["data", "meta"],
          properties: { data: {}, meta: { $ref: "#/components/schemas/Meta" } },
        },
        Error: ERROR_SCHEMA,
        Money: MONEY_SCHEMA,
        PlanPrice: {
          type: "object",
          properties: {
            net: { $ref: "#/components/schemas/Money" },
            tax: { $ref: "#/components/schemas/Money" },
            gross: { $ref: "#/components/schemas/Money" },
            taxRate: { type: "number", example: 0.19 },
            taxLabel: { type: "string", example: "+ IVA" },
            pricePrefix: { type: "string", example: "desde" },
            quoteOnly: {
              type: "boolean",
              description: "Cuando es true el plan no tiene precio publicado y no puede cobrarse en línea.",
            },
          },
        },
        Plan: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            summary: { type: "string" },
            badge: { type: "string" },
            note: { type: "string" },
            icon: { type: "string" },
            highlighted: { type: "boolean" },
            sortOrder: { type: "integer" },
            externalLink: { type: "string" },
            price: { $ref: "#/components/schemas/PlanPrice" },
            features: { type: "array", items: { type: "string" } },
            featureGroupTitle: { type: "string" },
            service: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
            category: { type: "object", properties: { id: { type: "string" }, name: { type: "string" } } },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        Category: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            sortOrder: { type: "integer" },
            plans: { type: "array", items: { $ref: "#/components/schemas/Plan" } },
          },
        },
        Service: {
          type: "object",
          description: 'Un "servicio" es el nivel superior del catálogo (por ejemplo, Desarrollo Web).',
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            slug: { type: "string" },
            description: { type: "string" },
            coverImage: { type: "string" },
            sortOrder: { type: "integer" },
            categories: { type: "array", items: { $ref: "#/components/schemas/Category" } },
          },
        },
        Customer: {
          type: "object",
          required: ["name", "email", "phone"],
          properties: {
            name: { type: "string" },
            email: { type: "string", format: "email" },
            phone: { type: "string", description: "Al menos 8 dígitos." },
            company: { type: "string" },
          },
        },
        CheckoutSessionRequest: {
          type: "object",
          required: ["method", "returnUrl", "customer", "items"],
          properties: {
            method: { type: "string", enum: ["webpay", "mercadopago"] },
            returnUrl: {
              type: "string",
              format: "uri",
              description: "Debe estar en la lista de URLs de retorno autorizadas de la aplicación.",
            },
            externalReference: {
              type: "string",
              maxLength: 191,
              description: "Tu identificador interno del pedido. Se devuelve en el retorno y en el webhook.",
            },
            customer: { $ref: "#/components/schemas/Customer" },
            items: {
              type: "array",
              minItems: 1,
              maxItems: 20,
              items: {
                type: "object",
                required: ["planId"],
                properties: {
                  planId: { type: "string" },
                  quantity: { type: "integer", minimum: 1, maximum: 99, default: 1 },
                },
              },
            },
          },
        },
        CheckoutSession: {
          type: "object",
          properties: {
            orderId: { type: "string", example: "SP-2026-123456" },
            createdAt: { type: "string", format: "date-time" },
            paymentStatus: { type: "string", enum: ["pending", "paid", "failed", "cancelled"] },
            orderStatus: { type: "string", enum: ["pending", "confirmed", "cancelled"] },
            paymentMethod: { type: "string", enum: ["transbank", "mercadopago", "simulated"] },
            externalReference: { type: "string" },
            returnUrl: { type: "string" },
            amounts: {
              type: "object",
              properties: {
                subtotal: { $ref: "#/components/schemas/Money" },
                tax: { $ref: "#/components/schemas/Money" },
                total: { $ref: "#/components/schemas/Money" },
              },
            },
            customer: { $ref: "#/components/schemas/Customer" },
            items: { type: "array", items: { type: "object" } },
          },
        },
        CheckoutRedirect: {
          oneOf: [
            {
              type: "object",
              required: ["type", "method", "url"],
              properties: {
                type: { type: "string", enum: ["url"] },
                method: { type: "string", enum: ["GET"] },
                url: { type: "string", format: "uri" },
              },
            },
            {
              type: "object",
              required: ["type", "method", "url", "fields"],
              properties: {
                type: { type: "string", enum: ["form_post"] },
                method: { type: "string", enum: ["POST"] },
                url: { type: "string", format: "uri" },
                fields: { type: "object", additionalProperties: { type: "string" } },
              },
            },
          ],
        },
        SaleRequest: {
          type: "object",
          required: ["client", "paymentMethod"],
          properties: {
            client: {
              type: "object",
              required: ["email"],
              properties: {
                companyName: { type: "string" },
                contactName: { type: "string" },
                contactFirstName: { type: "string" },
                contactLastName: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                website: { type: "string" },
              },
            },
            paymentMethod: { type: "string", enum: ["transfer", "cash", "other"] },
            soldAt: { type: "string", format: "date-time" },
            observation: { type: "string", maxLength: 2000 },
            externalReference: { type: "string", maxLength: 191 },
            items: {
              type: "array",
              items: {
                type: "object",
                required: ["planId"],
                properties: { planId: { type: "string" }, quantity: { type: "integer", minimum: 1 } },
              },
            },
            amounts: {
              type: "object",
              required: ["net"],
              properties: {
                net: { type: "integer", minimum: 1, description: "Monto neto acordado, sin IVA." },
                tax: { type: "integer", minimum: 0, description: "IVA. Si se omite se calcula al 19%." },
              },
            },
          },
        },
        Sale: {
          type: "object",
          properties: {
            id: { type: "string" },
            number: { type: "string", example: "VEN-2026-0042" },
            status: { type: "string", enum: ["REGISTERED", "IN_PROGRESS", "COMPLETED", "CANCELLED"] },
            source: { type: "string", enum: ["MANUAL", "QUOTE_ACCEPTED", "ORDER_PAID", "EXTERNAL_API"] },
            soldAt: { type: "string", format: "date-time" },
            paymentMethod: { type: ["string", "null"] },
            externalReference: { type: "string" },
            orderId: { type: ["string", "null"] },
            quoteNumber: { type: ["string", "null"] },
            observation: { type: "string" },
            amounts: {
              type: "object",
              properties: {
                subtotal: { $ref: "#/components/schemas/Money" },
                tax: { $ref: "#/components/schemas/Money" },
                total: { $ref: "#/components/schemas/Money" },
              },
            },
            client: {
              type: "object",
              properties: {
                id: { type: "string" },
                company: { type: "string" },
                contactName: { type: "string" },
              },
            },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        LeadRequest: {
          type: "object",
          required: ["contact"],
          properties: {
            contact: {
              type: "object",
              required: ["email"],
              properties: {
                companyName: { type: "string" },
                contactName: { type: "string" },
                email: { type: "string", format: "email" },
                phone: { type: "string" },
                website: { type: "string" },
              },
            },
            interest: {
              type: "object",
              properties: {
                serviceSlug: { type: "string" },
                serviceId: { type: "string" },
                categoryId: { type: "string" },
                planId: { type: "string" },
              },
            },
            message: { type: "string", maxLength: 4000 },
          },
        },
        PingResponse: {
          type: "object",
          properties: {
            data: {
              type: "object",
              properties: {
                ok: { type: "boolean" },
                apiVersion: { type: "string" },
                credential: { type: "string", enum: ["publishable", "secret"] },
                client: { type: "object" },
                serverTime: { type: "string", format: "date-time" },
              },
            },
            meta: { $ref: "#/components/schemas/Meta" },
          },
        },
        Scopes: {
          type: "string",
          enum: [...API_SCOPES],
          description: API_SCOPES.map((scope) => `- \`${scope}\`: ${API_SCOPE_DESCRIPTIONS[scope]}`).join("\n"),
        },
      },
    },
  };
}
