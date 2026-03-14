param(
  [switch]$SkipBuild,
  [switch]$SeedSmokeData,
  [switch]$SeedDemoData
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$runtimeDir = Join-Path $root ".local-runtime"
$logsDir = Join-Path $runtimeDir "logs"
$toolsDir = Join-Path $runtimeDir "tools"
$databaseUrl = "postgresql://mcq_user:mcq_password@localhost:5432/mcq_platform"
$stopScript = Join-Path $PSScriptRoot "stop-local-stack.ps1"

New-Item -ItemType Directory -Force -Path $logsDir, $toolsDir | Out-Null

function Get-PsqlPath {
  $command = Get-Command psql -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $candidate = Get-ChildItem -Path "C:\laragon\bin\postgresql" -Recurse -Filter psql.exe -ErrorAction SilentlyContinue |
    Sort-Object LastWriteTime -Descending |
    Select-Object -First 1

  if ($candidate) {
    return $candidate.FullName
  }

  throw "psql.exe was not found. Install PostgreSQL client tools or ensure Laragon is running."
}

function Download-Tool {
  param(
    [string]$Url,
    [string]$OutputPath
  )

  if (-not (Test-Path $OutputPath)) {
    Invoke-WebRequest -Uri $Url -OutFile $OutputPath
  }
}

function Start-LoggedProcess {
  param(
    [string]$Name,
    [string]$FilePath,
    [string]$Arguments,
    [string]$WorkingDirectory = $root,
    [hashtable]$Environment = @{}
  )

  $stdout = Join-Path $logsDir "$Name.out.log"
  $stderr = Join-Path $logsDir "$Name.err.log"

  $process = Start-Process -FilePath $FilePath `
    -ArgumentList $Arguments `
    -WorkingDirectory $WorkingDirectory `
    -RedirectStandardOutput $stdout `
    -RedirectStandardError $stderr `
    -WindowStyle Hidden `
    -PassThru

  foreach ($entry in $Environment.GetEnumerator()) {
    [System.Environment]::SetEnvironmentVariable($entry.Key, $entry.Value, "Process")
  }

  return $process
}

function Wait-ForHttp {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 120
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5 | Out-Null
      return
    } catch {
      Start-Sleep -Seconds 2
    }
  }

  throw "Timed out waiting for $Url"
}

function Invoke-SeedValidation {
  param(
    [string]$PsqlPath
  )

  $counts = & $PsqlPath -h localhost -p 5432 -U mcq_user -d mcq_platform -At -c "SELECT (SELECT count(*) FROM workspaces), (SELECT count(*) FROM users), (SELECT count(*) FROM projects), (SELECT count(*) FROM review_items), (SELECT count(*) FROM export_jobs);"
  $parts = $counts.Trim().Split('|')
  if ($parts.Length -ne 5) {
    throw "Unable to validate seeded smoke data."
  }

  $labels = @('workspaces', 'users', 'projects', 'review_items', 'export_jobs')
  for ($i = 0; $i -lt $labels.Length; $i++) {
    if ([int]$parts[$i] -lt 1) {
      throw "Seed validation failed: expected at least one row in $($labels[$i])."
    }
  }
}

if (Test-Path $stopScript) {
  Write-Host "==> Stopping any existing local stack" -ForegroundColor Cyan
  & powershell -ExecutionPolicy Bypass -File $stopScript | Out-Null
}

$psqlPath = Get-PsqlPath

Write-Host "==> Ensuring local PostgreSQL role and database" -ForegroundColor Cyan
$env:PGPASSWORD = "mcq_password"
& $psqlPath -h localhost -p 5432 -U postgres -d postgres -c "DO `$$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'mcq_user') THEN CREATE ROLE mcq_user LOGIN PASSWORD 'mcq_password'; END IF; END `$$;" | Out-Null
& $psqlPath -h localhost -p 5432 -U postgres -d postgres -tc "SELECT 1 FROM pg_database WHERE datname = 'mcq_platform';" | ForEach-Object {
  if (-not $_.Trim()) {
    & $psqlPath -h localhost -p 5432 -U postgres -d postgres -c "CREATE DATABASE mcq_platform OWNER mcq_user;" | Out-Null
  }
}

$minioExe = Join-Path $toolsDir "minio.exe"
$mcExe = Join-Path $toolsDir "mc.exe"

Write-Host "==> Downloading MinIO tools if needed" -ForegroundColor Cyan
Download-Tool -Url "https://dl.min.io/server/minio/release/windows-amd64/minio.exe" -OutputPath $minioExe
Download-Tool -Url "https://dl.min.io/client/mc/release/windows-amd64/mc.exe" -OutputPath $mcExe

