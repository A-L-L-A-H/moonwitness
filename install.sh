#!/usr/bin/env sh
# Moonwitness production installer (Coolify-style Docker Compose stack + First-Light /setup).
#
#   sudo ./install.sh
#   sudo ./install.sh --domain apps.example.com --email ops@example.com
#
# Idempoten: menjalankan ulang tidak menimpa secret/config yang sudah ada.
# Lihat --help untuk daftar flag lengkap.

set -eu

VERSION="0.2.0"
BIN_PATH="/usr/local/bin/arsy"
CONF_DIR="/etc/arsy"
CONF_FILE="$CONF_DIR/config.json"
STATE_FILE="$CONF_DIR/state.json"
LOG_DIR="/var/log/arsy"
UNIT_PATH="/etc/systemd/system/arsy.service"
SERVICE_USER="root"
DEPLOY_DIR="/opt/moonwitness"
MOONWITNESS_REPO_URL="${MOONWITNESS_REPO_URL:-https://github.com/A-L-L-A-H/moonwitness.git}"
MOONWITNESS_BRANCH="${MOONWITNESS_BRANCH:-main}"

SCRIPT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")" 2>/dev/null && pwd || pwd)
REPO_ROOT="$SCRIPT_DIR"
STACK_DIR=""

INSTALL_MODE="auto"
WITH_APP="ask"
WITH_CADDY="no"
DRY_RUN="no"
UNINSTALL="no"
DOMAIN=""
EMAIL=""
LISTEN="127.0.0.1:8787"
APP_DIR=""
BINARY_SRC=""
INSTANCE_NAME="${INSTANCE_NAME:-Moonwitness}"

log()  { printf '  %s\n' "$*"; }
step() { printf '\n==> %s\n' "$*"; }
warn() { printf 'WARN: %s\n' "$*" >&2; }
die()  { printf 'ERROR: %s\n' "$*" >&2; exit 1; }

usage() {
  cat <<'EOF'
Moonwitness installer (Coolify-style Docker Compose + /setup onboarding)

Pemakaian:
  sudo ./install.sh [opsi]

Mode instalasi:
  --docker            pasang stack Docker Compose + First-Light Onboarding (default)
  --systemd           pasang mode systemd legacy (arsy + opsional Node & Caddy host)

Opsi:
  --domain <host>     domain publik untuk app/dashboard (opsional; akses IP HTTP :80 aktif default)
  --email <email>     email ACME TLS untuk domain publik
  --listen <addr>     alamat listen arsy (default 127.0.0.1:8787)
  --binary <path>     pakai binary arsy yang sudah dibangun, jangan build
  --with-app          (mode --systemd) pasang app Node (web + api) sebagai service
  --no-app            (mode --systemd) lewati app Node
  --with-caddy        (mode --systemd) pasang Caddy host untuk --domain
  --app-dir <path>    direktori app Node/stack
  --dry-run           tampilkan rencana tanpa mengubah sistem
  --uninstall         hentikan stack/service tanpa menghapus volume data atau .env
  -h, --help          tampilkan bantuan ini

Contoh:
  sudo ./install.sh
  sudo ./install.sh --domain vps.contoh.id --email admin@contoh.id
  sudo ./install.sh --systemd --domain vps.contoh.id --email admin@contoh.id --with-app --with-caddy
EOF
}

while [ $# -gt 0 ]; do
  case "$1" in
    --docker)     INSTALL_MODE="docker"; shift ;;
    --systemd)    INSTALL_MODE="systemd"; shift ;;
    --domain)     DOMAIN=${2:-}; shift 2 ;;
    --email)      EMAIL=${2:-}; shift 2 ;;
    --listen)     LISTEN=${2:-}; shift 2 ;;
    --binary)     BINARY_SRC=${2:-}; shift 2 ;;
    --app-dir)    APP_DIR=${2:-}; shift 2 ;;
    --with-app)   WITH_APP="yes"; shift ;;
    --no-app)     WITH_APP="no"; shift ;;
    --with-caddy) WITH_CADDY="yes"; shift ;;
    --dry-run)    DRY_RUN="yes"; shift ;;
    --uninstall)  UNINSTALL="yes"; shift ;;
    -h|--help)    usage; exit 0 ;;
    *)            die "opsi tidak dikenal: $1 (lihat --help)" ;;
  esac
