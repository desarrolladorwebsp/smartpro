# Registro de ventas y comprobantes

## Montos en CLP

La entrada de una venta directa sigue siendo neta y el IVA se calcula al 19%.
Al convertir una cotización, la venta usa el total redondeado al peso que muestra
el panel; el IVA se obtiene como total menos neto para mantener el desglose exacto.
La cotización original no se modifica. Por ejemplo, un total de $49.432,60 pasa a
$49.433 en la venta y admite un pago completo de $49.433.

Los formularios y el servidor interpretan tanto `49433` como `49.433`. Los pagos
que exceden el saldo o tienen un formato inválido se rechazan. El botón de pago
completo usa el mismo total validado por el servidor.

## Almacenamiento de comprobantes

Los comprobantes nuevos se guardan en `SaleReceipt` de la base de datos existente;
no se escriben en `public/uploads` ni en `/tmp`. Cada carga recibe un UUID para que
reemplazar un comprobante no sobrescriba el anterior antes de confirmar el pago.
`SalePayment.receiptPath` conserva el enlace `/api/sales/receipts/<uuid>`.
La ruta requiere una sesión del panel y responde con caché privada desactivada.
Las referencias históricas a `/uploads/sales/` se conservan.

Se admiten PDF, JPG, PNG y WEBP de hasta 4 MiB. El límite deja espacio para el
formulario multipart bajo el máximo de 4,5 MB de Vercel. Se valida la firma del
archivo y se requiere un monto recibido mayor a cero para adjuntarlo.

## Despliegue y pruebas

La migración aditiva `20261022163000_sale_receipts/migration.sql` crea solo la nueva
tabla. La aplicación también ejecuta `CREATE TABLE IF NOT EXISTS` en el primer uso,
igual que las otras adaptaciones de esquema del proyecto. No requiere servicios
de almacenamiento ni credenciales nuevas y no convierte archivos históricos.

Las pruebas de `lib/sales/receipt.test.ts` usan una base simulada: verifican guardar,
abrir, reemplazar y eliminar archivos, acceso autenticado, límites y recuperación
ante errores. Las pruebas de montos cubren el caso $49.433 y el rechazo de sobrepagos.
No deben usarse las pruebas de integración que escriben en una base real contra
la base de producción.
