# Fase 6 - Configuracion operativa

## Prompt H17 - Marca y tema

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H16 aprobado.
La marca sigue siendo propia de appTraficoMKT; PortalCorporativo fuera de alcance.

Ejecuta solo H17 sobre frontend/app/branding/page.tsx y la parte de marca de
frontend/app/lib.ts. No redisenes otros modulos.

Discovery:
- Inventaria colores, gradientes, tipografia, logos, menu, header, periodos de
  activacion y opciones funcionales mezcladas con marca.
- Separa configuracion visual de banderas funcionales sin cambiar el contrato API.
- Presenta un mapa antes de modificar.

Implementa:
- features/branding/models, schemas, services, hooks y components.
- BrandForm seccionado con React Hook Form + Zod.
- ColorField, GradientEditor, TypographyEditor, LogoEditor y BrandPreview.
- useBrandSettings y servicio tipado sobre fetch.
- Aplicacion segura de variables CSS en core/branding o ubicacion equivalente.
- Vista previa que no contamine permanentemente el documento al cancelar.
- Pruebas de defaults, validaciones, preview, guardar/cancelar y error API.

No cambies identidad institucional ni valores por defecto sin documentar el valor
anterior y pedir aprobacion. No agregues biblioteca visual.

Criterios:
- branding/page.tsx solo compone.
- lib.ts pierde responsabilidades de marca que ya tengan destino claro.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar configuracion de marca

Detente antes de H18.
```

## Prompt H18 - Notificaciones y bitacoras

```text
Actua con Coordinator, Solution Architect, Frontend y QA segun CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H17 aprobado.
Notification API de PortalCorporativo fuera de alcance.

Ejecuta H18 como tres incrementos consecutivos, cada uno compilable, sin salir del
dominio de Notificaciones:
A. frontend/app/notifications/page.tsx.
B. frontend/app/my-notifications/page.tsx.
C. frontend/app/notification-log/page.tsx.

Implementa:
- features/notifications con models, schemas, services, hooks, components y utils.
- NotificationSettingsForm con React Hook Form + Zod.
- Editor visual/HTML/preview separado en componentes.
- Sanitizacion/aislamiento seguro de preview HTML segun el comportamiento actual.
- MyNotificationList y NotificationLog con filtros/paginacion compartidos.
- Servicios tipados sobre fetch y endpoints existentes.
- Estados carga/error/vacio, guardado y reintento.
- Pruebas de configuracion, cambio de modo, preview, listado personal, bitacora,
  filtros, paginacion y errores.

No cambies Power Automate, webhooks, backend ni envio real. No ejecutes mensajes.

Criterios:
- Las tres page.tsx solo componen.
- Plantillas no ejecutan scripts en preview.
- pnpm test y pnpm build verdes tras cada incremento.
- Commits:
  refactor(frontend): modularizar configuracion de notificaciones
  refactor(frontend): modularizar bandeja de notificaciones
  refactor(frontend): modularizar bitacora de notificaciones

Detente antes de H19.
```

## Prompt H19 - Almacenamiento

```text
Actua con Coordinator Agent, Solution Architect Agent, Frontend y QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H7 y H18 aprobados.
Content/File API de PortalCorporativo fuera de alcance.

Ejecuta solo H19 sobre frontend/app/storage/page.tsx.

Implementa:
- features/storage/models, schemas, services, hooks y components.
- Union discriminada Zod para Local, Blob y FTP.
- StorageSettingsForm que muestre solo campos del proveedor seleccionado.
- StorageProviderList y estados de activacion.
- useStorageSettings y servicio fetch tipado.
- Tratamiento seguro de secretos: nunca volver a mostrar valores sensibles ni
  persistirlos en localStorage/logs.
- Pruebas por proveedor, validaciones condicionales, edicion, error y secretos.

No pruebes conexiones reales ni modifiques infraestructura/backend. Si el API
expone secretos, registra riesgo sin ampliar alcance.

Criterios:
- storage/page.tsx solo compone.
- No hay secretos en pruebas, snapshots o mensajes.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar configuracion de almacenamiento

Detente antes de H20.
```

## Prompt H20 - Carga inicial

```text
Actua con Coordinator, Solution Architect, Frontend y QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H15, H16 y H19 aprobados.
PortalCorporativo fuera de alcance.

Ejecuta solo H20 sobre frontend/app/initial-import/page.tsx.

Implementa:
- features/initial-import/models, services, hooks, utils y components.
- ImportTypeSelector, TemplateDownloadList, ImportDropZone, ImportProgress,
  ImportResultSummary y detalle de errores.
- Validacion local de extension/tamano antes de enviar.
- Servicio fetch para multipart/form-data sin fijar Content-Type manualmente.
- Estados seleccion, carga, progreso disponible, exito parcial, error y reintento.
- Pruebas de plantilla seleccionada, archivo invalido, envio, resultado parcial y
  error API.

No cambies plantillas XLSX, parser backend, semillas ni datos. No hagas cargas
reales durante pruebas automatizadas.

Criterios:
- initial-import/page.tsx solo compone.
- Errores por fila son legibles y accesibles.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar carga inicial

Detente antes de H21.
```
