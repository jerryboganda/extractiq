#!/bin/bash
set -euo pipefail

# ─── ExtractIQ Production Deployment Script ───
# Run on VPS: bash deploy/deploy.sh

APP_DIR="/opt/extractiq"
REPO_URL="https://github.com/jerryboganda/extractiq.git"
NGINX_CONF="/etc/nginx/sites-available/extractiq.conf"
NGINX_LINK="/etc/nginx/sites-enabled/extractiq.conf"
WEB_ROOT="/var/www/extractiq"

echo "═══════════════════════════════════════"
echo "  ExtractIQ Deployment"
echo "═══════════════════════════════════════"

# ── 1. System dependencies ──
echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq curl git nginx docker.io docker-compose-plugin > /dev/null 2>&1

# Install Node.js 20 if not present
if ! command -v node &> /dev/null || [[ $(node --version | cut -d. -f1 | tr -d 'v') -lt 20 ]]; then
    echo "Installing Node.js 20..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - > /dev/null 2>&1
    apt-get install -y -qq nodejs > /dev/null 2>&1
fi

echo "  Node: $(node --version) | npm: $(npm --version) | Docker: $(docker --version | cut -d' ' -f3)"

# ── 2. Clone / pull repo ──
echo "[2/8] Fetching latest code..."
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 3. Backend .env ──
echo "[3/8] Checking environment configuration..."
if [ ! -f "$APP_DIR/Backend/.env" ]; then
    cp "$APP_DIR/Backend/.env.example" "$APP_DIR/Backend/.env"
    # Generate secure secrets
    JWT_SECRET=$(openssl rand -hex 64)
    ENCRYPTION_KEY=$(openssl rand -hex 32)
    POSTGRES_PASSWORD=$(openssl rand -hex 24)
    REDIS_PASSWORD=$(openssl rand -hex 24)

    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$APP_DIR/Backend/.env"
    sed -i "s|ENCRYPTION_KEY=.*|ENCRYPTION_KEY=${ENCRYPTION_KEY}|" "$APP_DIR/Backend/.env"
    sed -i "s|CORS_ORIGIN=.*|CORS_ORIGIN=https://extractiq.polytronx.com|" "$APP_DIR/Backend/.env"
    sed -i "s|NODE_ENV=.*|NODE_ENV=production|" "$APP_DIR/Backend/.env"
    sed -i "s|DATABASE_URL=.*|DATABASE_URL=postgresql://mcq_user:${POSTGRES_PASSWORD}@localhost:5432/mcq_platform|" "$APP_DIR/Backend/.env"
    sed -i "s|REDIS_URL=.*|REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379|" "$APP_DIR/Backend/.env"

    # Create production env file for docker-compose
    cat > "$APP_DIR/.env" <<EOF
POSTGRES_USER=mcq_user
POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
POSTGRES_DB=mcq_platform
REDIS_PASSWORD=${REDIS_PASSWORD}
S3_ACCESS_KEY=minioadmin
S3_SECRET_KEY=$(openssl rand -hex 16)
S3_BUCKET=mcq-platform
EOF

    echo "  ⚠ Generated new .env files with secure secrets"
    echo "  Review $APP_DIR/Backend/.env before proceeding"
fi

# ── 4. Build frontends ──
echo "[4/8] Building Website..."
cd "$APP_DIR/Website"
npm ci --omit=dev > /dev/null 2>&1
npm run build

echo "[4/8] Building Web App..."
cd "$APP_DIR/Web App"
npm ci --omit=dev > /dev/null 2>&1
npm run build

# ── 5. Deploy static files ──
echo "[5/8] Deploying static assets..."
mkdir -p "$WEB_ROOT/website" "$WEB_ROOT/webapp"
rm -rf "$WEB_ROOT/website/"* "$WEB_ROOT/webapp/"*

cp -r "$APP_DIR/Website/dist/"* "$WEB_ROOT/website/"
cp -r "$APP_DIR/Web App/dist/"* "$WEB_ROOT/webapp/"
chown -R www-data:www-data "$WEB_ROOT"

# ── 6. Configure Nginx ──
echo "[6/8] Configuring Nginx..."
cp "$APP_DIR/deploy/nginx/extractiq.conf" "$NGINX_CONF"
ln -sf "$NGINX_CONF" "$NGINX_LINK"
rm -f /etc/nginx/sites-enabled/default 2>/dev/null || true
nginx -t
systemctl reload nginx

# ── 7. Start backend services ──
echo "[7/8] Starting backend services..."
cd "$APP_DIR"
docker compose -f docker-compose.prod.yml up -d --build --remove-orphans

# Wait for services to be healthy
echo "  Waiting for services..."
sleep 15

# ── 8. Run database migrations & seed ──
echo "[8/8] Running database migrations..."
cd "$APP_DIR/Backend"
npm ci > /dev/null 2>&1
npx drizzle-kit migrate
npx tsx packages/db/src/seed.ts || true

echo ""
echo "═══════════════════════════════════════"
echo "  ✓ Deployment Complete!"
echo "═══════════════════════════════════════"
echo ""
echo "  Website:  https://extractiq.polytronx.com"
echo "  Web App:  https://extractiq.polytronx.com/app"
echo "  API:      https://extractiq.polytronx.com/api/v1/health"
echo ""
echo "  Admin credentials were printed during seed step above."
echo "  If this is a fresh deploy, scroll up to find them."
echo "  Change the password immediately after first login."
echo ""
