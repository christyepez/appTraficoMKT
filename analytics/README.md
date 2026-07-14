# Analytics - App Trafico MKT

Primera version funcional y versionable del panel Power BI de App Trafico MKT.

## Inicio rapido local

Desde la raiz del repositorio:

```powershell
$env:APPTRAFICOMKT_SQL_PASSWORD = "contraseña-local"
.\scripts\open-powerbi-local.ps1
```

El script actualiza `main`, levanta los servicios Docker necesarios, espera SQL Server, ejecuta los scripts `analytics/sql`, valida el esquema `bi`, comprueba el proyecto PBIP/PBIR y abre Power BI Desktop.

La clave no se guarda en Git; solo se pasa por variable de entorno o se solicita de forma segura.

## Estructura

- `powerbi/`: proyecto PBIP/PBIR, modelo semantico, paginas y tema.
- `sql/`: scripts idempotentes para esquema `bi`, calendario laboral, vistas y validaciones.
- `dax/`: medidas documentadas.
- `powerquery/`: parametros y consultas M.
- `documentation/`: inventario, modelo, reglas, diccionarios y manuales.
- `tests/`: instrucciones de pruebas de calidad.

## Orden de implementacion

1. Ejecutar `sql/00-create-bi-schema.sql`.
2. Ejecutar `sql/01-working-time.sql`.
3. Ejecutar `sql/02-analytic-views.sql`.
4. Ejecutar `sql/03-quality-validations.sql`.
5. Abrir `powerbi/AppTraficoMKT.BI.pbip`.
6. Configurar parametros y credenciales en Power BI Desktop.
7. Publicar en Power BI Service y configurar gateway.

## Seguridad

- No hay credenciales almacenadas.
- No hay RLS inicial por definicion del requerimiento.
- El usuario SQL recomendado para Power BI debe ser solo lectura sobre `bi`.

## Limitaciones conocidas

- `HorasEstimadas`, `Complejidad` y `PesoOperativo` no existen en la aplicacion; se entregan como parametrizacion BI demostrativa.
- La usabilidad usa `LastLoginAt` y notificaciones; para tiempo real de uso se requiere tabla de sesiones/eventos.
- Aprobaciones multiples paralelas requieren formalizar version/aprobador si se desea control contractual por version.
