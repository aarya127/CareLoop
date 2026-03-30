# syntax=docker/dockerfile:1
FROM node:22-alpine AS base
RUN corepack enable && npm install -g turbo@latest

FROM base AS pruner
WORKDIR /app
COPY . .
RUN turbo prune @careloop/api --docker

FROM base AS installer
WORKDIR /app
COPY --from=pruner /app/out/json/ .
RUN npm install --frozen-lockfile

FROM installer AS builder
WORKDIR /app
COPY --from=pruner /app/out/full/ .
RUN turbo run build --filter=@careloop/api

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 apiuser
COPY --from=builder --chown=apiuser:nodejs /app/apps/api/dist ./dist
COPY --from=builder --chown=apiuser:nodejs /app/node_modules ./node_modules
USER apiuser
EXPOSE 3001
CMD ["node", "dist/index.js"]
