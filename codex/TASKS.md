# Backlog de refactorizacion - App Trafico MKT

## Estado de hitos

| Hito | Estado | Evidencia |
|---|---|---|
| H0 Gobierno y linea base | Completado | Estrategia aprobada y publicada; Prompt 0 ejecutado. |
| H1 Fundacion Productos | Completado | Modulo base, servicio, utilidades y pruebas publicados en `feature1.0`. |
| H2 Formulario | Completado | React Hook Form, Zod, campos accesibles y pruebas de alta/edicion/error. |
| H3 Seguimiento y workflow | Completado | Hook de workspace, filtros, listado, tarjetas y acciones probados. |
| H4 Evidencias y aprobaciones | Completado | Adjuntos, galeria, vista previa y versiones desacoplados y probados. |
| H5 UX, CSS y accesibilidad | Completado | CSS modular, responsive, foco visible y dialogs accesibles. |
| H6 Estabilizacion Productos | Completado | Ver `codex/H6_PRODUCT_CLOSURE.md`: regresion automatizada verde y fusion condicionada a pruebas manuales. |
| H7 Evidencias | Completado | Página autónoma modularizada con reutilización compartida, 63 pruebas y cobertura crítica completa. |
| H8 Aprobaciones | Completado | Cola, decisiones validadas, adjuntos, permisos visibles y concurrencia desacoplados. |
| H9 Agenda técnica | Completado | CRUD, reservas derivadas, jornadas, filtros y reglas de fechas modularizados. |
| H10 Calendario técnico | Completado | Navegación, filtros, cuatro vistas y eventos reutilizan Agenda sin duplicar reservas. |
| H11 Métricas de Agenda | Completado | Indicadores, capacidad, carga técnica y filtros desacoplados sobre datos de Agenda. |
| H12 Requerimientos y Dashboard | Completado | Formulario, filtros, workflow, permisos visibles y servicio tipado desacoplados. |
| H13 Métricas generales | Completado | Fuentes parciales, cálculos, conceptos y secciones analíticas desacoplados. |
| H14 Auditoria | Completado | Tres fuentes normalizadas, filtros, paginación y detalle seguro desacoplados. |
| H15 Administración de catálogos | Completado | Grupos, relaciones, formularios discriminados y CRUD desacoplados. |
| H16 Usuarios y permisos visibles | Completado | Administracion, roles, pantallas y preferencias modularizados. |
| H17-H20 Configuracion operativa | Completado | Marca, notificaciones, almacenamiento e importacion modularizados. |
| H21-H23 Acceso y canales publicos | Completado | Acceso local, recuperacion, formulario publico y satisfaccion modularizados. |
| H24-H25 Consolidacion y cierre | Auditado / NO-GO | Ver `codex/H25_FRONTEND_CLOSURE.md` y remediaciones H25-R1 a H25-R4. |

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

- [x] Crear estructura `features/products`.
- [x] Crear modelos iniciales.
- [x] Crear servicio inicial sobre `fetch`.
- [x] Extraer utilidades puras del workflow.
- [x] Crear primeras pruebas unitarias.
- [x] Completar instalacion y lockfile de dependencias.
- [x] Migrar `activities/page.tsx` a los modelos, servicios y utilidades.
- [x] Agregar pruebas del servicio y filtros por sesion.
- [x] Ejecutar `pnpm lint` y registrar la deuda legacy.
- [x] Ejecutar `pnpm test`.
- [x] Ejecutar `pnpm build`.
- [x] Publicar commit de fundacion.

## Sprint 2

- [x] Crear `product.schema.ts` y tipos inferidos.
- [x] Extraer `ProductForm` desde `activities/page.tsx`.
- [x] Crear `ProductSelectField` con mensajes accesibles.
- [x] Mover el mapeo formulario-comando al modulo de Productos.
- [x] Implementar estados de guardado, error y exito.
- [x] Agregar CSS Module exclusivo del formulario.
- [x] Probar renderizado, validaciones, alta, edicion y error del servicio.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit del formulario desacoplado.

## Sprint 3

