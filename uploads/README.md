# Adjuntos locales

Este directorio contiene los archivos binarios gestionados por Evidence API cuando el proveedor activo es `Local`.

Docker Compose lo monta en `/app/uploads`, por lo que los archivos permanecen disponibles al clonar el repositorio y levantar los servicios.

Consideraciones:

- El limite de carga de la aplicacion es 50 MB por archivo.
- No renombre archivos existentes: la base `EvidenceDb` conserva la URL asociada a cada nombre.
- Los archivos pueden contener informacion institucional; el repositorio debe mantenerse privado.
- En produccion se recomienda Azure Blob Storage y una politica de respaldo independiente del codigo fuente.
