# Historia del reporte Power BI

El reporte `AppTraficoMKT.BI` esta organizado para que la direccion pueda leer primero el estado general y luego bajar al seguimiento operativo sin perder contexto.

## 1. Portada ejecutiva

Resume la salud de la operacion: requerimientos abiertos, productos en proceso, productos en aprobacion, productos aprobados, satisfaccion promedio y alertas de riesgo. Esta pagina responde donde debe poner atencion la direccion hoy.

## 2. Resumen gerencial

Muestra la demanda institucional y el cierre: volumen por mes, sede, facultad, carrera y estado. Permite ver si la operacion crece, se estabiliza o acumula pendientes.

## 3. Captacion e impacto

Relaciona requerimientos, productos, publico objetivo, canales y KPI principal para medir incidencia sobre captacion, posicionamiento y fidelizacion institucional.

## 4. Carga operativa

Presenta carga por responsable tecnico, estado, tipo de producto y fecha de entrega. Sirve para redistribuir trabajo y anticipar saturacion.

## 5. Atencion y tiempos

Cuenta el tiempo de gestion por etapa: asignacion, ejecucion, aprobacion y ciclo total. Identifica cuellos de botella y requerimientos sin actividad reciente.

## 6. Aprobaciones

Da seguimiento a productos pendientes, aprobados y rechazados, incluyendo versiones enviadas, adjuntos, aprobador, decision, comentario y tiempo de respuesta.

## 7. Satisfaccion

Integra la respuesta del solicitante al finalizar el requerimiento. Permite cruzar satisfaccion con tiempos, sede, facultad, tipo de evento y comentarios.

## 8. Usabilidad

Mide el uso de la aplicacion por usuario, rol, proceso y fecha. Ayuda a detectar adopcion, usuarios sin actividad, acciones frecuentes y confirmacion de notificaciones.

## 9. Detalle operativo

Concentra el detalle auditable para seguimiento: requerimientos, productos, responsables, aprobadores, estados, adjuntos, fechas y auditorias.

## Notas de implementacion

- Las pestanas PBIR se mantienen con definicion minima para evitar errores de compatibilidad al abrir el proyecto en Power BI Desktop.
- El archivo `AppTraficoMKT.BI.Report/pages/report-story.json` contiene el diseno detallado de graficas, filtros y decisiones esperadas por pagina.
- El modelo semantico usa conexion SQL Server DirectQuery mediante los parametros `ServerName`, `DatabaseName` y `EnvironmentName`.