- [x] Crear `useProductsWorkspace` para carga, polling y refresco.
- [x] Centralizar guardado, transiciones y eliminación de Productos.
- [x] Evitar solicitudes duplicadas durante acciones y actualizaciones.
- [x] Extraer `ProductFilters`, `ProductList` y `ProductCard`.
- [x] Extraer `ProductWorkflowActions`.
- [x] Diferenciar carga inicial, error recuperable, vacío y filtros sin resultados.
- [x] Mostrar el estado de actualización y bloquear acciones pendientes.
- [x] Probar búsqueda, visibilidad, paginación, workflow y reintento.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit de seguimiento y workflow.

## Sprint 4

- [x] Extraer `ProductAttachmentPanel`.
- [x] Extraer `EvidenceGallery` y `EvidencePreview`.
- [x] Extraer `ApprovalVersionsDialog`.
- [x] Centralizar operaciones de evidencias en el hook y servicios locales.
- [x] Validar archivo, URL, peso y tipo de vista previa.
- [x] Bloquear eliminación después de aprobación o rechazo.
- [x] Mejorar cierre por teclado y foco inicial de dialogs.
- [x] Probar archivos, enlaces, previews, eliminación y versiones.
- [x] Reducir `activities/page.tsx` por debajo de 120 líneas.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit de evidencias y aprobaciones.

## Sprint 5

- [x] Crear `Product.module.css` para composicion exclusiva del modulo.
- [x] Mantener en CSS global solo patrones compartidos y foco visible.
- [x] Mejorar jerarquia, espaciado, tarjetas y estados de feedback.
- [x] Mejorar responsive y respetar movimiento reducido.
- [x] Hacer seleccion de archivos operable con teclado.
- [x] Crear `ProductDialog` con foco inicial, ciclo de Tab y restauracion.
- [x] Cerrar dialogs con Escape salvo durante operaciones bloqueadas.
- [x] Agregar etiquetas y grupos accesibles a acciones y filtros.
- [x] Probar estructura accesible, teclado y estados visuales.
- [x] Ejecutar lint, TypeScript, pruebas y build.
- [x] Publicar commit de experiencia de Productos.

## Sprint 6

- [x] Inventariar y trazar los criterios de aceptacion H1-H5.
- [x] Confirmar que `activities/page.tsx` solo compone y mide 92 lineas.
- [x] Confirmar una unica fuente de modelos y ausencia de HTTP en presentacion.
- [x] Cubrir crear, editar, workflow, busqueda, paginacion y eliminacion.
- [x] Cubrir carga, enlace, eliminacion y consulta de evidencias y versiones.
- [x] Revisar permisos visibles y documentar el limite de seguridad frontend.
- [x] Ejecutar 49 pruebas y validar la cobertura critica acordada.
- [x] Documentar arquitectura, decisiones y patron reutilizable del modulo.
- [x] Registrar la regresion manual pendiente con servicios reales.
- [x] Ejecutar lint, TypeScript, cobertura y build final.
- [ ] Fusionar `feature1.0` solo tras completar la regresion manual y recibir autorizacion explicita.

## Hitos H7-H25

- [x] Ejecutar cada prompt en el orden de `codex/FRONTEND_MASTER_ROADMAP.md`.
- [x] Revisar cada puerta y registrar los incumplimientos de H25.
- [x] Mantener la aplicacion aislada de PortalCorporativo.
- [x] No fusionar `feature1.0` a `main` mientras H25 permanezca NO-GO.

## Sprint 7 - Evidencias

- [x] Clasificar contratos, utilidades, dialog y preview como `REUSE` interna.
- [x] Promover contratos de evidencia/aprobación y reglas con segundo consumidor a `shared`.
- [x] Crear servicio tipado sobre los endpoints existentes.
- [x] Crear `useEvidenceWorkspace` con permisos visibles, polling y operaciones bloqueadas.
- [x] Extraer `EvidenceList`, `EvidenceCard`, `EvidenceUploadDialog` y `EvidencePreview`.
- [x] Usar React Hook Form, Zod y validadores compartidos en la carga.
- [x] Agregar estados de carga, error recuperable, vacío, actualización y éxito.
- [x] Crear CSS Module exclusivo de Evidencias.
- [x] Reducir `evidence/page.tsx` a composición sin acceso HTTP.
- [x] Probar permisos visibles, archivos, URL, eliminación, previews, estados y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H7 y detenerse antes de H8.

