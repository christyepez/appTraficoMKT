# Abrir el proyecto en Power BI Desktop

1. Instalar Power BI Desktop actualizado con soporte PBIP/PBIR.
2. Abrir:

```text
analytics/powerbi/AppTraficoMKT.BI.pbip
```

3. Revisar parametros:

| Parametro | Local | Test/Prod |
| --- | --- | --- |
| `ServerName` | `localhost,14333` | Servidor SQL institucional |
| `DatabaseName` | `RequirementsDb` | Base donde se crearon vistas `bi` |
| `EnvironmentName` | `dev` | `test` o `prod` |

4. Configurar credenciales desde Power BI Desktop. No guardarlas en Git.
5. Actualizar vista previa.
6. Si Power BI solicita credenciales de bases relacionadas, usar el mismo origen SQL Server o credenciales equivalentes de solo lectura.
