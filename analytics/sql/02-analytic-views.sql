/*
Vistas analiticas App Trafico MKT.
Ejecutar despues de 00-create-bi-schema.sql y 01-working-time.sql.
Contexto recomendado: RequirementsDb, con acceso cross database a ActivitiesDb, EvidenceDb, IdentityDb y AdministrationDb.
*/

CREATE OR ALTER VIEW bi.DimFecha AS
WITH n AS (
    SELECT TOP (3653) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) - 1 AS i
    FROM sys.all_objects a CROSS JOIN sys.all_objects b
),
d AS (
    SELECT DATEADD(day, i, CONVERT(date, '2024-01-01')) AS Fecha
    FROM n
)
SELECT
    Fecha AS FechaKey,
    YEAR(Fecha) AS Anio,
    MONTH(Fecha) AS MesNumero,
    DATENAME(month, Fecha) AS Mes,
    DAY(Fecha) AS Dia,
    DATEPART(quarter, Fecha) AS Trimestre,
    FORMAT(Fecha, 'yyyy-MM') AS AnioMes,
    CASE WHEN DATEPART(weekday, Fecha) IN (1, 7) THEN 1 ELSE 0 END AS EsFinDeSemana,
    CASE WHEN h.HolidayDate IS NULL THEN 0 ELSE 1 END AS EsFeriado
FROM d
LEFT JOIN bi.Holidays h ON h.HolidayDate = d.Fecha AND h.IsActive = 1;
GO

CREATE OR ALTER VIEW bi.DimUsuario AS
SELECT
    u.Id AS UsuarioId,
    u.Name AS Nombre,
    u.Email AS Correo,
    u.AuthProvider AS ProveedorAutenticacion,
    u.Roles,
    u.ScreenPermissions AS PermisosPantalla,
    u.IsActive AS EsActivo,
    u.AllowMicrosoftLogin AS PermiteOffice365,
    u.LastLoginAt AS UltimoIngresoUtc,
    u.FacultyId,
    u.CampusId
FROM IdentityDb.dbo.Users u;
GO

CREATE OR ALTER VIEW bi.DimFacultad AS
SELECT Id AS FacultadId, Code AS Codigo, Name AS Facultad, IsActive AS EsActivo, CreatedAt
FROM AdministrationDb.dbo.Faculties;
GO

CREATE OR ALTER VIEW bi.DimSede AS
SELECT Id AS SedeId, Code AS Codigo, Name AS Sede, IsActive AS EsActivo, CreatedAt
FROM AdministrationDb.dbo.Campuses;
GO

CREATE OR ALTER VIEW bi.DimCarrera AS
SELECT c.Id AS CarreraId, c.Code AS Codigo, c.Name AS Carrera, c.FacultyId AS FacultadId, c.IsActive AS EsActivo, c.CreatedAt
FROM AdministrationDb.dbo.Careers c;
GO

CREATE OR ALTER VIEW bi.DimCatalogo AS
SELECT Id AS CatalogoId, Type AS TipoCatalogo, Code AS Codigo, Name AS Nombre, IsActive AS EsActivo, CreatedAt
FROM AdministrationDb.dbo.CatalogItems;
GO

CREATE OR ALTER VIEW bi.DimEstado AS
SELECT Id AS EstadoId, Type AS TipoEstado, Code AS Codigo, Name AS Estado, IsActive AS EsActivo
FROM RequirementsDb.dbo.CatalogReferences
WHERE Type = 'EstadoRequerimiento'
UNION ALL
SELECT Id, Type, Code, Name, IsActive
FROM ActivitiesDb.dbo.CatalogReferences
WHERE Type = 'EstadoProducto';
GO

CREATE OR ALTER VIEW bi.DimTipoRequerimiento AS
SELECT CatalogoId AS TipoRequerimientoId, Codigo, Nombre AS TipoRequerimiento, EsActivo
FROM bi.DimCatalogo
WHERE TipoCatalogo = 'TipoRequerimiento';
GO

CREATE OR ALTER VIEW bi.DimTipoProducto AS
SELECT
    c.CatalogoId AS TipoProductoId,
    c.Codigo,
    c.Nombre AS TipoProducto,
    COALESCE(w.Complexity, N'Sin parametrizar') AS Complejidad,
    COALESCE(w.EstimatedHours, 0) AS HorasEstimadas,
    COALESCE(w.Weight, 1) AS PesoOperativo,
    COALESCE(w.IsDemo, 0) AS EsPesoDemo,
    c.EsActivo