done

run() {
  if [ "$DRY_RUN" = "yes" ]; then
    printf '  [dry-run] %s\n' "$*"
    return 0
  fi
  "$@"
}

write_file() {
  target=$1
  mode=$2
  content=$3
  if [ "$DRY_RUN" = "yes" ]; then
    printf '  [dry-run] tulis %s (mode %s)\n' "$target" "$mode"
    return 0
  fi
  printf '%s' "$content" > "$target"
  chmod "$mode" "$target"
}

require_root() {
  if [ "$DRY_RUN" = "yes" ]; then
    return 0
  fi
  if [ "$(id -u)" -ne 0 ]; then
    die "butuh root: jalankan dengan sudo"
  fi
}

detect_os() {
  case "$(uname -s)" in
    Linux) ;;
    *)
      if [ "$DRY_RUN" = "yes" ]; then
        warn "bukan Linux ($(uname -s)); dry-run tetap lanjut untuk pratinjau"
        GOARCH=amd64
        return 0
      fi
      die "install.sh hanya untuk Linux (host VPS)."
      ;;
  esac
  if [ -r /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    log "OS: ${PRETTY_NAME:-$ID}"
  fi
  arch=$(uname -m)
  case "$arch" in
    x86_64|amd64) GOARCH=amd64 ;;
    aarch64|arm64) GOARCH=arm64 ;;
    *) die "arsitektur tidak didukung: $arch" ;;
  esac
  log "Arsitektur: $arch"
}

need_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "butuh perintah '$1'"
}

gen_token() {
  bytes=${1:-32}
  if command -v openssl >/dev/null 2>&1; then
    openssl rand -hex "$bytes"
  else
    od -An -N"$bytes" -tx1 /dev/urandom | tr -d ' \n'
  fi
}

ensure_secret() {
  path=$1
  if [ -s "$path" ]; then
    log "$path sudah ada, dibiarkan"
    return 0
  fi
  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] buat token baru di $path"
    return 0
  fi
  umask 077
  gen_token 32 > "$path"
  chmod 0600 "$path"
  log "$path dibuat (0600)"
}

