# Fase 2 - Evidencias y aprobaciones

## Prompt H7 - Modulo Evidencias

```text
Actua en este orden con los contratos de CodexCommonAgents:
1. Coordinator Agent.
2. Portal Reuse Agent, solo para confirmar aislamiento.
3. Solution Architect Agent.
4. Rol Frontend.
5. Rol QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H6 Productos aprobado.
PortalCorporativo: fuera de alcance; no crear adaptadores ni dependencias.

Ejecuta exclusivamente H7: refactorizar frontend/app/evidence/page.tsx.

Antes de modificar:
- Lee AGENTS.md, codex/PROJECT_CONTEXT.md, codex/INSTRUCTIONS.md,
  codex/FRONTEND_MASTER_ROADMAP.md y solo los archivos de Evidencias necesarios.
- Revisa los componentes de Evidencias creados durante Productos.
- Clasifica cada pieza como REUSE interna o CREATE; no dupliques vistas previas,
  validadores de archivos ni servicios ya existentes.
- Presenta archivos permitidos y plan de cambios.

Implementa por incrementos:
- features/evidence/models y contratos tipados.
- evidence.service sobre fetch y endpoints actuales.
- useEvidenceWorkspace para carga, filtros y operaciones asincronas.
- EvidenceList, EvidenceCard, EvidenceUploadDialog y EvidencePreview.
- Validaciones de archivo/URL/peso reutilizadas desde Productos cuando proceda.
- Estados de carga, error recuperable, vacio y exito.
- CSS Module solo para composicion propia del modulo.
- Pruebas de permisos visibles, carga, eliminacion, previews, estados y errores.

No cambies endpoints, almacenamiento, permisos backend ni el modulo Aprobaciones.

Criterios de aceptacion:
- evidence/page.tsx solo compone la pagina.
- No hay fetch en componentes de presentacion.
- No se duplican utilidades de Productos.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar evidencias

Actualiza codex/TASKS.md, entrega salida CodexCommonAgents y detente antes de H8.
```

## Prompt H8 - Modulo Aprobaciones

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA de
acuerdo con CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H6 y H7 aprobados.
Mantener aislamiento total de PortalCorporativo.

Ejecuta exclusivamente H8: refactorizar frontend/app/approvals/page.tsx.

Antes de modificar, inspecciona solo Aprobaciones y los contratos/componentes de
Productos/Evidencias que puedan reutilizarse. Presenta clasificacion REUSE
interna/CREATE, archivos permitidos y criterios de aceptacion.

Implementa:
- features/approvals/models y approval.service sobre fetch.
- Esquemas Zod para decisiones y comentarios si existe formulario.
- useApprovalsWorkspace.
- ApprovalQueue, ApprovalCard, ApprovalDecisionForm y ApprovalEvidenceDialog.
- Etiquetas de estado centralizadas y reutilizadas.
- Confirmacion clara de aprobar/rechazar y bloqueo de doble envio.
- Estados de carga, error, vacio y resultado.
- Pruebas de aprobar, rechazar, comentarios requeridos, evidencias, permisos
  visibles, error API y solicitudes duplicadas.

No cambies reglas backend, endpoints, notificaciones ni evidencias persistidas.

Criterios:
- approvals/page.tsx solo compone.
- Formularios usan React Hook Form + Zod.
- Componentes no llaman fetch.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar aprobaciones

Actualiza backlog y detente antes de H9.
```
