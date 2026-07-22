# Fase 7 - Acceso y canales publicos

## Prompt H21 - Login, recuperacion y cambio de clave

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend, rol Security
review y rol QA bajo las reglas de CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H16-H20 aprobados.
La identidad permanece local; no integrar Security API de PortalCorporativo.

Ejecuta H21 en tres incrementos:
A. frontend/app/login/page.tsx y sesion relacionada de app/lib.ts.
B. frontend/app/forgot-password/page.tsx.
C. frontend/app/change-password/page.tsx.

Antes de modificar:
- Documenta flujo de token, expiracion, localStorage/sessionStorage, logout,
  Microsoft 365 preparado, credenciales demo y redirecciones.
- Identifica riesgos XSS, exposicion de tokens, enumeracion de usuarios y mensajes.
- No cambies el protocolo backend.

Implementa:
- core/auth con modelos, session storage adapter, auth.service y hooks.
- features/auth con esquemas Zod y componentes LoginForm,
  ForgotPasswordForm y ChangePasswordForm.
- React Hook Form + Zod.
- Estados envio/error/exito, bloqueo de doble envio y mensajes accesibles.
- Pruebas de login valido/invalido, expiracion, logout, redireccion, recuperacion,
  cambio obligatorio y errores sin incluir secretos reales.

No cambies JWT, Azure AD, cookies, endpoints ni politicas backend. Cualquier mejora
de seguridad que requiera backend se registra como tarea separada/BLOCKED.

Criterios:
- Las tres page.tsx solo componen.
- Ningun token aparece en logs, errores o snapshots.
- pnpm test y pnpm build verdes tras cada incremento.
- Commits:
  refactor(frontend): modularizar autenticacion local
  refactor(frontend): modularizar recuperacion de acceso
  refactor(frontend): modularizar cambio de clave

Detente antes de H22.
```

## Prompt H22 - Formulario publico de requerimientos

```text
Actua con Coordinator, Solution Architect, Frontend, Security review y QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisitos: H12, H15 y H21 aprobados.
Mantener aislamiento de PortalCorporativo.

Ejecuta solo H22 sobre frontend/app/public-requirement/page.tsx y el formulario
publico embebido en Login si comparten comportamiento.

Implementa:
- features/public-requirement/models, schema, service, hook y components.
- PublicRequirementForm con React Hook Form + Zod.
- Selects dependientes Facultad/Carrera/Sede sin duplicar contratos.
- Regla pura y probada de ventana de activacion.
- Estado fuera de periodo, carga, envio, exito, error y prevencion de duplicados.
- Reutilizacion del mismo formulario en pagina completa y Login mediante props,
  no copias.
- Pruebas de catalogos dependientes, fechas limite, validaciones, envio y errores.

No agregues autenticacion al flujo publico ni cambies protecciones backend. Registra
como riesgo cualquier necesidad de CAPTCHA/rate limit que requiera backend.

Criterios:
- Una sola implementacion del formulario publico.
- page.tsx solo compone.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar formulario publico

Detente antes de H23.
```

## Prompt H23 - Encuesta de satisfaccion

```text
Actua con Coordinator Agent, Solution Architect Agent, Frontend, Security review
y QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H22 aprobado.
PortalCorporativo fuera de alcance.

Ejecuta solo H23 sobre frontend/app/satisfaction/[token]/page.tsx.

Implementa:
- features/satisfaction/models, schema, service, hook y components.
- SatisfactionForm con React Hook Form + Zod.
- Manejo explicito de token valido, invalido, usado, vencido y error de red.
- Estados carga, formulario, envio y confirmacion final.
- Accesibilidad de escalas/opciones y mensajes.
- Pruebas de estados del token, validaciones, envio unico y error API.

No decodifiques ni registres contenido sensible del token; no cambies firma,
endpoint ni reglas backend.

Criterios:
- satisfaction/[token]/page.tsx solo compone.
- Token no aparece en logs/snapshots.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): modularizar encuesta de satisfaccion

Detente antes de H24.
```
