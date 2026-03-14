param(
  [switch]$KeepRunning
)

$ErrorActionPreference = "Stop"

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
  throw "Docker is required to run scripts/local-release-check.ps1"
}

function Invoke-Step {
  param(
    [string]$Label,
    [scriptblock]$Action
  )

  Write-Host "==> $Label" -ForegroundColor Cyan
  & $Action
}

function Wait-ForReady {
  param(
    [string]$Url,
    [int]$TimeoutSeconds = 180
  )

  $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
  while ((Get-Date) -lt $deadline) {
    try {
      $response = Invoke-RestMethod -Uri $Url -TimeoutSec 5
      if ($response.status -eq "ready") {
        return
      }
    } catch {
      Start-Sleep -Seconds 3
      continue
    }

    Start-Sleep -Seconds 3
  }

  throw "Timed out waiting for readiness at $Url"
}

try {
  Invoke-Step "Start local stack" {
    docker compose -f docker-compose.local.yml up -d --build
  }

  Invoke-Step "Wait for API readiness" {
    Wait-ForReady -Url "http://localhost:4000/api/v1/health/ready"
  }

  Invoke-Step "Run database migrations inside the API container" {
    docker compose -f docker-compose.local.yml exec -T api npm run db:migrate:runtime
  }

  Invoke-Step "Seed deterministic smoke data" {
    docker compose -f docker-compose.local.yml exec -T api npx tsx scripts/seed-smoke.ts
  }

  Invoke-Step "Run backend tests" {
    npm --prefix Backend test
  }

  Invoke-Step "Run backend lint" {
    npm --prefix Backend run lint
  }

  Invoke-Step "Run backend typecheck" {
    npm --prefix Backend run typecheck
  }

  Invoke-Step "Run Web App lint" {
    npm --prefix "Web App" run lint
  }

  Invoke-Step "Run Web App tests" {
    npm --prefix "Web App" test -- --run
  }

  Invoke-Step "Build Web App" {
    npm --prefix "Web App" run build
  }

  Invoke-Step "Run Website tests" {
    npm --prefix Website test -- --run
  }

  Invoke-Step "Run Website lint" {
    npm --prefix Website run lint
  }

  Invoke-Step "Build Website" {
    npm --prefix Website run build
  }

  Invoke-Step "Run Playwright smoke suite" {
    $env:PLAYWRIGHT_BASE_URL = "http://localhost:8080"
    $env:PLAYWRIGHT_ADMIN_EMAIL = "smoke-admin@extractiq.local"
    $env:PLAYWRIGHT_ADMIN_PASSWORD = "ExtractIQSmoke!2026"
    $env:PLAYWRIGHT_INVITE_TOKEN = "smoke-invite-token-2026"
    $env:PLAYWRIGHT_PROJECT_NAME = "Smoke Project"
    npm --prefix Website run test:e2e
  }

  Write-Host "Local release check passed." -ForegroundColor Green
} finally {
  if (-not $KeepRunning) {
    Write-Host "==> Shutting down local stack" -ForegroundColor Cyan
    docker compose -f docker-compose.local.yml down
  }
}
