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
| R-009 | La regresion de Productos aun no se ejecuto contra backend, almacenamiento y roles reales | Medio | Ejecutar la lista manual de `frontend/features/products/README.md` antes de fusionar a `main`. |
| R-010 | El JWT de la sesión local permanece accesible desde JavaScript en `localStorage` | Alto | BLOCKED frontend: migrar a cookie `HttpOnly`, `Secure` y `SameSite` requiere contrato y cambios backend; mantener CSP estricta y revisar XSS mientras tanto. |
| R-011 | Recuperación y login públicos pueden sufrir fuerza bruta o abuso automatizado | Alto | BLOCKED frontend: aplicar rate limit, telemetría, anti-enumeración efectiva y CAPTCHA adaptativo en backend/gateway. |
| R-012 | El formulario público puede recibir spam, automatización o envíos duplicados distribuidos | Alto | BLOCKED frontend: la interfaz evita doble clic local; CAPTCHA, rate limit, idempotencia y detección de abuso requieren backend/gateway. |
| R-013 | Los tokens HMAC de satisfacción actuales no incluyen fecha de expiración | Alto | BLOCKED frontend: incorporar expiración firmada y respuesta HTTP 410 requiere cambiar la generación y validación backend; el frontend ya contempla ese estado. |
| R-014 | La URL completa de satisfacción, incluido su token, se incorpora actualmente al payload de auditoría backend | Alto | BLOCKED frontend: sanear o excluir `satisfactionUrl` del evento de auditoría requiere un cambio en Requirements API. |
| R-015 | Regresion al retirar selectores historicos de dominio desde `globals.css` | Bajo | Mitigado por H25-R2: los estilos de dominio se movieron a CSS Modules; confirmar visualmente en H25-R4. |
| R-016 | Regresion en autenticacion o canales publicos al desacoplar `LoginExperience` | Bajo | Mitigado por H25-R1: servicio/hook, RHF+Zod y dialogs accesibles con pruebas automatizadas. |
| R-017 | Los estilos migrados desde `globals.css` pueden diferir visualmente por ruta | Medio | Mitigado en codigo por H25-R2; la regresion visual por ruta forma parte de H25-R4. |
| R-018 | Regresion de tipado al consolidar contratos y campos compartidos | Bajo | Mitigado por H25-R3 con modelos compartidos, `FormField` canonico, TypeScript y suite verde. |
| R-019 | La regresion integral no se ha ejecutado contra APIs, storage, roles y navegadores reales | Alto | H25-R4: ejecutar y firmar la matriz manual antes de PR o merge. |