resolve_mode() {
  if [ "$INSTALL_MODE" != "auto" ]; then
    return 0
  fi
  if [ -f "$REPO_ROOT/docker-compose.yml" ] || [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
    INSTALL_MODE="docker"
  elif [ "$WITH_APP" = "yes" ] || [ "$WITH_CADDY" = "yes" ]; then
    INSTALL_MODE="systemd"
  else
    INSTALL_MODE="docker"
  fi
}

resolve_stack_dir() {
  if [ -n "$APP_DIR" ] && [ -f "$APP_DIR/docker-compose.yml" ]; then
    STACK_DIR="$APP_DIR"
  elif [ -f "$REPO_ROOT/docker-compose.yml" ]; then
    STACK_DIR="$REPO_ROOT"
  elif [ -f "$DEPLOY_DIR/docker-compose.yml" ]; then
    STACK_DIR="$DEPLOY_DIR"
  else
    STACK_DIR="$DEPLOY_DIR"
  fi
}

# ==============================================================================
# Mode 1: Coolify-Style Docker Compose Production Stack
# ==============================================================================

ensure_docker() {
  step "Memeriksa Docker Engine & Compose"
  if command -v docker >/dev/null 2>&1; then
    log "docker: $(docker --version 2>/dev/null || echo terpasang)"
  else
    if [ "$DRY_RUN" = "yes" ]; then
      log "[dry-run] pasang Docker Engine lewat https://get.docker.com"
    else
      if command -v curl >/dev/null 2>&1; then
        curl -fsSL https://get.docker.com | sh
      elif command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq
        apt-get install -y -qq docker.io docker-compose-plugin
      else
        die "butuh docker atau curl/apt-get untuk memasang Docker"
      fi
      if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
        systemctl enable --now docker >/dev/null 2>&1 || true
      fi
    fi
  fi

  if [ "$DRY_RUN" = "no" ]; then
    if ! docker compose version >/dev/null 2>&1; then
      if command -v apt-get >/dev/null 2>&1; then
        apt-get update -qq && apt-get install -y -qq docker-compose-plugin
      fi
      docker compose version >/dev/null 2>&1 || die "docker compose plugin tidak tersedia"
    fi
    log "compose: $(docker compose version 2>/dev/null)"
  fi
}

ensure_stack_source() {
  step "Menyiapkan direktori stack"
  resolve_stack_dir
  if [ -f "$STACK_DIR/docker-compose.yml" ]; then
    log "stack: $STACK_DIR"
    return 0
  fi

  need_cmd git
  log "cloning $MOONWITNESS_REPO_URL ($MOONWITNESS_BRANCH) → $STACK_DIR"
  run git clone --depth 1 --branch "$MOONWITNESS_BRANCH" "$MOONWITNESS_REPO_URL" "$STACK_DIR"
}

upsert_env_if_missing() {
  env_file=$1
  key=$2
  value=$3
  if grep -Eq "^${key}=" "$env_file" 2>/dev/null; then
    return 0
  fi
  printf '%s=%s\n' "$key" "$value" >> "$env_file"
}

setup_docker_env() {
  step "Menyiapkan environment produksi (.env)"
  env_file="$STACK_DIR/.env"
  public_domain=${DOMAIN:-moonwitness.biz.id}
  acme_email=${EMAIL:-admin@moonwitness.biz.id}
  default_cors="https://moonwitness.biz.id,https://a-l-l-a-h.com,https://id.moonwitness.biz.id"
  if [ -n "$DOMAIN" ]; then
    default_cors="https://${DOMAIN},http://${DOMAIN},${default_cors}"
  fi

  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] buat/verifikasi $env_file (tanpa MW_BOOTSTRAP_ADMIN_* agar /setup aktif)"
    return 0
  fi

  if [ ! -f "$env_file" ]; then
    pg_pass=$(gen_token 24)
    umask 077
    cat > "$env_file" <<EOF
# Generated by Moonwitness install.sh v$VERSION
# --- Public Ingress & TLS (Caddy) ---
ACME_EMAIL=$acme_email
DOMAIN_MOONWITNESS=$public_domain
DOMAIN_ALLAH=a-l-l-a-h.com
DOMAIN_API=api.moonwitness.biz.id
DOMAIN_ID=id.moonwitness.biz.id

# --- Core Runtime & Security Secrets ---
NODE_ENV=production
CORS_ORIGINS=$default_cors
TRUSTED_PROXY_COUNT=1
SESSION_SECRET=$(gen_token 32)
JWT_SECRET=$(gen_token 32)
MID_ISSUER_URL=https://id.moonwitness.biz.id
MID_KEY_ENCRYPTION_SECRET=$(gen_token 32)
MID_COOKIE_DOMAIN=.moonwitness.biz.id
STORAGE_ACCESS_KEY=mw-$(gen_token 8)
STORAGE_SECRET_KEY=$(gen_token 32)

# --- Coolify-Style First-Light Onboarding (/setup) ---
# Deliberately leave MW_BOOTSTRAP_ADMIN_* unset so the web /setup wizard creates the superuser.
CONTROL_NATIVE_SETUP=1
INSTANCE_NAME=$INSTANCE_NAME

# --- Database (PostgreSQL) & Seeds ---
POSTGRES_USER=moonwitness
POSTGRES_PASSWORD=$pg_pass
POSTGRES_DB=moonwitness
DATABASE_URL=postgresql://moonwitness:${pg_pass}@postgres:5432/moonwitness
SEED=0
ALLOW_DEMO_SEED=0

# --- Network Services ---
RADIUS_BIND_IP=0.0.0.0
RADIUS_SECRET=$(gen_token 24)
SNMP_CREDENTIAL_KEY=$(gen_token 32)
SNMP_POLL_INTERVAL=60
SNMP_TIMEOUT_MS=2000
SYSLOG_BIND_IP=127.0.0.1
SYSLOG_MAX_MESSAGES=100000
SYSLOG_API_KEY=$(gen_token 24)
SNMP_POLLER_API_KEY=$(gen_token 24)
EOF
    chmod 0600 "$env_file"
    log "$env_file dibuat dengan cryptographic secrets (0600)"
  else
    chmod 0600 "$env_file"
    pg_pass=$(gen_token 24)
    upsert_env_if_missing "$env_file" "POSTGRES_USER" "moonwitness"
    upsert_env_if_missing "$env_file" "POSTGRES_PASSWORD" "$pg_pass"
    upsert_env_if_missing "$env_file" "POSTGRES_DB" "moonwitness"
    pg_user_cur=$(grep -E '^POSTGRES_USER=' "$env_file" | head -n1 | cut -d= -f2- || echo "moonwitness")
    pg_pass_cur=$(grep -E '^POSTGRES_PASSWORD=' "$env_file" | head -n1 | cut -d= -f2- || echo "$pg_pass")
    pg_db_cur=$(grep -E '^POSTGRES_DB=' "$env_file" | head -n1 | cut -d= -f2- || echo "moonwitness")
    upsert_env_if_missing "$env_file" "DATABASE_URL" "postgresql://${pg_user_cur}:${pg_pass_cur}@postgres:5432/${pg_db_cur}"
    upsert_env_if_missing "$env_file" "SESSION_SECRET" "$(gen_token 32)"
    upsert_env_if_missing "$env_file" "JWT_SECRET" "$(gen_token 32)"
    upsert_env_if_missing "$env_file" "MID_KEY_ENCRYPTION_SECRET" "$(gen_token 32)"
    upsert_env_if_missing "$env_file" "STORAGE_ACCESS_KEY" "mw-$(gen_token 8)"
    upsert_env_if_missing "$env_file" "STORAGE_SECRET_KEY" "$(gen_token 32)"
    upsert_env_if_missing "$env_file" "RADIUS_SECRET" "$(gen_token 24)"
    upsert_env_if_missing "$env_file" "SNMP_CREDENTIAL_KEY" "$(gen_token 32)"
    upsert_env_if_missing "$env_file" "SYSLOG_API_KEY" "$(gen_token 24)"
    upsert_env_if_missing "$env_file" "SNMP_POLLER_API_KEY" "$(gen_token 24)"
    upsert_env_if_missing "$env_file" "CONTROL_NATIVE_SETUP" "1"
    upsert_env_if_missing "$env_file" "INSTANCE_NAME" "$INSTANCE_NAME"
    log "$env_file diverifikasi (secret lama dipertahankan)"
  fi
}

