# Git Flow y ambientes

## Ramas principales

- `main`: codigo productivo.
- `test`: validacion funcional y QA.
- `develop`: integracion de desarrollo.

## Ramas de trabajo

- `feature/<descripcion>`: nuevas funcionalidades.
- `bugfix/<descripcion>`: correcciones durante desarrollo.
- `hotfix/<descripcion>`: correcciones urgentes desde produccion.
- `release/<version>`: estabilizacion previa a produccion.

## Flujo recomendado

```mermaid
gitGraph
  commit id: "prod inicial"
  branch develop
  checkout develop
  commit id: "feature A"
  branch feature/auditoria
  checkout feature/auditoria
  commit id: "cambio"
  checkout develop
  merge feature/auditoria
  branch test
  checkout test
  merge develop
  checkout main
  merge test
```

## Promocion entre ambientes

1. Crear cambios en `feature/*`.
2. Pull Request hacia `develop`.
3. Validar pipeline CI.
4. Merge a `develop` despliega dev.
5. PR de `develop` hacia `test`.
6. Merge a `test` despliega test.
7. PR de `test` hacia `main`.
8. Merge a `main` despliega prod.

## GitHub Environments

Crear environments:

- `dev`
- `test`
- `prod`

Variables por environment:

- `DEPLOY_ENABLED`
- `DEPLOY_PATH`

Secrets por environment:

- `DEPLOY_HOST`
- `DEPLOY_USER`
- `DEPLOY_SSH_KEY`

Para produccion se recomienda activar aprobadores requeridos en el environment `prod`.

