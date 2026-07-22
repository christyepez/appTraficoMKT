# Modulo Productos

Este modulo implementa la pantalla `/activities` como una feature aislada. La
pagina de ruta se limita a componer la interfaz; las reglas, el acceso a datos y
los componentes viven bajo `features/products`. No existe integracion ni
dependencia con `PortalCorporativo`.

## Arquitectura y responsabilidades

| Capa | Responsabilidad | Dependencias permitidas |
|---|---|---|
| `app/activities/page.tsx` | Componer secciones y mantener el estado efimero de apertura, filtros y seleccion | Componentes y hook de Productos |
| `components/` | Renderizar formulario, filtros, tarjetas, workflow, adjuntos y dialogs accesibles | Modelos, esquemas y utilidades; sin HTTP |
| `hooks/useProductsWorkspace.ts` | Orquestar carga, polling, permisos visibles, mutaciones, concurrencia y feedback | Servicio y reglas puras |
| `services/product.service.ts` | Encapsular los contratos HTTP sobre el helper `api`, basado en `fetch` | Modelos compartidos y de la feature |
| `schemas/` | Validar el formulario y convertir sus valores al comando de guardado | Zod |
| `utils/` | Resolver workflow, busqueda y paginacion; reexportar temporalmente reglas compartidas usadas por rutas existentes | Funciones puras y `shared/utils` |
| `styles/Product.module.css` | Composicion visual exclusiva de Productos | Tokens y patrones de `app/globals.css` |

`shared/models/api.models.ts` conserva el contrato API canonico. El alias
`Product = Activity` expresa el lenguaje de la interfaz sin duplicar su forma.
Los controles de visibilidad en el frontend mejoran la experiencia, pero la
autorizacion efectiva sigue siendo responsabilidad del backend.

## Flujo de datos

1. `useProductsWorkspace` obtiene en paralelo productos, requerimientos,
   catalogos, tecnicos, evidencias, aprobaciones y configuracion de marca.
2. El hook filtra la informacion visible para la sesion y entrega un estado
   listo para renderizar.
3. Los componentes emiten intenciones tipadas y nunca llaman HTTP.
4. El hook bloquea operaciones repetidas, delega al servicio y refresca el
   workspace despues de cada mutacion.
5. Los mensajes se anuncian en pantalla y mediante el sistema global de toast.

## Criterios de aceptacion H1-H5

| Hito | Criterio verificado | Evidencia automatizada |
|---|---|---|
| H1 | Modelos, servicio `fetch`, filtros de sesion y reglas de workflow extraidos | `product.service.test.ts`, `product.utils.test.ts` |
| H2 | Alta/edicion desacopladas, validacion Zod y errores accesibles | `product.schema.test.ts`, `ProductForm.test.tsx` |
| H3 | Busqueda, paginacion, estados, permisos visibles y concurrencia centralizados | `ProductTracking.test.tsx`, `useProductsWorkspace.test.ts` |
| H4 | Carga, enlace, vista previa, eliminacion y versiones desacopladas | `evidence.utils.test.ts`, `EvidenceComponents.test.tsx` |
| H5 | CSS local, responsive, foco, teclado, Escape y restauracion de foco | `ProductDialog.test.tsx` y pruebas de componentes |

La suite de cierre cubre 49 casos. Las reglas, servicios y hooks alcanzan 100 %
de lineas y funciones, con 90,96 % de ramas globales y 80,28 % de ramas en el
hook de orquestacion. `activities/page.tsx` mide 92 lineas y no contiene reglas
de negocio ni acceso HTTP.

## Regresion funcional

La regresion automatizada verifica crear y editar productos, iniciar y enviar
al flujo de aprobacion, buscar, paginar, adjuntar archivos y enlaces, consultar
evidencias/versiones y eliminar cuando la interfaz lo permite. Antes de fusionar
se deben ejecutar ademas estas comprobaciones con backend y almacenamiento
reales:

- Recorrer el flujo `Todo -> InProgress -> EvidenceAttached -> PendingApproval`
  con usuarios Administrador, Coordinador y Tecnico.
- Confirmar que un Tecnico solo vea productos propios o asociados a sus
  requerimientos y que el backend rechace toda operacion no autorizada.
- Cargar y abrir un archivo real y una URL externa; verificar su persistencia.
- Revisar una version desde la pantalla independiente de Aprobaciones y validar
  el bloqueo de eliminacion tras aprobar o rechazar.
- Validar en movil y escritorio el orden de foco, contraste y lectura con
  tecnologia asistiva.

## Verificacion local

Desde `frontend`:

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm test:coverage
pnpm build
```

## Patron para los siguientes modulos

La estructura `components / hooks / models / schemas / services / utils /
styles` es la referencia inicial para H7-H25. Solo deben crearse las carpetas
que cada modulo necesite. Un elemento se promueve a `shared` cuando exista un
segundo consumidor real y mantenga el mismo contrato; los componentes de
workflow y composicion propios de Productos permanecen locales.

En H7 se comprobó el segundo uso de contratos de evidencia/aprobación,
visibilidad por sesión, validación de adjuntos, vista previa y dialog accesible;
esas piezas ya residen en `shared`. Los wrappers locales conservan estilos y API
de cada feature sin duplicar comportamiento.
