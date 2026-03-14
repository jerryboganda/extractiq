$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".local-runtime"
$pidFile = Join-Path $runtimeDir "pids.json"
$ports = @(4000, 8080, 9000, 9001)

function Stop-ListenerOnPort {
  param(
    [int]$Port
  )

  $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
    Select-Object -ExpandProperty OwningProcess -Unique

  foreach ($owningProcessId in $connections) {
    try {
      Stop-Process -Id $owningProcessId -Force -ErrorAction Stop
      Write-Host "Stopped listener on port $Port (PID $owningProcessId)" -ForegroundColor Cyan
    } catch {
      Write-Host "Listener on port $Port (PID $owningProcessId) was not running." -ForegroundColor Yellow
    }
  }
}

if (-not (Test-Path $pidFile)) {
  foreach ($port in $ports) {
    Stop-ListenerOnPort -Port $port
  }
  Write-Host "No local stack pid file found." -ForegroundColor Yellow
  exit 0
}

$state = Get-Content -Path $pidFile | ConvertFrom-Json

foreach ($name in "frontend", "worker", "api", "minio") {
  $processId = $state.$name
  if ($processId) {
    try {
      Stop-Process -Id $processId -Force -ErrorAction Stop
      Write-Host "Stopped $name (PID $processId)" -ForegroundColor Cyan
    } catch {
      Write-Host "$name (PID $processId) was not running." -ForegroundColor Yellow
    }
  }
}

foreach ($port in $ports) {
  Stop-ListenerOnPort -Port $port
}

Remove-Item $pidFile -Force
