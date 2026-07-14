/*
Validaciones de calidad de datos. Cada consulta debe devolver 0 filas o un conteo controlado.
*/

SELECT 'Productos sin requerimiento' AS Validacion, p.ProductoId, p.CodigoProducto
FROM bi.FactProducto p
LEFT JOIN bi.FactRequerimiento r ON r.RequerimientoId = p.RequerimientoId
WHERE r.RequerimientoId IS NULL;

SELECT 'Requerimientos duplicados' AS Validacion, CodigoRequerimiento, COUNT(*) AS Registros
FROM bi.FactRequerimiento
GROUP BY CodigoRequerimiento
HAVING COUNT(*) > 1;

SELECT 'Productos duplicados' AS Validacion, CodigoProducto, COUNT(*) AS Registros
FROM bi.FactProducto
WHERE EsEliminado = 0
GROUP BY CodigoProducto
HAVING COUNT(*) > 1;

SELECT 'Aprobaciones sin producto' AS Validacion, a.AprobacionId, a.ProductoId
FROM bi.FactAprobacion a
LEFT JOIN bi.FactProducto p ON p.ProductoId = a.ProductoId
WHERE p.ProductoId IS NULL;

SELECT 'Auditorias sin entidad' AS Validacion, h.EventoId, h.TipoEntidad, h.EntidadId
FROM bi.FactHistorialEstado h
WHERE h.EntidadId IS NULL;

SELECT 'Fechas inconsistentes requerimiento' AS Validacion, RequerimientoId, CodigoRequerimiento
FROM bi.FactRequerimiento
WHERE FechaFinEvento < FechaInicioEvento OR FechaSolicitud > FechaFinEvento;

SELECT 'Fecha evento anterior a solicitud' AS Validacion, RequerimientoId, CodigoRequerimiento
FROM bi.FactRequerimiento
WHERE FechaInicioEvento < FechaSolicitud;

SELECT 'Estados desconocidos requerimiento' AS Validacion, r.EstadoCodigo
FROM bi.FactRequerimiento r
LEFT JOIN bi.DimEstado e ON e.EstadoId = r.EstadoId
WHERE e.EstadoId IS NULL;

SELECT 'Estados desconocidos producto' AS Validacion, p.EstadoCodigo
FROM bi.FactProducto p
LEFT JOIN bi.DimEstado e ON e.EstadoId = p.EstadoId
WHERE e.EstadoId IS NULL;

SELECT 'Usuarios responsables inexistentes' AS Validacion, p.ResponsableProducto
FROM bi.FactProducto p
LEFT JOIN bi.DimUsuario u ON LOWER(u.Correo) = LOWER(p.ResponsableProducto) OR LOWER(u.Nombre) = LOWER(p.ResponsableProducto)
WHERE u.UsuarioId IS NULL AND p.EsEliminado = 0;

SELECT 'Requerimientos cerrados con productos pendientes' AS Validacion, r.RequerimientoId, r.CodigoRequerimiento
FROM bi.FactRequerimiento r
WHERE r.EsCompletado = 1
  AND EXISTS (
      SELECT 1 FROM bi.FactProducto p
      WHERE p.RequerimientoId = r.RequerimientoId AND p.EsEliminado = 0 AND p.EsAprobado = 0
  );

SELECT 'Productos aprobados sin evidencia' AS Validacion, p.ProductoId, p.CodigoProducto
FROM bi.FactProducto p
WHERE p.EsAprobado = 1
  AND NOT EXISTS (
      SELECT 1 FROM EvidenceDb.dbo.EvidenceItems e
      WHERE e.ActivityId = p.ProductoId AND ISNULL(e.IsDeleted, 0) = 0
  );

SELECT 'Encuestas asociadas a requerimientos no completados' AS Validacion, s.SatisfaccionId, s.RequerimientoId
FROM bi.FactSatisfaccion s
LEFT JOIN bi.FactRequerimiento r ON r.RequerimientoId = s.RequerimientoId
WHERE ISNULL(r.EsCompletado, 0) = 0;
