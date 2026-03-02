#!/bin/sh

echo "→ Iniciando banco de dados..."
cd /app/backend && npm run init-db || echo "⚠️  init-db falhou (pode ser normal se já existe)"

echo "→ Iniciando backend Express (porta 3001)..."
cd /app/backend && node src/index.js &

echo "→ Aguardando backend iniciar..."
sleep 3

echo "→ Iniciando frontend Next.js..."
cd /app && npm start
