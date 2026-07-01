# Ejecutar una vez como Administrador en el equipo que aloja la aplicación.
$principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    throw "Abra PowerShell con la opción 'Ejecutar como administrador' y vuelva a ejecutar este script."
}

$rules = @(
    @{ Name = "MarketingIndo-HTTP"; Port = 80 },
    @{ Name = "MarketingIndo-HTTPS"; Port = 443 },
    @{ Name = "MarketingIndo-Web-Direct"; Port = 3000 }
)

foreach ($rule in $rules) {
    if (-not (Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue)) {
        New-NetFirewallRule `
            -DisplayName $rule.Name `
            -Direction Inbound `
            -Action Allow `
            -Protocol TCP `
            -LocalPort $rule.Port `
            -Profile Domain,Private | Out-Null
    }
}

$addresses = Get-NetIPAddress -AddressFamily IPv4 |
    Where-Object {
        $_.IPAddress -notlike "169.254.*" -and
        $_.IPAddress -ne "127.0.0.1" -and
        $_.InterfaceAlias -notlike "vEthernet*"
    } |
    Select-Object -ExpandProperty IPAddress -Unique

Write-Host "Puertos habilitados para perfiles de red Dominio y Privado." -ForegroundColor Green
Write-Host "URLs disponibles desde otros equipos:" -ForegroundColor Cyan
foreach ($address in $addresses) {
    Write-Host "  HTTPS: https://$address/login"
    Write-Host "  HTTP directo: http://$address`:3000/login"
}
Write-Host "  Nombre principal: https://MarketingIndo/login (requiere registro DNS o hosts interno)"
