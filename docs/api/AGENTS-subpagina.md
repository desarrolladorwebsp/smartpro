# Bloque para el AGENTS.md de una subpágina

Copia este bloque en el `AGENTS.md` del repositorio de la subpágina. Está escrito para que la
IA que edite ese sitio sepa integrarse con SmartPro sin tener que leer toda la guía.

---

## Integración con la API de SmartPro

Este sitio no tiene catálogo, pagos ni CRM propios: todo eso vive en SmartPro y se consume por
la API `https://smartpro.cl/api/v1`. El cliente ya está en `lib/smartpro.ts`; **usa siempre ese
módulo en lugar de llamar a `fetch` directamente**, porque se encarga de firmar cada solicitud.

Especificación completa: `GET https://smartpro.cl/api/v1/openapi`.

### Reglas que no se rompen

- `lib/smartpro.ts` es solo de servidor. Nunca lo importes desde un componente `"use client"`
  ni expongas `SMARTPRO_SECRET_KEY` en una variable `NEXT_PUBLIC_*`.
- Los precios vienen del catálogo de SmartPro. No los guardes en este repositorio, no los
  calcules aquí y no los envíes en el cuerpo de un pago: se ignoran.
- Un plan con `price.quoteOnly: true` no se puede cobrar en línea. Muestra un botón de contacto.
- El parámetro `status` de la URL de retorno solo sirve para elegir la pantalla. Para entregar
  el servicio, confirma con `getCheckoutSession(orderId)` o con el webhook.
- Todo `POST` necesita una `idempotencyKey` derivada del identificador del pedido, no un
  aleatorio nuevo en cada intento.
- Cachea el catálogo (`revalidate: 300`). Nunca caches pagos, ventas ni estados.

### Funciones disponibles

```ts
// Catálogo (lectura, cacheable)
getCatalog(revalidate?)                       // servicios con categorías y planes
listServices(revalidate?)
getService(slug, revalidate?)
listPlans({ service?, category? }, revalidate?)
getPlan(id, revalidate?)
listPortfolio(service?, revalidate?)

// Pagos
createCheckoutSession({ method, returnUrl, customer, items, externalReference, idempotencyKey })
getCheckoutSession(orderId)                   // fuente de verdad del resultado

// Ventas y contactos
registerSale({ client, paymentMethod, items | amounts, externalReference, idempotencyKey })
listSales() / getSale(id)
createLead({ contact, interest, message, idempotencyKey })

// Diagnóstico y webhooks
ping()
verifyWebhookSignature({ rawBody, signatureHeader, timestampHeader })
```

### Vocabulario

**Servicio** es el nivel superior del catálogo (Desarrollo Web); **categoría** agrupa dentro de
un servicio; **plan** es lo que se vende y se cobra. Este sitio solo ve los servicios asignados
a su credencial: lo demás responde `resource_not_found`.

### Flujo de pago

1. `createCheckoutSession(...)` devuelve `{ session, redirect }`.
2. Si `redirect.type === "url"` (Mercado Pago), redirige a `redirect.url`.
   Si es `"form_post"` (Webpay), renderiza un formulario `POST` de auto-envío hacia
   `redirect.url` con los campos de `redirect.fields`. Webpay no funciona con una redirección
   simple.
3. El comprador vuelve a `returnUrl` con `?status=&orderId=&reference=`.
4. Confirma con `getCheckoutSession(orderId)`. Si `paymentStatus === "paid"`, la venta ya quedó
   registrada en SmartPro.
5. En paralelo llega el webhook firmado a `app/api/smartpro/webhook/route.ts`. Verifica la
   firma con `verifyWebhookSignature` usando el cuerpo crudo y responde `2xx`.

### Errores

Las llamadas fallidas lanzan `SmartProError` con `code`, `status` y `requestId`. Códigos
frecuentes: `validation_failed` (422, revisa `details`), `insufficient_scope` (403),
`invalid_signature` (401, el cuerpo firmado no coincide con el enviado),
`signature_expired` (401, reloj desfasado), `rate_limited` (429, respeta `Retry-After`),
`payment_gateway_error` (502, reintenta). Incluye el `requestId` al reportar un problema.

### Variables de entorno

```bash
SMARTPRO_API_URL=https://smartpro.cl
SMARTPRO_SECRET_KEY=sk_live_...        # solo servidor
SMARTPRO_WEBHOOK_SECRET=...            # solo servidor
NEXT_PUBLIC_SMARTPRO_PUBLIC_KEY=pk_live_...   # opcional, solo lecturas de catálogo
```
