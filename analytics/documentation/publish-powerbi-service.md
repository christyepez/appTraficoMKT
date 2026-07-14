# Publicar en Power BI Service

1. Abrir el PBIP en Power BI Desktop.
2. Iniciar sesion con la cuenta institucional.
3. Validar que los parametros apunten a `test` o `prod`.
4. Publicar en el workspace definido para Marketing/BI.
5. En Power BI Service, configurar credenciales del dataset.
6. Configurar gateway si SQL Server no es accesible directamente desde Microsoft Fabric/Power BI.
7. Programar actualizacion diaria.

## Recomendaciones

- Usar workspace separado por ambiente: Dev, Test, Prod.
- Mantener nombres de dataset consistentes: `App Trafico MKT BI - DEV/TEST/PROD`.
- Versionar cambios del modelo en Git antes de publicar a Prod.
- No habilitar RLS hasta definir reglas de seguridad de reporte.
