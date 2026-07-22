# Riesgos de refactorizacion frontend

| ID | Riesgo | Nivel | Tratamiento |
|---|---|---:|---|
| R-001 | Regresion del workflow de Productos | Alto | Extraccion incremental y pruebas de todos los estados. |
| R-002 | Contratos duplicados entre `app`, `shared` y `features` | Alto | Definir una unica fuente canonica y reexportar temporalmente. |
| R-003 | Solicitudes superpuestas por polling | Medio | Mitigado en Productos mediante una solicitud de carga activa y bloqueo por producto; replicar el patron al migrar otros modulos. |
| R-004 | CSS global con efectos laterales | Medio | CSS Modules y promocion a global solo al segundo uso. |
| R-005 | Abstracciones prematuras | Medio | Exigir dos consumidores antes de mover a `shared`. |
| R-006 | Next.js 16.0.8 reportado con vulnerabilidad | Alto | Mantener version por decision actual y evaluar un parche seguro de Next.js 16 en una tarea separada. |
| R-007 | Convergencia futura con PortalCorporativo | Medio | ADR-001 y nueva iniciativa antes de cualquier integracion. |
| R-008 | Paginas legacy incumplen reglas nuevas de hooks de React | Medio | Excepcion limitada a `app/**/*.tsx`; retirar por modulo al migrar cada pagina. Los modulos nuevos mantienen las reglas activas. |
