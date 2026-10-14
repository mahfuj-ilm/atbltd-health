#!/usr/bin/env bash
# ==============================================================================
# atbltd-health - Automated Repository Bootstrap Script
# ==============================================================================
# Sets up a fresh clone of the monorepo by validating prerequisites,
# creating environment files from templates, installing dependencies,
# and conditionally running database migrations and seeds if PostgreSQL is live.
#
# Usage:
#   npm run bootstrap
#   bash scripts/bootstrap.sh [--fresh] [--skip-db]
# ==============================================================================

set -euo pipefail

# Ensure OPENSSL_CONF fallback if needed
export OPENSSL_CONF="${OPENSSL_CONF:-/dev/null}"

# ANSI color output
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  BLUE='\033[0;34m'
  YELLOW='\033[1;33m'
  RED='\033[0;31m'
  BOLD='\033[1m'
  NC='\033[0m'
else
  GREEN=''
  BLUE=''
  YELLOW=''
  RED=''
  BOLD=''
  NC=''
fi

log_info() { echo -e "${BLUE}==>${NC} ${BOLD}$1${NC}"; }
log_success() { echo -e "${GREEN}✔${NC} $1"; }
log_warn() { echo -e "${YELLOW}⚠${NC} $1"; }
log_error() { echo -e "${RED}✖${NC} $1" >&2; }

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

FRESH=false
SKIP_DB=false

for arg in "$@"; do
  case "$arg" in
    --fresh)
      FRESH=true
      shift
      ;;
    --skip-db)
      SKIP_DB=true
      shift
      ;;
    -h|--help)
      echo "Usage: $0 [options]"
      echo "Options:"
      echo "  --fresh    Force reinstall dependencies via npm ci"
      echo "  --skip-db  Skip PostgreSQL connection check, migrations, and seeds"
      echo "  -h, --help Show this help message"
      exit 0
      ;;
    *)
      ;;
  esac
done

echo -e "${BOLD}======================================================================${NC}"
echo -e "${BOLD}       atbltd-health Monorepo Bootstrap                               ${NC}"
echo -e "${BOLD}======================================================================${NC}"

# 1. Validate Prerequisites
log_info "Step 1/4: Checking system prerequisites..."

if ! command -v node >/dev/null 2>&1; then
  log_error "Node.js is not installed. Please install Node.js 20 or higher."
  exit 1
fi

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_MAJOR" -lt 20 ]; then
  log_error "Node.js version must be >= 20. Found: $(node -v)"
  exit 1
fi
log_success "Node.js $(node -v) detected (>= 20 required)"

if ! command -v npm >/dev/null 2>&1; then
  log_error "npm is not installed. Please install npm 10 or higher."
  exit 1
fi

NPM_MAJOR=$(npm -v | cut -d. -f1)
if [ "$NPM_MAJOR" -lt 10 ]; then
  log_error "npm version must be >= 10. Found: $(npm -v)"
  exit 1
fi
log_success "npm $(npm -v) detected (>= 10 required)"

# 2. Setup Environment Variables
log_info "Step 2/4: Configuring environment files..."

copy_env_if_missing() {
  local src="$1"
  local dest="$2"
  if [ -f "$dest" ]; then
    log_success "Already exists: $dest"
  elif [ -f "$src" ]; then
    cp "$src" "$dest"
    log_success "Created: $dest (from $src)"
  else
    log_warn "Template missing: $src"
  fi
}

copy_env_if_missing ".env.example" ".env"
copy_env_if_missing "apps/backend/.env.example" "apps/backend/.env"
copy_env_if_missing "apps/frontend/.env.example" "apps/frontend/.env.local"

# 3. Install Dependencies
log_info "Step 3/4: Resolving workspace dependencies..."

if [ "$FRESH" = true ] || [ ! -d "node_modules" ]; then
  echo "Installing workspace dependencies from package-lock.json..."
  npm ci
  log_success "Workspace dependencies successfully installed."
else
  log_success "node_modules present. (Pass --fresh to force npm ci)"
fi

# 4. Database Setup & Seeding
log_info "Step 4/4: Database setup & verification..."

if [ "$SKIP_DB" = true ]; then
  log_warn "Skipping database setup as --skip-db was specified."
else
  # Probe PostgreSQL reachability on localhost:5432 using node net probe
  DB_LIVE=false
  if node -e 'const s = require("net").connect({port: 5432, host: "127.0.0.1", timeout: 1000}); s.on("connect", () => { s.destroy(); process.exit(0); }); s.on("error", () => { process.exit(1); }); s.on("timeout", () => { s.destroy(); process.exit(1); });' 2>/dev/null; then
    DB_LIVE=true
  fi

  if [ "$DB_LIVE" = true ]; then
    log_info "PostgreSQL is reachable on 127.0.0.1:5432. Executing migrations and seeds..."
    npm run migration:run --workspace=@atbltd-health/backend
    npm run seed
    npm run seed:ref
    log_success "Database migrations and seeds completed."
  else
    log_warn "PostgreSQL is not currently reachable on 127.0.0.1:5432."
    echo -e "   To start the development database:"
    echo -e "     ${BOLD}docker compose up -d postgres${NC}"
    echo -e "   Then run migrations and seeds:"
    echo -e "     ${BOLD}npm run migration:run --workspace=@atbltd-health/backend${NC}"
    echo -e "     ${BOLD}npm run seed && npm run seed:ref${NC}"
  fi
fi

echo -e "\n${GREEN}${BOLD}✔ Bootstrap completed successfully!${NC}\n"
echo -e "Next steps:"
echo -e "  • Start development servers: ${BOLD}npm run dev${NC}"
echo -e "  • Run full test suite:       ${BOLD}npm test${NC}"
echo -e "  • Run typecheck:             ${BOLD}npm run typecheck${NC}"
echo -e "  • Run linter:                ${BOLD}npm run lint${NC}\n"
