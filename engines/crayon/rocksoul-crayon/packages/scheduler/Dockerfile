FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable
RUN apk add --no-cache python3 make g++
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/scheduler ./packages/scheduler
COPY packages/tsconfig ./packages/tsconfig
RUN pnpm install --filter @rocksoul/scheduler... --frozen-lockfile
RUN pnpm --filter @rocksoul/scheduler build
RUN pnpm deploy --filter @rocksoul/scheduler --prod --legacy /app/deploy
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production SCHEDULER_HOST=0.0.0.0 SCHEDULER_PORT=3002 SCHEDULER_DATABASE_URL=file:/app/data/scheduler.db
RUN mkdir -p /app/data && chown -R node:node /app
USER node
COPY --from=build --chown=node:node /app/deploy ./
EXPOSE 3002
HEALTHCHECK CMD wget -q --spider http://127.0.0.1:3002/health || exit 1
CMD ["node","dist/server.js"]
