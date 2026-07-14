# Diccionario de datos BI

## Dimensiones

| Vista | Grano | Campos principales |
| --- | --- | --- |
| `bi.DimFecha` | Un dia | `FechaKey`, `Anio`, `MesNumero`, `Mes`, `Trimestre`, `AnioMes`, `EsFinDeSemana`, `EsFeriado` |
| `bi.DimUsuario` | Un usuario | `UsuarioId`, `Nombre`, `Correo`, `Roles`, `EsActivo`, `UltimoIngresoUtc` |
| `bi.DimFacultad` | Una facultad | `FacultadId`, `Codigo`, `Facultad`, `EsActivo` |
| `bi.DimSede` | Una sede | `SedeId`, `Codigo`, `Sede`, `EsActivo` |
| `bi.DimCarrera` | Una carrera | `CarreraId`, `Codigo`, `Carrera`, `FacultadId`, `EsActivo` |
| `bi.DimEstado` | Un estado | `EstadoId`, `TipoEstado`, `Codigo`, `Estado` |
| `bi.DimTipoRequerimiento` | Tipo de requerimiento | `TipoRequerimientoId`, `Codigo`, `TipoRequerimiento` |
| `bi.DimTipoProducto` | Tipo de producto | `TipoProductoId`, `TipoProducto`, `Complejidad`, `HorasEstimadas`, `PesoOperativo`, `EsPesoDemo` |
| `bi.DimCanalDifusion` | Canal de difusion | `CanalDifusionId`, `CanalDifusion` |
| `bi.DimPublicoObjetivo` | Publico objetivo | `PublicoObjetivoId`, `PublicoObjetivo` |
| `bi.DimKpi` | KPI principal | `KpiId`, `KpiPrincipal` |
| `bi.DimComplejidad` | Complejidad parametrizada | `Complejidad`, `HorasEstimadas`, `PesoOperativo`, `EsDemo` |
| `bi.DimCanalOrigen` | Evento de notificacion | `CanalOrigen`, `Registros` |

## Hechos

| Vista | Grano | Campos principales |
| --- | --- | --- |
| `bi.FactRequerimiento` | Un requerimiento | Codigo, solicitante, sede, facultad, carrera, fechas, estado, ciclo, antiguedad, anticipacion |
| `bi.FactProducto` | Un producto | Codigo producto, requerimiento, tipo, canal, KPI, responsable, estado, horas tecnicas, horas aprobacion, peso |
| `bi.FactAprobacion` | Una decision de aprobacion | Producto, aprobador, decision, comentarios, fecha, version por aprobador |
| `bi.FactHistorialEstado` | Un evento de auditoria | Entidad, tipo, estado anterior, estado nuevo, accion, usuario, payload JSON, fecha |
| `bi.FactSatisfaccion` | Una respuesta de encuesta | Requerimiento, calificaciones, recomendacion, comentarios, fecha |
| `bi.FactUsoUsuario` | Un usuario con agregados de uso | Ultimo ingreso, notificaciones recibidas/leidas, actividad reciente |
| `bi.FactKpiResultado` | KPI por productos | Total productos, aprobados, pendientes, carga ponderada |

## Campos faltantes propuestos

- `HorasEstimadas` en producto o parametrizacion formal de tipo de producto.
- `ComplejidadId` en producto o tipo de producto.
- `PesoOperativo` administrable.
- Version formal de aprobacion por producto.
- Tabla de sesiones de usuario para usabilidad detallada.
