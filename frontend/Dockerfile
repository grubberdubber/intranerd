# syntax=docker/dockerfile:1.7
# ============================================================================
# IntraNerd · SPA (multi-stage: assets -> Nginx)
# Contexto de build: raíz del repositorio
# ============================================================================

FROM node:24-alpine AS build
WORKDIR /app
ARG INTRANERD_API_BASE=/api
ENV INTRANERD_API_BASE=$INTRANERD_API_BASE
COPY index.html ./
COPY src ./src
COPY assets ./assets
COPY frontend/scripts/build.mjs ./frontend/scripts/build.mjs
RUN node frontend/scripts/build.mjs

FROM nginx:1.27-alpine AS runtime
RUN rm -f /etc/nginx/conf.d/default.conf
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/healthz || exit 1
