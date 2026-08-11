# App Trafico MKT - Plantillas Power Automate

Este paquete contiene plantillas JSON para construir los flujos de Power Automate usados por la aplicacion. No contiene secretos, URLs reales de webhooks ni identificadores de conexiones del tenant.

## Archivos

| Archivo | Uso |
| --- | --- |
| `flow-email-notification.json` | Flujo independiente para enviar correos HTML. |
| `flow-teams-notification.json` | Flujo independiente para publicar mensajes/tarjetas en Teams. |
| `flow-product-approval-callback.json` | Flujo para publicar tarjeta de aprobacion, esperar respuesta y retornar la decision a la API. |
| `adaptive-card-product-approval.json` | Tarjeta adaptativa usada por Teams. |
| `environment-placeholders.json` | Variables que deben configurarse por ambiente. |

## Configuracion requerida

1. Crear tres flujos automatizados en Power Automate con el trigger `When an HTTP request is received`.
2. Copiar el esquema de entrada desde el archivo JSON correspondiente.
3. Crear las acciones indicadas en `actions`.
4. Reemplazar placeholders:
   - `{{PUBLIC_APP_URL}}`
   - `{{APPROVAL_CALLBACK_API_KEY}}`
   - `{{DEFAULT_TEAMS_TEAM_ID}}`
   - `{{DEFAULT_TEAMS_CHANNEL_ID}}`
5. Guardar cada flujo y copiar su HTTP POST URL.
6. Registrar las URLs en la pantalla `Notificaciones` de la aplicacion o por variables de entorno:
   - `Notifications__EmailWebhookUrl`
   - `Notifications__TeamsWebhookUrl`
   - `Notifications__PowerAutomateWebhookUrl` como fallback legado.

## Seguridad

- No enviar adjuntos binarios por Power Automate.
- No exponer rutas fisicas de archivos.
- Usar `idempotencyKey` para evitar duplicados.
- En callbacks a la aplicacion enviar el header `x-api-key`.
- Configurar `Approvals__CallbackApiKey` en el backend con el mismo valor secreto.

## Nota sobre importacion

Power Automate no importa directamente estos JSON como solucion completa porque las conexiones de Outlook, Teams y HTTP dependen del tenant. Estos archivos son plantillas operativas para construir o automatizar la creacion del flujo. Para un ZIP importable oficial se debe exportar una solucion desde Power Platform ya conectada al ambiente destino.
