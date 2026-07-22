# H25 - Regresion integral y cierre de feature1.0

Fecha de auditoria: 22 de julio de 2026.

## Dictamen

**NO-GO para PR o merge `feature1.0 -> main`.**

La suite automatizada y el build estan verdes, las 23 paginas quedaron reducidas
a composicion y no existe acceso HTTP directo en TSX. H25-R1, H25-R2 y H25-R3
fueron implementados y verificados automaticamente. El dictamen permanece
NO-GO por dos condiciones que requieren un entorno integrado y decisiones fuera
del refactor frontend:

1. La regresion manual con APIs, almacenamiento, roles y navegadores reales no se
   ha ejecutado.
2. Los riesgos backend R-010 a R-014 no han sido resueltos o aceptados
   formalmente.

## Evidencia automatizada

| Control | Resultado |
|---|---|
| `pnpm test` | PASS: 95 archivos, 323 pruebas. |
| `pnpm test:coverage` | PASS: 97.94% lineas/statements, 84.71% branches, 96.12% funciones. |
| `pnpm lint` | PASS, sin errores ni warnings de ESLint. |
| `pnpm build` | PASS: 24 rutas generadas; 23 rutas funcionales auditadas y `_not-found`. |
| TypeScript | PASS dentro de `next build`. |
| Grafo de imports | PASS: 227 archivos, 458 aristas y 0 ciclos detectados. |
| `fetch` en TSX | PASS: 0 ocurrencias. |
| Dependencia PortalCorporativo | PASS: 0 imports, paquetes o URLs de ejecucion. |

`baseline-browser-mapping` informa datos auxiliares desactualizados. No afecta
lint ni build y no se actualiza porque la decision vigente es conservar versiones.

## Comparacion con la linea base H0

Linea base de codigo: `5ce370d`; cierre auditado antes del commit H25: `bd56be1`.

| Metrica | Antes | H25 | Cambio |
|---|---:|---:|---:|
| Lineas totales en `page.tsx` | 5,703 | 365 | -93.6% |
| Mayor `page.tsx` | 610 | 92 | -84.9% |
| Archivos de prueba frontend | 0 | 95 | +95 |
| Pruebas automatizadas | 0 | 323 | +323 |
| Llamadas `api(...)` desde TSX | 109 | 0 | -100% |
| Lineas de `app/lib.ts` | 426 | 9 | -97.9% |
| Lineas de `app/nav.tsx` | 209 | 1 | -99.5% |
| Lineas de `globals.css` | 2,573 | 1,207 | -53.1% |

`LoginExperience` coordina autenticacion y canales publicos mediante un hook,
servicios tipados, RHF + Zod y dialogs accesibles. Los estilos de dominio se
movieron a CSS Modules; `globals.css` conserva tokens y patrones compartidos.

## Auditoria estructural

| Control | Estado | Evidencia o deuda |
|---|---|---|
| Paginas como composicion | Cumple | 23 paginas, 365 lineas; maximo 92. |
| HTTP en presentacion | Cumple | 0 usos de `api(...)` o `fetch` en componentes TSX. |
| Modelos duplicados | Cumple | `Technician` y `ExternalEvidencePayload` tienen fuente canonica compartida. |
| Componentes compartidos | Cumple | Formularios de catalogos y usuarios reutilizan `FormField`. |
| Formularios RHF + Zod | Cumple | El asistente del login tambien usa esquema Zod y React Hook Form. |
| CSS global/local | Cumple en codigo | Estilos de dominio migrados a CSS Modules; falta la comprobacion visual incluida en H25-R4. |
| Imports circulares | Cumple | 0 ciclos en el grafo estatico. |
| Codigo obsoleto | Cumple con deuda | Sin marcadores TODO/FIXME; permanecen fachadas compatibles con 57 consumidores. |
| Componentes criticos probados | Cumple automatizado | Cada feature tiene pruebas; login incluye componente, formulario, hook, SSO y PKCE. |
| Teclado, foco y dialogs | Cumple automatizado | Popup y chatbot reutilizan `AccessibleDialog`; falta regresion manual. |
| Botones y paleta institucional | Cumple automatizado | Todos los botones de produccion declaran un patron visual o variante especializada; pruebas verifican principal, secundario y peligro. |
| Estados de pantalla | Cumple automatizado | Hooks/componentes cubren carga, error, vacio y exito por modulo. Falta validacion real. |

## Matriz de regresion manual pendiente

La columna de rol indica el perfil objetivo; debe probarse tambien la combinacion
de `screenPermissions` habilitada y denegada, porque Administrador tiene acceso
global y los demas perfiles dependen de permisos configurables.

