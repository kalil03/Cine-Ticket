#!/bin/sh

echo "→ Configurando banco de dados SQLite..."
cd /app/backend
npx prisma migrate deploy 2>&1 || echo "⚠️  migrate falhou, tentando db push..."
npx prisma db push --accept-data-loss 2>&1 || echo "⚠️  db push falhou"
npx prisma generate 2>&1 || true

echo "→ Iniciando backend Express (porta 3001)..."
node src/index.js &
BACKEND_PID=$!

echo "→ Aguardando backend iniciar (PID: $BACKEND_PID)..."
sleep 4

echo "→ Iniciando frontend Next.js..."
cd /app && npm start

