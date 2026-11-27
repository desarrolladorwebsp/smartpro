# Alta de clientes desde el primer mensaje de WhatsApp

En SendPulse, abre **Chatbots → Smart Pro → Configuración del bot → Webhooks** y selecciona **Mensaje entrante**. Configura la URL HTTPS `/api/webhooks/sendpulse/incoming?key=<token privado>` de SmartPro con `SENDPULSE_INCOMING_TOKEN` y el ID del bot conectado en `SENDPULSE_WHATSAPP_BOT_ID`. Mantén privada la URL completa.

SmartPro crea la ficha con el primer mensaje que recibe de un contacto sin ficha, aunque el mensaje active palabras clave o el cliente ya haya conversado por WhatsApp antes de configurar la integración. Los siguientes mensajes reutilizan la ficha. Solo se procesan los datos de contacto. El texto, los archivos adjuntos y el resto del evento se descartan.

## Solicitud API desde un flujo

Para acciones explícitas en flujos de SendPulse, también está disponible el formato de **Solicitud API**.

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

Aplica la migración `20261126110000_sendpulse_contacts` en la base local antes de probar. La respuesta `true` indica que el contacto se guardó o que ya tiene una ficha. SmartPro busca coincidencias por ID de SendPulse, teléfono o correo y conserva la etapa y la clasificación de las fichas existentes. Si los datos coinciden con distintas fichas, responde `409` para que se pueda revisar la coincidencia. Una ficha nueva queda en **Nuevo** como **Activo**, con origen **SendPulse +56 9 2250 7731**. Las fichas con un contacto vinculado a SendPulse pueden mostrar la pestaña **SendPulse** aunque tengan otro origen registrado.