if (-not (Test-NetConnection -ComputerName localhost -Port 9000 -InformationLevel Quiet)) {
  Write-Host "==> Starting MinIO on localhost:9000" -ForegroundColor Cyan
  $env:MINIO_ROOT_USER = "minioadmin"
  $env:MINIO_ROOT_PASSWORD = "minioadmin"
  $minioProcess = Start-Process -FilePath $minioExe `
    -ArgumentList "server `"$runtimeDir\minio-data`" --console-address `":9001`"" `
    -WorkingDirectory $root `
    -RedirectStandardOutput (Join-Path $logsDir "minio.out.log") `
    -RedirectStandardError (Join-Path $logsDir "minio.err.log") `
    -WindowStyle Hidden `
    -PassThru
  Wait-ForHttp -Url "http://localhost:9000/minio/health/live"
} else {
  $minioProcess = $null
}

Write-Host "==> Configuring MinIO bucket and CORS" -ForegroundColor Cyan
& $mcExe alias set extractiq http://localhost:9000 minioadmin minioadmin | Out-Null
& $mcExe mb extractiq/mcq-platform --ignore-existing | Out-Null
$corsPath = Join-Path $runtimeDir "minio-cors.json"
@'
[
  {
    "AllowedOrigins": ["http://localhost:8080"],
    "AllowedMethods": ["GET", "PUT", "POST", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
'@ | Set-Content -Path $corsPath -Encoding utf8
& $mcExe cors set extractiq/mcq-platform $corsPath | Out-Null

Write-Host "==> Running database migrations" -ForegroundColor Cyan
Push-Location (Join-Path $root "Backend")
try {
  $env:DATABASE_URL = $databaseUrl
  npm run db:migrate:runtime
} finally {
  Pop-Location
}

if ($SeedSmokeData -or $SeedDemoData) {
  Write-Host "==> Seeding deterministic smoke data" -ForegroundColor Cyan
  Push-Location (Join-Path $root "Backend")
  try {
    $env:DATABASE_URL = $databaseUrl
    npm run smoke:seed
    Invoke-SeedValidation -PsqlPath $psqlPath
  } finally {
    Pop-Location
  }
}

if (-not $SkipBuild) {
  Write-Host "==> Building Website and Web App" -ForegroundColor Cyan
  Push-Location (Join-Path $root "Website")
  try {
    npm run build
  } finally {
    Pop-Location
  }
  Push-Location (Join-Path $root "Web App")
  try {
    npm run build
  } finally {
    Pop-Location
  }
}

Write-Host "==> Starting API, worker, and local frontend" -ForegroundColor Cyan

$apiProcess = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run dev:api" `
  -WorkingDirectory (Join-Path $root "Backend") `
  -RedirectStandardOutput (Join-Path $logsDir "api.out.log") `
  -RedirectStandardError (Join-Path $logsDir "api.err.log") `
  -WindowStyle Hidden `
  -PassThru

$workerProcess = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run dev:worker" `
  -WorkingDirectory (Join-Path $root "Backend") `
  -RedirectStandardOutput (Join-Path $logsDir "worker.out.log") `
  -RedirectStandardError (Join-Path $logsDir "worker.err.log") `
  -WindowStyle Hidden `
  -PassThru

$frontendProcess = Start-Process -FilePath "node.exe" `
  -ArgumentList "`"$root\scripts\serve-local-stack.mjs`"" `
  -WorkingDirectory $root `
  -RedirectStandardOutput (Join-Path $logsDir "frontend.out.log") `
  -RedirectStandardError (Join-Path $logsDir "frontend.err.log") `
  -WindowStyle Hidden `
  -PassThru

Wait-ForHttp -Url "http://localhost:4000/api/v1/health"
Wait-ForHttp -Url "http://localhost:8080/"
Wait-ForHttp -Url "http://localhost:8080/app/login"

$state = @{
  api = $apiProcess.Id
  worker = $workerProcess.Id
  frontend = $frontendProcess.Id
  minio = $minioProcess?.Id
} | ConvertTo-Json

$state | Set-Content -Path (Join-Path $runtimeDir "pids.json") -Encoding utf8

Write-Host ""
Write-Host "Local stack is running:" -ForegroundColor Green
Write-Host "  Website: http://localhost:8080/"
Write-Host "  Web App: http://localhost:8080/app/login"
Write-Host "  API:     http://localhost:4000/api/v1/health"
Write-Host "  MinIO:   http://localhost:9001/ (minioadmin / minioadmin)"
Write-Host ""
Write-Host "Create your first admin account at: http://localhost:8080/app/register"
if ($SeedSmokeData -or $SeedDemoData) {
  Write-Host "Smoke admin login: smoke-admin@extractiq.local / ExtractIQSmoke!2026"
  Write-Host "Invite token fixture: smoke-invite-token-2026"
}
Write-Host "Logs: $logsDir"
