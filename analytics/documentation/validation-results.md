# Resultados de validacion BI

Fecha: 2026-07-14.

## Validaciones ejecutadas

Se ejecutaron correctamente:

1. `analytics/sql/00-create-bi-schema.sql`
2. `analytics/sql/01-working-time.sql`
3. `analytics/sql/02-analytic-views.sql`
4. `analytics/sql/03-quality-validations.sql`

La instancia local usada fue `requirements-sqlserver`, base `RequirementsDb`.

## Resultado tecnico

- Se crearon 21 vistas bajo esquema `bi`.
- La funcion `bi.fn_WorkingMinutes` fue creada y probada.
- Prueba de ejemplo: de `2026-07-13T13:00:00Z` a `2026-07-13T15:00:00Z` devuelve 90 minutos laborables, porque en Ecuador cruza de 08:00 a 10:00 y la jornada inicia 08:30.

## Hallazgos de calidad de datos

Las validaciones criticas de integridad referencial devolvieron 0 filas para:

- Productos sin requerimiento.
- Requerimientos duplicados.
- Productos duplicados.
- Aprobaciones sin producto.
- Auditorias sin entidad.
- Estados desconocidos.
- Requerimientos cerrados con productos pendientes.
- Productos aprobados sin evidencia.
- Encuestas asociadas a requerimientos no completados.

Hallazgos a revisar en datos historicos:

- 15 requerimientos con fechas inconsistentes.
- 16 requerimientos con fecha de evento anterior a solicitud.
- 2 productos con responsable `Tecnico Comunicacion` sin usuario coincidente en `IdentityDb.dbo.Users`.

Decision: no se corrigieron datos transaccionales desde scripts BI. Estos casos deben resolverse con migracion o correccion funcional administrada.
