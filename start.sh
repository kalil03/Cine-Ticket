#!/bin/sh

# Exportar variáveis do .env para o shell (necessário para Prisma CLI)
if [ -f /app/backend/.env ]; then
  export $(grep -v '^#' /app/backend/.env | xargs)
fi

# Garantir DATABASE_URL mesmo que .env não exista
export DATABASE_URL="${DATABASE_URL:-file:./dev.db}"

echo "→ Configurando banco de dados SQLite..."
cd /app/backend
npx prisma migrate deploy 2>&1 || echo "⚠️  migrate falhou, tentando db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️  db push falhou"

echo "→ Iniciando backend Express na porta 3001..."
# Forçar porta 3001 para não conflitar com Next.js (Render usa PORT=10000)
PORT=3001 node src/index.js &
BACKEND_PID=$!

echo "→ Aguardando backend iniciar (PID: $BACKEND_PID)..."
sleep 3

echo "→ Iniciando frontend Next.js..."
cd /app && npm start

