# Prompts de ejecucion por hitos

Este archivo cubre H0-H6. Los prompts H7-H25 se encuentran ordenados en
[`prompts/README.md`](prompts/README.md) y el orden maestro en
[`FRONTEND_MASTER_ROADMAP.md`](FRONTEND_MASTER_ROADMAP.md).

## Forma de uso

1. Ejecutar un solo prompt a la vez en la rama `feature1.0`.
2. Revisar el plan y el diff antes de autorizar el siguiente sprint.
3. No combinar sprints ni adelantar componentes.
4. Exigir pruebas y build verdes antes de cerrar cada incremento.
5. Mantener `appTraficoMKT` aislado de `PortalCorporativo`.
6. Usar `CodexCommonAgents` como contrato de coordinacion y calidad.

Repositorio de aplicacion:
`https://github.com/christyepez/appTraficoMKT`

Repositorio de agentes:
`https://github.com/christyepez/CodexCommonAgents`

## Prompt 0 - Revisar y aprobar la estrategia

```text
Actua como Coordinator Agent de CodexCommonAgents.

Repositorio objetivo: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Repositorio de agentes: https://github.com/christyepez/CodexCommonAgents

La aplicacion debe mantenerse completamente aislada de PortalCorporativo. Usa
CodexCommonAgents solo como marco de coordinacion, arquitectura y calidad.

Lee unicamente:
- AGENTS.md
- README.md
- codex/PROJECT_CONTEXT.md
- codex/INSTRUCTIONS.md
- codex/REFACTOR_STRATEGY.md
- codex/FRONTEND_MASTER_ROADMAP.md
- codex/TASKS.md
- codex/prompts/README.md
- CodexCommonAgents/AGENTS.md
- CodexCommonAgents/agents/00-coordinator-agent.md
- CodexCommonAgents/agents/02-solution-architect-agent.md
- CodexCommonAgents/rules/00-global-rules.md

No modifiques codigo.

Revisa la estrategia de refactorizacion del frontend comenzando por Productos.
Valida alcance, dependencias, orden de sprints, criterios de aceptacion, riesgos,
metricas y puntos de decision. Identifica contradicciones o tareas demasiado
grandes. Propone ajustes concretos sobre la documentacion, pero no los apliques
sin presentar primero el diagnostico.

Entrega:
- Decision del Coordinator Agent.
- Clasificacion: CREATE para Productos; portal fuera de alcance.
- Observaciones por sprint.
- Ajustes recomendados.
- Riesgos y bloqueos.
- Confirmacion de si Sprint 1 puede iniciar.
```

## Prompt 1 - Hito H1: fundacion de Productos

```text
Actua en este orden:
1. Coordinator Agent.
2. Portal Reuse Agent, solo para comprobar aislamiento.
3. Solution Architect Agent.
4. Implementador Frontend bajo las decisiones del Solution Architect.
5. QA bajo los criterios de salida de CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama obligatoria: feature1.0
Agentes: https://github.com/christyepez/CodexCommonAgents

Restriccion principal: no integrar, consumir ni depender de PortalCorporativo.
No modificar backend, contratos API ni otros modulos funcionales.

Objetivo: ejecutar exclusivamente Sprint 1/Hito H1 de
codex/REFACTOR_STRATEGY.md para crear la fundacion modular de Productos.

Alcance:
- Configurar Vitest, jsdom y Testing Library.
- Agregar Testing Library user-event para interacciones de usuario.
- Agregar React Hook Form y Zod, sin migrar aun el formulario.
- Crear features/products/{models,services,utils}.
- Mantener fetch detras de servicios tipados.
- Extraer de activities/page.tsx solo modelos duplicados, reglas puras de
  estados, busqueda, permisos visibles y generacion de codigo.
- Agregar pruebas unitarias para esas reglas.
- Cubrir al menos 80% del codigo nuevo de reglas, servicios y hooks.
- Definir contratos API canonicos sin duplicarlos entre app, shared y features.
- No cambiar la apariencia ni extraer componentes visuales en este sprint.

Criterios de aceptacion:
- Todas las rutas siguen compilando.
- pnpm test y pnpm build finalizan correctamente.
- No existen llamadas nuevas a PortalCorporativo.
- No se modifican contratos backend.
- activities/page.tsx conserva exactamente el comportamiento existente.
- El cambio queda en un commit pequeno con mensaje:
  refactor(frontend): crear fundacion del modulo productos

Antes de modificar, presenta archivos permitidos y plan. Al finalizar entrega el
formato de salida exigido por CodexCommonAgents, el diff resumido y riesgos. No
inicies Sprint 2.
```

