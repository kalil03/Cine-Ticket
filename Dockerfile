FROM node:18-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Instala dependências do frontend
COPY package*.json ./
RUN npm install

# Instala dependências do backend
COPY backend/package*.json ./backend/
RUN npm install --prefix backend

# Copia todo o código
COPY . .

# Build do Next.js (frontend)
RUN npm run build

RUN chmod +x start.sh
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080

CMD ["sh", "start.sh"]