FROM bi.DimCatalogo c
LEFT JOIN bi.ProductTypeWeights w ON w.ProductType = c.Nombre
WHERE c.TipoCatalogo = 'TipoProducto';
GO

CREATE OR ALTER VIEW bi.DimCanalDifusion AS
SELECT CatalogoId AS CanalDifusionId, Codigo, Nombre AS CanalDifusion, EsActivo
FROM bi.DimCatalogo
WHERE TipoCatalogo = 'CanalDifusion';
GO

CREATE OR ALTER VIEW bi.DimPublicoObjetivo AS
SELECT CatalogoId AS PublicoObjetivoId, Codigo, Nombre AS PublicoObjetivo, EsActivo
FROM bi.DimCatalogo
WHERE TipoCatalogo = 'PublicoObjetivo';
GO

CREATE OR ALTER VIEW bi.DimKpi AS
SELECT CatalogoId AS KpiId, Codigo, Nombre AS KpiPrincipal, EsActivo
FROM bi.DimCatalogo
WHERE TipoCatalogo = 'KpiPrincipal';
GO

CREATE OR ALTER VIEW bi.DimComplejidad AS
SELECT DISTINCT Complexity AS Complejidad, EstimatedHours AS HorasEstimadas, Weight AS PesoOperativo, IsDemo AS EsDemo
FROM bi.ProductTypeWeights;
GO

CREATE OR ALTER VIEW bi.DimCanalOrigen AS
SELECT EventType AS CanalOrigen, COUNT_BIG(*) AS Registros
FROM ActivitiesDb.dbo.NotificationRecords
GROUP BY EventType;
GO

CREATE OR ALTER VIEW bi.FactRequerimiento AS
WITH cierre AS (
    SELECT RequirementId, MIN(OccurredAt) AS FechaCierreUtc
    FROM RequirementsDb.dbo.RequirementAuditEvents
    WHERE ToStatus IN ('Completed', 'Rejected')
    GROUP BY RequirementId
)
SELECT
    r.Id AS RequerimientoId,
    r.Code AS CodigoRequerimiento,
    r.ActivityOrEvent AS ActividadEvento,
    r.RequestedBy AS Solicitante,
    r.FacultyId AS FacultadId,
    r.Career AS CarreraTexto,
    r.CampusId AS SedeId,
    r.Place AS Lugar,
    r.StartDate AS FechaInicioEvento,
    r.EndDate AS FechaFinEvento,
    r.RequestDate AS FechaSolicitud,
    r.EventFormatId AS FormatoEventoId,
    r.EventFormat AS FormatoEvento,
    r.StatusId AS EstadoId,
    r.Status AS EstadoCodigo,
    r.CreatedAt AS CreadoUtc,
    r.UpdatedAt AS ActualizadoUtc,
    c.FechaCierreUtc,
    r.IsDeleted AS EsEliminado,
    CASE WHEN r.Status IN ('Completed', 'Rejected') THEN 1 ELSE 0 END AS EsFinalizado,
    CASE WHEN r.Status = 'Completed' THEN 1 ELSE 0 END AS EsCompletado,
    CASE WHEN r.Status = 'Rejected' THEN 1 ELSE 0 END AS EsRechazado,
    DATEDIFF(day, r.RequestDate, r.StartDate) AS DiasAnticipacion,
    bi.fn_WorkingMinutes(r.CreatedAt, COALESCE(c.FechaCierreUtc, r.UpdatedAt, SYSDATETIMEOFFSET())) / 60.0 AS HorasLaborablesCiclo,
    bi.fn_WorkingMinutes(r.CreatedAt, SYSDATETIMEOFFSET()) / 60.0 AS HorasLaborablesAntiguedad
FROM RequirementsDb.dbo.Requirements r
LEFT JOIN cierre c ON c.RequirementId = r.Id;
GO

