FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && apk add --no-cache python3 make g++
COPY . .
RUN pnpm install --frozen-lockfile && pnpm --filter @rocksoul/webhooks build
FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/packages/webhooks/dist ./packages/webhooks/dist
RUN mkdir -p /app/data
EXPOSE 3004
CMD ["node", "packages/webhooks/dist/server.js"]
