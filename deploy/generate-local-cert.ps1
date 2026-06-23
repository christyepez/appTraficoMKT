$ErrorActionPreference = "Stop"

$certDir = Join-Path $PSScriptRoot "certs\local"
$generatorProject = Join-Path $PSScriptRoot "cert-generator\LocalCertGenerator.csproj"

New-Item -ItemType Directory -Force -Path $certDir | Out-Null
dotnet run --project $generatorProject -- $certDir

Write-Host "Navegador: https://localhost"
Write-Host "Nota: al ser autofirmado, el navegador mostrara advertencia de seguridad."
