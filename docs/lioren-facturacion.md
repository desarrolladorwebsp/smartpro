# Facturación de ventas con Lioren

## Flujo en Smartpro

1. Crear la venta no genera un documento tributario.
2. En **Ventas**, usar **Emitir factura** para abrir el borrador editable.
3. Revisar tipo de documento, fechas, RUT, razón social, giro, domicilio tributario y detalle.
4. Completar los códigos numéricos de ciudad y comuna consultados en Lioren. Smartpro guarda las etiquetas del cliente, pero Lioren requiere identificadores numéricos.
5. **Confirmar y emitir factura** envía la solicitud desde el servidor. Smartpro conserva el estado, tipo, identificador, folio, borrador enviado y último error.

La factura afecta usa código SII `33`; la exenta usa `34`. El total calculado debe coincidir con el total de la venta antes de emitir. Una venta cancelada o ya facturada no se puede volver a emitir desde este flujo.

## API y autenticación

La integración usa `POST /dtes` bajo la URL base configurada y envía `Authorization: Bearer <token>`, `Content-Type: application/json` y una llave `X-Idempotency-Check` derivada del ID de venta para que una repetición de la misma venta no genere otro DTE. La respuesta permite guardar el identificador y folio devueltos por Lioren.

La integración es server-side. No uses prefijos `NEXT_PUBLIC_` para las credenciales. Configura las siguientes variables en el entorno de ejecución:

| Variable | Uso |
| --- | --- |
| `LIOREN_API_BASE_URL` | URL base de la API. Para esta integración: `https://cl.lioren.enterprises/api`. |
| `LIOREN_API_TOKEN` | Token de acceso del cliente API; se envía como Bearer. |
| `LIOREN_API_KEY` | Credencial adicional recibida junto al token de prueba. Se conserva localmente, pero la integración actual no la envía: Lioren autentica estas llamadas con el token Bearer. |
| `LIOREN_ISSUER_EMAIL` | Opcional: correo de contacto del emisor que acompaña el DTE. |
| `LIOREN_ISSUER_PHONE` | Opcional: teléfono de contacto del emisor. |
| `LIOREN_ISSUER_ACTIVITY_CODE` | Opcional: actividad económica SII del emisor. Si se omite, Lioren usa la primera actividad registrada. |

La URL base se puede cambiar por otra entregada por Lioren. SmartPro exige HTTPS. Lioren indica que el token determina la empresa y el entorno; el token configurado localmente corresponde a **PRUEBAS API: SMARTPRO**, por lo que las consultas de verificación y documentos de prueba pertenecen a ese entorno. Para producción debe configurarse el token productivo entregado por Lioren. No reutilices el token de pruebas en producción.

## Habilitación de producción informada por Lioren

Lioren confirmó que el ambiente productivo está habilitado para la empresa y que se debe operar con la cuenta administradora. Antes de emitir documentos reales:

1. En el panel de Lioren, ir a **APIs → Administrar APIs → Registrar** y crear un cliente API para producción. El token de ese cliente debe configurarse en Vercel como secreto `LIOREN_API_TOKEN` en el entorno **Production**; no se debe copiar el token de pruebas ni guardarlo en Git o en variables `NEXT_PUBLIC_*`.
2. Mantener `LIOREN_API_BASE_URL=https://cl.lioren.enterprises/api`, salvo que Lioren entregue otra URL productiva.
3. La cuenta aún no incluye **Factura exenta**. Solicitar a la ejecutiva de Lioren que active ese producto antes de emitir documentos tipo `34`. Hasta entonces, no emitir facturas exentas desde SmartPro.
4. En **Timbraje de Folios → Solicitar Folios**, solicitar los folios productivos necesarios para factura electrónica antes de la primera emisión.
5. Revisar en Lioren que la razón social productiva no conserve el prefijo `PRUEBAS API:`. La razón social informada para las pruebas es `EMPRESA COMERCIAL LYV SPA`; confirmar que esa sea también la razón social tributaria de producción.
6. Después de guardar el secreto en Vercel, crear un nuevo despliegue de producción para que las funciones reciban el token. Verificar autenticación con `GET /whoami` y revisar los datos de emisor/receptor en SmartPro. No usar `POST /dtes` como prueba de conectividad: esa ruta emite un documento tributario real cuando se configura el token productivo.

La confirmación de disponibilidad del ambiente no equivale a contar con token, folios ni suscripción a Factura exenta. La emisión sigue siendo manual desde el detalle de cada venta y solo debe confirmarse cuando el operador haya revisado el borrador.

### Estado de integración (13-10-2026)

- El token productivo fue validado con `GET /whoami` (HTTP 200) y guardado localmente en `.env.local` y en Vercel Production como secreto `LIOREN_API_TOKEN`.
- `LIOREN_API_BASE_URL` está configurada en Production como `https://cl.lioren.enterprises/api`.
- El despliegue de producción quedó **Ready**. La verificación no emitió ningún DTE.
- La credencial `LIOREN_API_KEY` se guarda localmente porque Lioren la entregó junto al token; la integración actual autentica con Bearer y no envía esa clave.
- Pendiente en la cuenta Lioren: solicitar folios productivos y activar Factura exenta antes de emitir documentos exentos.

## Pruebas

La ruta `GET /whoami` permite verificar autenticación sin emitir documentos. Lioren ofrece un entorno de pruebas que se inicializa desde el panel de empresa y se accede con el token asociado a ese entorno; la URL de API se mantiene y el token selecciona la empresa/entorno. Para validaciones iniciales usa consultas GET. `POST /dtes` crea un documento dentro del entorno seleccionado, así que solo debe probarse con el token de pruebas y después de confirmar los datos del borrador.

El botón de emisión permanece deshabilitado mientras falte `LIOREN_API_BASE_URL` o `LIOREN_API_TOKEN`. Las ventas guardadas antes de la integración aparecen como `NOT_ISSUED`. El esquema agrega las columnas de factura de forma idempotente al ejecutar el inicializador de ventas o al cargar/registrar ventas.

Para aplicar el esquema de ventas manualmente en el entorno configurado, ejecutar `npm run db:sales:schema` desde la carpeta `smartpro`.
