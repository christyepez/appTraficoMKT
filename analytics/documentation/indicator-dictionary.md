# Diccionario de indicadores

| Indicador | Definicion | Consideracion |
| --- | --- | --- |
| Total requerimientos | Conteo de `FactRequerimiento` | Incluye historicos; filtrar eliminados si se requiere operativo vivo |
| Requerimientos activos | Requerimientos no finalizados ni eliminados | No mezcla completados |
| Requerimientos completados | Estado `Completed` | Cierre valido solo si productos aprobados |
| Requerimientos rechazados | Estado `Rejected` | Incluye eliminacion logica convertida a finalizado rechazado |
| Productos activos | Productos no aprobados ni eliminados | Incluye pendientes, ejecucion, correccion y aprobacion |
| Productos aprobados | Estado actual `Approved` | Producto finalizado |
| Productos rechazados | Decisiones `Rejected` en aprobaciones | No depende del estado actual porque el producto vuelve a proceso |
| Porcentaje de cierre | Completados / total requerimientos | Usar con filtros de fecha |
| Tiempo promedio tecnico | Horas laborables desde inicio tecnico hasta envio a aprobacion | Excluye tiempo pendiente de aprobacion |
| Tiempo promedio aprobacion | Horas laborables desde envio a aprobacion hasta decision | Cuenta como carga del aprobador |
| Tiempo promedio total cerrado | Horas laborables desde creacion hasta cierre | Solo registros cerrados |
| Antiguedad abiertos | Horas laborables desde creacion hasta hoy | Solo abiertos |
| Dias de anticipacion | Fecha inicio evento - fecha solicitud | Puede ser negativo si la solicitud se registro tarde |
| Carga ponderada | Suma de pesos operativos pendientes | Usa parametros demo si no existen pesos reales |
| Horas pendientes | Suma de horas estimadas pendientes | Parametrizacion BI editable |
| Capacidad disponible | Tecnicos activos * 9 horas por dia | Jornada 08:30 a 17:30 |
| Porcentaje ocupacion | Horas pendientes / capacidad disponible | Semaforo operativo |
| Aprobacion primer intento | Productos aprobados con una sola decision | Bajo reproceso |
| Numero de reprocesos | Cantidad de rechazos | Cada rechazo representa retorno al tecnico |
| Satisfaccion promedio | Promedio de satisfaccion general | Meta inicial >= 4 |
| Tasa respuesta encuesta | Encuestas / requerimientos completados | Mide adopcion de encuesta |
| Usuarios ultimos 7 dias | Usuarios con `LastLoginAt` reciente | Aproximacion hasta tener tabla de sesiones |
