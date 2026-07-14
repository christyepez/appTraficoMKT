[CmdletBinding()]
param(
    [string]$ConfigPath,
    [switch]$SkipGitUpdate,
    [switch]$SkipOpenPowerBI
)

$ErrorActionPreference = "Stop"
Set-StrictMode -Version Latest

function Write-Step {
    param([string]$Message)
    Write-Host ""
    Write-Host "==> $Message" -ForegroundColor Cyan
}

function Write-Ok {
    param([string]$Message)
    Write-Host "OK  $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "WARN $Message" -ForegroundColor Yellow
}

function Fail {
    param([string]$Message)
    throw $Message
}

function Get-RepoRoot {
    $current = (Resolve-Path ".").Path
    while ($true) {
        if ((Test-Path (Join-Path $current "docker-compose.yml") -PathType Leaf) -and
            (Test-Path (Join-Path $current "analytics\powerbi\AppTraficoMKT.BI.pbip") -PathType Leaf)) {
            return $current
        }

        $parent = Split-Path -Parent $current
        if ($parent -eq $current -or [string]::IsNullOrWhiteSpace($parent)) {
            Fail "No se encontro la raiz del repositorio. Ejecuta este script desde appTraficoMKT o una subcarpeta."
        }
        $current = $parent
    }
}

function ConvertTo-PlainText {
    param([System.Security.SecureString]$SecureString)
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($SecureString)
    try {
        return [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr)
    }
    finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr)
    }
}

function Test-Command {
    param([string]$Name)
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Invoke-Checked {
    param(
        [string]$DisplayName,
        [scriptblock]$Command
    )

    try {
        & $Command
        if ($LASTEXITCODE -ne $null -and $LASTEXITCODE -ne 0) {
            Fail "$DisplayName fallo con codigo $LASTEXITCODE."
        }
    }
    catch {
        Fail "$DisplayName fallo. $($_.Exception.Message)"
    }
}

function Invoke-SqlText {
    param(
        [string]$Sql,
        [string]$Database = $script:DatabaseName,
        [string]$FailureLabel = "Consulta SQL"
    )

    if ($script:UseLocalSqlCmd) {
        $previous = $env:SQLCMDPASSWORD
        try {
            $env:SQLCMDPASSWORD = $script:SqlPasswordPlain
            $Sql | & $script:SqlCmdPath -S $script:ServerName -U $script:SqlUser -d $Database -C -b -W -h -1
            if ($LASTEXITCODE -ne 0) { Fail "$FailureLabel fallo con sqlcmd local." }
        }
        finally {
            $env:SQLCMDPASSWORD = $previous
        }
        return
    }

    $previous = $env:SQLCMDPASSWORD
    try {
        $env:SQLCMDPASSWORD = $script:SqlPasswordPlain
        $Sql | docker exec -i -e SQLCMDPASSWORD $script:SqlContainerName /opt/mssql-tools18/bin/sqlcmd -S localhost -U $script:SqlUser -d $Database -C -b -W -h -1
        if ($LASTEXITCODE -ne 0) { Fail "$FailureLabel fallo con sqlcmd dentro del contenedor." }
    }
    finally {
        $env:SQLCMDPASSWORD = $previous
    }
}

function Invoke-SqlFile {
    param([string]$Path)

    if (-not (Test-Path $Path -PathType Leaf)) {
        Fail "No existe el script SQL requerido: $Path"
    }

    Write-Step "Ejecutando $(Split-Path -Leaf $Path)"
    try {
        $sql = Get-Content -Raw $Path
        Invoke-SqlText -Sql $sql -FailureLabel "Script $(Split-Path -Leaf $Path)"
        Write-Ok "Ejecutado $(Split-Path -Leaf $Path)"
    }
    catch {
        Fail "El script SQL fallo: $Path. $($_.Exception.Message)"
    }
}

function Wait-SqlReady {
    param([int]$TimeoutSeconds = 180)

    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $attempt = 0
    while ((Get-Date) -lt $deadline) {
        $attempt++
        try {
            Invoke-SqlText -Sql "SELECT 1;" -Database "master" -FailureLabel "Prueba de conexion SQL" | Out-Null
            Write-Ok "SQL Server responde."
            return
        }
        catch {
            Start-Sleep -Seconds 5
            Write-Host "Esperando SQL Server... intento $attempt" -ForegroundColor DarkGray
        }
    }

    Fail "SQL Server no respondio en $TimeoutSeconds segundos. Revisa Docker Desktop, el contenedor $script:SqlContainerName y el puerto 14333."
}

function Find-PowerBIDesktop {
    $programFilesX86 = [Environment]::GetEnvironmentVariable("ProgramFiles(x86)")
    $candidates = @(
        "$env:ProgramFiles\Microsoft Power BI Desktop\bin\PBIDesktop.exe",
        "$programFilesX86\Microsoft Power BI Desktop\bin\PBIDesktop.exe",
        "$env:LOCALAPPDATA\Microsoft\WindowsApps\PBIDesktop.exe"
    ) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) }

    foreach ($candidate in $candidates) {
        if (Test-Path $candidate -PathType Leaf) { return $candidate }
    }

    $storePackage = Get-AppxPackage -Name "Microsoft.MicrosoftPowerBIDesktop" -ErrorAction SilentlyContinue
    if ($storePackage) {
        $storeExe = Join-Path $storePackage.InstallLocation "bin\PBIDesktop.exe"
        if (Test-Path $storeExe -PathType Leaf) { return $storeExe }
    }

    $command = Get-Command "PBIDesktop.exe" -ErrorAction SilentlyContinue
    if ($command) { return $command.Source }

    return $null
}

