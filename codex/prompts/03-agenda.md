# Fase 3 - Planificacion tecnica

## Prompt H9 - Agenda tecnica

```text
Usa Coordinator Agent y Solution Architect Agent de CodexCommonAgents; ejecuta
roles Frontend y QA bajo sus decisiones.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H6 aprobado.
PortalCorporativo: fuera de alcance.

Ejecuta solo H9 sobre frontend/app/agenda/page.tsx.

Discovery obligatorio:
- Inventaria agenda manual, reservas derivadas de Productos, tecnicos, jornadas,
  filtros, edicion y reglas de fechas.
- Separa claramente datos remotos, reglas puras de planificacion y presentacion.
- Presenta archivos permitidos antes de implementar.

Implementa:
- features/agenda/models, schemas, services, utils, hooks y components.
- agenda.service usando fetch y endpoints actuales.
- Funciones puras para rangos laborales, fechas, duracion y combinacion de reservas.
- AgendaForm con React Hook Form + Zod.
- AgendaList, AgendaFilters y AgendaItemCard.
- useAgendaWorkspace para carga y operaciones.
- Pruebas de rangos, cruces, filtros, alta/edicion, permisos visibles y errores.

No modifiques Calendario ni Metricas de Agenda salvo mover una utilidad realmente
compartida y probada. No cambies reglas backend.

Criterios:
- agenda/page.tsx solo compone.
- Reglas de tiempo son puras y probadas.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar agenda tecnica

Detente antes de H10.
```

## Prompt H10 - Calendario tecnico

```text
Actua con Coordinator, Solution Architect, Frontend y QA segun CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H9 aprobado.
Aislamiento de PortalCorporativo obligatorio.

Ejecuta solo H10 sobre frontend/app/agenda-calendar/page.tsx.

Reutiliza modelos, servicios y reglas de tiempo de features/agenda. No dupliques
la construccion de reservas ni el filtrado por tecnico.

Extrae:
- CalendarToolbar y selectores de dia/semana/mes/lista.
- CalendarFilters.
- DayView, WeekView, MonthView y ListView cuando existan esos comportamientos.
- CalendarEvent y utilidades puras de rangos/posicionamiento.
- useAgendaCalendar para navegacion y estado local.
- CSS Module para la grilla especifica del calendario.

Mejora responsive, teclado, etiquetas de eventos, estado vacio y legibilidad sin
cambiar el significado de los datos.

Pruebas:
- Navegacion temporal.
- Cambios de vista.
- Semana laboral/completa.
- Filtros por tecnico y sede.
- Eventos en limites de fecha/hora.
- Renderizado sin datos y con errores.

Criterios:
- agenda-calendar/page.tsx solo compone.
- No duplica reglas de Agenda.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar calendario tecnico

Detente antes de H11.
```

## Prompt H11 - Metricas de Agenda

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H9 y H10 aprobados.
PortalCorporativo fuera de alcance.

Ejecuta solo H11 sobre frontend/app/agenda-metrics/page.tsx.

Implementa:
- Modelos tipados de metricas de agenda.
- Servicio o selectores puros segun el origen real de los datos.
- useAgendaMetrics.
- MetricSummary, TechnicianWorkload, CapacityIndicator y filtros de periodo.
- Funciones puras para capacidad, ocupacion, horas y agregaciones.
- Estados carga/error/vacio.
- CSS local solo cuando una visualizacion lo requiera.
- Pruebas de calculos, filtros, datos incompletos, cero divisiones y renderizado.

No agregues una biblioteca de graficos sin presentar necesidad, alternativas y
aprobacion. Prefiere HTML/CSS accesible para visualizaciones simples.

Criterios:
- agenda-metrics/page.tsx solo compone.
- Calculos documentados y probados.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar metricas de agenda

Actualiza el backlog y detente antes de H12.
```
