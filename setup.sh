#!/usr/bin/env bash

set -Eeuo pipefail

on_error() {
  echo ""
  echo "Erro: setup interrompido na linha $1."
  exit 1
}

trap 'on_error $LINENO' ERR

log() {
  echo ""
  echo "==> $1"
}

command_exists() {
  command -v "$1" >/dev/null 2>&1
}

ensure_env_var() {
  local file="$1"
  local key="$2"
  local value="$3"

  if grep -q "^${key}=" "$file"; then
    sed -i "s|^${key}=.*|${key}=${value}|" "$file"
  else
    printf '%s=%s\n' "$key" "$value" >> "$file"
  fi
}

load_nvm() {
  export NVM_DIR="$HOME/.nvm"
  if [ -s "$NVM_DIR/nvm.sh" ]; then
    # shellcheck source=/dev/null
    . "$NVM_DIR/nvm.sh"
  fi
}

node_major_version() {
  if ! command_exists node; then
    echo "0"
    return
  fi

  node -v | sed 's/^v//' | cut -d. -f1
}

log "Verificando Node.js"
if ! command_exists node || [ "$(node_major_version)" -lt 18 ]; then
  log "Instalando Node.js 18 via nvm"
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
  load_nvm
  nvm install 18
  nvm use 18
else
  echo "Node.js já instalado: $(node -v)"
fi

load_nvm

log "Verificando Docker"
if ! command_exists docker; then
  log "Instalando Docker"
  curl -fsSL https://get.docker.com | sh
else
  echo "Docker já instalado: $(docker --version)"
fi

log "Verificando jq"
if ! command_exists jq; then
  log "Instalando jq"
  sudo apt-get update
  sudo apt-get install -y jq
else
  echo "jq já instalado: $(jq --version)"
fi

log "Subindo banco de dados PostgreSQL"
if sudo docker ps -a --format '{{.Names}}' | grep -q '^barbershop-db$'; then
  echo "Container barbershop-db já existe. Iniciando..."
  sudo docker start barbershop-db >/dev/null
else
  echo "Criando container barbershop-db..."
  sudo docker run --name barbershop-db \
    -e POSTGRES_USER=barbershop \
    -e POSTGRES_PASSWORD=barbershop \
    -e POSTGRES_DB=barbershop \
    -p 5433:5432 -d postgres:16 >/dev/null
fi

echo "Aguardando banco iniciar..."
sleep 3

log "Configurando back-end"
if [ ! -f .env ]; then
  echo "Criando .env a partir de .env.example"
  cp .env.example .env
fi

ensure_env_var ".env" "DATABASE_URL" "postgresql://barbershop:barbershop@localhost:5433/barbershop"
ensure_env_var ".env" "SKIP_DATE_VALIDATION" "true"

echo "Instalando dependências do back-end"
npm install

echo "Rodando migrations"
npm run migrate

log "Configurando front-end"
cd frontend

if [ ! -f .env.local ]; then
  echo "Criando frontend/.env.local a partir de frontend/.env.example"
  cp .env.example .env.local
fi

echo "Instalando dependências do front-end"
npm install
cd ..

log "Populando banco"
echo "Iniciando back-end temporariamente para executar o seed"
npm run dev > /tmp/barbershop-scheduler-api.log 2>&1 &
API_PID=$!

cleanup_api() {
  if kill -0 "$API_PID" >/dev/null 2>&1; then
    kill "$API_PID" >/dev/null 2>&1 || true
  fi
}

trap 'cleanup_api; on_error $LINENO' ERR
trap 'cleanup_api' EXIT

echo "Aguardando API responder em http://localhost:3333"
for attempt in $(seq 1 30); do
  if curl -fsS http://localhost:3333/ >/dev/null 2>&1; then
    break
  fi

  if [ "$attempt" -eq 30 ]; then
    echo "Erro: API não respondeu em http://localhost:3333."
    echo "Confira o log em /tmp/barbershop-scheduler-api.log"
    exit 1
  fi

  sleep 1
done

npx tsx seed.ts
cleanup_api
trap - EXIT

log "Setup concluído"
echo "Setup concluído."
echo ""
echo "Para iniciar o projeto:"
echo "  Terminal 1: npm run dev"
echo "  Terminal 2: cd frontend && npm run dev"
echo ""
echo "Acesse: http://localhost:3000"
echo "Filtro de data: 2026-05-01 até 2026-06-30"
