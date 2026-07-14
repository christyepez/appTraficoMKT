# Pruebas de calidad BI

Ejecutar en SQL Server despues de crear las vistas:

```powershell
$env:SQLCMDPASSWORD = $env:APPTRAFICOMKT_SQL_PASSWORD
sqlcmd -S localhost,14333 -U sa -d RequirementsDb -i analytics/sql/03-quality-validations.sql
$env:SQLCMDPASSWORD = $null
```

Criterio de aceptacion:

- Las validaciones criticas deben devolver 0 filas.
- Si hay filas por datos historicos, se documenta el hallazgo y se corrige en la fuente o por migracion controlada.
- No se corrigen datos transaccionales desde scripts BI.

Validaciones incluidas:

- Productos sin requerimiento.
- Requerimientos duplicados.
- Productos duplicados.
- Aprobaciones sin producto.
- Auditorias sin entidad.
- Fechas inconsistentes.
- Fecha de evento anterior a solicitud.
- Estados desconocidos.
- Usuarios inexistentes.
- Requerimientos cerrados con productos pendientes.
- Productos aprobados sin evidencia.
- Encuestas asociadas a requerimientos no completados.