CREATE OR ALTER VIEW bi.FactProducto AS
WITH approval_sent AS (
    SELECT ActivityId, MIN(OccurredAt) AS FechaEnvioAprobacionUtc
    FROM ActivitiesDb.dbo.ActivityAuditEvents
    WHERE ToStatus = 'PendingApproval'
    GROUP BY ActivityId
),
first_start AS (
    SELECT ActivityId, MIN(OccurredAt) AS FechaInicioTecnicoUtc
    FROM ActivitiesDb.dbo.ActivityAuditEvents
    WHERE ToStatus IN ('InProgress', 'EvidenceAttached')
    GROUP BY ActivityId
),
last_approval AS (
    SELECT ActivityId, MAX(CreatedAt) AS FechaUltimaDecisionUtc,
           MAX(CASE WHEN Decision = 'Rejected' THEN 1 ELSE 0 END) AS TieneRechazo,
           MAX(CASE WHEN Decision = 'Approved' THEN 1 ELSE 0 END) AS TieneAprobacion
    FROM EvidenceDb.dbo.Approvals
    WHERE ISNULL(IsDeleted, 0) = 0
    GROUP BY ActivityId
)
SELECT
    a.Id AS ProductoId,
    a.RequirementId AS RequerimientoId,
    a.ProductId AS CodigoProducto,
    a.RequirementTypeId AS TipoRequerimientoId,
    a.RequirementType AS TipoRequerimientoTexto,
    a.TargetAudienceId AS PublicoObjetivoId,
    a.TargetAudience AS PublicoObjetivoTexto,
    a.ProductTypeId AS TipoProductoId,
    a.ProductType AS TipoProductoTexto,
    a.DiffusionChannelId AS CanalDifusionId,
    a.DiffusionChannel AS CanalDifusionTexto,
    a.MainKpiId AS KpiId,
    a.MainKpi AS KpiTexto,
    a.ProductResponsible AS ResponsableProducto,
    a.ProductDeliveryDate AS FechaEntregaProducto,
    a.StatusId AS EstadoId,
    a.Status AS EstadoCodigo,
    a.CreatedAt AS CreadoUtc,
    a.UpdatedAt AS ActualizadoUtc,
    s.FechaInicioTecnicoUtc,
    ps.FechaEnvioAprobacionUtc,
    la.FechaUltimaDecisionUtc,
    a.IsDeleted AS EsEliminado,
    CASE WHEN a.Status = 'Approved' THEN 1 ELSE 0 END AS EsAprobado,
    CASE WHEN COALESCE(la.TieneRechazo, 0) = 1 AND a.Status <> 'Approved' THEN 1 ELSE 0 END AS EsEnCorreccion,
    CASE WHEN a.Status = 'PendingApproval' THEN 1 ELSE 0 END AS EsPendienteAprobacion,
    CASE WHEN a.Status IN ('Todo', 'InProgress', 'EvidenceAttached') THEN 1 ELSE 0 END AS EsCargaTecnica,
    COALESCE(w.EstimatedHours, 0) AS HorasEstimadas,
    COALESCE(w.Weight, 1) AS PesoOperativo,
    COALESCE(w.Complexity, N'Sin parametrizar') AS Complejidad,
    bi.fn_WorkingMinutes(COALESCE(s.FechaInicioTecnicoUtc, a.CreatedAt), COALESCE(ps.FechaEnvioAprobacionUtc, a.UpdatedAt, SYSDATETIMEOFFSET())) / 60.0 AS HorasTecnicasLaborables,
    bi.fn_WorkingMinutes(ps.FechaEnvioAprobacionUtc, COALESCE(la.FechaUltimaDecisionUtc, SYSDATETIMEOFFSET())) / 60.0 AS HorasAprobacionLaborables
FROM ActivitiesDb.dbo.Activities a
LEFT JOIN first_start s ON s.ActivityId = a.Id
LEFT JOIN approval_sent ps ON ps.ActivityId = a.Id
LEFT JOIN last_approval la ON la.ActivityId = a.Id
LEFT JOIN bi.ProductTypeWeights w ON w.ProductType = a.ProductType;
GO

CREATE OR ALTER VIEW bi.FactAprobacion AS
SELECT
    ap.Id AS AprobacionId,
    ap.ActivityId AS ProductoId,
    act.RequirementId AS RequerimientoId,
    act.ProductId AS CodigoProducto,
    ap.Decision AS Decision,
    ap.ApprovedBy AS Aprobador,
    ap.Comments AS Comentarios,
    ap.CreatedAt AS FechaDecisionUtc,
    ROW_NUMBER() OVER (PARTITION BY ap.ActivityId, ap.ApprovedBy ORDER BY ap.CreatedAt) AS VersionAprobacion,
    CASE WHEN ap.Decision = 'Approved' THEN 1 ELSE 0 END AS EsAprobado,
    CASE WHEN ap.Decision = 'Rejected' THEN 1 ELSE 0 END AS EsRechazado
