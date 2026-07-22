# ADR-001 - Aislamiento inicial de PortalCorporativo

## Estado

Aceptado.

## Contexto

`CodexCommonAgents` aplica normalmente una estrategia Portal-First para evitar
duplicar capacidades transversales. Para la refactorizacion frontend 1.0 de
`appTraficoMKT`, el responsable del producto decidio mantener la aplicacion
autonoma y aislada de `PortalCorporativo`.

## Decision

- Usar `CodexCommonAgents` solo como marco de coordinacion, arquitectura y calidad.
- No consumir codigo, APIs, identidad, menus, configuracion ni infraestructura de
  `PortalCorporativo` durante H0-H25.
- Mantener los contratos backend actuales de `appTraficoMKT`.
- Clasificar Productos y los demas modulos propios como `CREATE` dentro de este
  repositorio y reutilizar internamente componentes existentes cuando aplique.
- Exigir una iniciativa, ADR, backlog y autorizacion separados para evaluar una
  integracion futura con el portal.

## Consecuencias

- La refactorizacion puede avanzar sin dependencias cruzadas.
- Las capacidades transversales actuales continuan siendo responsabilidad de
  `appTraficoMKT` durante esta etapa.
- Puede existir deuda de convergencia futura con PortalCorporativo.
- El Portal Reuse Agent actua solo como control de aislamiento.

## Riesgos aceptados

- Duplicacion temporal de capacidades que en otra iniciativa podrian pertenecer
  al portal.
- Mayor costo futuro si se decide integrar ambas plataformas.
- Necesidad de revisar nuevamente seguridad, menus, auditoria, archivos y
  notificaciones antes de cualquier convergencia.
