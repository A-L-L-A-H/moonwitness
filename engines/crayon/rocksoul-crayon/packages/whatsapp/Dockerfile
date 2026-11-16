# ==========================================
# Builder Stage: Install & Compile TypeScript
# ==========================================
FROM node:22-alpine AS builder

WORKDIR /app

# Copy dependency definition
COPY package.json tsconfig.json ./

# Install all dependencies (using --ignore-scripts or allowing builds)
RUN npm install

# Copy source code, client React SPA, and view templates
COPY vite.config.ts ./
COPY src ./src
COPY client ./client
COPY views ./views

# Build TypeScript server and Vite client into dist/
RUN npm run build

# ==========================================
# Runner Stage: Lightweight Production Runtime
# ==========================================
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV WA_PORT=3001
ENV WA_HOST=0.0.0.0
ENV WA_DASHBOARD_PASSWORD=210491
ENV WA_DATABASE_URL="file:/app/data/whatsapp.db"
ENV WA_SESSIONS_DIR="/app/data/whatsapp-sessions"

# Create persistent data directory with node permissions
RUN mkdir -p /app/data && chown -R node:node /app

# Security: Run as non-root user
USER node

# Copy compiled assets and dependencies
COPY --from=builder --chown=node:node /app/package.json ./
COPY --from=builder --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --from=builder --chown=node:node /app/views ./views

EXPOSE 3001

# Container healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3001/health || exit 1

# Start Fastify WhatsApp Gateway
CMD ["node", "dist/server.js"]
