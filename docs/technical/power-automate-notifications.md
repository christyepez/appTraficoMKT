# Flujos Power Automate - Notificaciones

La aplicación envía eventos a Power Automate por canales separados. Configure cada URL en `Notificaciones` o por variables de entorno:

- Correo: `Notifications:EmailWebhookUrl`
- Teams: `Notifications:TeamsWebhookUrl`
- Fallback legado: `Notifications:PowerAutomateWebhookUrl`

No se envían binarios adjuntos. Los payloads incluyen metadatos y el usuario debe revisar archivos dentro de la aplicación.

## Flujo de Correo

Trigger: `When an HTTP request is received`.

Payload esperado:

```json
{
  "eventType": "ProductApprovalRequested",
  "channel": "Email",
  "subject": "Aprobación producto PROD-0001",
  "html": "<h2>Aprobación producto PROD-0001</h2>",
  "recipientEmail": "aprobador@uti.edu.ec",
  "teamsChannel": "Marketing",
  "idempotencyKey": "notification-guid:Email",
  "data": {
    "id": "notification-guid",
    "recipientEmail": "aprobador@uti.edu.ec",
    "requirementId": "requirement-guid",
    "activityId": "activity-guid",
    "payloadJson": "{}"
  }
}
```

Acciones recomendadas:

1. Validar `idempotencyKey`.
2. Enviar correo HTML a `recipientEmail`.
3. Incluir enlace interno de la aplicación si el flujo lo requiere.
4. No adjuntar archivos binarios.

## Flujo de Teams

Trigger: `When an HTTP request is received`.

Payload esperado:

```json
{
  "eventType": "ProductApproved",
  "channel": "Teams",
  "subject": "Producto aprobado",
  "teamsTitle": "Producto aprobado",
  "html": "<h2>Producto aprobado</h2>",
  "recipientEmail": "tecnico@uti.edu.ec",
  "teamsChannel": "Marketing",
  "idempotencyKey": "notification-guid:Teams",
  "data": {
    "id": "notification-guid",
    "requirementId": "requirement-guid",
    "activityId": "activity-guid",
    "payloadJson": "{}"
  }
}
```

Acciones recomendadas:

1. Publicar tarjeta adaptativa o mensaje HTML en el canal parametrizado.
2. Usar `idempotencyKey` para evitar publicaciones duplicadas.
3. Si requiere acción de aprobación, llamar el endpoint de callback configurado en la aplicación con una clave segura del servidor.