setup_arsy_optional() {
  if [ -n "$BINARY_SRC" ] && [ -f "$BINARY_SRC" ]; then
    install_binary
    setup_config
    if [ -d /run/systemd/system ]; then
      install_unit
    fi
    return 0
  fi

  if [ -d "$STACK_DIR/cp/arsy" ] && command -v go >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
    REPO_ROOT="$STACK_DIR"
    install_binary
    setup_config
    install_unit
    return 0
  fi

  log "arsy host agent opsional dilewati (native onboarding Docker aktif)"
}

start_docker_stack() {
  step "Membangun & menyalakan stack Docker Compose"
  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] cd '$STACK_DIR' && docker compose up -d --build --remove-orphans"
    return 0
  fi
  ( cd "$STACK_DIR" && docker compose up -d --build --remove-orphans )
}

wait_docker_health() {
  step "Menunggu healthcheck semua layanan"
  services="postgres caddy web allah api radius snmp-poller syslog"
  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] cek status health: $services"
    return 0
  fi

  elapsed=0
  timeout=90
  while [ "$elapsed" -lt "$timeout" ]; do
    all_healthy="yes"
    for svc in $services; do
      cid=$(cd "$STACK_DIR" && docker compose ps -q "$svc" 2>/dev/null || true)
      if [ -z "$cid" ]; then
        all_healthy="no"
        break
      fi
      health=$(docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}{{.State.Status}}{{end}}' "$cid" 2>/dev/null || echo "unknown")
      if [ "$health" != "healthy" ] && [ "$health" != "running" ]; then
        all_healthy="no"
        break
      fi
    done

    if [ "$all_healthy" = "yes" ]; then
      log "8/8 layanan berstatus healthy"
      return 0
    fi
    sleep 3
    elapsed=$((elapsed + 3))
  done

  warn "Sebagian layanan belum berstatus healthy setelah ${timeout}s:"
  ( cd "$STACK_DIR" && docker compose ps ) || true
  die "stack healthcheck timeout"
}

