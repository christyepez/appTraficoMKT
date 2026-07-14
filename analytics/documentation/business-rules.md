# Reglas de negocio BI

1. Un requerimiento puede tener varios productos.
2. Todos los productos activos deben estar aprobados para cerrar el requerimiento.
3. Las aprobaciones pueden ser paralelas; en el modelo BI cada decision queda como fila en `FactAprobacion`.
4. Un rechazo devuelve el producto al tecnico; por eso se mide el rechazo desde aprobaciones/auditoria.
5. El tiempo pendiente de aprobacion no se contabiliza al tecnico.
6. El tiempo pendiente de aprobacion se contabiliza al aprobador.
7. Un producto rechazado vuelve a carga activa del tecnico.
8. Productos en `PendingApproval` cuentan como carga del aprobador.
9. La carga se pondera por tipo de producto, complejidad y horas estimadas usando `bi.ProductTypeWeights`.
10. No existe SLA contractual; los umbrales de aprobacion son administrativos y editables en `bi.ApprovalThresholds`.
11. Los registros abiertos y cerrados no se mezclan en promedios de duracion.
12. Registros abiertos calculan antiguedad hasta la fecha actual.
13. Registros cerrados calculan duracion hasta la fecha real de cierre o ultima actualizacion.
14. No hay RLS inicialmente; el reporte tiene visibilidad completa.
15. La actualizacion esperada es diaria.
16. Los historicos se conservan indefinidamente.
