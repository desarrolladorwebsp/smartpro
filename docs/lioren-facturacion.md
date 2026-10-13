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
| `LIOREN_API_BASE_URL` | URL base de la API. En la documentación consultada: `https://cl.lioren.enterprises/api`. Se deja vacía hasta que Lioren confirme el entorno que debe usarse. |
| `LIOREN_API_TOKEN` | Token de acceso del cliente API; se envía como Bearer. |
| `LIOREN_ISSUER_EMAIL` | Opcional: correo de contacto del emisor que acompaña el DTE. |
| `LIOREN_ISSUER_PHONE` | Opcional: teléfono de contacto del emisor. |
| `LIOREN_ISSUER_ACTIVITY_CODE` | Opcional: actividad económica SII del emisor. Si se omite, Lioren usa la primera actividad registrada. |

La URL base se puede cambiar por otra entregada por Lioren. SmartPro exige HTTPS y no activa una URL por defecto para evitar enviar documentos a producción por error. No hay claves Lioren en los `.env` locales revisados al implementar esto; solicita a Lioren el token y cualquier URL de pruebas que habiliten para la empresa.

## Pruebas

La documentación de Lioren describe `GET /api/whoami` como una ruta gratuita para comprobar autenticación y detectar la empresa asociada al token. No documenta en esa sección una ruta de sandbox para emitir DTE. Por eso, no hay una variable `LIOREN_ENV=sandbox` ni debe usarse `POST /dtes` para una prueba hasta que Lioren confirme una URL y credenciales de pruebas que no emitan documentos tributarios reales.

El botón de emisión permanece deshabilitado mientras falte `LIOREN_API_BASE_URL` o `LIOREN_API_TOKEN`. Las ventas guardadas antes de la integración aparecen como `NOT_ISSUED`. El esquema agrega las columnas de factura de forma idempotente al ejecutar el inicializador de ventas o al cargar/registrar ventas.

Para aplicar el esquema de ventas manualmente en el entorno configurado, ejecutar `npm run db:sales:schema` desde la carpeta `smartpro`.