## Sprint 8 - Aprobaciones

- [x] Reutilizar contratos, dialog accesible y vista previa compartidos.
- [x] Crear servicio tipado sobre endpoints existentes de aprobaciones.
- [x] Crear `useApprovalsWorkspace` con filtros, polling y bloqueo por producto.
- [x] Extraer `ApprovalQueue`, `ApprovalCard`, `ApprovalDecisionForm` y `ApprovalEvidenceDialog`.
- [x] Reemplazar `window.prompt` con React Hook Form y esquema Zod.
- [x] Exigir comentario y confirmar aprobar/rechazar de forma explícita.
- [x] Mantener Auditores en consulta sin presentar acciones de decisión.
- [x] Mostrar carga, error recuperable, vacío, actualización y resultado.
- [x] Crear CSS Module exclusivo de Aprobaciones.
- [x] Reducir `approvals/page.tsx` a composición sin acceso HTTP.
- [x] Probar decisiones, comentarios, adjuntos, permisos, errores y doble envío.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H8 y detenerse antes de H9.

## Sprint 9 - Agenda técnica

- [x] Inventariar agenda manual, reservas derivadas, técnicos, jornadas, filtros y edición.
- [x] Crear modelos, esquema Zod y servicio sobre endpoints existentes.
- [x] Extraer reglas puras de jornada, fechas, duración y combinación de reservas.
- [x] Crear `useAgendaWorkspace` con visibilidad, métricas y operaciones bloqueadas.
- [x] Extraer `AgendaForm`, `AgendaFilters`, `AgendaList` y `AgendaItemCard`.
- [x] Usar React Hook Form y Zod para alta/edición.
- [x] Mostrar carga, error recuperable, vacío, actualización y resultado.
- [x] Crear CSS Module exclusivo de Agenda.
- [x] Reducir `agenda/page.tsx` a composición sin acceso HTTP.
- [x] Probar jornadas, fechas, duración, reservas, filtros, permisos, CRUD y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H9 y detenerse antes de H10.

## Sprint 10 - Calendario técnico

- [x] Reutilizar modelos, servicio, permisos y construcción de reservas de Agenda.
- [x] Crear `useAgendaCalendar` para navegación, filtros y estado local.
- [x] Extraer `CalendarToolbar` y `CalendarFilters`.
- [x] Extraer vistas Día, Semana, Mes y Lista con `CalendarEvent`.
- [x] Agregar detalle accesible de evento con dialog compartido.
- [x] Probar navegación, vistas, semana laboral/completa, filtros y límites temporales.
- [x] Mejorar responsive, etiquetas, carga, error y vacío con CSS local.
- [x] Reducir `agenda-calendar/page.tsx` a composición sin acceso HTTP.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H10 y detenerse antes de H11.

## Sprint 11 - Métricas de Agenda

- [x] Reutilizar modelos, servicio, permisos y reservas derivadas de Agenda.
- [x] Crear selectores puros para horas, ocupación, capacidad y agregaciones.
- [x] Crear `useAgendaMetrics` para carga, visibilidad, período y estado derivado.
- [x] Extraer filtros, resumen, capacidad, carga técnica y detalle operativo.
- [x] Resolver datos incompletos y divisiones por cero con resultados seguros.
- [x] Mostrar carga, error recuperable y vacío sin duplicar acceso HTTP.
- [x] Crear CSS Module exclusivo para la visualización de métricas.
- [x] Mantener la página como composición legible y sin lógica de negocio.
- [x] Probar cálculos, filtros, capacidad, carga, datos incompletos y renderizado.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H11 y detenerse antes de H12.

## Sprint 12 - Requerimientos y Dashboard

