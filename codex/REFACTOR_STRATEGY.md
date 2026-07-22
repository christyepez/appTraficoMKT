# Estrategia de refactorizacion frontend

## Resultado esperado

Transformar el frontend actual en una arquitectura modular por funcionalidades,
manteniendo los contratos backend y entregando valor en incrementos pequenos.

## Arquitectura objetivo

```text
frontend/
  app/                         rutas y composicion Next.js
  core/                        sesion, cliente HTTP, configuracion y permisos
  shared/
    components/                controles visuales reutilizables
    hooks/                     hooks realmente transversales
    models/                    contratos compartidos
    styles/                    tokens y patrones globales
    utils/                     funciones puras compartidas
  features/
    products/
      components/              formulario, lista, workflow y adjuntos
      hooks/                   orquestacion de pantalla
      models/                  contratos del modulo
      schemas/                 Zod
      services/                fetch tipado
      styles/                  CSS Module especifico
      utils/                   reglas puras
```

`page.tsx` conserva JSX porque Next.js usa React/TSX; la separacion equivalente
a HTML independiente se logra extrayendo componentes visuales pequenos, no
creando archivos HTML que React no consume.

## Principios

1. Mantener la aplicacion aislada de PortalCorporativo.
2. Refactorizar por comportamiento completo, no por carpetas vacias.
3. Separar primero reglas puras y acceso HTTP.
4. Extraer despues formulario, listado, workflow, adjuntos y modales.
5. Incorporar pruebas antes de eliminar la implementacion anterior.
6. Mejorar accesibilidad y estados visuales sin cambiar contratos.
7. Evitar abstracciones genericas hasta tener al menos dos usos reales.

## Hitos

| Hito | Resultado verificable | Sprint objetivo |
|---|---|---|
| H0 | Gobierno de agentes, diagnostico, backlog y build base | Sprint 0 |
| H1 | Fundacion de pruebas, modelos, servicios y utilidades | Sprint 1 |
| H2 | Formulario de Producto desacoplado y validado | Sprint 2 |
| H3 | Seguimiento, workflow y busqueda desacoplados | Sprint 3 |
| H4 | Evidencias y versiones de aprobacion desacopladas | Sprint 4 |
| H5 | UX, accesibilidad y CSS modular consolidados | Sprint 5 |
| H6 | Modulo Productos estabilizado y documentado | Sprint 6 |
| H7 | Patron validado aplicado gradualmente al resto del frontend | Sprints 7+ |

## Plan de sprints

Los sprints se plantean como ciclos de dos semanas. Sprint 0 puede ejecutarse
como una preparacion de hasta una semana.

### Sprint 0 - Gobierno y linea base

Objetivo: controlar la refactorizacion antes de mover comportamiento.

- Incorporar `AGENTS.md`, contexto, instrucciones y backlog.
- Aplicar Coordinator, Portal Reuse y Solution Architect.
- Registrar Productos como `CREATE` y el aislamiento del portal como restriccion.
- Confirmar build base de las 24 rutas.
- Inventariar responsabilidades de `activities/page.tsx`.
- Definir convenciones de carpetas, nombres y commits.

Criterio de salida: estrategia aprobada y build base verde.

### Sprint 1 - Fundacion de Productos

Objetivo: extraer dependencias tecnicas sin cambiar la interfaz.

- Configurar Vitest, jsdom y Testing Library.
- Agregar React Hook Form y Zod.
- Crear modelos propios de Productos.
- Crear servicio tipado sobre `fetch`.
- Extraer estados, permisos, filtros, busqueda y pasos del workflow.
- Agregar pruebas unitarias de reglas puras y servicios.
- Mantener `activities/page.tsx` funcional durante la migracion.

Criterio de salida: pruebas y build verdes; sin llamadas HTTP nuevas dentro de
componentes extraidos.

### Sprint 2 - Formulario de Producto

Objetivo: separar alta y edicion de Productos.

