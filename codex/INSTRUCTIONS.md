# Instrucciones de implementacion

## Flujo por tarea

1. El Coordinator Agent define alcance, clasificacion y criterios de aceptacion.
2. El Portal Reuse Agent comprueba si la capacidad es transversal.
3. El Solution Architect Agent delimita componentes, contratos y dependencias.
4. Se implementa el cambio minimo compilable.
5. Se ejecutan pruebas unitarias/de componentes y build.
6. Se registra el resultado en `codex/TASKS.md`.

## Definicion de terminado

- La pagina es un componente de composicion.
- El acceso HTTP se encuentra en servicios tipados.
- Las reglas puras tienen pruebas unitarias.
- Los componentes tienen responsabilidades acotadas.
- Los formularios usan esquemas Zod y mensajes accesibles.
- Los estados de carga, error, vacio y exito son visibles.
- No hay regresiones de permisos ni de flujo.
- `pnpm test` y `pnpm build` terminan correctamente.