- [x] Inventariar formulario, catálogos, filtros, workflow, permisos y endpoints.
- [x] Reutilizar dialog accesible, paginación, resaltado, sesión y cliente HTTP.
- [x] Crear modelos, esquema Zod, servicio, utilidades y hook del módulo.
- [x] Extraer formulario de alta/edición con carreras dependientes de facultad.
- [x] Extraer filtros, listado, tarjetas, workflow y productos relacionados.
- [x] Conservar contratos y reglas de finalización del backend.
- [x] Aplicar carga, error recuperable, vacío, éxito y bloqueo de doble acción.
- [x] Mantener Auditor en consulta y la autorización efectiva en backend.
- [x] Reducir `dashboard/page.tsx` a composición sin acceso HTTP.
- [x] Probar alta, edición, filtros, transiciones, visibilidad, errores y servicios.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H12 y detenerse antes de H13.

## Sprint 13 - Métricas generales

- [x] Inventariar contratos, cálculos, conceptos y secciones de la pantalla.
- [x] Crear modelos y servicio tipado sobre las cinco fuentes existentes.
- [x] Tolerar fuentes parciales y diferenciar carga, error total y vacío.
- [x] Extraer cálculos puros de auditoría, esfuerzo, barras y carga por usuario.
- [x] Crear `useMetricsDashboard` con polling y actualización no superpuesta.
- [x] Extraer toolbar, tarjetas, segmentos, etapas, participación y usabilidad.
- [x] Conservar visualizaciones CSS/HTML sin agregar librería de gráficos.
- [x] Mantener `analytics/` y Power BI fuera del cambio.
- [x] Reducir `metrics/page.tsx` a composición sin acceso HTTP.
- [x] Probar cálculos, transformaciones, conceptos, parciales, vacíos y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H13 y detenerse antes de H14.

## Sprint 14 - Auditoría

- [x] Inventariar las fuentes de Requerimientos, Productos y Aprobaciones.
- [x] Crear modelos y servicio tipado tolerante a fuentes parciales.
- [x] Normalizar y ordenar eventos mediante funciones puras.
- [x] Crear `useAuditLog` con polling, filtros y actualización no superpuesta.
- [x] Extraer filtros, resumen, lista paginada y detalle del evento.
- [x] Formatear fechas y payloads incompletos de manera segura.
- [x] Ocultar tokens, contraseñas, secretos y autorización en payloads JSON.
- [x] Diferenciar carga, error total, datos parciales y vacío.
- [x] Mantener la auditoría como visualización sin alterar persistencia ni eventos.
- [x] Reducir `audit/page.tsx` a composición sin acceso HTTP.
- [x] Probar normalización, orden, filtros, detalle, parciales y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H14 y detenerse antes de H15.

## Sprint 15 - Administración de catálogos

- [x] Inventariar grupos, relaciones, variantes y endpoints CRUD.
- [x] Modelar formularios mediante una unión discriminada tipada.
- [x] Crear servicio y `useCatalogAdministration` con polling y bloqueos.
- [x] Extraer selector, lista paginada, formulario de catálogo y aprobador.
- [x] Validar códigos, relaciones, correo, nivel y tipo dinámico con Zod.
- [x] Mostrar carga, error, vacío, confirmación y duplicidad del API.
- [x] Conservar contratos backend, seeds e importación inicial.
- [x] Reducir `admin/page.tsx` a composición sin acceso HTTP.
- [x] Probar variantes, relaciones, CRUD, inactivación y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H15 y detenerse antes de H16.

## Sprint 16 - Usuarios y permisos visibles

- [x] Inventariar usuarios, perfiles, pantallas visibles y endpoints existentes.
- [x] Crear modelos, esquema Zod, servicio, utilidades y `useUsersAdministration`.
- [x] Extraer formulario, selectores, lista, acciones de estado y composición.
- [x] Centralizar los valores iniciales y las pantallas sugeridas por perfil.
- [x] Conservar `fetch`, los contratos backend y el proveedor inmutable al editar.
- [x] Mostrar carga, error, vacío, confirmación y bloqueo de doble acción.
- [x] Distinguir visibilidad de interfaz y autorización efectiva del backend.
- [x] Reducir `users/page.tsx` a composición sin acceso HTTP.
- [x] Probar alta, edición, perfiles, pantallas, activación, validaciones y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H16 y detenerse antes de H17.

## Sprint 17 - Marca y tema

