# Fase 4 - Requerimientos y analitica

## Prompt H12 - Requerimientos y Dashboard

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA de
CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H6 aprobado.
No integrar PortalCorporativo.

Ejecuta exclusivamente H12 sobre frontend/app/dashboard/page.tsx, que representa
la gestion y seguimiento de Requerimientos.

Discovery:
- Inventaria formulario, filtros, estados, transiciones, tarjetas, permisos y
  llamadas API.
- Identifica componentes shared ya validados en Productos.
- Presenta plan y archivos permitidos.

Implementa:
- features/requirements/models, schemas, services, utils, hooks y components.
- RequirementForm con React Hook Form + Zod.
- RequirementFilters, RequirementList, RequirementCard y WorkflowActions.
- useRequirementsWorkspace.
- Servicio tipado sobre fetch y contratos actuales.
- Estados carga/error/vacio/exito y prevencion de doble envio.
- Pruebas de alta, edicion, filtros, transiciones, permisos visibles y errores.

No cambies contratos backend, reglas de finalizacion ni Productos.

Criterios:
- dashboard/page.tsx solo compone.
- No hay fetch en presentacion.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar requerimientos

Detente antes de H13.
```

## Prompt H13 - Metricas generales

```text
Actua con Coordinator, Solution Architect, Frontend y QA segun CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H6, H11 y H12 aprobados.
PortalCorporativo fuera de alcance.

Ejecuta solo H13 sobre frontend/app/metrics/page.tsx.

Implementa:
- features/metrics/models y metrics.service si los datos vienen del API.
- Selectores/transformaciones puras para agregaciones locales.
- useMetricsDashboard.
- MetricsToolbar, MetricCard, MetricSection, StageSection, ParticipationStory y
  secciones de uso, productos, requerimientos y aprobaciones.
- Formateadores compartidos solo cuando tengan mas de un consumidor.
- Estados carga/error/vacio y datos parciales.
- Pruebas de calculos, transformaciones, secciones, filtros y errores.

No agregues libreria de graficos sin aprobacion. No mezcles este modulo con Power
BI ni modifiques `analytics/`.

Criterios:
- metrics/page.tsx solo compone.
- Calculos puros y probados.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar metricas generales

Detente antes de H14.
```

## Prompt H14 - Auditoria

```text
Actua con Coordinator Agent, Solution Architect Agent, Frontend y QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H12 y H13 aprobados.
Mantener implementacion autonoma; PortalCorporativo fuera de alcance.

Ejecuta solo H14 sobre frontend/app/audit/page.tsx.

Extrae:
- features/audit/models y audit.service.
- Normalizadores tipados para eventos de requerimientos, productos y aprobaciones.
- useAuditLog.
- AuditFilters, AuditTable/List, AuditEventDetail y estado vacio/error.
- Formateo legible y seguro de valores anteriores/nuevos.
- Paginacion y busqueda reutilizadas cuando aplique.
- Pruebas de normalizacion, filtrado, orden, detalle, datos incompletos y error API.

La auditoria del frontend es visualizacion; no simules ni sustituyas la auditoria
backend. No cambies persistencia ni eventos.

Criterios:
- audit/page.tsx solo compone.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar auditoria

Detente antes de H15.
```