detect_public_ip() {
  if [ "$DRY_RUN" = "yes" ]; then
    echo "<PUBLIC_IP>"
    return 0
  fi
  ip=""
  if command -v curl >/dev/null 2>&1; then
    ip=$(curl -fsSL --max-time 3 https://api.ipify.org 2>/dev/null || curl -fsSL --max-time 3 https://ifconfig.me 2>/dev/null || true)
  fi
  if [ -z "$ip" ] && command -v hostname >/dev/null 2>&1; then
    ip=$(hostname -I 2>/dev/null | awk '{print $1}' || true)
  fi
  printf '%s' "${ip:-<VPS_IP>}"
}

print_onboarding_banner() {
  public_ip=$(detect_public_ip)
  setup_domain=${DOMAIN:-}
  if [ -z "$setup_domain" ] && [ -f "$STACK_DIR/.env" ]; then
    setup_domain=$(grep -E '^DOMAIN_MOONWITNESS=' "$STACK_DIR/.env" 2>/dev/null | head -n1 | cut -d= -f2- || true)
  fi

  printf '\n================================================================\n'
  printf '  Moonwitness siap untuk First-Light Onboarding\n'
  printf '================================================================\n'
  printf '  Web Setup (IP)   : http://%s/setup\n' "$public_ip"
  if [ -n "$setup_domain" ]; then
    printf '  Web Setup (DNS)  : https://%s/setup\n' "$setup_domain"
  fi
  printf '  Direktori stack  : %s\n' "$STACK_DIR"
  printf '  Environment file : %s/.env\n' "$STACK_DIR"
  printf '================================================================\n\n'
}

# ==============================================================================
# Mode 2: Legacy Systemd Host Installer (arsy + opsional Node & Caddy)
# ==============================================================================

ensure_systemd() {
  if [ "$DRY_RUN" = "yes" ]; then
    return 0
  fi
  if [ ! -d /run/systemd/system ]; then
    die "systemd tidak aktif; arsy dipasang sebagai service systemd"
  fi
}

install_binary() {
  step "Memasang binary arsy"

  if [ -n "$BINARY_SRC" ]; then
    [ -f "$BINARY_SRC" ] || die "binary tidak ditemukan: $BINARY_SRC"
    run install -m 0755 "$BINARY_SRC" "$BIN_PATH"
    log "dari $BINARY_SRC"
    return 0
  fi

  need_cmd go
  log "go: $(go version)"
  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] build $REPO_ROOT/cp/arsy -> $BIN_PATH"
    return 0
  fi
  ( cd "$REPO_ROOT/cp/arsy" && CGO_ENABLED=0 GOOS=linux GOARCH="$GOARCH" \
      go build -trimpath -ldflags "-s -w" -o "$BIN_PATH" ./cmd/arsy )
  chmod 0755 "$BIN_PATH"
  log "binary: $BIN_PATH"
}