## Prompt 2 - Hito H2: formulario desacoplado

```text
Usa los agentes Coordinator y Solution Architect de CodexCommonAgents y ejecuta
el rol Frontend bajo sus decisiones.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H1 aprobado, pruebas y build verdes.
PortalCorporativo: completamente fuera de alcance.

Ejecuta solo Sprint 2/Hito H2 de codex/REFACTOR_STRATEGY.md.

Objetivo: extraer alta y edicion de Productos desde activities/page.tsx.

Implementa:
- features/products/schemas/product.schema.ts con Zod.
- ProductForm usando React Hook Form.
- ProductSelectField y mensajes de error accesibles.
- Mapeo formulario -> comando API dentro del modulo, no en la vista.
- Estados de guardado, error y exito.
- CSS Module solo si el formulario requiere composicion especifica.
- Pruebas de renderizado, validaciones, alta, edicion y error del servicio.

Conserva fetch, endpoints, payloads, permisos y comportamiento actual. Se permite
mejorar jerarquia visual, espaciado y mensajes, pero no redisenar otras secciones.

Criterios:
- page.tsx no contiene campos ni validaciones del formulario.
- ProductForm no llama fetch directamente.
- pnpm test y pnpm build verdes.
- Commit: refactor(frontend): desacoplar formulario de productos

Detente al cerrar H2 y presenta evidencia para revision. No ejecutes H3.
```

## Prompt 3 - Hito H3: seguimiento y workflow

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA
segun CodexCommonAgents.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H2 aprobado.
Mantener aislamiento total de PortalCorporativo.

Ejecuta unicamente Sprint 3/Hito H3.

Extrae:
- ProductFilters.
- ProductList.
- ProductCard.
- ProductWorkflowActions.
- useProductsWorkspace para carga, refresco, acciones y estados asincronos.

Mejora:
- Estado inicial de carga.
- Error recuperable con reintento.
- Estado vacio diferenciado de resultado sin coincidencias.
- Indicador de actualizacion.
- Etiquetas y titles comprensibles.
- Prevencion de solicitudes duplicadas durante acciones.

Prueba busqueda, paginacion, visibilidad, estados del workflow, acciones
habilitadas/deshabilitadas y manejo de error. No extraigas aun evidencias ni
versiones de aprobacion.

Criterios:
- page.tsx funciona como composicion.
- Componentes visuales no llaman fetch.
- Build y pruebas verdes.
- Commit: refactor(frontend): separar seguimiento y workflow de productos

Detente y solicita revision antes de H4.
```

## Prompt 4 - Hito H4: evidencias y versiones

```text
Usa Coordinator Agent y Solution Architect Agent de CodexCommonAgents, con roles
Frontend y QA subordinados a sus decisiones.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H3 aprobado.
PortalCorporativo y su Content/File API estan fuera de alcance.

Ejecuta solo Sprint 4/Hito H4.

Limite funcional: H4 cubre evidencias y versiones solo dentro de la experiencia
de Productos. La pagina autonoma de Evidencias corresponde a H7 y la cola
autonoma de Aprobaciones corresponde a H8.

Extrae:
- ProductAttachmentPanel.
- EvidenceGallery.
- EvidencePreview.
- ApprovalVersionsDialog.
- Validadores de archivo, URL, peso y tipo.
- Operaciones de evidencias dentro de product.service o evidence.service local.

Mantener endpoints y almacenamiento actuales. Mejorar foco de modales, cierre con
teclado, etiquetas, vista previa, confirmaciones y mensajes de error.