try {
    $repoRoot = Get-RepoRoot
    Set-Location $repoRoot

    $defaultConfigPath = Join-Path $repoRoot "analytics\config\local.example.psd1"
    if ([string]::IsNullOrWhiteSpace($ConfigPath)) { $ConfigPath = $defaultConfigPath }
    if (-not (Test-Path $ConfigPath -PathType Leaf)) {
        Fail "No existe el archivo de configuracion: $ConfigPath"
    }

    $config = Import-PowerShellDataFile -Path $ConfigPath
    $script:ServerName = [string]$config.ServerName
    $script:DatabaseName = [string]$config.DatabaseName
    $script:EnvironmentName = [string]$config.EnvironmentName
    $script:SqlUser = [string]$config.SqlUser
    $passwordEnvName = [string]$config.SqlPasswordEnvironmentVariable
    $script:SqlContainerName = "requirements-sqlserver"

    if ([string]::IsNullOrWhiteSpace($script:ServerName)) { Fail "ServerName no esta configurado." }
    if ([string]::IsNullOrWhiteSpace($script:DatabaseName)) { Fail "DatabaseName no esta configurado." }
    if ([string]::IsNullOrWhiteSpace($script:SqlUser)) { Fail "SqlUser no esta configurado." }
    if ([string]::IsNullOrWhiteSpace($passwordEnvName)) { Fail "SqlPasswordEnvironmentVariable no esta configurado." }

    $passwordValue = [Environment]::GetEnvironmentVariable($passwordEnvName, "Process")
    if ([string]::IsNullOrEmpty($passwordValue)) {
        $passwordValue = [Environment]::GetEnvironmentVariable($passwordEnvName, "User")
    }
    if ([string]::IsNullOrEmpty($passwordValue)) {
        Write-Warn "No existe la variable $passwordEnvName. Se solicitara la clave local sin mostrarla."
        $secure = Read-Host "Clave SQL local para $($script:SqlUser) en $($script:ServerName)" -AsSecureString
        $script:SqlPasswordPlain = ConvertTo-PlainText $secure
    }
    else {
        $script:SqlPasswordPlain = $passwordValue
    }

    Write-Step "Validando Docker Desktop"
    if (-not (Test-Command "docker")) {
        Fail "Docker no esta disponible. Instala o inicia Docker Desktop y vuelve a ejecutar."
    }
    docker version | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Fail "Docker Desktop no responde. Abre Docker Desktop y espera a que este iniciado."
    }
    Write-Ok "Docker disponible."

    if (-not $SkipGitUpdate) {
        Write-Step "Actualizando rama main"
        Invoke-Checked "git checkout main" { git checkout main }
        Invoke-Checked "git pull origin main" { git pull origin main }
        Write-Ok "main actualizado."
    }

    Write-Step "Levantando servicios necesarios para BI"
    $services = @("sqlserver", "requirements-api", "activities-api", "evidence-api", "identity-api", "administration-api")
    docker compose up -d $services
    if ($LASTEXITCODE -ne 0) {
        Fail "No se pudieron levantar los servicios BI. Si el error menciona el puerto 14333, revisa que no este ocupado por otro SQL Server o contenedor."
    }
    Write-Ok "Servicios solicitados a Docker Compose: $($services -join ', ')"

    $containerId = docker ps -q -f "name=^/$($script:SqlContainerName)$"
    if ([string]::IsNullOrWhiteSpace($containerId)) {
        Fail "El contenedor $($script:SqlContainerName) no esta iniciado. Revisa docker compose ps sqlserver."
    }

    $sqlCmdCommand = Get-Command "sqlcmd" -ErrorAction SilentlyContinue
    $script:SqlCmdPath = if ($sqlCmdCommand) { $sqlCmdCommand.Source } else { $null }
    $script:UseLocalSqlCmd = -not [string]::IsNullOrWhiteSpace($script:SqlCmdPath)
    if ($script:UseLocalSqlCmd) {
        Write-Ok "Se usara sqlcmd local: $($script:SqlCmdPath)"
    }
    else {
        Write-Warn "sqlcmd local no esta instalado. Se usara sqlcmd dentro del contenedor $($script:SqlContainerName)."
    }

    Write-Step "Esperando disponibilidad de SQL Server"
    Wait-SqlReady -TimeoutSeconds 240

    Write-Step "Validando bases logicas"
    $dbCheckSql = @"
