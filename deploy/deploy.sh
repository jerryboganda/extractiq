#!/bin/bash
set -euo pipefail

APP_DIR="${APP_DIR:-/root/extractiq}"
REPO_URL="${REPO_URL:-git@github.com:jerryboganda/extractiq.git}"
BRANCH="${BRANCH:-main}"

ROOT_ENV_FILE=".env"
BACKEND_ENV_FILE="Backend/.env"
COMPOSE_FILES=(-f docker-compose.prod.yml)

log() {
  printf '\n==> %s\n' "$1"
}

die() {
  printf '\nERROR: %s\n' "$1" >&2
  exit 1
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || die "Required command not found: $1"
}

ensure_prerequisites() {
  local missing=0

  if ! command -v docker >/dev/null 2>&1; then
    missing=1
  fi

  if ! command -v git >/dev/null 2>&1; then
    missing=1
  fi

  if ! command -v curl >/dev/null 2>&1; then
    missing=1
  fi

  if ! docker compose version >/dev/null 2>&1; then
    missing=1
  fi

  if [ "$missing" -eq 0 ]; then
    return 0
  fi

  apt-get update -qq
  apt-get install -y -qq curl git docker.io docker-compose-plugin >/dev/null 2>&1
}

require_file() {
  local path="$1"
  [ -f "$path" ] || die "Required file is missing: $path"
}

require_env_value() {
  local path="$1"
  local key="$2"
  local value

  value="$(grep -E "^${key}=" "$path" | tail -n 1 | cut -d'=' -f2- || true)"
  [ -n "$value" ] || die "Missing required setting ${key} in ${path}"
}

wait_for_http() {
  local url="$1"
  local label="$2"
  local timeout_seconds="${3:-180}"
  local deadline=$((SECONDS + timeout_seconds))

  until curl --silent --show-error --fail "$url" >/dev/null 2>&1; do
    if [ "$SECONDS" -ge "$deadline" ]; then
      die "Timed out waiting for ${label} at ${url}"
    fi
    sleep 3
  done
}

wait_for_ready() {
  local url="$1"
  local timeout_seconds="${2:-180}"
  local deadline=$((SECONDS + timeout_seconds))

  while [ "$SECONDS" -lt "$deadline" ]; do
    local status
    status="$(curl --silent "$url" | sed -n 's/.*"status":"\([^"]*\)".*/\1/p' || true)"
    if [ "$status" = "ready" ]; then
      return 0
    fi
    sleep 3
  done

  die "Timed out waiting for readiness at ${url}"
}

log "Installing deployment prerequisites"
ensure_prerequisites

require_command docker
require_command git
require_command curl

log "Fetching latest code into ${APP_DIR}"
if [ -d "${APP_DIR}/.git" ]; then
  cd "$APP_DIR"
  git fetch origin "$BRANCH"
  git checkout "$BRANCH"
  git reset --hard "origin/${BRANCH}"
else
  git clone --branch "$BRANCH" "$REPO_URL" "$APP_DIR"
  cd "$APP_DIR"
fi

log "Validating production environment files"
require_file "$ROOT_ENV_FILE"
require_file "$BACKEND_ENV_FILE"

for key in POSTGRES_PASSWORD REDIS_PASSWORD S3_ACCESS_KEY S3_SECRET_KEY; do
  require_env_value "$ROOT_ENV_FILE" "$key"
done

for key in APP_BASE_URL CORS_ORIGIN DATABASE_URL REDIS_URL S3_ENDPOINT S3_PUBLIC_ENDPOINT S3_ACCESS_KEY S3_SECRET_KEY S3_BUCKET JWT_SECRET ENCRYPTION_KEY SMTP_HOST SMTP_PORT SMTP_FROM_NAME SMTP_FROM; do
  require_env_value "$BACKEND_ENV_FILE" "$key"
done

enable_email_delivery="$(grep -E '^ENABLE_EMAIL_DELIVERY=' "$BACKEND_ENV_FILE" | tail -n 1 | cut -d'=' -f2- || true)"
if [ "${enable_email_delivery:-true}" = "true" ]; then
  require_env_value "$BACKEND_ENV_FILE" "SMTP_USER"
  require_env_value "$BACKEND_ENV_FILE" "SMTP_PASS"
fi

if docker network inspect nginx-proxy-manager_default >/dev/null 2>&1; then
  COMPOSE_FILES+=(-f docker-compose.prod.proxy.yml)
fi

app_base_url="$(grep -E '^APP_BASE_URL=' "$BACKEND_ENV_FILE" | tail -n 1 | cut -d'=' -f2-)"
cors_origin="$(grep -E '^CORS_ORIGIN=' "$BACKEND_ENV_FILE" | tail -n 1 | cut -d'=' -f2-)"

log "Building and starting the production stack"
docker compose "${COMPOSE_FILES[@]}" build api worker frontend
docker compose "${COMPOSE_FILES[@]}" up -d --remove-orphans

log "Waiting for API liveness"
wait_for_http "http://localhost:4100/api/v1/health" "API liveness"

log "Running runtime-safe database migrations inside the API container"
docker compose "${COMPOSE_FILES[@]}" exec -T api npm run db:migrate:runtime

log "Waiting for dependency readiness"
wait_for_ready "http://localhost:4100/api/v1/health/ready"

log "Deployment checks"
curl --silent --show-error --fail "http://localhost:4100/api/v1/health" >/dev/null
curl --silent --show-error --fail "http://localhost:4100/api/v1/health/ready" >/dev/null
curl --silent --show-error --fail "http://localhost:4101/" >/dev/null

printf '\nDeployment complete.\n'
printf '  Website:  %s/\n' "$cors_origin"
printf '  Web App:  %s/login\n' "$app_base_url"
printf '  API:      %s/api/v1/health\n' "$cors_origin"
