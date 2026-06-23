# Power BI - métricas de requerimientos y productos

Fuente recomendada: API publicada por Nginx o Cloudflare.

Parámetro sugerido en Power BI:

- `BaseUrl`: `https://localhost` o la URL pública vigente de Cloudflare.

Tablas sugeridas:

- `Requerimientos`: `/api/requirements`
- `AuditoriaRequerimientos`: `/api/requirements/audit`
- `MetricasRequerimientos`: `/api/requirements/metrics`
- `Productos`: `/api/activities`
- `AuditoriaProductos`: `/api/activities/audit`
- `MetricasProductos`: `/api/activities/metrics`

Indicadores recomendados:

- Carga operativa del equipo: productos por responsable y porcentaje de participación.
- Proyectos ejecutados durante el año: requerimientos creados/completados por fecha.
- Tiempo promedio de dedicación: diferencia entre creación, actualización y auditoría por etapa.
- Incidencia institucional: distribución por canal de difusión, KPI principal, público objetivo y tipo de producto.
- Participación de áreas: distribución por facultad, sede, tipo de producto y responsable.
- Eficiencia de gestión: productos aprobados vs pendientes, requerimientos completados vs activos.
- Cuellos de botella: promedio de horas por etapa en auditorías.

Relaciones sugeridas:

- `Requerimientos[id]` 1:N `Productos[requirementId]`
- `Requerimientos[id]` 1:N `AuditoriaRequerimientos[requirementId]`
- `Productos[id]` 1:N `AuditoriaProductos[activityId]`

Medidas DAX sugeridas:

```DAX
% Requerimientos completados =
DIVIDE(
    COUNTROWS(FILTER(Requerimientos, Requerimientos[status] = "Completed")),
    COUNTROWS(Requerimientos)
)

% Productos aprobados =
DIVIDE(
    COUNTROWS(FILTER(Productos, Productos[status] = "Approved")),
    COUNTROWS(Productos)
)

Tiempo promedio requerimiento (días) =
AVERAGEX(
    Requerimientos,
    DATEDIFF(Requerimientos[createdAt], COALESCE(Requerimientos[updatedAt], NOW()), DAY)
)

Participación responsable % =
DIVIDE(
    COUNTROWS(Productos),
    CALCULATE(COUNTROWS(Productos), ALL(Productos[productResponsible]))
)
```

