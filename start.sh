#!/bin/sh
set -e

echo "→ Iniciando backend (porta 3001)..."
cd /app/backend && npm run init-db && node src/index.js &

echo "→ Iniciando frontend Next.js..."
cd /app && npm start
