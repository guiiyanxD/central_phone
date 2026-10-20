<#
.SYNOPSIS
  Protección activa contra eliminación accidental de volúmenes en CentralPhone (Docker Compose).
.DESCRIPTION
  Intercepta llamadas a 'docker compose down -v' o 'docker compose down --volumes'
  tanto en la consola local de Windows como en scripts de PowerShell.
#>

function docker {
    $rawArgs = @($args)
    $argsStr = "$rawArgs"

    $hasDown = ($argsStr -match "\bdown\b")
    $hasVolumeFlag = ($argsStr -match "(^|\s)-v(\s|$)" -or $argsStr -match "(^|\s)--volumes(\s|$)")

    if ($hasDown -and $hasVolumeFlag) {
        Write-Host ""
        Write-Host "🛑 [BLOQUEO DE SEGURIDAD - CENTRALPHONE]" -ForegroundColor Red
        Write-Host "Se ha intentado ejecutar 'docker compose down' con flag de eliminación de volúmenes (-v / --volumes)." -ForegroundColor Yellow
        Write-Host "Esta operación destruiría de forma irreversible la base de datos de PostgreSQL (ventas, cajas e inventario)." -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Comandos recomendados:" -ForegroundColor Cyan
        Write-Host "  * Para apagar contenedores preservando datos: docker compose down" -ForegroundColor Green
        Write-Host "  * Para reconstruir tras cambios de código:     docker compose up -d --build" -ForegroundColor Green
        Write-Host ""
        return
    }

    $realDocker = (Get-Command docker -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1).Source
    if ($realDocker) {
        & $realDocker @args
    } else {
        Write-Host "No se encontró el ejecutable docker en el PATH del sistema." -ForegroundColor Red
    }
}

Write-Host "🛡️ Protección de volúmenes Docker activada para CentralPhone en PowerShell." -ForegroundColor Green