setup_config() {
  step "Menyiapkan $CONF_DIR"

  run mkdir -p "$CONF_DIR" "$LOG_DIR"
  run chmod 0750 "$CONF_DIR"
  run chmod 0750 "$LOG_DIR"

  ensure_secret "$CONF_DIR/token-admin"
  ensure_secret "$CONF_DIR/token-readonly"

  if [ -f "$CONF_FILE" ]; then
    log "$CONF_FILE sudah ada, dibiarkan"
  else
    write_file "$CONF_FILE" 0640 "$(cat <<EOF
{
  "listen": "$LISTEN",
  "state_path": "$STATE_FILE",
  "audit_path": "$LOG_DIR/audit.jsonl",
  "token_admin_file": "$CONF_DIR/token-admin",
  "token_readonly_file": "$CONF_DIR/token-readonly",
  "allow": {
    "units": ["arsy", "caddy", "docker", "moonwitness-*"],
    "containers": ["moonwitness-*", "arsy-*"],
    "paths": ["$CONF_DIR", "/etc/caddy", "/opt/moonwitness", "/var/lib/moonwitness"],
    "users": ["deploy", "moonwitness"],
    "cron_owners": ["root"]
  }
}
EOF
)"
  fi

  if [ -f "$STATE_FILE" ]; then
    log "$STATE_FILE sudah ada, dibiarkan"
  else
    write_file "$STATE_FILE" 0640 "$(cat <<EOF
{
  "version": 1,
  "resources": [
    { "kind": "dir", "path": "/opt/moonwitness", "mode": "0755" },
    { "kind": "systemd", "name": "arsy", "state": "started", "enabled": true }
  ]
}
EOF
)"
  fi
}

install_unit() {
  step "Memasang arsy.service"

  unit=$(cat <<EOF
[Unit]
Description=arsy control plane
Documentation=file://$REPO_ROOT/docs/superpowers/specs/2026-11-11-arsy-control-plane-design.md
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=$BIN_PATH serve --config $CONF_FILE
Restart=on-failure
RestartSec=2
User=$SERVICE_USER
Environment=ARSY_LISTEN=$LISTEN

# Guardrail proses
NoNewPrivileges=yes
PrivateTmp=yes
ProtectHome=read-only
ProtectSystem=full
ReadWritePaths=$CONF_DIR $LOG_DIR /etc/caddy /opt/moonwitness /var/lib/moonwitness

[Install]
WantedBy=multi-user.target
EOF
)

  write_file "$UNIT_PATH" 0644 "$unit
"
  run systemctl daemon-reload
  run systemctl enable arsy.service
  run systemctl restart arsy.service
  log "arsy.service aktif"
}

setup_app() {
  [ "$WITH_APP" = "no" ] && return 0

  if [ "$WITH_APP" = "ask" ]; then
    if [ ! -d "$REPO_ROOT/apps/web" ]; then
      log "app Node tidak ditemukan, dilewati"
      return 0
    fi
    WITH_APP="no"
  fi

  step "Menyiapkan app Node"
  app_root=${APP_DIR:-$REPO_ROOT}
  need_cmd node
  need_cmd pnpm

  log "node: $(node --version)"
  log "pnpm: $(pnpm --version)"

  run sh -c "cd '$app_root' && pnpm install --frozen-lockfile"
  run sh -c "cd '$app_root' && pnpm build"

  write_app_units "$app_root"
}

