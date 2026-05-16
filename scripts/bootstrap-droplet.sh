#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────
#  ICC Thinkific Manager — DigitalOcean droplet bootstrap
#  Target: Ubuntu 22.04 / 24.04 LTS, root user
#  Usage (on the droplet, as root):
#    bash bootstrap-droplet.sh
# ─────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────
REPO_URL="https://github.com/rdefoundoux/icc-thinkific-management.git"
REPO_BRANCH="refactor/postgres-icc-rebrand"
APP_DIR="/opt/icc-thinkific-management"
SERVER_DIR="$APP_DIR/pcnc-server"
PG_USER="pcnc"
PG_PASS="$(openssl rand -hex 24)"
PG_DB="pcnc"
NODE_MAJOR=20
DROPLET_IP="$(curl -fsS https://ipinfo.io/ip || echo '143.198.39.187')"

log()  { printf '\n\033[1;36m▶  %s\033[0m\n' "$*"; }
ok()   { printf '   \033[1;32m✓\033[0m %s\n' "$*"; }
fail() { printf '\n\033[1;31m✗  %s\033[0m\n' "$*" >&2; exit 1; }

# ── 0. Sanity ────────────────────────────────────────────────────────
[ "$EUID" -eq 0 ] || fail "Must be run as root"
log "Bootstrap starting on $(hostname) ($DROPLET_IP)"

# ── 1. System packages ───────────────────────────────────────────────
log "Updating apt + installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -qq
apt-get install -y -qq \
    curl ca-certificates gnupg lsb-release \
    git build-essential ufw nginx \
    postgresql postgresql-contrib \
    >/dev/null
ok "base packages installed"

# ── 2. Node.js 20 (NodeSource) ───────────────────────────────────────
if ! command -v node >/dev/null || [ "$(node -v | cut -c2-3)" != "$NODE_MAJOR" ]; then
    log "Installing Node.js $NODE_MAJOR"
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MAJOR}.x" | bash - >/dev/null
    apt-get install -y -qq nodejs >/dev/null
fi
ok "node $(node -v) / npm $(npm -v)"

# ── 3. pm2 ───────────────────────────────────────────────────────────
if ! command -v pm2 >/dev/null; then
    log "Installing pm2"
    npm install -g pm2 >/dev/null
fi
ok "pm2 $(pm2 -v)"

