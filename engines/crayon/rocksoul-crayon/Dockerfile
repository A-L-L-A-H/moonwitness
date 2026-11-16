# ==========================================
# Base Image: Setup Node & PNPM
# ==========================================
FROM node:22-alpine AS base

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"

RUN corepack enable && corepack prepare pnpm@11.17.0 --activate

# ==========================================
# Builder Stage: Install dependencies & build
# ==========================================
FROM base AS builder
WORKDIR /app

# Copy monorepo configurations & source code
# (.dockerignore ensures node_modules & dist are excluded)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages ./packages
COPY apps ./apps

# Install dependencies in workspace
RUN --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile

# Build shared packages and api
RUN pnpm build

# Prune devDependencies and isolate production bundle
RUN pnpm --filter @rocksoul/api --prod --legacy deploy /prod/api

# ==========================================
# Runner Stage: Lightweight production image
# ==========================================
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0
ENV DATABASE_URL="file:/app/data/sqlite.db"

# Create data directory for SQLite with non-root node permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Security: Run as non-root user
USER node

# Copy deployed standalone bundle
COPY --from=builder --chown=node:node /prod/api ./

EXPOSE 3000

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "dist/index.js"]
