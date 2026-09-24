# Build context: repo root (needs ../shared). See docker-compose.yml.
FROM node:20-alpine AS builder
WORKDIR /app
COPY shared ./shared
COPY backend/package*.json ./backend/
RUN cd backend && npm ci
COPY backend ./backend
RUN cd backend && npm run build && npm prune --omit=dev

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app/backend
COPY --from=builder --chown=node:node /app/backend/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/backend/dist ./dist
COPY --from=builder --chown=node:node /app/backend/package.json ./
USER node
EXPOSE 5000
CMD ["node", "dist/backend/src/index.js"]