write_app_units() {
  app_root=$1

  web_unit=$(cat <<EOF
[Unit]
Description=moonwitness web
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$app_root/apps/web
Environment=NODE_ENV=production
Environment=PORT=3000
Environment=HOSTNAME=127.0.0.1
ExecStart=$(command -v pnpm || echo /usr/local/bin/pnpm) start
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
)

  api_unit=$(cat <<EOF
[Unit]
Description=moonwitness api
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
WorkingDirectory=$app_root/apps/api
Environment=NODE_ENV=production
Environment=PORT=3002
Environment=HOST=127.0.0.1
Environment=CONTROL_NATIVE_SETUP=1
Environment=ARSY_URL=http://$LISTEN
ExecStart=$(command -v pnpm || echo /usr/local/bin/pnpm) start
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
EOF
)

  write_file /etc/systemd/system/moonwitness-web.service 0644 "$web_unit
"
  write_file /etc/systemd/system/moonwitness-api.service 0644 "$api_unit
"

  run systemctl daemon-reload
  run systemctl enable moonwitness-api.service moonwitness-web.service
  run systemctl restart moonwitness-api.service moonwitness-web.service
  log "moonwitness-api + moonwitness-web aktif"
}

setup_vpn_tools() {
  step "Menyiapkan tool VPN (WireGuard)"

  if command -v wg >/dev/null 2>&1 && command -v nft >/dev/null 2>&1; then
    log "wireguard-tools dan nftables sudah ada"
  elif [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] apt-get install -y wireguard-tools iproute2 nftables"
  else
    need_cmd apt-get
    run apt-get update -qq
    run apt-get install -y -qq wireguard-tools iproute2 nftables
  fi

  write_file /etc/sysctl.d/90-arsy-vpn.conf 0644 "net.ipv4.ip_forward=1
"
  run sysctl -w net.ipv4.ip_forward=1
  log "vpn siap: aktifkan lewat dashboard atau 'arsy vpn up --endpoint <host>'"
}

setup_caddy() {
  [ "$WITH_CADDY" = "yes" ] || return 0
  [ -n "$DOMAIN" ] || die "--with-caddy butuh --domain"
  [ -n "$EMAIL" ] || die "--with-caddy butuh --email"

  step "Memasang Caddy untuk $DOMAIN"
  if ! command -v caddy >/dev/null 2>&1; then
    if [ "$DRY_RUN" = "yes" ]; then
      log "[dry-run] pasang Caddy via apt-get"
    else
      need_cmd apt-get
      run apt-get update -qq
      run apt-get install -y -qq debian-keyring debian-archive-keyring apt-transport-https curl gnupg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' \
        | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
      curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' \
        > /etc/apt/sources.list.d/caddy-stable.list
      apt-get update -qq
      apt-get install -y -qq caddy
    fi
  fi

  caddyfile=$(cat <<EOF
{
	email $EMAIL
}

$DOMAIN {
	encode zstd gzip
	reverse_proxy 127.0.0.1:3000
}
EOF
)

  run mkdir -p /etc/caddy
  write_file /etc/caddy/Caddyfile 0644 "$caddyfile
"

  run systemctl enable caddy
  run systemctl restart caddy
  log "Caddy melayani https://$DOMAIN -> 127.0.0.1:3000"
}

doctor() {
  step "Verifikasi"
  if [ "$DRY_RUN" = "yes" ]; then
    log "[dry-run] $BIN_PATH doctor"
    return 0
  fi
  "$BIN_PATH" doctor || warn "doctor melaporkan masalah; periksa output di atas"
  if systemctl is-active --quiet arsy.service; then
    log "arsy.service: active"
  else
    warn "arsy.service tidak aktif; lihat: journalctl -u arsy -n 50"
  fi
}

show_tokens() {
  [ "$DRY_RUN" = "yes" ] && return 0
  step "Token akses"
  log "admin    : $(cat "$CONF_DIR/token-admin")"
  log "readonly : $(cat "$CONF_DIR/token-readonly")"
  log ""
  log "Simpan di tempat aman. Regenerasi: hapus file token lalu jalankan installer lagi."
  log "Uji:  curl -H \"Authorization: Bearer \$(cat $CONF_DIR/token-admin)\" http://$LISTEN/v1/host"
  log "Tunnel: ssh -L 8787:$LISTEN -N user@<vps>"
}

