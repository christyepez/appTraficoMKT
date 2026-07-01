# Acceso desde LAN y WLAN

La aplicación escucha en todas las interfaces del equipo anfitrión. Esto permite acceder desde redes cableadas y Wi-Fi de la organización, siempre que exista conectividad entre las VLAN y las políticas institucionales no bloqueen los puertos.

## Preparación del servidor

1. Abra PowerShell como Administrador.
2. Ejecute `deploy/configure-lan.ps1` desde la raíz del repositorio.
3. Inicie la solución con `docker compose -f docker-compose.yml -f docker-compose.https.yml up -d`.
4. Compruebe los contenedores con `docker compose ps`.

El script habilita entrada TCP en los perfiles `Domain` y `Private` para:

- `443`: acceso HTTPS mediante Nginx.
- `80`: redirección a HTTPS.
- `3000`: acceso HTTP directo para diagnóstico interno.

## Acceso desde otros equipos

- `https://MarketingIndo/login`, cuando DNS institucional resuelva `MarketingIndo` hacia el equipo servidor.
- `https://<IP-DEL-SERVIDOR>/login`, cuando se use la IP asignada por LAN o WLAN.
- `http://<IP-DEL-SERVIDOR>:3000/login`, únicamente para diagnóstico si el certificado interno todavía no es confiable.

Para un acceso estable, reserve una IP en DHCP y cree en DNS los registros `MarketingIndo` y `marketingtrafico.indoamerica.edu.ec` apuntando a esa IP. El certificado HTTPS debe incluir esos nombres en su SAN y su autoridad emisora debe estar instalada como confiable en los equipos de la organización.

## Validaciones de red

1. Desde otro equipo ejecute `Test-NetConnection MarketingIndo -Port 443`.
2. Si falla por nombre pero funciona por IP, corrija DNS.
3. Si falla también por IP, valide firewall local, ACL entre VLAN y aislamiento de clientes Wi-Fi.
4. Si abre con advertencia, distribuya el certificado raíz institucional; no desactive la validación TLS.