| Rutas | Rol o contexto | Casos obligatorios |
|---|---|---|
| `/login` | Publico | Local correcto/error, Microsoft retorno/state, marca, popup, chatbot, teclado y 320/768/1440 px. |
| `/forgot-password` | Publico | Correo valido/invalido, respuesta anti-enumeracion, error de red y foco. |
| `/change-password` | Usuario con cambio obligatorio | Validacion, confirmacion, exito, sesion vencida y redireccion. |
| `/dashboard` | Administrador, Coordinador, Solicitante | Carga/error/vacio/exito, crear/editar/workflow, permisos y dialog. |
| `/activities` | Administrador, Tecnico | Crear/editar, workflow, filtros, polling, concurrencia y evidencias. |
| `/evidence` | Administrador, Tecnico | Archivo/URL, preview, limite, eliminar, almacenamiento real y permisos. |
| `/approvals` | Administrador, Aprobador | Cola vacia, aprobar/rechazar, comentario, adjuntos y doble envio. |
| `/agenda` | Administrador, Coordinador, Tecnico | CRUD, solapes, jornada, replanificacion, filtros y errores parciales. |
| `/agenda-calendar` | Administrador, Coordinador, Tecnico | Dia/semana/mes/lista, navegacion, filtros, detalle y responsive. |
| `/agenda-metrics` | Administrador, Coordinador | Periodos, capacidad, carga, vacio, error parcial y responsive. |
| `/metrics` | Administrador, Coordinador, Auditor | Fuentes parciales, filtros, conceptos, vacio y exportacion visual. |
| `/audit` | Administrador, Auditor | Tres fuentes, busqueda, paginacion, JSON seguro y fuente fallida. |
| `/admin` | Administrador | CRUD por grupo, relaciones, validacion, permisos y errores API. |
| `/users` | Administrador | Alta/edicion, roles, pantallas, proveedor, estado y menu. |
| `/branding` | Administrador | Vista previa/cancelar/guardar, logo, contraste, tema y recarga. |
| `/notifications` | Administrador | CRUD, plantillas, webhook, correo/Teams, validacion y error. |
| `/my-notifications` | Usuario autenticado | Vacio, lista, reconocer, globo y polling. |
| `/notification-log` | Administrador, Auditor | Filtros, vacio, error, paginacion y detalle. |
| `/storage` | Administrador | Local/Blob/FTP, secretos ocultos, validacion y persistencia. |
| `/initial-import` | Administrador | Plantillas, archivo valido/invalido, progreso, parcial y errores por fila. |
| `/public-requirement` | Publico | Ventana activa/inactiva, catalogos, RHF/Zod, envio unico y responsive. |
| `/satisfaction/[token]` | Publico con token | Valido, invalido, usado, vencido/410, red, envio unico y confirmacion. |
| Navegacion global | Todos los roles | Menu horizontal/vertical, plegado, ruta prohibida, foco, idioma, tema y logout. |

## Remediaciones antes del GO

| ID | Prioridad | Tarea | Criterio de salida |
|---|---:|---|---|
| H25-R1 | Completada | Servicio/hook tipado, chatbot RHF+Zod y dialogs accesibles. | 0 usos de `api` en TSX; pruebas de login, hook y formulario verdes. |
| H25-R2 | Implementada | Estilos concretos migrados desde `globals.css` a CSS Modules por feature. | Codigo conforme; comparacion visual queda incluida en H25-R4. |
| H25-R3 | Completada | Contratos y campos equivalentes consolidados. | Una fuente canonica y suite verde. |
| H25-R4 | Alta | Ejecutar y firmar la matriz manual con backend, storage y roles reales. | Todos los casos PASS o defectos aceptados formalmente. |
| H25-R5 | Alta backend | Resolver R-010 a R-014 de seguridad/protocolo. | Riesgos aceptados o cambios backend desplegados y probados. |

## Commits e hitos

Los SHAs siguientes identifican la historia local exacta usada para construir los
arboles publicados. Desde H16 algunos commits de GitHub tienen SHA distinto
porque se recrearon mediante el conector, conservando mensaje, padre logico y
arbol verificado.

| Hito | Commit local | Mensaje |
|---|---|---|
| H0 | `0f6939d`, `5ce370d` | Definir roadmap y ajustar estrategia. |
| H1 | `ca639f9` | Crear fundacion del modulo productos. |
| H2 | `14377a6` | Desacoplar formulario de productos. |
| H3 | `82d9182` | Separar seguimiento y workflow de productos. |
| H4 | `6a8f7e5` | Desacoplar evidencias y aprobaciones de productos. |
| H5 | `33cf19b` | Mejorar experiencia del modulo productos. |
| H6 | `78193f5` | Cerrar refactorizacion del modulo productos. |
| H7 | `31919b9` | Modularizar evidencias. |
| H8 | `d7c084c` | Modularizar aprobaciones. |
| H9 | `0d5f560` | Modularizar agenda tecnica. |
| H10 | `c77372e` | Modularizar calendario tecnico. |
| H11 | `0e43eac` | Modularizar metricas de agenda. |
| H12 | `40c9aa5` | Modularizar requerimientos. |
| H13 | `671dea7` | Modularizar metricas generales. |
| H14 | `8669da8` | Modularizar auditoria. |
| H15 | `4a2fa3d` | Modularizar administracion de catalogos. |
| H16 | `b8dc8f8` | Modularizar administracion de usuarios. |
| H17 | `6cda09e` | Modularizar configuracion de marca. |
| H18 | `9b5bb25`, `44bca51`, `2d3f14d` | Modularizar configuracion, bandeja y bitacora de notificaciones. |
| H19 | `c14d3ea` | Modularizar configuracion de almacenamiento. |
| H20 | `4d25191` | Modularizar carga inicial. |
| H21 | `9839a71`, `a9475ea`, `e8adcd5` | Modularizar login, recuperacion y cambio de clave. |
| H22 | `6c1eab5` | Modularizar formulario publico. |
| H23 | `186398f` | Modularizar encuesta de satisfaccion. |
| H24 | `bd56be1` | Consolidar shell y componentes compartidos. |

Publicaciones GitHub verificadas al final de la cadena: H21
`a20bbf5`/`7b4e38c`/`31f9df4`, H22 `b0f6838`, H23 `4636860` y H24
`e91a618`.

## Recomendacion de PR

No abrir aun el PR `feature1.0 -> main`. Completar H25-R4, aceptar o resolver
formalmente H25-R5, repetir esta auditoria y obtener GO explicito.
Incluso con GO, el merge y despliegue requieren autorizacion separada.
