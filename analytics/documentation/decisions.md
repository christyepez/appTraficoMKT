# Decisiones de arquitectura BI

## 2026-07-14 - Inventario del repositorio

- Se usaron las clases `RequirementsDbContext`, `ActivitiesDbContext`, `EvidenceDbContext`, `IdentityDbContext` y `AdministrationDbContext` como fuente de verdad.
- No se inventaron tablas transaccionales. Las tablas faltantes se documentan como brechas.
- El modelo analitico se conectara a SQL Server por vistas `bi`, no por APIs, para evitar mezclar contratos HTTP con analitica historica.

## 2026-07-14 - Modelo dimensional

- Se define estrella con hechos de requerimiento, producto, aprobacion, historial de estado, satisfaccion, uso de usuario y KPI resultado.
- Los catalogos se exponen como dimensiones desde las tablas reales de administracion y referencias por servicio.
- No se implementa RLS en esta version, por requerimiento explicito.

## 2026-07-14 - Tiempos laborales

- Se crea `bi.Holidays` como tabla administrable en SQL.
- Se crea `bi.fn_WorkingMinutes` para calcular minutos laborales entre timestamps UTC, con conversion a Ecuador mediante `AT TIME ZONE 'SA Pacific Standard Time'`.
- La funcion calcula intersecciones por dia laboral de 08:30 a 17:30, excluyendo sabados, domingos y feriados.

## 2026-07-14 - Carga operativa

- Como `HorasEstimadas`, `Complejidad` y `PesoOperativo` no existen en la aplicacion, se propone `bi.ProductTypeWeights` como parametrizacion analitica demostrativa.
- Los valores iniciales son ejemplos editables y no deben tratarse como dato contractual.

## 2026-07-14 - PBIP/PBIR

- Se genera una primera version funcional y versionable con PBIP, semantic model en formato de texto y reporte PBIR declarativo.
- La estructura puede abrirse y completarse visualmente en Power BI Desktop. Los archivos de modelo, M y DAX quedan versionados para Git.