- Crear esquema Zod y tipos inferidos.
- Crear `ProductForm` con React Hook Form.
- Crear selects reutilizables y mensajes de validacion accesibles.
- Extraer carga de catalogos y tecnicos.
- Mejorar jerarquia visual, espaciado y estados de guardado.
- Probar alta, edicion, validaciones y errores del API.

Criterio de salida: el formulario no depende de `page.tsx` ni construye llamadas
HTTP directamente.

### Sprint 3 - Seguimiento y workflow

Objetivo: separar listado, busqueda y transiciones de estado.

- Crear `ProductList`, `ProductCard`, `ProductFilters` y `ProductWorkflowActions`.
- Extraer hook de orquestacion `useProductsWorkspace`.
- Centralizar mensajes y confirmaciones.
- Mejorar estados vacio, carga, error y actualizacion.
- Probar visibilidad, busqueda, paginacion y botones por estado.

Criterio de salida: `page.tsx` solo compone la pantalla y sus secciones.

### Sprint 4 - Evidencias y aprobaciones

Objetivo: desacoplar carga, vista previa y versiones enviadas.

- Crear `ProductAttachmentPanel`.
- Crear `EvidenceGallery` y vista previa por tipo.
- Crear `ApprovalVersionsDialog`.
- Separar validacion de archivo, URL, peso y tipo.
- Probar carga, eliminacion permitida/bloqueada y modales.

Criterio de salida: evidencias y aprobaciones pueden evolucionar sin modificar
el listado o formulario.

### Sprint 5 - Diseno, CSS y accesibilidad

Objetivo: consolidar la mejora visual acordada.

- Extraer tokens, botones, campos, paneles, badges y dialogs compartidos.
- Crear CSS Module solo para composicion especifica de Productos.
- Reducir reglas duplicadas de `globals.css`.
- Revisar responsive, navegacion por teclado, foco y etiquetas ARIA.
- Validar contraste, mensajes y estados deshabilitados.

Criterio de salida: experiencia consistente en escritorio y movil sin CSS
especifico filtrandose a otros modulos.

### Sprint 6 - Estabilizacion y cierre de Productos

Objetivo: entregar el primer modulo como patron de referencia.

- Alcanzar cobertura acordada de reglas y componentes criticos.
- Ejecutar regresion funcional del flujo completo.
- Eliminar codigo obsoleto y duplicado.
- Documentar decisiones y patron reutilizable.
- Medir lineas y responsabilidades restantes de `page.tsx`.
- Preparar PR final del modulo.

Criterio de salida: Productos estable, documentado y listo para produccion.

### Sprint 7 en adelante - Expansion controlada

Orden recomendado por deuda y afinidad:

1. Evidencias y Aprobaciones.
2. Agenda y Calendario.
3. Dashboard y Metricas.
4. Administracion y Usuarios.
5. Marca, Notificaciones y Almacenamiento.
6. Login y sesion dentro de la arquitectura autonoma actual.

Cada modulo repite discovery, clasificacion, extraccion, pruebas, UX y cierre.

## Riesgos y controles

| Riesgo | Control |
|---|---|
| Regresion funcional por mover demasiado codigo | Commits pequenos, pruebas antes de eliminar y build por incremento. |
| Duplicar componentes genericos prematuramente | Promover a `shared` solo al segundo uso comprobado. |
| Permisos inconsistentes | Mantener autorizacion backend y probar filtros frontend como experiencia, no seguridad. |
| Introducir dependencia accidental con PortalCorporativo | Prohibir integraciones en esta etapa y exigir una iniciativa/ADR separados. |
| CSS global con efectos laterales | Tokens/patrones globales y CSS Modules para composicion local. |
| Polling y estados asincronos complejos | Centralizar en un hook y evitar solicitudes superpuestas. |

## Metricas de seguimiento

- `activities/page.tsx` reducido a menos de 120 lineas al cerrar Sprint 4.
- Cero llamadas HTTP directas en componentes de presentacion.
- Cero modelos de Productos duplicados fuera de su modulo.
- Pruebas de todas las reglas de workflow y permisos visibles.
- Build y pruebas verdes en cada commit.
- Sin aumento de errores TypeScript.
