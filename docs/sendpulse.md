# Alta de clientes desde el bot de WhatsApp de SendPulse

En **Estructura del bot → Flujos del sistema → Saludo del bot**, agrega un bloque **Solicitud API** al inicio del flujo. El saludo se dispara cuando la persona inicia por primera vez un chat con ese bot.

- Método `POST` y ruta `/api/webhooks/sendpulse` en un servidor de SmartPro accesible por HTTPS.
- Encabezado `Authorization: Bearer <token de SmartPro>` o `bearer: <token de SmartPro>`.
- Cuerpo JSON, con las variables del bot seleccionadas en el editor de SendPulse.

```json
{
  "id": "{{contact_id}}",
  "nombre": "{{name}}",
  "telefono": "{{phone}}",
  "disparador": "nuevo_contacto"
}
```

En SmartPro, define el mismo token en `SENDPULSE_WEBHOOK_TOKEN`. `SENDPULSE_API_KEY` es la clave de la cuenta de SendPulse que permite consultar el contacto por ID. Si falta esa clave o la consulta falla, SmartPro puede usar el nombre y el teléfono recibidos en la solicitud.

Aplica la migración `20261126110000_sendpulse_contacts` en la base local antes de probar. La respuesta `true` indica que el contacto se guardó o que ya tiene una ficha. SmartPro busca coincidencias por ID de SendPulse, teléfono o correo y conserva la etapa de las fichas existentes. Si los datos coinciden con distintas fichas, responde `409` para que se pueda revisar la coincidencia. Una ficha nueva queda en **Nuevo** como **Potencial**.