- [x] Inventariar configuración visual, menú, agenda, formularios y períodos públicos.
- [x] Separar identidad visual y banderas funcionales sin cambiar el contrato API.
- [x] Mover modelos, defaults y aplicación segura de CSS a `core/branding`.
- [x] Crear esquema Zod, servicio tipado y `useBrandSettings`.
- [x] Extraer formulario, colores, gradientes, tipografía, logos y vista previa.
- [x] Mantener sin cambios los valores institucionales existentes.
- [x] Aislar la vista previa del documento hasta guardar y restaurar al cancelar.
- [x] Reducir `branding/page.tsx` a composición sin acceso HTTP.
- [x] Probar defaults, validaciones, preview, guardado, cancelación y errores.
- [x] Ejecutar lint, TypeScript, cobertura y build.
- [x] Publicar commit H17 y detenerse antes de H18.

## Sprint 18 - Notificaciones y bitácoras

- [x] Inventariar configuración, registros personales, bitácora y endpoints.
- [x] Crear modelos, esquema, servicios, utilidades y hooks del dominio.
- [x] Modularizar configuración con React Hook Form y Zod.
- [x] Separar editor visual, HTML y vista previa segura.
- [x] Sanear HTML y aislarlo en un `iframe sandbox` sin scripts.
- [x] Modularizar bandeja personal y acuse con bloqueo de doble acción.
- [x] Compartir filtros, paginación y presentación de registros.
- [x] Modularizar bitácora con carga, error recuperable y vacío.
- [x] Mantener Power Automate, webhooks, backend y envío real sin cambios.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build final.
- [x] Publicar los tres commits H18 y detenerse antes de H19.

## Sprint 19 - Almacenamiento

- [x] Inventariar proveedores, contrato CRUD y exposición actual de secretos.
- [x] Crear modelos seguros, unión discriminada Zod, servicio, utilidades y hook.
- [x] Descartar secretos inmediatamente después de recibir respuestas del API.
- [x] Mostrar solo los campos correspondientes a Local, Blob o FTP.
- [x] Exigir valores sensibles de reemplazo sin volver a mostrar los almacenados.
- [x] Implementar listado, activación, carga, error, vacío y confirmaciones.
- [x] Reducir `storage/page.tsx` a composición sin acceso HTTP.
- [x] Probar proveedores, validaciones, edición, errores y tratamiento de secretos.
- [x] Ejecutar cobertura, lint, TypeScript y build.
- [x] Publicar commit H19 y detenerse antes de H20.

## Sprint 20 - Carga inicial

- [x] Inventariar tipos, plantillas, historial, contrato multipart y resultados.
- [x] Crear modelos, servicio, utilidades, hook y componentes del módulo.
- [x] Validar extensión XLSX y límite de 50 MB antes del envío.
- [x] Enviar `FormData` sin establecer manualmente `Content-Type`.
- [x] Extraer selector, plantillas, drop zone, progreso y resumen.
- [x] Preparar detalle accesible para errores por hoja y fila disponibles.
- [x] Cubrir selección, carga, resultado parcial, error y reintento.
- [x] Reducir `initial-import/page.tsx` a composición sin acceso HTTP.
- [x] Mantener plantillas, parser, semillas y datos sin cambios.
- [x] Ejecutar cobertura, lint, TypeScript y build.
- [x] Publicar commit H20 y detenerse antes de H21.

## Sprint 21 - Acceso y sesión

- [x] Inventariar JWT, expiración, almacenamiento local, PKCE, logout y redirecciones.
- [x] Extraer modelos y adaptador de sesión a `core/auth` sin cambiar el protocolo.
- [x] Crear servicio de autenticación y utilidades de mensajes y redirección.
- [x] Modularizar login local con React Hook Form y Zod.
- [x] Conservar el flujo Microsoft 365, sus claves PKCE y las credenciales demo.
- [x] Modularizar recuperación con respuesta neutral contra enumeración de usuarios.
- [x] Modularizar cambio de clave, confirmación, limpieza de sesión y retorno al login.
- [x] Reducir las tres páginas de acceso a composición.
- [x] Probar acceso válido/inválido, expiración, logout, recuperación y cambio obligatorio.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build.
- [x] Publicar los tres commits H21 y detenerse antes de H22.

## Sprint 22 - Formulario público de requerimientos

