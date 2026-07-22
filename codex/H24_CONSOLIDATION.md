# H24 - Consolidación de shell y transversalidad

## Inventario inicial

| Archivo | Responsabilidades encontradas | Decisión |
|---|---|---|
| `app/lib.ts` | HTTP, sesión, toast, idioma, marca y modelos | Convertir en fachada de compatibilidad; mover comportamiento a `core`. |
| `app/nav.tsx` | Autorización, marca, polling, responsive, perfil, idioma y menú | Convertir en punto de exportación; separar shell en servicio, hook y componentes. |
| `app/globals.css` | Tokens, shell, patrones y estilos históricos de dominio | Mantener patrones compartidos, eliminar reglas muertas y conservar estilos locales nuevos en CSS Modules. |
| `app/layout.tsx` | Metadatos, idioma, estilos y toast | Mantener y añadir navegación accesible al contenido. |

## Matriz KEEP/MOVE/MERGE/DELETE

| Elemento | Acción | Resultado |
|---|---|---|
| Sesión y marca canónicas | KEEP | Continúan en `core/auth` y `core/branding`. |
| Cliente HTTP | MOVE | `core/api/api-client.ts`. |
| Toast e idioma | MOVE | `core/configuration`. |
| Reglas de menú y rutas permitidas | MOVE | `core/permissions/navigation.ts`. |
| Cabecera, menú y coordinación del shell | MOVE | `features/shell`. |
| Campos con label/error repetidos | MERGE | `shared/components/FormField.tsx`, usado por Requerimientos, Agenda y formulario público. |
| Estados específicos de cada módulo | KEEP | Sus contratos de reintento y vacío no son equivalentes. |
| Reglas CSS sin consumidores | DELETE | Se retiraron selectores históricos de branding, agenda, calendario y editores ya migrados. |
| Fachadas `app/lib.ts` y `app/nav.tsx` | KEEP mínimo | Evitan una migración mecánica de 56 consumidores sin añadir comportamiento nuevo. |

## Límites

- No se modificaron rutas, contratos backend ni permisos efectivos.
- `PortalCorporativo` continúa fuera de alcance.
- Los estilos específicos nuevos permanecen en CSS Modules; `globals.css` conserva tokens y patrones compartidos, con deuda histórica restante a verificar en H25.
