# Power Automate - Flujo de aprobación de productos

Cuenta sugerida para crear/publicar: `christianyepez@uti.edu.ec`.

## Objetivo

Crear un flujo que reciba el webhook de la aplicación cuando un producto se envía o se aprueba, notifique por correo y Teams, y permita retornar la decisión de aprobación/rechazo hacia la API.

## Trigger

Usar `When an HTTP request is received`.

Esquema de entrada:

```json
{
  "type": "object",
  "properties": {
    "eventType": { "type": "string" },
    "subject": { "type": "string" },
    "teamsTitle": { "type": "string" },
    "html": { "type": "string" },
    "data": {
      "type": "object",
      "properties": {
        "id": { "type": "string" },
        "requirementId": { "type": "string" },
        "productId": { "type": "string" },
        "productType": { "type": "string" },
        "productResponsible": { "type": "string" },
        "approvedBy": { "type": "string" },
        "comments": { "type": "string" },
        "evidence": { "type": "array" }
      }
    }
  }
}
```

## Acciones recomendadas

1. `Send an email (V2)`:
   - Para: aprobador o `EmailTo` configurado.
   - Asunto: `Aprobacion producto @{triggerBody()?['data']?['productId']}`.
   - Cuerpo: `@{triggerBody()?['html']}`.

2. `Post adaptive card and wait for a response` en Teams:
   - Equipo/canal: usar la parametrización `TeamsChannel`.
   - Tarjeta: ver `adaptive-card-product-approval.json`.
   - Botones: Aprobar / Rechazar.

3. `HTTP` de retorno a la aplicación:
   - Método: `POST`.
   - URL: `https://TU_URL_PUBLICA/api/activities/{id}/approvals`.
   - Body:

```json
{
  "decision": "Approved",
  "approvedBy": "christianyepez@uti.edu.ec",
  "comments": "Aprobado desde Teams"
}
```

## Importante

La URL pública HTTPS puede venir de Cloudflare Tunnel para pruebas o de Nginx con certificado real en producción.
