# Fase 5 - Administracion

## Prompt H15 - Catalogos y administracion

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H6 y H12 aprobados.
PortalCorporativo y su Catalog API estan fuera de alcance.

Ejecuta exclusivamente H15 sobre frontend/app/admin/page.tsx.

Discovery:
- Identifica facultades, sedes, carreras, aprobadores, catalogos dinamicos y sus
  relaciones.
- Separa contratos, configuracion de grupos y comportamiento CRUD.
- Presenta plan, riesgos y archivos permitidos.

Implementa:
- features/administration/models, schemas, services, utils, hooks y components.
- CatalogGroupSelector, CatalogList, CatalogForm y ApproverForm.
- React Hook Form + Zod para cada variante.
- useCatalogAdministration para carga y CRUD.
- Servicio tipado sobre fetch.
- Confirmaciones, errores por duplicidad, estados carga/vacio y paginacion.
- Pruebas por tipo de catalogo, relaciones, alta, edicion, activacion y error API.

No cambies seeds, contratos backend ni importacion inicial.

Criterios:
- admin/page.tsx solo compone.
- Formularios no mezclan variantes sin una union discriminada tipada.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar administracion de catalogos

Detente antes de H16.
```

## Prompt H16 - Usuarios y permisos visibles

```text
Actua con Coordinator, Solution Architect, Frontend y QA de CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H15 aprobado.
La identidad sigue siendo propia de appTraficoMKT; no integrar PortalCorporativo.

Ejecuta solo H16 sobre frontend/app/users/page.tsx.

Implementa:
- features/users/models, schemas, services, hooks y components.
- UserForm con React Hook Form + Zod.
- RoleSelector, ScreenPermissionSelector, UserList y UserStatusActions.
- useUsersAdministration.
- Servicio tipado sobre fetch y endpoints existentes.
- Normalizacion central de roles/pantallas sin mover seguridad al frontend.
- Estados carga/error/vacio, confirmaciones y bloqueo de doble envio.
- Pruebas de alta/edicion, roles, pantallas, activacion, validaciones y errores.

No cambies JWT, autenticacion backend, politicas ni permisos efectivos.

Criterios:
- users/page.tsx solo compone.
- La documentacion distingue visibilidad UI de autorizacion backend.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar administracion de usuarios

Detente antes de H17.
```
