# Diagrama del modelo BI

```mermaid
erDiagram
    DimFecha ||--o{ FactRequerimiento : "Fecha solicitud"
    DimFacultad ||--o{ FactRequerimiento : "facultad"
    DimSede ||--o{ FactRequerimiento : "sede"
    FactRequerimiento ||--o{ FactProducto : "productos"
    DimTipoRequerimiento ||--o{ FactProducto : "tipo requerimiento"
    DimTipoProducto ||--o{ FactProducto : "tipo producto"
    DimCanalDifusion ||--o{ FactProducto : "canal"
    DimPublicoObjetivo ||--o{ FactProducto : "publico"
    DimKpi ||--o{ FactProducto : "kpi"
    FactProducto ||--o{ FactAprobacion : "decisiones"
    FactRequerimiento ||--o{ FactSatisfaccion : "encuesta"
    FactRequerimiento ||--o{ FactHistorialEstado : "auditoria requerimiento"
    FactProducto ||--o{ FactHistorialEstado : "auditoria producto"
    DimUsuario ||--o{ FactUsoUsuario : "uso"
```

## Relacionamiento

- `FactProducto.RequerimientoId` -> `FactRequerimiento.RequerimientoId`.
- `FactAprobacion.ProductoId` -> `FactProducto.ProductoId`.
- `FactSatisfaccion.RequerimientoId` -> `FactRequerimiento.RequerimientoId`.
- `FactRequerimiento.FacultadId` -> `DimFacultad.FacultadId`.
- `FactRequerimiento.SedeId` -> `DimSede.SedeId`.
- `FactProducto.TipoProductoId` -> `DimTipoProducto.TipoProductoId`.

Evitar muchos a muchos. Si se formalizan aprobadores multiples por version, crear tabla puente o hecho granular `Producto-Version-Aprobador`.
