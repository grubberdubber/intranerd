# syntax=docker/dockerfile:1.7
# ============================================================================
# IntraNerd · API (multi-stage)
# Contexto de build: raíz del repositorio
# ============================================================================

FROM node:24-alpine AS deps
WORKDIR /app
ENV NODE_ENV=production
COPY backend/package.json backend/package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev --ignore-scripts && npm cache clean --force

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

COPY --from=deps --chown=intranerd:intranerd /app/node_modules ./node_modules
COPY --chown=intranerd:intranerd backend/package.json ./
COPY --chown=intranerd:intranerd backend/src ./src

USER intranerd
EXPOSE 4000
VOLUME ["/app/data", "/app/uploads"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4000/api/v1/health || exit 1

CMD ["node", "src/server.js"]
