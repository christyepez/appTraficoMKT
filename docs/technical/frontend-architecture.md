# Arquitectura frontend

## Alcance y estado

El frontend de App Trafico MKT usa Next.js 16, React 19 y TypeScript. La
refactorizacion `feature1.0` conserva `fetch`, los contratos HTTP y las versiones
del producto. No existe dependencia de ejecucion con `PortalCorporativo`.

El cierre H25 queda en estado **NO-GO para fusionar a `main`** hasta resolver los
bloqueos registrados en `codex/H25_FRONTEND_CLOSURE.md` y completar la regresion
manual con servicios y roles reales.

## Capas

| Ruta | Responsabilidad | Regla |
|---|---|---|
| `app/` | Rutas, layout y composicion | No contiene acceso HTTP ni reglas de dominio. |
| `features/<modulo>/components` | Presentacion e interaccion local | Recibe datos y comandos; no usa `fetch`. |
| `features/<modulo>/hooks` | Estado, carga, polling y casos de uso de UI | Coordina servicios y estados de pantalla. |
| `features/<modulo>/services` | Contratos HTTP tipados | Usa el cliente de `core/api`. |
| `features/<modulo>/schemas` | Validacion de formularios | Zod con tipos inferidos y React Hook Form. |
| `features/<modulo>/models` | Contratos propios del modulo | No duplica contratos transversales. |
| `features/<modulo>/utils` | Reglas puras | Sin React ni efectos externos. |
| `core/` | API, sesion, marca, configuracion y permisos transversales | Sin dependencia hacia `app/` o features concretas. |
| `shared/` | Componentes, modelos y utilidades con dos o mas consumidores | No actua como framework interno. |

La direccion esperada es `app -> features -> core/shared`. Los servicios usan
`core/api`; las fachadas `app/lib.ts` y `app/nav.tsx` son temporales y no deben
recibir comportamiento nuevo.

## Estado de interfaz

Cada workspace debe distinguir, cuando aplique:

- carga inicial;
- actualizacion no bloqueante;
- error recuperable con reintento;
- lista vacia;
- filtro sin resultados;
- operacion pendiente y resultado exitoso.

Los dialogs nuevos usan `shared/components/AccessibleDialog`, con nombre
accesible, cierre con Escape, ciclo de foco y restauracion al elemento anterior.
Los formularios refactorizados usan React Hook Form, Zod, labels explicitas y
mensajes asociados.

## Estilos

`app/globals.css` debe limitarse a tokens y patrones realmente compartidos. Los
estilos de una ruta o feature pertenecen a su CSS Module. H25 detecto estilos
historicos de login, calendario, agenda, marca y notificaciones que aun deben
migrarse por dominio antes del GO.

## Pruebas

Vitest y Testing Library cubren reglas, servicios, hooks y componentes criticos.
La puerta automatizada de H25 ejecuta `pnpm test`, `pnpm test:coverage`,
`pnpm lint` y `pnpm build`. Las pruebas no sustituyen la matriz manual por rol,
backend real, almacenamiento ni responsive en navegadores objetivo.