FROM EvidenceDb.dbo.Approvals ap
LEFT JOIN ActivitiesDb.dbo.Activities act ON act.Id = ap.ActivityId
WHERE ISNULL(ap.IsDeleted, 0) = 0;
GO

CREATE OR ALTER VIEW bi.FactHistorialEstado AS
SELECT
    Id AS EventoId,
    RequirementId AS EntidadId,
    RequirementId AS RequerimientoId,
    CAST(NULL AS uniqueidentifier) AS ProductoId,
    N'Requerimiento' AS TipoEntidad,
    FromStatus AS EstadoAnterior,
    ToStatus AS EstadoNuevo,
    Action AS Accion,
    PerformedBy AS RealizadoPor,
    Comments AS PayloadJson,
    OccurredAt AS FechaEventoUtc
FROM RequirementsDb.dbo.RequirementAuditEvents
UNION ALL
SELECT
    Id,
    ActivityId,
    RequirementId,
    ActivityId,
    N'Producto',
    FromStatus,
    ToStatus,
    Action,
    PerformedBy,
    Comments,
    OccurredAt
FROM ActivitiesDb.dbo.ActivityAuditEvents
UNION ALL
SELECT
    Id,
    ActivityId,
    CAST(NULL AS uniqueidentifier),
    ActivityId,
    N'Aprobacion',
    CAST(NULL AS nvarchar(32)),
    Decision,
    Action,
    PerformedBy,
    PayloadJson,
    OccurredAt
FROM EvidenceDb.dbo.ApprovalAuditEvents;
GO

CREATE OR ALTER VIEW bi.FactSatisfaccion AS
SELECT
    s.Id AS SatisfaccionId,
    s.RequirementId AS RequerimientoId,
    r.FacultyId AS FacultadId,
    r.CampusId AS SedeId,
    s.OverallRating AS SatisfaccionGeneral,
    s.TimelinessRating AS CumplimientoTiempo,
    s.QualityRating AS Calidad,
    CASE WHEN s.WouldRecommend = 1 THEN 1 ELSE 0 END AS Recomienda,
    s.Comments AS Comentarios,
    s.SubmittedAt AS FechaRespuestaUtc
FROM RequirementsDb.dbo.RequirementSatisfactionResponses s
LEFT JOIN RequirementsDb.dbo.Requirements r ON r.Id = s.RequirementId;
GO

CREATE OR ALTER VIEW bi.FactUsoUsuario AS
SELECT
    u.Id AS UsuarioId,
    u.Email AS Correo,
    u.Name AS Nombre,
    u.Roles,
    u.IsActive AS EsActivo,
    u.LastLoginAt AS UltimoIngresoUtc,
    CASE WHEN u.LastLoginAt >= DATEADD(day, -7, SYSDATETIMEOFFSET()) THEN 1 ELSE 0 END AS IngresoUltimos7Dias,
    DATEDIFF(hour, u.LastLoginAt, SYSDATETIMEOFFSET()) AS HorasDesdeUltimoIngreso,
    COUNT(n.Id) AS NotificacionesRecibidas,
    SUM(CASE WHEN n.IsAcknowledged = 1 THEN 1 ELSE 0 END) AS NotificacionesLeidas
FROM IdentityDb.dbo.Users u
LEFT JOIN ActivitiesDb.dbo.NotificationRecords n
    ON n.RecipientEmail = u.Email OR n.RecipientEmail = u.Name OR n.RecipientEmail = 'todos'
GROUP BY u.Id, u.Email, u.Name, u.Roles, u.IsActive, u.LastLoginAt;
GO

CREATE OR ALTER VIEW bi.FactKpiResultado AS
SELECT
    p.KpiId,
    p.KpiTexto,
    COUNT_BIG(*) AS TotalProductos,
    SUM(CASE WHEN p.EsAprobado = 1 THEN 1 ELSE 0 END) AS ProductosAprobados,
    SUM(CASE WHEN p.EsPendienteAprobacion = 1 THEN 1 ELSE 0 END) AS ProductosPendientesAprobacion,
    SUM(p.PesoOperativo) AS CargaPonderada
FROM bi.FactProducto p
GROUP BY p.KpiId, p.KpiTexto;
GO