Pruebas minimas:
- Archivo valido/invalido y limite de 50 MB.
- URL valida/invalida.
- Eliminacion habilitada o bloqueada por decision de aprobacion.
- Renderizado de imagen, PDF y tipo sin vista previa.
- Apertura/cierre de dialogs y listado de versiones.

Criterios:
- Build y pruebas verdes.
- page.tsx menor a 120 lineas o justificar por escrito la desviacion.
- Commit: refactor(frontend): desacoplar evidencias y aprobaciones de productos

No ejecutes H5.
```

## Prompt 5 - Hito H5: diseno, CSS y accesibilidad

```text
Actua con Coordinator Agent, Solution Architect Agent, rol Frontend y rol QA.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H4 aprobado.
Mantener PortalCorporativo fuera de alcance.

Ejecuta exclusivamente Sprint 5/Hito H5.

Objetivo: mejorar la experiencia de Productos usando CSS puro.

Reglas:
- globals.css conserva tokens y patrones realmente compartidos.
- Product.module.css contiene solo composicion propia del modulo.
- No agregar Tailwind, Material UI, Shadcn ni otra biblioteca visual.
- No cambiar la identidad institucional sin aprobacion.

Revisa jerarquia, espacios, responsive, contraste, foco visible, teclado,
etiquetas, dialogs, estados deshabilitados, mensajes y areas tactiles. Elimina
solo reglas CSS duplicadas cuya equivalencia este comprobada.

Agrega o ajusta pruebas de accesibilidad estructural y estados visuales que puedan
validarse en Testing Library. Ejecuta pruebas y build.

Commit: style(frontend): mejorar experiencia del modulo productos

Entrega comparacion antes/despues, reglas globales promovidas, CSS local creado y
riesgos. Detente antes de H6.
```

## Prompt 6 - Hito H6: estabilizacion y cierre

```text
Actua como Coordinator Agent y QA, consultando al Solution Architect Agent.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0
Prerequisito: H5 aprobado.
No integrar PortalCorporativo.

Ejecuta solo Sprint 6/Hito H6.

Realiza:
- Inventario de criterios de aceptacion H1-H5.
- Regresion del flujo Producto: crear, editar, iniciar, adjuntar, enviar a
  aprobacion, ver versiones, buscar, paginar y eliminar cuando corresponda.
- Revision de permisos visibles sin considerarlos seguridad backend.
- Eliminacion de codigo obsoleto comprobado.
- Cobertura de reglas y componentes criticos.
- Actualizacion de README y codex/TASKS.md.
- Registro de deuda y decisiones relevantes.
- Build final.

No agregues funcionalidades nuevas ni refactorices otros modulos.

Criterios:
- pnpm test y pnpm build verdes.
- Sin modelos ni reglas de Productos duplicados.
- Sin fetch en componentes de presentacion.
- page.tsx solo compone.
- Documentacion consistente con el codigo.
- Commit: docs(frontend): cerrar refactorizacion del modulo productos

Entrega recomendacion GO/NO-GO para fusionar feature1.0 y lista de verificaciones
manuales pendientes. No hagas merge sin autorizacion explicita.
```

## Prompt 7 - Verificar cierre de Productos antes de continuar

```text
Actua exclusivamente como Coordinator Agent y Solution Architect Agent.

Repositorio: https://github.com/christyepez/appTraficoMKT
Rama: feature1.0 o la rama indicada por el responsable.
Prerequisito: H6 aprobado.
Mantener aislamiento respecto a PortalCorporativo.

No modifiques codigo.

Compara el resultado final de Productos con los criterios H1-H6 y con el patron
definido en codex/FRONTEND_MASTER_ROADMAP.md. No vuelvas a priorizar los modulos:
el orden H7-H25 ya fue definido y debe cambiarse solo mediante una decision
documentada.

Entrega:
- GO/NO-GO para iniciar H7 Evidencias.
- Componentes reutilizables de Productos que pueden promoverse a shared.
- Componentes que no deben generalizarse.
- Riesgos y deuda que condicionan H7.
- Confirmacion del prompt H7 que debe ejecutarse.

No inicies la implementacion.
```
