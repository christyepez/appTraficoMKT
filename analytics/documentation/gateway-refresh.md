# Gateway y actualizacion diaria

## Gateway

1. Instalar On-premises Data Gateway en un servidor estable de la organizacion.
2. Registrar el gateway con la cuenta institucional.
3. Agregar origen SQL Server:
   - Servidor: el valor productivo de `ServerName`.
   - Base: `RequirementsDb`.
   - Metodo: SQL o Windows segun politica institucional.
4. Validar conexion.

## Actualizacion

- Frecuencia inicial: una vez al dia.
- Ventana sugerida: fuera del horario laboral, por ejemplo 06:00 America/Guayaquil.
- Reintentos: habilitar reintento automatico de Power BI Service.
- Monitoreo: revisar historial de actualizaciones y alertas del workspace.

## Credenciales

No deben guardarse en repositorio. Deben configurarse en Power BI Desktop/Service o Gateway.
