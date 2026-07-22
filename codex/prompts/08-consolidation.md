# Fase 8 - Consolidacion y cierre

## Prompt H24 - Navegacion, layout, shared/core y CSS global

```text
Actua con Coordinator Agent y Solution Architect Agent. Ejecuta roles Frontend y
QA bajo sus decisiones.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H1-H23 aprobados.
PortalCorporativo permanece fuera de alcance.

Ejecuta solo H24. Archivos principales:
- frontend/app/nav.tsx
- frontend/app/layout.tsx
- frontend/app/globals.css
- frontend/app/lib.ts
- frontend/shared y frontend/core creados durante los hitos.

Discovery obligatorio:
- Inventaria responsabilidades restantes de lib.ts, nav.tsx y globals.css.
- Encuentra duplicaciones reales entre al menos dos modulos.
- Presenta matriz KEEP/MOVE/MERGE/DELETE antes de modificar.

Implementa:
- core/api, core/auth, core/configuration y core/permissions solo donde exista
  comportamiento transversal comprobado.
- shared/components para controles usados por dos o mas modulos.
- shared/utils/models/hooks con el mismo criterio.
- AppNav dividido en shell, menu, perfil y notificaciones cuando corresponda.
- Layout accesible y consistente.
- Tokens/patrones globales consolidados; estilos especificos permanecen en CSS
  Modules de cada funcionalidad.
- Eliminacion segura de duplicados con pruebas existentes como red de proteccion.
- Pruebas de menu por roles/pantallas, colapso, responsive, sesion y tema.

No crees un framework interno ni abstracciones con un solo consumidor. No cambies
marca, permisos backend o rutas publicas.

Criterios:
- lib.ts queda pequeno y con responsabilidades justificadas, o desaparece por
  migracion completa y probada.
- globals.css contiene tokens y patrones, no estilos de paginas concretas.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): consolidar shell y componentes compartidos

Detente antes de H25.
```

## Prompt H25 - Regresion integral y cierre de feature1.0

```text
Actua como Coordinator Agent y QA principal, consultando al Solution Architect.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H24 aprobado.
No integrar PortalCorporativo y no agregar funcionalidades.

Ejecuta el cierre integral de la refactorizacion frontend.

Revisa todas las rutas:
- login, forgot-password, change-password
- dashboard, activities, evidence, approvals
- agenda, agenda-calendar, agenda-metrics
- metrics, audit
- admin, users
- branding, notifications, my-notifications, notification-log
- storage, initial-import
- public-requirement, satisfaction/[token]

Actividades:
- Ejecutar suite completa de pruebas y build de produccion.
- Verificar imports circulares, modelos duplicados, fetch directo en presentacion,
  CSS global especifico, componentes sin pruebas y codigo obsoleto.
- Revisar estados carga/error/vacio/exito en cada modulo.
- Revisar responsive, teclado, foco, labels y dialogs.
- Preparar matriz de regresion manual por rol.
- Actualizar README, arquitectura frontend, codex/TASKS.md y riesgos.
- Registrar deuda que no deba corregirse dentro del cierre.
- Comparar metricas antes/despues: tamanos de page.tsx, duplicacion, pruebas y build.

No corrijas hallazgos grandes silenciosamente: clasificalos y crea tareas separadas.

Criterios GO:
- pnpm test y pnpm build verdes.
- Todas las paginas son composicion.
- No hay fetch en componentes de presentacion.
- Formularios refactorizados usan React Hook Form + Zod.
- CSS cumple la politica global/local.
- Sin dependencia de PortalCorporativo.
- Documentacion alineada con codigo.

Commit de cierre: docs(frontend): completar roadmap de refactorizacion 1.0

Entrega:
- GO/NO-GO.
- Evidencias automatizadas.
- Checklist manual pendiente.
- Riesgos y deuda.
- Lista exacta de commits/hitos.
- Recomendacion de PR feature1.0 -> main.

No hagas merge ni despliegue sin autorizacion explicita.
```
