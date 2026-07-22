# Contexto del proyecto - App Trafico MKT

## Proyecto

- Repositorio: `https://github.com/christyepez/appTraficoMKT`.
- Rama de trabajo: `feature1.0`.
- Dominio: gestion de requerimientos y productos de Marketing.
- Frontend: Next.js 16, React 19, TypeScript y CSS.
- Backend: microservicios .NET con APIs de requerimientos, productos, evidencias, identidad y administracion.

## Objetivo actual

Refactorizar el frontend de forma incremental, comenzando por Productos, para
separar presentacion, estado, casos de uso, acceso HTTP, modelos, validaciones y
reglas puras sin romper los contratos vigentes.

## Decisiones confirmadas

- Primer modulo: Productos (`/activities`).
- Se permite mejorar el diseno mientras se conserva el flujo funcional.
- CSS puro: estilos globales compartidos y CSS especifico solo cuando sea necesario.
- Formularios: React Hook Form y Zod.
- Pruebas: Vitest y Testing Library.
- Transporte HTTP: mantener `fetch` mediante servicios tipados.
- Entrega: modulo por modulo y commits pequenos.
- Versiones: conservar Next.js 16 y React 19.

## Capacidades propias del dominio

- Requerimientos de Marketing.
- Productos y su flujo de estados.
- Agenda tecnica del equipo.
- Evidencias vinculadas al producto.
- Aprobacion funcional de productos.
- Metricas especificas de Trafico MKT.

## Aislamiento de PortalCorporativo

En la primera etapa la aplicacion es autonoma. `CodexCommonAgents` se usa como
marco de gobierno, arquitectura y calidad, no como una dependencia de ejecucion.

| Capacidad | Decision actual |
|---|---|
| Login, usuarios, roles y permisos | Mantener implementacion propia |
| Menu y navegacion | Mantener implementacion propia |
| Marca y configuracion visual | Mantener implementacion propia |
| Catalogos | Mantener implementacion propia |
| Auditoria | Mantener implementacion propia |
| Notificaciones | Mantener implementacion propia |
| Evidencias y archivos | Mantener implementacion propia |
| Productos y requerimientos | `CREATE`, dominio Trafico MKT |

Cualquier evaluacion de integracion con PortalCorporativo requiere una iniciativa,
ADR, backlog y autorizacion separados.

## Restricciones

- No cambiar contratos backend sin una tarea y ADR independientes.
- No trasladar autorizacion al frontend.
- No introducir una nueva biblioteca HTTP sin beneficio medible.
- No redisenar varios modulos en el mismo incremento.
- No agregar dependencias de PortalCorporativo.
