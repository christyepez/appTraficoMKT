# Guia funcional de usuario

## Perfiles

| Perfil | Uso principal |
| --- | --- |
| Administrador | Configura usuarios, catalogos, marca, almacenamiento, carga inicial, notificaciones y auditoria. |
| Coordinador | Supervisa requerimientos, productos, aprobaciones, metricas y auditoria. |
| Solicitante | Crea y consulta requerimientos propios. |
| Tecnico | Gestiona productos asignados y adjunta evidencias. |
| Aprobador | Revisa productos pendientes y aprueba o rechaza. |
| Auditor | Consulta metricas y trazabilidad. |

## Inicio de sesion

1. Abrir la aplicacion.
2. Ingresar correo y clave local o usar Office 365 si el usuario lo tiene habilitado.
3. Si el usuario tiene clave temporal, el sistema redirige a cambio de clave.
4. Luego del cambio de clave se vuelve al login automaticamente.

## Requerimientos

Ruta: `/dashboard`

1. Presionar `+`.
2. Completar actividad/evento, solicitante, facultad, carrera, sede, lugar, fechas, objetivo y formato.
3. Guardar.
4. El requerimiento aparece en el seguimiento.
5. Se puede pasar por estados: analisis, ejecucion y completado.

Reglas:

- Administrador y Coordinador ven todos.
- Tecnico ve requerimientos relacionados con productos asignados.
- Por defecto se ocultan requerimientos finalizados.

## Productos

Ruta: `/activities`

1. Presionar `+`.
2. Seleccionar requerimiento.
3. Usar el `Id producto` sugerido.
4. Completar catalogos, responsable tecnico, fecha y observaciones.
5. Guardar.

Workflow:

1. Cambiar a progreso.
2. Adjuntar evidencia.
3. Enviar a aprobacion.
4. Revisar version enviada a aprobacion.
5. Si se rechaza, adjuntar correccion y reenviar.

La pantalla permite:

- Buscar en el seguimiento.
- Ver adjuntos en popup.
- Ver versiones enviadas a aprobacion.
- Editar o eliminar logicamente.

## Adjuntos

Ruta: `/evidence`

1. Presionar `+`.
2. Seleccionar producto.
3. Arrastrar archivo o seleccionarlo.
4. Revisar preview.
5. Adjuntar.

La pantalla muestra cabecera con totales y detalle de cada evidencia con:

- Producto asociado.
- Tipo de archivo.
- Ruta.
- Aprobaciones relacionadas.
- Preview o boton abrir.
- Eliminacion logica.

## Aprobaciones

Ruta: `/approvals`

1. Revisar productos pendientes.
2. Ver datos del producto en el grid detalle.
3. Abrir adjuntos en popup.
4. Aprobar o rechazar.
5. Ingresar comentarios.

Si se rechaza, la decision queda guardada como version historica. El tecnico puede corregir adjuntando nueva evidencia y reenviar.

## Auditorias y tracking

Ruta: `/audit`

Disponible para Administrador, Coordinador y Auditor.

Permite consultar:

- Tracking de requerimientos.
- Tracking de productos.
- Tracking de aprobaciones.

Incluye filtros por tipo, buscador, resumen y detalle tecnico del evento.

## Administracion de catalogos

Ruta: `/admin`

Permite administrar:

- Facultades.
- Sedes.
- Carreras por facultad.
- Aprobadores.
- Estados.
- Tipos de requerimiento/producto.
- Publico objetivo.
- Canal de difusion.
- KPI principal.

## Usuarios

Ruta: `/users`

Permite:

- Crear usuarios.
- Editar correo.
- Resetear clave temporal.
- Activar/desactivar Office 365.
- Asignar rol.
- Asignar pantallas visibles.
- Configurar menu horizontal o vertical por usuario.
- Ocultar/ver usuarios inactivos.

## Marca

Ruta: `/branding`

Permite parametrizar:

- Textos.
- Colores.
- Botones.
- Tipografia.
- Logo.
- Cabecera.
- Menu.

Los cambios son globales y se aplican a todos los usuarios; el modo de menu puede ser sobrescrito por usuario.

## Carga inicial

Ruta: `/initial-import`

Opciones:

- Completa.
- Administracion.
- Catalogos.
- Usuarios.
- Requerimientos.
- Productos.

Cada opcion tiene su plantilla independiente. La pantalla muestra tracking de cargas, fechas y resultados procesados.

## Metricas

Ruta: `/metrics`

Conceptos disponibles:

- Resumen ejecutivo.
- Carga operativa.
- Tiempos y esfuerzo.
- Incidencia institucional.
- Participacion por areas.

