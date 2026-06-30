# Operaciones y despliegue

## Ejecucion local

```powershell
docker compose up --build
```

URLs:

- Frontend: `http://localhost:3000`
- Nginx HTTPS local: `https://localhost`
- SQL Server: `localhost,14333`

## Acceso por red interna

URLs configuradas:

- Principal: `https://MarketingIndo/login`
- Secundaria: `https://DESKTOP-Q1VCG41/login`
- IP actual: `https://172.20.20.66/login`

Requisitos:

1. Crear DNS interno `MarketingIndo -> 172.20.20.66` o una reserva DHCP estable.
2. Permitir TCP 80 y 443 en Windows Firewall para perfil privado.
3. Distribuir `deploy/certs/local/cert.pem` como certificado raíz confiable; nunca distribuir `key.pem`.
4. Mantener Docker Desktop configurado para iniciar con la sesión de Windows.

Prueba desde otro equipo:

```powershell
Resolve-DnsName MarketingIndo
Test-NetConnection MarketingIndo -Port 443
```

## HTTPS local

Generar certificado:

```powershell
.\deploy\generate-local-cert.ps1
```

Levantar con HTTPS:

```powershell
docker compose -f docker-compose.yml -f docker-compose.https.yml up --build -d
```

## Microsoft Teams

Nginx emite CSP `frame-ancestors` para Teams, Microsoft 365 y `cloud.microsoft`. Para usar la aplicación como pestaña también se requiere:

- DNS accesible desde el equipo cliente.
- Certificado confiable en Windows/Teams WebView.
- Política de Teams que permita pestañas de sitio web.
- Para una Teams App personalizada, registrar el hostname en `validDomains`.

## Túnel externo

Desarrollo temporal:

```powershell
docker compose -f docker-compose.yml -f docker-compose.https.yml -f docker-compose.tunnel.yml up -d
```

Producción debe usar `docker-compose.tunnel.named.yml`, el hostname `marketingtrafico.indoamerica.edu.ec` y credenciales guardadas fuera de Git.

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