# ── 4. PostgreSQL — create user + DB if absent ───────────────────────
log "Configuring PostgreSQL"
systemctl enable --now postgresql >/dev/null
PG_USER_EXISTS=$(sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$PG_USER'")
if [ "$PG_USER_EXISTS" = "1" ]; then
    ok "user '$PG_USER' already exists — leaving as is"
    PG_PASS="$(grep -E '^DATABASE_URL=' "$SERVER_DIR/.env" 2>/dev/null | sed -E 's|.*://[^:]+:([^@]+)@.*|\1|' || echo "$PG_PASS")"
else
    sudo -u postgres psql -v ON_ERROR_STOP=1 <<SQL
CREATE USER ${PG_USER} WITH PASSWORD '${PG_PASS}';
CREATE DATABASE ${PG_DB} OWNER ${PG_USER};
GRANT ALL PRIVILEGES ON DATABASE ${PG_DB} TO ${PG_USER};
SQL
    ok "created user '$PG_USER' and database '$PG_DB'"
fi
DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@localhost:5432/${PG_DB}?schema=public"

# ── 5. Firewall ──────────────────────────────────────────────────────
log "Configuring firewall (ufw)"
ufw allow OpenSSH >/dev/null 2>&1 || true
ufw allow 'Nginx Full' >/dev/null 2>&1 || true
yes | ufw enable >/dev/null 2>&1 || true
ok "ufw active"

# ── 6. Clone / update repo ───────────────────────────────────────────
if [ ! -d "$APP_DIR/.git" ]; then
    log "Cloning $REPO_URL → $APP_DIR"
    git clone --branch "$REPO_BRANCH" "$REPO_URL" "$APP_DIR"
else
    log "Pulling latest $REPO_BRANCH"
    git -C "$APP_DIR" fetch --quiet origin
    git -C "$APP_DIR" checkout "$REPO_BRANCH" --quiet
    git -C "$APP_DIR" reset --hard "origin/$REPO_BRANCH" --quiet
fi
ok "repo at $(git -C "$APP_DIR" rev-parse --short HEAD)"

# ── 7. Server .env ───────────────────────────────────────────────────
log "Writing $SERVER_DIR/.env"
mkdir -p "$SERVER_DIR"
if [ ! -f "$SERVER_DIR/.env" ]; then
    JWT_SECRET="$(openssl rand -hex 48)"
    COOKIE_SECRET="$(openssl rand -hex 48)"
    cat > "$SERVER_DIR/.env" <<EOF
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

DATABASE_URL=${DATABASE_URL}

JWT_SECRET=${JWT_SECRET}
COOKIE_SECRET=${COOKIE_SECRET}
COOKIE_DOMAIN=

FRONTEND_URL=http://${DROPLET_IP}
ALLOWED_ORIGINS=http://${DROPLET_IP},http://${DROPLET_IP}:5173

# ── Thinkific — REPLACE WITH REAL VALUES ────────────────────────────
THINKIFIC_CLIENT_ID=replace_me
THINKIFIC_CLIENT_SECRET=replace_me
THINKIFIC_SUBDOMAIN=replace_me
THINKIFIC_OAUTH_REDIRECT_URI=http://${DROPLET_IP}/api/v1/auth/thinkific/callback

# ── Elvanto — REPLACE WITH REAL VALUES ──────────────────────────────
ELVANTO_CLIENT_ID=replace_me
ELVANTO_CLIENT_SECRET=replace_me
ELVANTO_REDIRECT_URI=http://${DROPLET_IP}/api/v1/elvanto/callback

# ── Zoom (optional) ─────────────────────────────────────────────────
ZOOM_ACCOUNT_ID=
ZOOM_CLIENT_ID=
ZOOM_CLIENT_SECRET=

# ── SMTP (optional) ─────────────────────────────────────────────────
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=
EOF
    chmod 600 "$SERVER_DIR/.env"
    ok ".env generated with random secrets"
else
    ok ".env already exists — leaving as is"
fi

# ── 8. npm install + prisma generate + migrate ───────────────────────
log "Installing server deps"
cd "$SERVER_DIR"
npm ci --omit=dev >/dev/null
ok "deps installed ($(jq -r '.dependencies | keys | length' package.json) packages)"

log "Prisma: generate + migrate deploy"
npx prisma generate >/dev/null
# Use migrate deploy in prod; if no migrations exist yet, fall back to db push
if [ -d "prisma/migrations" ] && [ -n "$(ls -A prisma/migrations 2>/dev/null)" ]; then
    npx prisma migrate deploy
else
    npx prisma db push --skip-generate
fi
ok "database schema in sync"

# ── 9. pm2 ───────────────────────────────────────────────────────────
log "Starting pcnc-server under pm2"
pm2 delete pcnc-server >/dev/null 2>&1 || true
pm2 start src/server.js --name pcnc-server --time --max-memory-restart 500M
pm2 save >/dev/null
pm2 startup systemd -u root --hp /root >/dev/null
ok "pm2 status:"
pm2 list

# ── 10. nginx reverse proxy ──────────────────────────────────────────
log "Configuring nginx → :3000"
cat > /etc/nginx/sites-available/pcnc <<NGINX
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 90s;
    }
}
NGINX
ln -sf /etc/nginx/sites-available/pcnc /etc/nginx/sites-enabled/pcnc
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
ok "nginx serving http://$DROPLET_IP"

# ── 11. Smoke test ───────────────────────────────────────────────────
log "Smoke test"
sleep 2
curl -fsS http://127.0.0.1:3000/health && echo
curl -fsS http://127.0.0.1:3000/ready  && echo
ok "API responds"

# ── 12. Summary ──────────────────────────────────────────────────────
cat <<EOF

╔══════════════════════════════════════════════════════════════════╗
║   ICC Thinkific Manager  —  Droplet bootstrap COMPLETE          ║
╠══════════════════════════════════════════════════════════════════╣
║   App dir       : $APP_DIR
║   Branch        : $REPO_BRANCH @ $(git -C "$APP_DIR" rev-parse --short HEAD)
║   API           : http://$DROPLET_IP/api/v1
║   Health        : http://$DROPLET_IP/health
║   Postgres      : postgresql://${PG_USER}:***@localhost:5432/${PG_DB}
║
║   Manage app    : pm2 logs pcnc-server | pm2 restart pcnc-server
║   Update code   : cd $APP_DIR && git pull && cd pcnc-server \\
║                   && npm ci --omit=dev && npx prisma migrate deploy \\
║                   && pm2 restart pcnc-server
║
║   IMPORTANT — edit $SERVER_DIR/.env and fill in:
║     • THINKIFIC_CLIENT_ID / SECRET / SUBDOMAIN
║     • ELVANTO_CLIENT_ID / SECRET
║   then: pm2 restart pcnc-server
╚══════════════════════════════════════════════════════════════════╝
EOF
