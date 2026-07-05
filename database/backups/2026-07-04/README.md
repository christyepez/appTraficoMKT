# Respaldo SQL Server - 2026-07-04

Respaldo completo y comprimido de las cinco bases de datos de App Trafico MKT, generado desde el contenedor local `requirements-sqlserver` el 4 de julio de 2026.

## Contenido

| Archivo | Base de datos | SHA-256 |
| --- | --- | --- |
| `RequirementsDb.bak` | Requerimientos, auditoria y satisfaccion | `35698E5434CFC99978289E1CC203353F70C24D0A30EBF777F889292F4593E37D` |
| `ActivitiesDb.bak` | Productos y notificaciones | `FDC56B98F7E18A3C78D714A0D71E79EB184276D414932C06FB6B3B17B78E106F` |
| `EvidenceDb.bak` | Adjuntos y aprobaciones | `D0D2234E12266BD2D22B684B58315BD2B691F92C3B8A462E53B9750224F48946` |
| `IdentityDb.bak` | Usuarios, roles, sesiones y marca | `5CA9901A116F5AFE5203DC8915360B171D39E02AF15AD78DB5825EF6B699A166` |
| `AdministrationDb.bak` | Catalogos y cargas iniciales | `57FD5FB20B3EEC3F882CC5A608EDF2AC50C06FF6FE74DDD15332C3AD4C5472A4` |

Todos los archivos fueron creados con `COMPRESSION` y `CHECKSUM`. Se ejecuto `RESTORE VERIFYONLY ... WITH CHECKSUM` y SQL Server confirmo que cada conjunto es valido.

## Restauracion local

1. Levante SQL Server con Docker Compose.
2. Copie el respaldo requerido al contenedor:

```powershell
docker cp database/backups/2026-07-04/RequirementsDb.bak requirements-sqlserver:/var/opt/mssql/backup/RequirementsDb.bak
```

3. Restaure la base. El ejemplo reemplaza `RequirementsDb`; cambie el nombre para las demas bases:

```powershell
docker exec requirements-sqlserver /opt/mssql-tools18/bin/sqlcmd `
  -S localhost -U sa -P "Passw0rd!Local" -C `
  -Q "ALTER DATABASE [RequirementsDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; RESTORE DATABASE [RequirementsDb] FROM DISK=N'/var/opt/mssql/backup/RequirementsDb.bak' WITH REPLACE; ALTER DATABASE [RequirementsDb] SET MULTI_USER;"
```

4. Reinicie las APIs y valide sus endpoints `/health`.

## Seguridad

Los respaldos contienen datos operativos y cuentas de la aplicacion. El repositorio debe mantenerse privado y su acceso debe limitarse a personal autorizado. Las contrasenas y secretos de ambientes no deben extraerse de estos respaldos para otros usos.