SELECT COUNT(*) AS ExistingDatabases
FROM sys.databases
WHERE name IN ('RequirementsDb','ActivitiesDb','EvidenceDb','IdentityDb','AdministrationDb');
"@
    $dbCountText = (Invoke-SqlText -Sql $dbCheckSql -Database "master" -FailureLabel "Validacion de bases") | Out-String
    $dbCount = [int](($dbCountText -split "\r?\n" | Where-Object { $_.Trim() -match "^\d+$" } | Select-Object -First 1).Trim())
    if ($dbCount -lt 5) {
        Fail "No existen las 5 bases logicas requeridas. Encontradas: $dbCount. Espera a que terminen de iniciar las APIs o revisa docker compose logs."
    }
    Write-Ok "Bases logicas disponibles: $dbCount/5."

    $sqlScripts = @(
        "analytics\sql\00-create-bi-schema.sql",
        "analytics\sql\01-working-time.sql",
        "analytics\sql\02-analytic-views.sql",
        "analytics\sql\03-quality-validations.sql"
    )
    foreach ($scriptPath in $sqlScripts) {
        Invoke-SqlFile -Path (Join-Path $repoRoot $scriptPath)
    }

    Write-Step "Validando esquema BI"
    $validationSql = @"
SELECT COUNT(*) FROM sys.schemas WHERE name = 'bi';
SELECT COUNT(*) FROM sys.views v INNER JOIN sys.schemas s ON s.schema_id = v.schema_id WHERE s.name = 'bi';
SELECT COUNT(*) FROM sys.objects WHERE object_id = OBJECT_ID('bi.fn_WorkingMinutes') AND type IN ('FN','IF','TF');
SELECT COUNT(*) FROM sys.tables t INNER JOIN sys.schemas s ON s.schema_id = t.schema_id WHERE s.name = 'bi' AND t.name IN ('Holidays','ProductTypeWeights','ApprovalThresholds');
SELECT bi.fn_WorkingMinutes('2026-07-13T08:30:00','2026-07-13T17:30:00');
"@
    $validationText = (Invoke-SqlText -Sql $validationSql -FailureLabel "Validacion BI") | Out-String
    $numbers = @($validationText -split "\r?\n" | ForEach-Object { $_.Trim() } | Where-Object { $_ -match "^\d+(\.\d+)?$" })
    if ($numbers.Count -lt 5) { Fail "No se pudo interpretar la validacion BI. Salida: $validationText" }
    $schemaCount = [int]$numbers[0]
    $viewCount = [int]$numbers[1]
    $functionCount = [int]$numbers[2]
    $configTableCount = [int]$numbers[3]
    $workingMinutes = [int]$numbers[4]

    if ($schemaCount -ne 1) { Fail "No existe el esquema bi." }
    if ($viewCount -lt 20) { Fail "Se esperaban al menos 20 vistas bi, pero se encontraron $viewCount." }
    if ($functionCount -ne 1) { Fail "No existe bi.fn_WorkingMinutes." }
    if ($configTableCount -lt 3) { Fail "Faltan tablas de configuracion BI. Encontradas: $configTableCount/3." }
    if ($workingMinutes -le 0) { Fail "bi.fn_WorkingMinutes devolvio $workingMinutes; se esperaba un valor positivo para la prueba solicitada." }
    Write-Ok "Vistas BI: $viewCount. Funcion laboral: $workingMinutes minutos."

    Write-Step "Validando PBIP, PBIR y modelo semantico"
    $pbipPath = Join-Path $repoRoot "analytics\powerbi\AppTraficoMKT.BI.pbip"
    $reportPath = Join-Path $repoRoot "analytics\powerbi\AppTraficoMKT.BI.Report"
    $semanticPath = Join-Path $repoRoot "analytics\powerbi\AppTraficoMKT.BI.SemanticModel"
    if (-not (Test-Path $pbipPath -PathType Leaf)) { Fail "No existe el archivo PBIP: $pbipPath" }
    if (-not (Test-Path $reportPath -PathType Container)) { Fail "No existe la carpeta del reporte PBIR: $reportPath" }
    if (-not (Test-Path $semanticPath -PathType Container)) { Fail "No existe la carpeta del modelo semantico: $semanticPath" }
    if ((Test-Path (Join-Path $reportPath "definition") -PathType Container) -and
        (Test-Path (Join-Path $reportPath "report.json") -PathType Leaf)) {
        Fail "El reporte contiene PBIR (definition) y PBIR-Legacy (report.json). Elimina AppTraficoMKT.BI.Report\report.json."
    }

    Get-ChildItem -Path (Join-Path $repoRoot "analytics\powerbi") -Recurse -File -Include *.json,*.pbip,*.pbir,*.pbism |
        ForEach-Object {
            $jsonPath = if ($_.PSObject.Properties.Name -contains "FullName") { $_.FullName } else { $_.ToString() }
            try { Get-Content -Raw $jsonPath | ConvertFrom-Json | Out-Null }
            catch { Fail "JSON/PBIR/PBIP invalido en ${jsonPath}: $($_.Exception.Message)" }
        }

    $pbip = Get-Content -Raw $pbipPath | ConvertFrom-Json
    if (-not $pbip.artifacts -or $pbip.artifacts.Count -lt 1) {
        Fail "El PBIP no contiene artefactos."
    }
    foreach ($artifact in @($pbip.artifacts)) {
        $artifactProperties = @($artifact.PSObject.Properties.Name)
        if ($artifactProperties.Count -ne 1 -or $artifactProperties[0] -ne "report") {
            Fail "El PBIP de Power BI Desktop solo admite artefactos report en esta version. Propiedades encontradas: $($artifactProperties -join ', ')."
        }
    }

    $pbismPath = Join-Path $semanticPath "definition.pbism"
    $pbism = Get-Content -Raw $pbismPath | ConvertFrom-Json
    $pbismProperties = @($pbism.PSObject.Properties.Name)
    $unsupportedPbismProperties = @($pbismProperties | Where-Object { $_ -notin @("version") })
    if ($unsupportedPbismProperties.Count -gt 0) {
        Fail "definition.pbism contiene propiedades no soportadas por Power BI Desktop: $($unsupportedPbismProperties -join ', ')."
    }
    $modelBimPath = Join-Path $semanticPath "model.bim"
    $modelTmdlPath = Join-Path $semanticPath "definition\model.tmdl"
    if ([string]$pbism.version -eq "1.0") {
        if (-not (Test-Path $modelBimPath -PathType Leaf)) {
            Fail "definition.pbism version 1.0 requiere model.bim en el modelo semantico."
        }
        if (Test-Path $modelTmdlPath -PathType Leaf) {
            Fail "El modelo semantico tiene model.bim y TMDL al mismo tiempo. Elimina definition\model.tmdl."
        }
        $modelText = Get-Content -Raw $modelBimPath
        try { $modelJson = $modelText | ConvertFrom-Json }
        catch { Fail "model.bim no es JSON valido: $($_.Exception.Message)" }
        if (-not $modelJson.model -or -not $modelJson.model.tables) {
            Fail "model.bim no contiene model.tables."
        }
    }
    elseif ([string]$pbism.version -ge "4.0") {
        if (-not (Test-Path $modelTmdlPath -PathType Leaf)) {
            Fail "definition.pbism version 4.0 o superior requiere definition\model.tmdl."
        }
        $modelText = Get-Content -Raw $modelTmdlPath
        if ($modelText -match "[A-Za-z]:\\") { Fail "El modelo TMDL contiene rutas locales absolutas." }
        if ($modelText -match "(?m)^\s*meta\s+\[") {
            Fail "El modelo TMDL contiene bloques meta no soportados por Power BI Desktop en este contexto."
        }
        if ($modelText -match '`r`n') {
            Fail 'El modelo TMDL contiene secuencias literales de salto de linea (`r`n).'
        }
    }
    else {
        Fail "Version de definition.pbism no soportada: $($pbism.version)."
    }

    foreach ($required in @("ServerName", "DatabaseName", "EnvironmentName", "FactRequerimiento", "FactProducto", "FactAprobacion", "FactSatisfaccion", "FactUsoUsuario", "FactKpiResultado")) {
        if ($modelText -notmatch [regex]::Escape($required)) { Fail "El modelo semantico no contiene $required." }
    }
    $credentialPatterns = @("Pass" + "w0rd", "SqlPassword", "Password=")
    foreach ($pattern in $credentialPatterns) {
        if ($modelText -match [regex]::Escape($pattern)) { Fail "El modelo semantico parece contener credenciales." }
    }

    $reportPagesPath = Join-Path $reportPath "definition\pages"
    if (-not (Test-Path $reportPagesPath -PathType Container)) {
        $reportPagesPath = Join-Path $reportPath "pages"
    }
    $pageCount = (Get-ChildItem -Path $reportPagesPath -Recurse -Filter "page.json").Count
    if ($pageCount -lt 5) { Fail "Se esperaban 5 paginas PBIR, pero se encontraron $pageCount." }
    $visualCount = (Get-ChildItem -Path $reportPagesPath -Recurse -Filter "visual.json" -ErrorAction SilentlyContinue).Count
    Write-Ok "PBIP/PBIR/modelo semantico validado. Paginas: $pageCount. Visuales: $visualCount."

    if (-not $SkipOpenPowerBI) {
        Write-Step "Abriendo Power BI Desktop"
        $powerBiExe = Find-PowerBIDesktop
        try {
            if ($powerBiExe) {
                Start-Process -FilePath $powerBiExe -ArgumentList "`"$pbipPath`""
                Write-Ok "Power BI Desktop iniciado: $powerBiExe"
            }
            else {
                Write-Warn "No se encontro PBIDesktop.exe. Se intentara abrir el PBIP por asociacion de Windows."
                Start-Process -FilePath $pbipPath
                Write-Ok "Solicitud de apertura enviada a Windows."
            }
        }
        catch {
            Fail "No se pudo abrir Power BI Desktop. Instala Power BI Desktop actualizado o abre manualmente: $pbipPath. Detalle: $($_.Exception.Message)"
        }
    }
    else {
        Write-Warn "Apertura de Power BI omitida por parametro -SkipOpenPowerBI."
    }

    Write-Host ""
    Write-Host "Resumen local Power BI" -ForegroundColor Green
    Write-Host "Servidor: $($script:ServerName)"
    Write-Host "Base: $($script:DatabaseName)"
    Write-Host "Ambiente: $($script:EnvironmentName)"
    Write-Host "Proyecto: $pbipPath"
    Write-Host "Vistas BI: $viewCount"
    Write-Host "Funcion laboral: OK ($workingMinutes minutos en la prueba solicitada; la funcion interpreta timestamps como UTC y convierte a Ecuador)"
    Write-Host ""
    Write-Host "Proximo paso en Power BI Desktop:" -ForegroundColor Cyan
    Write-Host "1. Cuando solicite credenciales, usa SQL Server con usuario '$($script:SqlUser)' y la clave local."
    Write-Host "2. Confirma parametros: ServerName=$($script:ServerName), DatabaseName=$($script:DatabaseName), EnvironmentName=$($script:EnvironmentName)."
    Write-Host "3. Ejecuta Actualizar para cargar las vistas del esquema bi."
}
catch {
    Write-Host ""
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host ""
    Write-Host "Acciones sugeridas:" -ForegroundColor Yellow
    Write-Host "- Verifica que Docker Desktop este abierto."
    Write-Host "- Revisa si el puerto 14333 esta ocupado."
    Write-Host "- Confirma la clave en APPTRAFICOMKT_SQL_PASSWORD."
    Write-Host "- Ejecuta: docker compose ps"
    Write-Host "- Revisa logs: docker compose logs sqlserver"
    exit 1
}
finally {
    if (Get-Variable -Name SqlPasswordPlain -Scope Script -ErrorAction SilentlyContinue) {
        $script:SqlPasswordPlain = $null
    }
}
