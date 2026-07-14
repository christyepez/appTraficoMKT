# Abrir el proyecto en Power BI Desktop

## Requisitos previos

- Windows con Docker Desktop iniciado.
- Git disponible en consola.
- Power BI Desktop actualizado con soporte para proyectos `.pbip`, PBIR y modelo semantico versionable.
- Repositorio `appTraficoMKT` actualizado.

## Instalacion de Power BI Desktop

Opciones soportadas:

- Microsoft Store: instala "Power BI Desktop".
- Instalador tradicional: instala desde Microsoft y deja `PBIDesktop.exe` en `Program Files`.

Si el script no encuentra el ejecutable, intentara abrir el archivo `.pbip` por asociacion de Windows.

## Comando unico

Desde la raiz del repositorio:

```powershell
$env:APPTRAFICOMKT_SQL_PASSWORD = "contraseña-local"
.\scripts\open-powerbi-local.ps1
```

El script:

1. Detecta la raiz del repositorio.
2. Ejecuta `git checkout main` y `git pull origin main`.
3. Levanta `sqlserver`, `requirements-api`, `activities-api`, `evidence-api`, `identity-api` y `administration-api`.
4. Espera SQL Server.
5. Ejecuta los scripts BI.
6. Valida el esquema `bi`, vistas, tablas de configuracion y `bi.fn_WorkingMinutes`.
7. Valida PBIP/PBIR/TMDL.
8. Abre `analytics/powerbi/AppTraficoMKT.BI.pbip`.

Si no existe `sqlcmd` local, usa `/opt/mssql-tools18/bin/sqlcmd` dentro del contenedor `requirements-sqlserver`.

Nota: `bi.fn_WorkingMinutes` espera timestamps UTC y los convierte a Ecuador. La prueba automatizada ejecuta la consulta solicitada con valores sin zona horaria; SQL Server los interpreta como `datetimeoffset` con offset cero, por eso el resultado valida funcionamiento de la funcion y no debe leerse como una jornada local completa.

## Parametros del modelo

| Parametro | Local | Test/Prod |
| --- | --- | --- |
| `ServerName` | `localhost,14333` | Servidor SQL institucional |
| `DatabaseName` | `RequirementsDb` | Base donde se crearon vistas `bi` |
| `EnvironmentName` | `dev` | `test` o `prod` |

No se guarda usuario ni contraseña dentro de Power Query, TMDL, PBIR, JSON ni archivos del repositorio.

## Credenciales en Power BI Desktop

Cuando Power BI solicite credenciales:

- Tipo: SQL Server.
- Servidor: `localhost,14333`.
- Base: `RequirementsDb`.
- Usuario local: `sa`.
- Contraseña local Docker: la misma usada en `APPTRAFICOMKT_SQL_PASSWORD`.

## Borrar credenciales almacenadas

En Power BI Desktop:

1. Ir a `Archivo > Opciones y configuracion > Configuracion de origen de datos`.
2. Seleccionar `localhost,14333`.
3. Usar `Borrar permisos`.
4. Actualizar nuevamente e ingresar credenciales correctas.

## Actualizar el modelo

1. Abrir el PBIP.
2. Confirmar parametros.
3. Seleccionar `Actualizar`.
4. Revisar que las consultas carguen desde el esquema `bi`.

## Revisar relaciones

En la vista Modelo de Power BI:

- `FactProducto.RequerimientoId` hacia `FactRequerimiento.RequerimientoId`.
- `FactAprobacion.ProductoId` hacia `FactProducto.ProductoId`.
- `FactSatisfaccion.RequerimientoId` hacia `FactRequerimiento.RequerimientoId`.
- Dimensiones de facultad, sede, tipo producto y KPI hacia sus hechos.

## Comprobar paginas

El reporte debe mostrar cinco paginas:

1. Resumen gerencial.
2. Carga operativa.
3. Atencion y tiempos.
4. Aprobaciones.
5. Detalle operativo.

## Errores frecuentes

| Error | Accion |
| --- | --- |
| Docker Desktop apagado | Abrir Docker Desktop y esperar a que inicie. |
| Puerto `14333` ocupado | Cerrar otro SQL Server/contenedor o cambiar el mapeo en `docker-compose.yml`. |
| Credenciales incorrectas | Actualizar `APPTRAFICOMKT_SQL_PASSWORD` y borrar permisos en Power BI. |
| `RequirementsDb` inexistente | Esperar el inicio de APIs o revisar `docker compose logs requirements-api`. |
| Script SQL falla | Revisar el nombre del script mostrado por `open-powerbi-local.ps1`. |
| Power BI Desktop no instalado | Instalar Power BI Desktop actualizado. |
| PBIP incompatible | Actualizar Power BI Desktop; PBIR/TMDL requieren versiones recientes. |

## Apertura manual

Si necesitas abrirlo manualmente:

```text
analytics/powerbi/AppTraficoMKT.BI.pbip
```
