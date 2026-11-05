# syntax=docker/dockerfile:1.7
# ============================================================================
# IntraNerd · API (multi-stage, pnpm workspace)
# Contexto de build: raíz del repositorio
# ============================================================================

FROM node:24-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production
RUN corepack enable
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY backend/package.json ./backend/package.json
RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --filter intranerd-backend --prod --frozen-lockfile

FROM node:24-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production \
    PORT=4000 \
    DATABASE_PATH=/app/data/intranerd.db \
    UPLOAD_DIR=/app/uploads \
    SEED_ON_START=true

RUN apk add --no-cache wget \
    && addgroup -S intranerd \
    && adduser -S intranerd -G intranerd \
    && mkdir -p /app/data /app/uploads \
    && chown -R intranerd:intranerd /app/data /app/uploads

# Se conserva la estructura del workspace para que los enlaces simbólicos de
# pnpm (`backend/node_modules` → `node_modules/.pnpm`) sigan siendo válidos.
COPY --from=deps --chown=intranerd:intranerd /app/node_modules ./node_modules
COPY --from=deps --chown=intranerd:intranerd /app/backend/node_modules ./backend/node_modules
COPY --chown=intranerd:intranerd backend/package.json ./backend/package.json
COPY --chown=intranerd:intranerd backend/src ./backend/src

USER intranerd
EXPOSE 4000
VOLUME ["/app/data", "/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "backend/src/server.js"]
