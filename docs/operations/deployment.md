# Operaciones y despliegue

## Ejecucion local

```powershell
docker compose up --build
```

URLs:

- Frontend: `http://localhost:3000`
- Nginx HTTPS local: `https://localhost`
- SQL Server: `localhost,14333`

## HTTPS local

Generar certificado:

```powershell
.\deploy\generate-local-cert.ps1
```

Levantar con HTTPS:

```powershell
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

## Produccion

Archivo base:

```powershell
docker compose -f docker-compose.prod.yml up -d --build
```

Nginx productivo:

- `deploy/nginx.prod-https.conf`

## Variables sensibles

No guardar secretos en el repositorio. Configurar por ambiente:

- `Jwt__Secret`
- `AzureAd__TenantId`
- `AzureAd__ClientId`
- `AzureAd__ClientSecret`
- `AzureAd__AllowedDomain`
- `Notifications__PowerAutomateWebhookUrl`
- Cadenas de conexion SQL Server
- Credenciales Blob/FTP

## Backups

Recomendado:

- Backup diario de SQL Server.
- Backup del volumen de evidencias local si no se usa Blob/FTP.
- Export periodico de catalogos y usuarios.

## Monitoreo

Endpoints de salud:

- `/health` en cada microservicio.

Puntos a monitorear:

- Estado de contenedores.
- Tiempo de respuesta de APIs.
- Espacio de almacenamiento.
- Errores de Power Automate.
- Intentos de login fallidos.

