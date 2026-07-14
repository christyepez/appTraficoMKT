# Configuracion SQL Server para BI

## Local Docker

1. Levantar SQL Server y servicios:

```powershell
docker compose up -d sqlserver requirements-api activities-api evidence-api identity-api administration-api
```

2. Ejecutar scripts BI en `RequirementsDb`:

```powershell
sqlcmd -S localhost,14333 -U sa -P "Passw0rd!Local" -d RequirementsDb -i analytics/sql/00-create-bi-schema.sql
sqlcmd -S localhost,14333 -U sa -P "Passw0rd!Local" -d RequirementsDb -i analytics/sql/01-working-time.sql
sqlcmd -S localhost,14333 -U sa -P "Passw0rd!Local" -d RequirementsDb -i analytics/sql/02-analytic-views.sql
sqlcmd -S localhost,14333 -U sa -P "Passw0rd!Local" -d RequirementsDb -i analytics/sql/03-quality-validations.sql
```

3. Confirmar que existen las vistas:

```sql
SELECT name FROM sys.views WHERE schema_id = SCHEMA_ID('bi') ORDER BY name;
```

## Produccion

- Crear un login/usuario SQL de solo lectura para Power BI.
- Otorgar `SELECT` sobre esquema `bi`.
- No entregar permisos de escritura sobre tablas transaccionales.
- Mantener feriados, pesos y umbrales con proceso administrado.
