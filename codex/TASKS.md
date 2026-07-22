# Backlog de refactorizacion - App Trafico MKT

## Estado de hitos

| Hito | Estado | Evidencia |
|---|---|---|
| H0 Gobierno y linea base | Completado | Estrategia aprobada y publicada; Prompt 0 ejecutado. |
| H1 Fundacion Productos | En progreso | Autorizado despues del Prompt 0. |
| H2 Formulario | Pendiente | - |
| H3 Seguimiento y workflow | Pendiente | - |
| H4 Evidencias y aprobaciones | Pendiente | - |
| H5 UX, CSS y accesibilidad | Pendiente | - |
| H6 Estabilizacion Productos | Pendiente | - |
| H7-H8 Evidencias y Aprobaciones | Pendiente | Ver `codex/prompts/02-evidence-approvals.md`. |
| H9-H11 Agenda | Pendiente | Ver `codex/prompts/03-agenda.md`. |
| H12-H14 Requerimientos y analitica | Pendiente | Ver `codex/prompts/04-requirements-analytics.md`. |
| H15-H16 Administracion | Pendiente | Ver `codex/prompts/05-administration.md`. |
| H17-H20 Configuracion operativa | Pendiente | Ver `codex/prompts/06-operations.md`. |
| H21-H23 Acceso y canales publicos | Pendiente | Ver `codex/prompts/07-access-public.md`. |
| H24-H25 Consolidacion y cierre | Pendiente | Ver `codex/prompts/08-consolidation.md`. |

## Sprint 0

- [x] Crear rama `feature1.0` desde `main`.
- [x] Confirmar que las ramas existentes ya estaban integradas.
- [x] Ejecutar build base del frontend.
- [x] Revisar agentes disponibles en `CodexCommonAgents`.
- [x] Confirmar aislamiento inicial respecto a `PortalCorporativo`.
- [x] Definir arquitectura objetivo, hitos y sprints.
- [x] Confirmar la estrategia con el responsable del producto.
- [x] Publicar el commit documental.
- [x] Ejecutar Prompt 0 y aprobar sus ajustes.

## Sprint 1

- [ ] Crear estructura `features/products`.
- [ ] Crear modelos iniciales.
- [ ] Crear servicio inicial sobre `fetch`.
- [ ] Extraer utilidades puras del workflow.
- [ ] Crear primeras pruebas unitarias.
- [ ] Completar instalacion y lockfile de dependencias.
- [ ] Migrar `activities/page.tsx` a los modelos, servicios y utilidades.
- [ ] Agregar pruebas del servicio y filtros por sesion.
- [ ] Ejecutar `pnpm test`.
- [ ] Ejecutar `pnpm build`.
- [ ] Publicar commit de fundacion.

## Hitos H7-H25

- [ ] Ejecutar cada prompt en el orden de `codex/FRONTEND_MASTER_ROADMAP.md`.
- [ ] Revisar y aprobar cada puerta antes del siguiente hito.
- [ ] Mantener la aplicacion aislada de PortalCorporativo.
- [ ] No fusionar `feature1.0` a `main` antes del GO de H25.
