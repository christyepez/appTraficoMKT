# Inventario analitico App Trafico MKT

Fecha de inventario: 2026-07-14.

## Fuentes reales identificadas

El repositorio implementa microservicios con bases SQL Server logicas separadas. No se modifican tablas transaccionales para esta version BI.

| Base | Servicio | DbContext | Tablas reales principales |
| --- | --- | --- | --- |
| RequirementsDb | `Requirements.Api` | `RequirementsDbContext` | `Requirements`, `CatalogReferences`, `RequirementAuditEvents`, `RequirementSatisfactionResponses` |
| ActivitiesDb | `Activities.Api` | `ActivitiesDbContext` | `Activities`, `CatalogReferences`, `ActivityAuditEvents`, `NotificationSettings`, `NotificationRecords` |
| EvidenceDb | `Evidence.Api` | `EvidenceDbContext` | `EvidenceItems`, `Approvals`, `ApprovalAuditEvents`, `StorageSettings` |
| IdentityDb | `Identity.Api` | `IdentityDbContext` | `Users`, `BrandSettings` |
| AdministrationDb | `Administration.Api` | `AdministrationDbContext` | `Faculties`, `Campuses`, `Careers`, `CatalogItems`, `Approvers`, `InitialImportRuns` |

## Entidades y campos relevantes

### Requerimientos

Tabla real: `RequirementsDb.dbo.Requirements`.

Campos reales usados: `Id`, `Code`, `ActivityOrEvent`, `RequestedBy`, `FacultyId`, `Faculty`, `Career`, `CampusId`, `Campus`, `Place`, `StartDate`, `EndDate`, `EventObjective`, `EventFormatId`, `EventFormat`, `RequestDate`, `Status`, `StatusId`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`, `DeletedBy`.

Estados reales: `Draft`, `InAnalysis`, `InExecution`, `PendingApproval`, `Completed`, `Rejected`.

Regla real: un requerimiento se completa cuando todos sus productos activos estan aprobados.

### Productos

Tabla real: `ActivitiesDb.dbo.Activities`.

Campos reales usados: `Id`, `RequirementId`, `ProductId`, `RequirementTypeId`, `RequirementType`, `StrategicObjective`, `TargetAudienceId`, `TargetAudience`, `ProductTypeId`, `ProductType`, `DiffusionChannelId`, `DiffusionChannel`, `MainKpiId`, `MainKpi`, `ProductResponsible`, `ProductDeliveryDate`, `Status`, `StatusId`, `Observations`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`, `DeletedBy`.

Estados reales: `Todo`, `InProgress`, `EvidenceAttached`, `PendingApproval`, `Approved`, `Rejected`.

Nota: la migracion actual convierte registros `Rejected` a `InProgress`; por eso los rechazos historicos se calculan desde `EvidenceDb.dbo.Approvals` y `EvidenceDb.dbo.ApprovalAuditEvents`.

### Aprobaciones y evidencias

Tablas reales: `EvidenceDb.dbo.Approvals`, `EvidenceDb.dbo.ApprovalAuditEvents`, `EvidenceDb.dbo.EvidenceItems`.

Campos reales de aprobacion: `Id`, `ActivityId`, `Decision`, `ApprovedBy`, `Comments`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`, `DeletedBy`.

Campos reales de evidencia: `Id`, `ActivityId`, `FileName`, `ContentType`, `StorageUrl`, `UploadedBy`, `CreatedAt`, `UpdatedAt`, `IsDeleted`, `DeletedAt`, `DeletedBy`.

### Usuarios y uso

Tabla real: `IdentityDb.dbo.Users`.

Campos reales usados: `Id`, `Name`, `Email`, `AuthProvider`, `AllowMicrosoftLogin`, `Roles`, `ScreenPermissions`, `FacultyId`, `CampusId`, `MenuMode`, `MenuCollapsed`, `IsActive`, `MustChangePassword`, `LastLoginAt`, `PasswordResetAt`.

### Catalogos

Catalogos maestros reales:

- `AdministrationDb.dbo.Faculties`
- `AdministrationDb.dbo.Campuses`
- `AdministrationDb.dbo.Careers`
- `AdministrationDb.dbo.CatalogItems`
- `AdministrationDb.dbo.Approvers`

Catalogos replicados por servicio:

- `RequirementsDb.dbo.CatalogReferences`
- `ActivitiesDb.dbo.CatalogReferences`

## Endpoints de metricas existentes

- `GET /requirements/metrics`
- `GET /activities/metrics`
- `GET /approvals/metrics`
- `GET /usage-metrics`

Decision: el Power BI se conectara a SQL Server mediante vistas `bi` y no a endpoints HTTP, para consolidar historicos, auditorias y relaciones entre bases.

## Calculos corregidos

Los endpoints actuales calculan promedios mezclando abiertos y completados con `UpdatedAt ?? now`. En BI se separan:

- Registros completados: duracion hasta fecha real de cierre detectada por auditoria o `UpdatedAt`.
- Registros abiertos: antiguedad hasta `SYSUTCDATETIME()`.

## Campos faltantes en la aplicacion

Estos campos no existen actualmente y se documentan como propuesta, sin inventar valores productivos:

- `HorasEstimadas` por producto.
- `ComplejidadId` o complejidad parametrizada por tipo de producto.
- `PesoOperativo` por tipo de producto.
- Calendario de feriados administrable en la aplicacion.
- Relacion explicita producto-version-aprobador para aprobaciones paralelas multiples; hoy `Approvals` registra decisiones por producto y aprobador, pero no existe entidad formal de version.
- Registro de sesiones/actividad fina de usuario; hoy solo existe `LastLoginAt`, por eso usabilidad es una primera aproximacion.
