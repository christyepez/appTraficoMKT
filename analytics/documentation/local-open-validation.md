# Validacion de apertura local Power BI

Fecha: 2026-07-14.

Rama de trabajo: `fix/powerbi-local-open`.

## Comando validado

```powershell
$env:APPTRAFICOMKT_SQL_PASSWORD = "contraseña-local"
.\scripts\open-powerbi-local.ps1 -SkipGitUpdate -SkipOpenPowerBI
```

Se uso `-SkipGitUpdate` para no cambiar de rama durante la prueba de desarrollo y `-SkipOpenPowerBI` para validar sin abrir la interfaz grafica. El comando final de usuario no requiere esos parametros.

## Resultado real

- Docker Desktop disponible.
- Servicios levantados por Docker Compose:
  - `sqlserver`
  - `requirements-api`
  - `activities-api`
  - `evidence-api`
  - `identity-api`
  - `administration-api`
- Contenedor SQL real: `requirements-sqlserver`.
- Puerto SQL real: `localhost,14333`.
- Bases logicas disponibles: 5/5.
- Scripts BI ejecutados correctamente:
  - `00-create-bi-schema.sql`
  - `01-working-time.sql`
  - `02-analytic-views.sql`
  - `03-quality-validations.sql`
- Vistas `bi` detectadas: 21.
- Tablas de configuracion detectadas: `bi.Holidays`, `bi.ProductTypeWeights`, `bi.ApprovalThresholds`.
- Funcion laboral detectada: `bi.fn_WorkingMinutes`.
- Prueba solicitada ejecutada:

```sql
SELECT bi.fn_WorkingMinutes(
    '2026-07-13T08:30:00',
    '2026-07-13T17:30:00'
);
```

Resultado local: 240 minutos. La funcion interpreta timestamps como UTC y convierte a Ecuador; por eso esta prueba valida funcionamiento, no representa una jornada local completa de 08:30 a 17:30 Ecuador.

- PBIP existe: `analytics/powerbi/AppTraficoMKT.BI.pbip`.
- JSON/PBIR/PBIP/PBISM parsean correctamente.
- TMDL contiene parametros `ServerName`, `DatabaseName`, `EnvironmentName`.
- Paginas PBIR detectadas: 5.

## Hallazgos de datos

Las validaciones SQL reportaron datos historicos a corregir por proceso funcional o migracion controlada:

- 15 requerimientos con fechas inconsistentes.
- 16 requerimientos con fecha de evento anterior a solicitud.
- 2 productos con responsable `Tecnico Comunicacion` sin usuario coincidente.

No se modificaron datos transaccionales desde el proceso BI.

## Escenarios probados o simulados

| Escenario | Tipo | Resultado |
| --- | --- | --- |
| Docker activo | Real | Correcto |
| SQL Server ya iniciado | Real | Correcto |
| Scripts SQL ejecutados repetidamente | Real | Correcto, scripts idempotentes |
| `sqlcmd` local instalado | Real | Correcto, se uso SQLCMD local |
| Archivo PBIP presente | Real | Correcto |
| JSON/PBIR/PBIP validos | Real | Correcto |
| Cinco paginas del reporte | Real | Correcto |
| Docker Desktop apagado | Simulado por lectura de codigo | El script falla con mensaje accionable antes de ejecutar SQL |
| SQL Server tardando en iniciar | Simulado por lectura de codigo | El script reintenta hasta 240 segundos |
| Falta de `sqlcmd` local | Simulado por lectura de codigo | El script usa `docker exec` con `sqlcmd` del contenedor |
| Contraseña incorrecta | Simulado por lectura de codigo | El script se detiene en la prueba de conexion SQL |
| PBIP ausente | Simulado por lectura de codigo | El script se detiene antes de abrir Power BI |
| Power BI Desktop no instalado | Simulado por lectura de codigo | Intenta asociacion de Windows y muestra error accionable si falla |

## Problemas encontrados y correcciones

- Se corrigio una expresion PowerShell inicial que no agrupaba correctamente llamadas a `Test-Path`.
- Se corrigio compatibilidad con Windows PowerShell evitando el operador `?.`.
- Se corrigio la expansion de servicios para `docker compose up -d`.
- Se agregaron al TMDL las vistas `DimComplejidad`, `DimCanalOrigen` y `FactKpiResultado`.
- Se cambio la documentacion para usar variable de entorno en lugar de clave literal en comandos BI.

## Limitaciones reales

- La apertura visual completa del PBIP depende de tener Power BI Desktop actualizado con soporte PBIP/PBIR/TMDL.
- Power BI Desktop puede requerir aceptar o reingresar credenciales manualmente.
- La prueba automatizada no puede confirmar render visual interno de Power BI Desktop sin automatizacion de la aplicacion.
