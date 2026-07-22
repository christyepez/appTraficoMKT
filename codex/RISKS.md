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
| R-015 | `globals.css` conserva selectores históricos específicos de dominio que todavía tienen consumidores | Medio | H25 confirmó el remanente; H25-R2 debe migrarlo por módulo con regresión visual por ruta. |
| R-016 | `LoginExperience` conserva acceso HTTP, formulario nativo y overlays fuera de los patrones modulares | Alto | H25-R1: extraer servicio/hook, migrar chatbot a RHF+Zod y usar dialogs accesibles con pruebas integrales. |
| R-017 | Los estilos concretos de rutas restantes en `globals.css` pueden generar efectos laterales | Alto | H25-R2: migrar por feature con comparacion visual; bloquea GO. |
| R-018 | Persisten contratos y campos equivalentes duplicados entre features | Medio | H25-R3: consolidar `Technician`, `ExternalEvidencePayload` y dos `Field` locales sin crear abstracciones nuevas. |
| R-019 | La regresion integral no se ha ejecutado contra APIs, storage, roles y navegadores reales | Alto | H25-R4: ejecutar y firmar la matriz manual antes de PR o merge. |