- [x] Inventariar las implementaciones completa, modal y chatbot.
- [x] Separar modelos, esquema Zod, servicio, utilidades y hook del flujo público.
- [x] Implementar una sola versión de `PublicRequirementForm` para página y login.
- [x] Mantener el chatbot separado por su contrato simplificado con valores predeterminados.
- [x] Aplicar Facultad/Carrera dependiente y reutilizar los contratos de catálogos.
- [x] Centralizar y probar la regla inclusiva de ventana de activación.
- [x] Mostrar fuera de período, carga, error recuperable, vacío, envío y éxito.
- [x] Evitar envíos duplicados mientras existe una petición activa.
- [x] Reducir `public-requirement/page.tsx` a composición.
- [x] Conservar el endpoint público y no agregar autenticación ni cambios backend.
- [x] Probar catálogos, límites, validaciones, envío, duplicados y errores.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build.
- [x] Publicar el commit H22 y detenerse antes de H23.

## Sprint 23 - Encuesta de satisfacción

- [x] Inventariar contexto, payload, endpoints y estados actuales de la encuesta.
- [x] Mantener el token opaco sin decodificarlo, registrarlo ni mostrarlo.
- [x] Crear modelos, esquema Zod, servicio con errores tipados y hook del flujo.
- [x] Diferenciar token válido, inválido, usado, vencido y error de red.
- [x] Preparar el estado vencido para HTTP 410 sin cambiar el protocolo backend.
- [x] Implementar escalas accesibles de 1 a 5 con grupos y etiquetas explícitas.
- [x] Mostrar carga, formulario, envío, error recuperable y confirmación final.
- [x] Evitar envíos simultáneos mediante estado visual y bloqueo inmediato.
- [x] Reducir `satisfaction/[token]/page.tsx` a composición.
- [x] Probar estados del token, validaciones, servicio, envío único y error API.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build.
- [x] Publicar el commit H23 y detenerse antes de H24.

## Sprint 24 - Shell, shared/core y CSS global

- [x] Inventariar responsabilidades de `lib.ts`, `nav.tsx`, `layout.tsx` y `globals.css`.
- [x] Documentar matriz KEEP/MOVE/MERGE/DELETE antes de modificar.
- [x] Mover cliente HTTP a `core/api` sin cambiar contratos ni comportamiento.
- [x] Mover toast e idioma a `core/configuration`.
- [x] Centralizar menú, visibilidad y primera ruta en `core/permissions`.
- [x] Dividir AppNav en servicio, hook, cabecera, perfil/notificaciones y menú.
- [x] Convertir `app/lib.ts` y `app/nav.tsx` en fachadas mínimas justificadas.
- [x] Consolidar `FormField` compartido en tres consumidores reales.
- [x] Añadir salto accesible al contenido y metadatos consistentes al layout.
- [x] Eliminar reglas CSS históricas sin consumidores y conservar patrones globales.
- [x] Probar roles, pantallas, orden, colapso, responsive, sesión, tema e idioma.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build.
- [x] Publicar commit H24 y detenerse antes de H25.

## Sprint 25 - Regresion integral y cierre

- [x] Revisar las 23 rutas funcionales y sus estados esperados.
- [x] Ejecutar pruebas, cobertura, lint, TypeScript y build de produccion.
- [x] Verificar imports circulares, acceso HTTP en presentacion y modelos duplicados.
- [x] Revisar composicion de paginas, formularios, CSS, dialogs, foco y labels.
- [x] Confirmar aislamiento de PortalCorporativo y conservacion de versiones.
- [x] Comparar metricas de H0 contra H25.
- [x] Preparar matriz manual por rol y pantalla.
- [x] Actualizar README, arquitectura, roadmap, tareas y riesgos.
- [x] Emitir dictamen NO-GO y no abrir PR ni hacer merge.
- [x] H25-R1: desacoplar por completo `LoginExperience`.
- [x] H25-R2: migrar CSS concreto restante a CSS Modules; validacion visual pendiente en H25-R4.
- [x] H25-R3: consolidar modelos y campos duplicados.
- [ ] H25-R4: ejecutar regresion manual con servicios y roles reales.
- [ ] Repetir H25 y obtener GO antes de recomendar PR a `main`.
