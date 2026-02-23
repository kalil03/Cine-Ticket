FROM node:18-alpine

WORKDIR /app

RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

COPY package*.json ./
RUN npm install

COPY . .
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 8080

CMD ["npm", "run", "dev"]