uninstall() {
  resolve_stack_dir
  if [ -f "$STACK_DIR/docker-compose.yml" ] && command -v docker >/dev/null 2>&1; then
    step "Menghentikan stack Docker Compose"
    if [ "$DRY_RUN" = "yes" ]; then
      log "[dry-run] cd '$STACK_DIR' && docker compose down --remove-orphans"
    else
      ( cd "$STACK_DIR" && docker compose down --remove-orphans ) || true
    fi
  fi

  step "Melepas arsy systemd"
  if command -v systemctl >/dev/null 2>&1; then
    run systemctl disable --now arsy.service || true
    run rm -f "$UNIT_PATH"
    run systemctl daemon-reload || true
  fi
  run rm -f "$BIN_PATH"
  log "container, service, dan binary dihapus"
  log "volume data, .env, config, token, dan audit dipertahankan"
}

ask() {
  prompt=$1
  default=${2:-}
  if [ -n "$default" ]; then
    printf '  %s [%s]: ' "$prompt" "$default" >&2
  else
    printf '  %s: ' "$prompt" >&2
  fi
  read -r REPLY || REPLY=""
  if [ -z "$REPLY" ]; then
    REPLY=$default
  fi
}

interactive() {
  [ -t 0 ] || return 0

  step "Onboarding interaktif (systemd)"
  log "Tekan Enter untuk menerima nilai default."

  if [ "$WITH_APP" = "ask" ]; then
    ask "Pasang juga app Node (web + api) sebagai service? (yes/no)" "yes"
    case "$REPLY" in
      y|Y|yes|Yes|YES) WITH_APP="yes" ;;
      *) WITH_APP="no" ;;
    esac
  fi

  if [ "$WITH_APP" = "yes" ] && [ -z "$APP_DIR" ]; then
    ask "Direktori app Node" "$REPO_ROOT"
    APP_DIR=$REPLY
  fi

  if [ -z "$DOMAIN" ]; then
    ask "Domain publik untuk dashboard (kosongkan jika tidak pakai HTTPS)" ""
    DOMAIN=$REPLY
  fi

  if [ -n "$DOMAIN" ] && [ "$WITH_CADDY" != "yes" ]; then
    ask "Pasang Caddy sebagai reverse proxy untuk $DOMAIN? (yes/no)" "yes"
    case "$REPLY" in
      y|Y|yes|Yes|YES) WITH_CADDY="yes" ;;
      *) WITH_CADDY="no" ;;
    esac
  fi

  if [ "$WITH_CADDY" = "yes" ] && [ -z "$EMAIL" ]; then
    ask "Email untuk ACME Caddy" ""
    EMAIL=$REPLY
  fi

  if [ "$LISTEN" = "127.0.0.1:8787" ]; then
    ask "Alamat listen arsy" "127.0.0.1:8787"
    LISTEN=$REPLY
  fi

  log ""
  log "Ringkasan:"
  log "  app Node : $WITH_APP"
  log "  domain   : ${DOMAIN:-<tidak ada>}"
  log "  caddy    : $WITH_CADDY"
  log "  listen   : $LISTEN"
  ask "Lanjutkan instalasi? (yes/no)" "yes"
  case "$REPLY" in
    y|Y|yes|Yes|YES) ;;
    *) die "dibatalkan pengguna" ;;
  esac
}

main() {
  resolve_mode
  step "Moonwitness installer v$VERSION (mode: $INSTALL_MODE)"
  if [ "$DRY_RUN" = "yes" ]; then
    log "mode dry-run: tidak ada perubahan sistem"
  fi

  if [ "$UNINSTALL" = "yes" ]; then
    require_root
    uninstall
    exit 0
  fi

  require_root
  detect_os

  if [ "$INSTALL_MODE" = "docker" ]; then
    ensure_docker
    ensure_stack_source
    setup_docker_env
    setup_arsy_optional
    start_docker_stack
    wait_docker_health
    print_onboarding_banner
    return 0
  fi

  interactive
  ensure_systemd
  install_binary
  setup_config
  install_unit
  setup_vpn_tools
  setup_app
  setup_caddy
  doctor
  show_tokens

  printf '\nSelesai.\n'
}

main "$@"
