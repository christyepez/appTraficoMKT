# AGENTS.md - App Trafico MKT

## Proposito

Definir como Codex debe operar en este repositorio usando los contratos de
`christyepez/CodexCommonAgents` y una estrategia de cambios incrementales. La
aplicacion se mantiene aislada de `PortalCorporativo` en esta etapa.

## Lectura obligatoria

1. `README.md`.
2. `codex/PROJECT_CONTEXT.md`.
3. `codex/INSTRUCTIONS.md`.
4. `codex/REFACTOR_STRATEGY.md` cuando la tarea afecte al frontend.
5. `CodexCommonAgents/AGENTS.md` del repositorio comun.
6. `CodexCommonAgents/registry/reusable-portal-apis.md`.
7. `CodexCommonAgents/playbooks/portal-first-implementation.md`.

Repositorio comun: <https://github.com/christyepez/CodexCommonAgents>

Version revisada al crear este contrato:
`fc8c96a9d128465f724099bbd9bee5f85f5e4f12`.

## Agentes aplicables

| Orden | Agente | Responsabilidad en App Trafico MKT |
|---|---|---|
| 1 | Coordinator Agent | Define alcance, clasificacion, archivos permitidos, dependencias y criterios de aceptacion. |
| 2 | Portal Reuse Agent | Confirma que la tarea permanece aislada y no introduce dependencias con PortalCorporativo. |
| 3 | Solution Architect Agent | Disena la separacion por funcionalidades, contratos, dependencias y ADR. |

Los roles de Frontend y QA se ejecutan bajo el control del Solution Architect
hasta que existan como agentes versionados en `CodexCommonAgents`.

## Regla obligatoria

Antes de crear componentes, clasificar la decision como `REUSE`, `EXTEND`,
`ADAPT`, `CREATE` o `BLOCKED`.

## Reglas de implementacion

- Mantener Next.js 16, React 19 y TypeScript.
- Organizar el frontend por funcionalidades, no por tipo tecnico global.
- Mantener `page.tsx` como punto de composicion; no alojar reglas de negocio ni acceso HTTP en la pagina.
- Mantener `fetch` detras de servicios tipados.
- Usar React Hook Form y Zod en formularios nuevos o refactorizados.
- Usar CSS global para tokens y patrones compartidos; CSS Modules para estilos propios de una funcionalidad.
- Agregar pruebas con Vitest y Testing Library.
- Conservar autorizacion efectiva en backend.
- Hacer commits pequenos, compilables y revisables.
- No mezclar una refactorizacion estructural con una migracion a PortalCorporativo.
- No consumir codigo, APIs, identidad, menus ni configuracion de PortalCorporativo.

## Criterio de salida

Cada tarea debe reportar agente, clasificacion, archivos modificados, pruebas,
impactos transversales, riesgos y siguiente paso.
