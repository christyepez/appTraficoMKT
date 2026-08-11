# Flujo Seguro de Aprobaciones

## Objetivo

El frontend no conoce ni envía URLs de Power Automate. La aplicación usa endpoints internos y el backend orquesta la solicitud, la decisión, la auditoría, las notificaciones y la actualización de estado del producto.

## Endpoints de aplicación

- `POST /api/activities/{id}/submit-approval`: crea una solicitud pendiente para el producto, cambia el estado a `PendingApproval`, registra auditoría y genera notificación al aprobador.
- `GET /api/activities/{id}/approvals`: consulta el historial/versiones de aprobación de un producto.
- `GET /api/approvals`: consulta aprobaciones desde Evidence para grillas, métricas y auditoría.
- `POST /api/approvals/{approvalId}/decision`: registra aprobación o rechazo por `approvalId`, evita doble decisión con HTTP 409 y sincroniza el estado del producto desde Activities.

## Seguridad

- La pantalla de notificaciones solo muestra si Power Automate está configurado; no expone la URL real del webhook.
- El webhook se configura por variable de entorno/configuración del backend: `Notifications__PowerAutomateWebhookUrl`.
- Para callbacks desde Power Automate se puede configurar `Approvals__CallbackApiKey`. Cuando `source` es `powerautomate`, el callback debe enviar el header `x-api-key`.
- El frontend envía decisiones con `source: "web"` y `decidedByEmail` tomado de la sesión.

## Estados

- Al solicitar aprobación se crea un registro `Approval` con `Status = Pending` y `Decision = Pending`.
- Si se aprueba, el producto pasa a `Approved`.
- Si se rechaza, el producto vuelve a `InProgress` y se conserva la versión enviada a aprobación.
- Si la aprobación ya fue respondida, el endpoint devuelve `409` con el mensaje `La aprobación ya fue respondida.`

## Auditoría y Notificaciones

Cada solicitud y decisión queda registrada en auditoría con fecha, usuario, proceso, acción y payload JSON. Las notificaciones internas se guardan en `NotificationRecords`; el envío externo queda encapsulado en backend y no bloquea la gestión si el canal externo está temporalmente indisponible.
